export function buildDraftLetterPrompt(input: { caseTitle: string; domain: string; roughNote: string }) {
  return `You are helping a legal aid volunteer draft a formal advisory letter.
Case: "${input.caseTitle}" (domain: ${input.domain || 'unspecified'}).

The volunteer's rough note / instructions:
"""
${input.roughNote}
"""

Write a formal, clear, respectful draft letter based on the note above. This is a
DRAFT that the volunteer will review and edit before it is sent — do not include
any placeholder legal advice you are not confident about; keep tone professional
and factual. Sign off as "[Volunteer name], Legal Aid Volunteer".

Respond with ONLY the letter text, no JSON, no markdown fences.`;
}
