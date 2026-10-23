<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { explainForm } from '../lib/explain'
import type { AnswerCheck } from '../lib/normalize'
import { checkAnswer, spokenMatches } from '../lib/normalize'
import type { ListenState, Listener } from '../lib/speech'
import { createListener } from '../lib/speech'
import type { DrillCard } from '../types'
import { TENSE_LABELS } from '../types'

const props = defineProps<{
  card: DrillCard
  index: number
  total: number
  correct: number
  wrong: number
  streak: number
  /** Голосовой режим: отвечать вслух, микрофон слушает без нажатий. */
  voice?: boolean
}>()

const emit = defineEmits<{
  correct: []
  wrong: [given: string]
  skip: []
  quit: []
  next: []
}>()

/** Буквы, которых нет на русской/английской раскладке. */
const ACCENTS = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü']

const input = ref('')
const feedback = ref<AnswerCheck | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
/** Короткая зелёная вспышка: прошлый ответ верный, уже следующая карточка. */
const flashOk = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | undefined

/** Что распознал микрофон в последний раз (для неверного ответа). */
const heard = ref<string | null>(null)
const listenState = ref<ListenState>('paused')
let listener: Listener | null = null

const VOICE_STATUS: Record<ListenState, string> = {
  listening: 'Слушаю… скажите форму',
  paused: 'Микрофон выключен',
  denied: 'Нет доступа к микрофону — разрешите его в браузере',
  network: 'Нет связи с распознаванием речи — нужен интернет',
  unsupported: 'Браузер не умеет распознавать речь',
}

const voiceStatus = computed(() => {
  if (listenState.value === 'listening' && feedback.value !== null) {
    return 'Скажите правильную форму — и дальше'
  }
  return VOICE_STATUS[listenState.value]
})

const progress = computed(() => `${props.index + 1} / ${props.total}`)
const revealed = computed(() => feedback.value !== null)
const canCheck = computed(() => input.value.trim().length > 0)
const canSubmit = computed(() => revealed.value || canCheck.value)
const answered = computed(() => props.correct + props.wrong)
const accuracy = computed(() =>
  answered.value === 0 ? null : Math.round((props.correct / answered.value) * 100),
)

const hint = computed(() => {
  if (feedback.value !== 'wrong' && feedback.value !== 'almost') return null
  return explainForm(props.card.verb, props.card.tense, props.card.person)
})

/** Части предложения вокруг пропуска `___`. */
const sentenceParts = computed(() => {
  const parts = props.card.sentence.split('___')
  return {
    before: parts[0] ?? '',
    after: parts.slice(1).join('___'),
  }
})

const filledBlank = computed(() => {
  if (feedback.value === null) return '___'
  return props.card.answer
})

function focusInput() {
  // preventScroll: на телефоне не прыгаем к полю при каждом фокусе
  inputEl.value?.focus({ preventScroll: true })
}

watch(
  () => [props.card.sentence, props.card.verb.infinitive, props.card.answer, props.index],
  async () => {
    input.value = ''
    feedback.value = null
    heard.value = null
    await nextTick()
    focusInput()
  },
  { immediate: true },
)

/** Верно — сразу к следующему заданию, без «Дальше». */
function acceptCorrect() {
  emit('correct')
  emit('next')
  flashOk.value = false
  clearTimeout(flashTimer)
  // снять класс и поставить заново в следующем тике — анимация перезапустится
  nextTick(() => {
    flashOk.value = true
    flashTimer = setTimeout(() => (flashOk.value = false), 600)
  })
}

function submit() {
  if (feedback.value !== null) {
    emit('next')
    return
  }
  if (!canCheck.value) return
  const result = checkAnswer(input.value, props.card.answer)
  if (result === 'exact') {
    acceptCorrect()
    return
  }
  feedback.value = result
  emit('wrong', input.value.trim())
  focusInput()
}

/**
 * Ответ голосом. Верно → следующая карточка. Неверно → ошибка и подсказка,
 * микрофон слушает дальше: произнесли правильную форму — идём дальше.
 */
function onSpoken(alternatives: string[]) {
  if (spokenMatches(alternatives, props.card.answer)) {
    if (feedback.value === null) acceptCorrect()
    else emit('next')
    return
  }
  heard.value = alternatives[0] ?? null
  if (feedback.value === null) {
    feedback.value = 'wrong'
    emit('wrong', heard.value ?? '')
  }
}

function startListening() {
  listener?.start()
}

function onVisibility() {
  if (document.hidden) listener?.stop()
  else listener?.start()
}

onMounted(() => {
  if (!props.voice) return
  listener = createListener({
    onResult: onSpoken,
    onState: (state) => (listenState.value = state),
  })
  listener.start()
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  clearTimeout(flashTimer)
  listener?.stop()
  listener = null
  document.removeEventListener('visibilitychange', onVisibility)
})

