import { pluralRu } from './plural'

/** Серия дней подряд с хотя бы одной сессией. */
export const DAILY_KEY = 'tiempos.daily.v1'

export interface DailyStreak {
  /** Последний день практики, YYYY-MM-DD (локальное время). */
  lastDay: string
  streak: number
  best: number
}

const EMPTY: DailyStreak = { lastDay: '', streak: 0, best: 0 }

export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function previousDay(date: Date): string {
  const prev = new Date(date)
  prev.setDate(prev.getDate() - 1)
  return dayKey(prev)
}

export function loadDaily(): DailyStreak {
  try {
    const raw = localStorage.getItem(DAILY_KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as Partial<DailyStreak>
    if (
      typeof parsed.lastDay !== 'string' ||
      typeof parsed.streak !== 'number' ||
      typeof parsed.best !== 'number'
    ) {
      return { ...EMPTY }
    }
    return { lastDay: parsed.lastDay, streak: parsed.streak, best: parsed.best }
  } catch {
    return { ...EMPTY }
  }
}

/** Актуальная серия: если вчера и сегодня не занимались — она сгорела. */
export function currentStreak(daily: DailyStreak, now: Date = new Date()): number {
  if (daily.lastDay === dayKey(now) || daily.lastDay === previousDay(now)) {
    return daily.streak
  }
  return 0
}

/** Отметить практику сегодня. */
export function markPracticed(now: Date = new Date()): DailyStreak {
  const daily = loadDaily()
  const today = dayKey(now)
  if (daily.lastDay === today) return daily
  const streak = daily.lastDay === previousDay(now) ? daily.streak + 1 : 1
  const next: DailyStreak = {
    lastDay: today,
    streak,
    best: Math.max(daily.best, streak),
  }
  localStorage.setItem(DAILY_KEY, JSON.stringify(next))
  return next
}

/** «1 день», «3 дня», «11 дней», «21 день». */
export function daysLabel(n: number): string {
  return `${n} ${pluralRu(n, 'день', 'дня', 'дней')}`
}
