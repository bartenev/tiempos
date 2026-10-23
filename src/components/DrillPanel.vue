<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { explainForm } from '../lib/explain'
import type { AnswerCheck } from '../lib/normalize'
import { checkAnswer } from '../lib/normalize'
import type { DrillCard } from '../types'
import { TENSE_LABELS } from '../types'
import Icon from './Icon.vue'
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
/**
 * Кнопки оценки появляются ровно под пальцем, которым открыли ответ, —
 * короткая пауза, чтобы двойной тап не поставил оценку случайно.
 */
const GRADE_GUARD_MS = 350
let shownAt = 0
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

/** Ответ открыт: устно после тапа или текстом после ошибки. */
const answerShown = computed(
  () => shown.value || feedback.value === 'wrong' || feedback.value === 'almost',
)

/**
 * Пустой пропуск — неразрывный пробел: линию рисует border-bottom,
 * символы «___» дали бы вторую линию.
 */
const filledBlank = computed(() => {
  if (feedback.value === null && !shown.value) return '\u00a0'
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
  if (!props.oral || shown.value) return
  shown.value = true
  shownAt = Date.now()
}

/** Самооценка в устном режиме; обе кнопки ведут к следующей карточке. */
function grade(ok: boolean) {
  if (!shown.value || Date.now() - shownAt < GRADE_GUARD_MS) return
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
  <section class="drill" :class="{ 'drill--oral': oral }">
    <header class="topbar drill__bar">
      <button class="button button--ghost button--small topbar__back drill__quit" type="button" @click="emit('quit')"><Icon name="back" />выход</button>
      <span class="topbar__title drill__counter">{{ progress }}</span>
      <span class="topbar__aside drill__score">
        <Icon name="check" />{{ correct }}
        <Icon name="cross" />{{ wrong }}
      </span>
    </header>

    <div class="drill__meter" aria-live="polite">
      <div class="drill__meter-track">
        <div class="drill__meter-fill" :style="{ width: `${((index) / total) * 100}%` }" />
      </div>
      <span class="drill__meter-stats">
        <span v-if="accuracy !== null" class="drill__accuracy">{{ accuracy }}%</span>
        <span v-if="streak >= 2" class="drill__streak"><Icon name="flame" />{{ streak }}</span>
      </span>
    </div>

    <div
      class="drill__card"
      :class="{ 'drill__card--flash': flashOk, 'drill__card--tappable': oral && !shown }"
      @click="reveal"
    >
      <div class="drill__tense">
        {{ TENSE_LABELS[card.tense] }}
        <span v-if="card.retry" class="drill__retry">повтор</span>
      </div>
      <p
        class="drill__sentence"
        :class="{
          'drill__sentence--ok': feedback === 'exact',
          'drill__sentence--almost': feedback === 'almost',
          'drill__sentence--bad': feedback === 'wrong',
          'drill__sentence--shown': shown,
        }"
      >
        <span class="drill__sentence-before">{{ sentenceParts.before }}</span>
        <span class="drill__blank">{{ filledBlank }}</span> <span class="drill__infinitive">({{ card.verb.infinitive }})</span>
        <span class="drill__sentence-after">{{ sentenceParts.after }}</span>
      </p>
      <p class="drill__translation">{{ card.translation }}</p>
    </div>

    <p v-if="answerShown" class="drill__answer" lang="es">{{ card.answer }}</p>

    <template v-if="oral">
      <RuleHint v-if="hint" class="drill__hint" :hint="hint" />
      <!-- На телефоне закреплено внизу экрана — под большой палец. -->
      <div class="drill__dock">
        <button v-if="!shown" class="drill__reveal" type="button" @click="reveal">
          Скажите форму вслух или про себя —<br class="drill__reveal-break" />тапните, чтобы проверить
        </button>
        <div v-else class="drill__grades">
          <button class="drill__grade drill__grade--bad" type="button" @click="grade(false)"><Icon name="cross" />Ошибся</button>
          <button class="drill__grade drill__grade--ok" type="button" @click="grade(true)"><Icon name="check" />Сказал верно</button>
        </div>
      </div>
    </template>

    <form v-else class="drill__form" @submit.prevent="submit">
      <label class="sr-only drill__label" for="answer">Форма глагола</label>
      <input
        id="answer"
        ref="inputEl"
        v-model="input"
        class="drill__input"
        :class="{
          'drill__input--ok': feedback === 'exact',
          'drill__input--almost': feedback === 'almost',
          'drill__input--bad': feedback === 'wrong',
        }"
        type="text"
        inputmode="text"
        enterkeyhint="go"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        lang="es"
        :readonly="revealed"
        placeholder="форма глагола…"
      />

      <div class="drill__accents" role="group" aria-label="Буквы с ударением">
        <button
          v-for="ch in ACCENTS"
          :key="ch"
          class="drill__accent"
          type="button"
          tabindex="-1"
          :disabled="revealed"
          @pointerdown.prevent
          @click="insertAccent(ch)"
        >
          {{ ch }}
        </button>
      </div>

      <p v-if="feedback === 'almost'" class="notice notice--almost drill__feedback">
        Почти — проверьте ударения. Правильно: <b class="drill__correct-form">{{ card.answer }}</b>
      </p>
      <p v-else-if="feedback === 'wrong'" class="notice notice--bad drill__feedback">
        Неверно. Правильно: <b class="drill__correct-form">{{ card.answer }}</b>
      </p>

      <RuleHint v-if="hint" class="drill__hint" :hint="hint" />

      <div class="screen__actions drill__actions">
        <button class="button button--primary drill__submit" type="submit" :disabled="!canSubmit">
          {{ revealed ? 'Дальше' : 'Проверить' }}
        </button>
        <button v-if="!revealed" class="button button--ghost drill__skip" type="button" @click="skip">
          Пропустить
        </button>
      </div>
    </form>
  </section>
</template>
