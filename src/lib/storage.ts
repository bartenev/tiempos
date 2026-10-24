/**
 * Ключи localStorage, которые приложение больше не читает.
 * progress.v2 — счёт старого модуля «Прогресс», его заменил stats.v1.
 */
export const OBSOLETE_KEYS = ['tiempos.progress.v2']

/**
 * Попросить браузер не стирать хранилище: Safari иначе может удалить данные сайта,
 * который не открывали 7 дней. Браузер решает сам; отказ — не ошибка.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    const storage = navigator.storage
    if (!storage?.persist) return false
    if (await storage.persisted?.()) return true
    return await storage.persist()
  } catch {
    return false
  }
}

/** Стереть устаревшие ключи при запуске, чтобы не копились в хранилище. */
export function removeObsoleteKeys(): void {
  try {
    for (const key of OBSOLETE_KEYS) localStorage.removeItem(key)
  } catch {
    /* хранилище недоступно — чистить нечего */
  }
}
