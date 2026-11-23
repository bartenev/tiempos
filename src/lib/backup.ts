/**
 * Выгрузка всех данных приложения (ключи `tiempos.*` в localStorage) одним JSON —
 * чтобы посмотреть историю ответов со стороны и подстроить алгоритмы.
 */
export const DATA_PREFIX = 'tiempos.'

export interface DataExport {
  app: 'tiempos'
  /** Версия приложения на момент выгрузки. */
  version: string
  /** Когда выгрузили (ISO). */
  exportedAt: string
  /** Ключ → значение: JSON разобран, если это JSON, иначе строка как есть. */
  data: Record<string, unknown>
}

export function collectData(version: string, now: Date = new Date()): DataExport {
  const data: Record<string, unknown> = {}
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(DATA_PREFIX)) keys.push(key)
    }
    for (const key of keys.sort()) {
      const raw = localStorage.getItem(key)
      if (raw === null) continue
      try {
        data[key] = JSON.parse(raw) as unknown
      } catch {
        data[key] = raw
      }
    }
  } catch {
    /* хранилище недоступно — выгружаем что есть */
  }
  return { app: 'tiempos', version, exportedAt: now.toISOString(), data }
}

export function exportJson(version: string, now: Date = new Date()): string {
  return JSON.stringify(collectData(version, now))
}

/** Имя файла: tiempos-2026-11-24.json (по местному времени). */
export function exportFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `tiempos-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}
