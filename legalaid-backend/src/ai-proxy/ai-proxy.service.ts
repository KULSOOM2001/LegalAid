import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiInteraction, AiFeature } from './entities/ai-interaction.entity';
import { Case } from '../cases/entities/case.entity';
import { buildClassifyPrompt } from './prompts/classify.prompt';
import { buildSummarisePrompt } from './prompts/summarise.prompt';
import { buildDraftLetterPrompt } from './prompts/draft-letter.prompt';
import { buildPredictOutcomePrompt } from './prompts/predict-outcome.prompt';

type AiResult<T> = { success: true; data: T } | { success: false; fallback: true; error: string };

@Injectable()
export class AiProxyService {
  private readonly logger = new Logger(AiProxyService.name);
  private apiKey = process.env.GEMINI_API_KEY || '';
  private model = 'gemini-2.5-flash'; // free tier model

  constructor(
    @InjectRepository(AiInteraction) private aiInteractionRepo: Repository<AiInteraction>,
  ) {
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY not set — AI features will always use fallback behaviour.');
    }
  }

  private async call<T>(
    feature: AiFeature,
    prompt: string,
    parse: (text: string) => T,
    context: { caseId?: string; requestedById?: string },
  ): Promise<AiResult<T>> {
    const start = Date.now();

    if (!this.apiKey) {
      await this.logInteraction(feature, prompt, null, true, 'AI client not configured (missing API key)', Date.now() - start, context);
      return { success: false, fallback: true, error: 'AI client not configured' };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
      }

      const json: any = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const parsed = parse(rawText);

      await this.logInteraction(feature, prompt, rawText, false, null, Date.now() - start, context);
      return { success: true, data: parsed };
    } catch (err: any) {
      const message = err?.message || 'Unknown AI error';
      this.logger.error(`AI feature ${feature} failed: ${message}`);
      await this.logInteraction(feature, prompt, null, true, message, Date.now() - start, context);
      return { success: false, fallback: true, error: message };
    }
  }

  private async logInteraction(
    feature: AiFeature,
    prompt: string,
    output: string | null,
    fallbackFired: boolean,
    errorMessage: string | null,
    latencyMs: number,
    context: { caseId?: string; requestedById?: string },
  ) {
    const row = this.aiInteractionRepo.create({
      feature,
      prompt,
      output,
      fallbackFired,
      errorMessage,
      latencyMs,
      caseId: context.caseId,
      requestedById: context.requestedById,
    });
    await this.aiInteractionRepo.save(row);
  }

  private parseJson(text: string) {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }

  async classifyCase(c: Case, requestedById: string) {
    const prompt = buildClassifyPrompt({ title: c.title, description: c.description });
    return this.call(AiFeature.CLASSIFY, prompt, (t) => this.parseJson(t), { caseId: c.id, requestedById });
  }

  async summariseDocument(input: { caseId: string; caseTitle: string; documentText: string; requestedById: string }) {
    const prompt = buildSummarisePrompt({ caseTitle: input.caseTitle, documentText: input.documentText });
    return this.call(AiFeature.SUMMARISE_DOCUMENT, prompt, (t) => this.parseJson(t), {
      caseId: input.caseId,
      requestedById: input.requestedById,
    });
  }

  async draftLetter(input: { caseId: string; caseTitle: string; domain: string; roughNote: string; requestedById: string }) {
    const prompt = buildDraftLetterPrompt({ caseTitle: input.caseTitle, domain: input.domain, roughNote: input.roughNote });
    return this.call(AiFeature.DRAFT_LETTER, prompt, (t) => t.trim(), {
      caseId: input.caseId,
      requestedById: input.requestedById,
    });
  }

  async predictOutcome(input: {
    caseId: string;
    title: string;
    description: string;
    domain: string;
    urgency: string;
    noteSummaries: string[];
    requestedById: string;
  }) {
    const prompt = buildPredictOutcomePrompt(input);
    return this.call(AiFeature.PREDICT_OUTCOME, prompt, (t) => this.parseJson(t), {
      caseId: input.caseId,
      requestedById: input.requestedById,
    });
  }

  async getInteractionsForCase(caseId: string) {
    return this.aiInteractionRepo.find({ where: { caseId }, order: { createdAt: 'DESC' } });
  }
}