/**
 * Ключи localStorage, которые приложение больше не читает.
 * progress.v2 — счёт старого модуля «Прогресс», его заменил stats.v1.
 */
export const OBSOLETE_KEYS = ['tiempos.progress.v2']

/** Стереть устаревшие ключи при запуске, чтобы не копились в хранилище. */
export function removeObsoleteKeys(): void {
  try {
    for (const key of OBSOLETE_KEYS) localStorage.removeItem(key)
  } catch {
    /* хранилище недоступно — чистить нечего */
  }
}
