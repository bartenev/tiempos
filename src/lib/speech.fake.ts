import type { RecognitionLike } from './speech'

/**
 * Только для тестов: фейковый распознаватель речи.
 * Тест сам «говорит» (say) и завершает фразы (fail).
 */
export class FakeRecognition implements RecognitionLike {
  static instances: FakeRecognition[] = []
  lang = ''
  continuous = true
  interimResults = true
  maxAlternatives = 1
  onresult: RecognitionLike['onresult'] = null
  onerror: RecognitionLike['onerror'] = null
  onend: RecognitionLike['onend'] = null
  started = false
  aborted = false

  constructor() {
    FakeRecognition.instances.push(this)
  }

  start() {
    this.started = true
  }

  abort() {
    this.aborted = true
    this.onend?.()
  }

  say(...alternatives: string[]) {
    this.onresult?.({ results: [alternatives.map((transcript) => ({ transcript }))] })
    this.onend?.()
  }

  fail(error: string) {
    this.onerror?.({ error })
    this.onend?.()
  }

  static get last(): FakeRecognition {
    return FakeRecognition.instances[FakeRecognition.instances.length - 1]!
  }
}

export function installFakeRecognition(): void {
  FakeRecognition.instances = []
  ;(window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition =
    FakeRecognition
}

export function removeFakeRecognition(): void {
  delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
}
