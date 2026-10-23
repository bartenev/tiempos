/**
 * Распознавание речи через Web Speech API (Chrome / Edge / Safari).
 * Звук обрабатывается на серверах Google / Apple — нужен интернет.
 */

/** Минимальный интерфейс распознавателя (и для фейка в тестах). */
export interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  abort(): void
}

type RecognitionCtor = new () => RecognitionLike

export function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isSpeechSupported(): boolean {
  return recognitionCtor() !== null
}

/**
 * listening — слушаем; paused — выключено (вкладка скрыта, экран ушёл);
 * denied — нет доступа к микрофону; network — нет связи с сервисом;
 * unsupported — браузер не умеет.
 */
export type ListenState = 'listening' | 'paused' | 'denied' | 'network' | 'unsupported'

export interface Listener {
  /** Начать слушать и перезапускаться после каждой фразы. */
  start(): void
  stop(): void
}

export interface ListenerOptions {
  lang?: string
  /** Варианты распознавания одной фразы, от самого уверенного. */
  onResult(alternatives: string[]): void
  onState(state: ListenState): void
}

/** Сколько вариантов просить у распознавателя (см. spokenMatches). */
export const MAX_ALTERNATIVES = 5

/**
 * Слушает без нажатий: после каждой фразы (или тишины) браузер
 * завершает распознавание — сразу запускаем его снова, пока не вызван stop().
 */
export function createListener(options: ListenerOptions): Listener {
  const Ctor = recognitionCtor()
  let active = false
  let rec: RecognitionLike | null = null
  let restartTimer: ReturnType<typeof setTimeout> | undefined

  function launch() {
    if (!Ctor || !active) return
    rec = new Ctor()
    rec.lang = options.lang ?? 'es-ES'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = MAX_ALTERNATIVES

    rec.onresult = (event) => {
      const first = event.results[0]
      if (!first) return
      const alternatives: string[] = []
      for (let i = 0; i < first.length; i++) {
        const text = first[i]?.transcript.trim()
        if (text) alternatives.push(text)
      }
      if (alternatives.length > 0) options.onResult(alternatives)
    }

    rec.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        active = false
        options.onState('denied')
      } else if (event.error === 'network') {
        active = false
        options.onState('network')
      }
      // no-speech / aborted / audio-capture — просто перезапустимся в onend
    }

    rec.onend = () => {
      rec = null
      if (!active) return
      clearTimeout(restartTimer)
      restartTimer = setTimeout(launch, 150)
    }

    try {
      rec.start()
      options.onState('listening')
    } catch {
      // start() во время работы предыдущего — повторим чуть позже
      clearTimeout(restartTimer)
      restartTimer = setTimeout(launch, 300)
    }
  }

  return {
    start() {
      if (!Ctor) {
        options.onState('unsupported')
        return
      }
      if (active) return
      active = true
      launch()
    },
    stop() {
      active = false
      clearTimeout(restartTimer)
      rec?.abort()
      rec = null
      options.onState('paused')
    },
  }
}
