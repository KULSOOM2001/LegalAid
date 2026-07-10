export function buildClassifyPrompt(input: { title: string; description: string }) {
  return `You are a legal-intake triage assistant for a free legal aid clinic.
Read the citizen's case submission and classify it.

Case title: ${input.title}
Case description: ${input.description}

Respond with ONLY a JSON object (no markdown fences, no preamble) in this exact shape:
{
  "domain": "housing" | "family" | "employment" | "immigration" | "consumer" | "other",
  "urgency": "low" | "medium" | "high" | "critical",
  "rationale": "one short sentence explaining the classification"
}`;
}