function skip() {
  if (feedback.value === null) emit('skip')
  emit('next')
}

function insertAccent(ch: string) {
  if (revealed.value) return
  const el = inputEl.value
  if (!el) {
    input.value += ch
    return
  }
  const start = el.selectionStart ?? input.value.length
  const end = el.selectionEnd ?? input.value.length
  input.value = input.value.slice(0, start) + ch + input.value.slice(end)
  nextTick(() => {
    el.setSelectionRange(start + ch.length, start + ch.length)
    focusInput()
  })
}
</script>

<template>
  <section class="panel drill">
    <header class="bar">
      <button class="ghost small" type="button" @click="emit('quit')">‹ выход</button>
      <span class="prog">{{ progress }}</span>
      <span class="score">
        ✓ {{ correct }} · ✗ {{ wrong }}
      </span>
    </header>

    <div class="session-meter" aria-live="polite">
      <div class="meter-track">
        <div class="meter-fill" :style="{ width: `${((index) / total) * 100}%` }" />
      </div>
      <span class="meter-stats">
        <span v-if="accuracy !== null">{{ accuracy }}%</span>
        <span v-if="streak >= 2" class="streak">🔥 {{ streak }}</span>
      </span>
    </div>

    <div class="prompt-card" :class="{ 'flash-ok': flashOk }">
      <div class="meta">
        {{ TENSE_LABELS[card.tense] }}
        <span v-if="card.retry" class="retry-tag">повтор</span>
      </div>
      <p
        class="sentence"
        :class="{
          ok: feedback === 'exact',
          almost: feedback === 'almost',
          bad: feedback === 'wrong',
        }"
      >
        <span>{{ sentenceParts.before }}</span>
        <span class="blank">{{ filledBlank }}</span>
        <span>{{ sentenceParts.after }}</span>
      </p>
      <p class="translation">{{ card.translation }}</p>
      <p class="hint-verb">
        глагол: <b>{{ card.verb.infinitive }}</b>
      </p>
    </div>

    <form class="answer-form" @submit.prevent="submit">
      <div v-if="voice" class="voice-panel" :class="listenState" aria-live="polite">
        <span class="mic-dot" aria-hidden="true" />
        <span class="voice-status">{{ voiceStatus }}</span>
        <button
          v-if="listenState !== 'listening' && listenState !== 'unsupported'"
          class="ghost small"
          type="button"
          @click="startListening"
        >
          🎤 Включить
        </button>
      </div>
      <p v-if="voice && heard" class="heard">Услышал: «{{ heard }}»</p>

      <template v-if="!voice">
        <label class="sr-only" for="answer">Форма глагола</label>
        <input
          id="answer"
          ref="inputEl"
          v-model="input"
          type="text"
          inputmode="text"
          enterkeyhint="go"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          lang="es"
          :readonly="revealed"
          :class="{
            ok: feedback === 'exact',
            almost: feedback === 'almost',
            bad: feedback === 'wrong',
          }"
          placeholder="форма глагола…"
        />

        <div class="accent-keys" role="group" aria-label="Буквы с ударением">
          <button
            v-for="ch in ACCENTS"
            :key="ch"
            type="button"
            class="accent-key"
            tabindex="-1"
            :disabled="revealed"
            @pointerdown.prevent
            @click="insertAccent(ch)"
          >
            {{ ch }}
          </button>
        </div>
      </template>

      <p v-if="feedback === 'almost'" class="hint almost-text">
        Почти — проверьте ударения. Правильно: <b>{{ card.answer }}</b>
      </p>
      <p v-else-if="feedback === 'wrong'" class="hint bad-text">
        Неверно. Правильно: <b>{{ card.answer }}</b>
      </p>

      <div v-if="hint" class="rule-hint">
        <p class="rule">{{ hint.rule }}</p>
        <p v-if="hint.stem && hint.ending !== undefined" class="formula">
          <span class="stem">{{ hint.stem }}</span>
          <span class="plus">+</span>
          <span class="ending">-{{ hint.ending }}</span>
        </p>
        <ul class="row">
          <li v-for="item in hint.row" :key="item.person" :class="{ current: item.current }">
            <span class="p">{{ item.label }}</span>
            <span class="v">{{ item.value }}</span>
          </li>
        </ul>
        <p v-if="hint.note" class="note">{{ hint.note }}</p>
      </div>

      <div class="actions drill-actions">
        <button v-if="!voice || revealed" class="primary" type="submit" :disabled="!canSubmit">
          {{ revealed ? 'Дальше' : 'Проверить' }}
        </button>
        <button v-if="!revealed" class="ghost" type="button" @click="skip">
          Пропустить
        </button>
      </div>
    </form>
  </section>
</template>
