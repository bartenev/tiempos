<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { explainForm } from '../lib/explain'
import type { AnswerCheck } from '../lib/normalize'
import { checkAnswer } from '../lib/normalize'
import type { DrillCard } from '../types'
import { TENSE_LABELS } from '../types'
import RuleHint from './RuleHint.vue'

const props = defineProps<{
  card: DrillCard
  index: number
  total: number
  correct: number
  wrong: number
  streak: number
  /** Устный режим: сказать форму вслух / про себя, открыть ответ и оценить себя. */
  oral?: boolean
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
/** Устный режим: ответ открыт, ждём самооценку. */
const shown = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)
/** Короткая зелёная вспышка: прошлый ответ верный, уже следующая карточка. */
const flashOk = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | undefined

const progress = computed(() => `${props.index + 1} / ${props.total}`)
const revealed = computed(() => feedback.value !== null)
const canCheck = computed(() => input.value.trim().length > 0)
const canSubmit = computed(() => revealed.value || canCheck.value)
const answered = computed(() => props.correct + props.wrong)
const accuracy = computed(() =>
  answered.value === 0 ? null : Math.round((props.correct / answered.value) * 100),
)

const hint = computed(() => {
  const show = feedback.value === 'wrong' || feedback.value === 'almost' || shown.value
  if (!show) return null
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
  if (feedback.value === null && !shown.value) return '___'
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
    shown.value = false
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

function reveal() {
  if (props.oral) shown.value = true
}

/** Самооценка в устном режиме; обе кнопки ведут к следующей карточке. */
function grade(ok: boolean) {
  if (!shown.value) return
  if (ok) {
    acceptCorrect()
    return
  }
  emit('wrong', '')
  emit('next')
}

/** Клавиатура в устном режиме: пробел / Enter — ответ, → верно, ← ошибся. */
function onKey(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (!shown.value && (event.key === ' ' || event.key === 'Enter')) {
    event.preventDefault()
    reveal()
  } else if (shown.value && event.key === 'ArrowRight') {
    event.preventDefault()
    grade(true)
  } else if (shown.value && event.key === 'ArrowLeft') {
    event.preventDefault()
    grade(false)
  }
}

onMounted(() => {
  if (props.oral) window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  clearTimeout(flashTimer)
  window.removeEventListener('keydown', onKey)
})
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

    <div
      class="prompt-card"
      :class="{ 'flash-ok': flashOk, tappable: oral && !shown }"
      @click="reveal"
    >
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
          shown,
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

    <div v-if="oral" class="oral">
      <button v-if="!shown" class="reveal-btn" type="button" @click="reveal">
        Скажите форму вслух или про себя —<br />тапните, чтобы проверить
      </button>
      <template v-else>
        <RuleHint v-if="hint" :hint="hint" />
        <div class="grade-actions">
          <button class="grade bad" type="button" @click="grade(false)">✗ Ошибся</button>
          <button class="grade ok" type="button" @click="grade(true)">✓ Сказал верно</button>
        </div>
      </template>
    </div>

    <form v-else class="answer-form" @submit.prevent="submit">
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

      <p v-if="feedback === 'almost'" class="hint almost-text">
        Почти — проверьте ударения. Правильно: <b>{{ card.answer }}</b>
      </p>
      <p v-else-if="feedback === 'wrong'" class="hint bad-text">
        Неверно. Правильно: <b>{{ card.answer }}</b>
      </p>

      <RuleHint v-if="hint" :hint="hint" />

      <div class="actions drill-actions">
        <button class="primary" type="submit" :disabled="!canSubmit">
          {{ revealed ? 'Дальше' : 'Проверить' }}
        </button>
        <button v-if="!revealed" class="ghost" type="button" @click="skip">
          Пропустить
        </button>
      </div>
    </form>
  </section>
</template>
