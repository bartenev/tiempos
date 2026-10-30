/**
 * Trim + lowercase for comparison; punctuation and extra spaces don't count.
 * A lone dash means «nothing goes here», same as an empty field.
 */
export function normalizeAnswer(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[¿?¡!.,;:—–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return normalized === '-' ? '' : normalized
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

/** Несколько верных вариантов: лучший из результатов по каждому. */
export function checkAnswers(input: string, accepted: string[]): AnswerCheck {
  const checks = accepted.map((answer) => checkAnswer(input, answer))
  if (checks.includes('exact')) return 'exact'
  return checks.includes('almost') ? 'almost' : 'wrong'
}

/** Каждое поле проверяем отдельно: видно, какой именно пропуск неверный. */
export function checkBlanks(inputs: string[], blanks: string[][]): AnswerCheck[] {
  return blanks.map((accepted, i) => checkAnswers(inputs[i] ?? '', accepted))
}

/** Итог по всем полям: верно, только если верно всё. */
export function overallCheck(checks: AnswerCheck[]): AnswerCheck {
  if (checks.includes('wrong')) return 'wrong'
  return checks.includes('almost') ? 'almost' : 'exact'
}
