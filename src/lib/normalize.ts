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

/**
 * Ключ «по звучанию» для голосового режима: то, что на слух неразличимо,
 * приводим к одному виду — ударения (sé / se), b / v, ll / y, немая h.
 */
export function phoneticKey(value: string): string {
  return stripDiacritics(value.toLowerCase())
    .replace(/[^a-z]/g, '')
    .replace(/v/g, 'b')
    .replace(/ll/g, 'y')
    .replace(/ch/g, '§')
    .replace(/h/g, '')
    .replace(/§/g, 'ch')
}

/**
 * Сказана ли нужная форма: смотрим все варианты распознавания
 * и каждое слово в них (распознаватель может услышать «yo hablo»).
 */
export function spokenMatches(alternatives: string[], expected: string): boolean {
  const target = phoneticKey(expected)
  if (!target) return false
  return alternatives.some((alt) =>
    alt.split(/[\s,.;:!?¡¿"«»()-]+/).some((word) => phoneticKey(word) === target),
  )
}
