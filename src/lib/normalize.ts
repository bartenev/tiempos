/** Trim + lowercase for comparison. */
export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase()
}

/** Strip Spanish diacritics for «almost» check. */
export function stripDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export type AnswerCheck = 'exact' | 'almost' | 'wrong'

/**
 * Strict match (with accents). If only accents differ → «almost».
 */
export function checkAnswer(input: string, expected: string): AnswerCheck {
  const a = normalizeAnswer(input)
  const b = normalizeAnswer(expected)
  if (a === b) return 'exact'
  if (a.length > 0 && stripDiacritics(a) === stripDiacritics(b)) return 'almost'
  return 'wrong'
}
