export function buildSummarisePrompt(input: { caseTitle: string; documentText: string }) {
  return `You are assisting a legal aid volunteer. Summarise the following document
attached to case "${input.caseTitle}" in plain, non-legal language so the volunteer
can quickly understand it. Flag if it looks urgent (e.g. eviction notice with a
deadline, court summons, termination letter).

Document text (may be OCR/extracted, could be imperfect):
"""
${input.documentText.slice(0, 6000)}
"""

Respond with ONLY a JSON object (no markdown fences):
{
  "summary": "2-4 sentence plain-language summary",
  "urgent": true | false,
  "urgentReason": "short reason, or empty string if not urgent"
}`;
}
