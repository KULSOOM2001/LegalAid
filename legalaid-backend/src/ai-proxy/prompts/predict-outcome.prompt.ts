export function buildPredictOutcomePrompt(input: { title: string; description: string; domain: string; urgency: string; noteSummaries: string[] }) {
  return `You are an advisory model estimating likely case outcomes for internal
volunteer/supervisor planning ONLY. This is never shown to the citizen and is not
a guarantee of any legal result.

Case: ${input.title}
Domain: ${input.domain}
Urgency: ${input.urgency}
Description: ${input.description}
Case notes so far: ${input.noteSummaries.join(' | ') || 'none yet'}

Respond with ONLY a JSON object:
{
  "predictedOutcome": "won" | "settled" | "referred" | "withdrawn" | "unresolved",
  "confidence": "low" | "medium" | "high",
  "rationale": "one short sentence, advisory tone"
}`;
}
