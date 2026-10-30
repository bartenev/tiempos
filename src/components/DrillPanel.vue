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
  /** Устный режим: прошлую самооценку можно отменить. */
  canUndo?: boolean
  /** К карточке вернулись отменой — ответ сразу открыт, ждём новую оценку. */
  reopened?: boolean
}>()

const emit = defineEmits<{
  correct: []
  wrong: [given: string]
  skip: []
  quit: []
  next: []
  undo: []
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
    shown.value = Boolean(props.oral && props.reopened)
    shownAt = Date.now()
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

/** Клавиатура в устном режиме: пробел / Enter — ответ, → верно, ← ошибся, Backspace — отмена. */
function onKey(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (event.key === 'Backspace' && props.canUndo) {
    event.preventDefault()
    emit('undo')
  } else if (!shown.value && (event.key === ' ' || event.key === 'Enter')) {
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
        <button v-if="canUndo" class="drill__undo" type="button" @click="emit('undo')">
          <Icon name="back" />Вернуть прошлую карточку
        </button>
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

      <div v-if="!revealed" class="drill__accents" role="group" aria-label="Буквы с ударением">
        <button
          v-for="ch in ACCENTS"
          :key="ch"
          class="drill__accent"
          type="button"
          tabindex="-1"
          @pointerdown.prevent
          @click="insertAccent(ch)"
        >
          {{ ch }}
        </button>
      </div>

      <!-- правильная форма уже крупно под карточкой — здесь только вердикт -->
      <p v-if="feedback === 'almost'" class="notice notice--almost drill__feedback">
        Почти — проверьте ударения.
      </p>
      <p v-else-if="feedback === 'wrong'" class="notice notice--bad drill__feedback">
        Неверно.
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

<style scoped lang="scss">
/* ===== drill: верх экрана ===== */

.drill__score {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.drill__meter {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: calc(-1 * var(--space-2)) 0 var(--space-4);
  font-size: var(--text-sm);
  color: var(--muted);
}

.drill__meter-track {
  flex: 1;
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--line);
  overflow: hidden;
}

.drill__meter-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 0.25s ease;
}

.drill__meter-stats {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  min-width: 5.5rem;
  font-variant-numeric: tabular-nums;
}

.drill__streak {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: var(--weight-semibold);
  color: var(--ink);
}

/* ===== drill: карточка задания (два размера: предложение и служебное) ===== */

.drill__card {
  margin-bottom: var(--space-4);
  padding: var(--space-5) var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--card);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--muted);
}

.drill__card--tappable {
  cursor: pointer;
}

.drill__card--flash {
  animation: flash-ok 0.6s ease-out;
}

@keyframes flash-ok {
  0% {
    border-color: var(--ok);
    box-shadow: 0 0 0 3px var(--ok-bg);
  }
  100% {
    border-color: var(--line);
    box-shadow: 0 0 0 3px transparent;
  }
}

.drill__tense {
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.drill__retry {
  margin-left: var(--space-2);
  padding: 0 var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--surface);
}

.drill__sentence {
  margin: var(--space-3) 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  line-height: 1.45;
  color: var(--ink);
  text-wrap: balance;
}

.drill__blank {
  display: inline-block;
  min-width: 4ch;
  padding: 0 var(--space-1);
  border-bottom: 2px solid var(--accent);
  font-weight: var(--weight-bold);
  color: var(--accent);
}

.drill__sentence--ok .drill__blank {
  border-color: var(--ok);
  color: var(--ok);
}

.drill__sentence--almost .drill__blank {
  border-color: var(--almost);
  color: var(--almost);
}

.drill__sentence--bad .drill__blank {
  border-color: var(--bad);
  color: var(--bad);
}

.drill__sentence--shown .drill__blank {
  border-color: var(--accent);
  color: var(--accent);
}

.drill__infinitive {
  font-weight: var(--weight-regular);
  color: var(--muted);
  white-space: nowrap;
}

.drill__translation {
  margin: 0;
}

/* ===== drill: крупный ответ под карточкой ===== */

.drill__answer {
  margin: 0 0 var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--card);
  text-align: center;
  font-size: var(--text-display);
  font-weight: var(--weight-bold);
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: var(--accent);
  overflow-wrap: anywhere;
  animation: answer-in 0.18s ease-out;
}

@keyframes answer-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
}

/* ===== drill: ввод текстом ===== */

.drill__input {
  width: 100%;
  min-height: 3.25rem;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--line);
  border-radius: var(--radius-md);
  outline: none;
  background: var(--input-bg);
  font: inherit;
  font-size: var(--text-lg);
  color: var(--ink);
}

.drill__input:focus {
  border-color: var(--accent);
}

.drill__input--ok {
  border-color: var(--ok);
  background: var(--ok-bg);
}

.drill__input--almost {
  border-color: var(--almost);
  background: var(--almost-bg);
}

.drill__input--bad {
  border-color: var(--bad);
  background: var(--bad-bg);
}

.drill__accents {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.drill__accent {
  min-height: var(--tap);
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--card);
  font: inherit;
  font-size: var(--text-lg);
  color: var(--ink);
  cursor: pointer;
}

.drill__accent:active:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.drill__submit {
  flex: 1;
}

/* ===== drill: устный режим ===== */

.drill__dock {
  margin-top: var(--space-4);
}

.drill__undo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border: none;
  border-radius: var(--radius-pill);
  background: var(--card);
  font: inherit;
  font-size: var(--text-sm);
  color: var(--muted);
  cursor: pointer;
}

.drill__undo:hover {
  color: var(--ink);
}

.drill__reveal {
  width: 100%;
  min-height: 6rem;
  padding: var(--space-4);
  border: 1.5px dashed var(--line);
  border-radius: var(--radius-md);
  background: var(--card);
  font: inherit;
  line-height: 1.45;
  color: var(--muted);
  cursor: pointer;
}

.drill__reveal:hover {
  border-color: var(--accent);
  color: var(--ink);
}

.drill__grades {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.drill__grade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 6rem;
  border: 1.5px solid transparent;
  border-radius: var(--radius-md);
  font: inherit;
  font-weight: var(--weight-bold);
  cursor: pointer;
}

.drill__grade--bad {
  border-color: var(--bad);
  background: var(--bad-bg);
  color: var(--bad);
}

.drill__grade--ok {
  border-color: var(--ok);
  background: var(--ok-bg);
  color: var(--ok);
}

/* ===== адаптив ===== */

@media (prefers-reduced-motion: reduce) {
  .drill__card--flash,
  .drill__answer {
    animation: none;
  }
}

/* телефон: зона тапа и оценки — внизу экрана, контент прокручивается над ней */
@media (max-width: 640px) {
  /* «Проверить / Дальше» — тоже у нижнего края, когда подсказка длинная */
  .drill__actions {
    position: sticky;
    bottom: 0;
    z-index: 2;
    margin: var(--space-2) calc(-1 * var(--space-4)) 0;
    padding: var(--space-3) var(--space-4) calc(var(--space-3) + env(safe-area-inset-bottom));
    background: linear-gradient(to top, var(--bg) 70%, transparent);
  }

  .drill--oral {
    padding-bottom: calc(8rem + env(safe-area-inset-bottom));
  }

  .drill__dock {
    position: fixed;
    left: 50%;
    bottom: 0;
    z-index: 3;
    width: 100%;
    max-width: 460px;
    margin: 0;
    padding: var(--space-5) calc(var(--space-4) + env(safe-area-inset-right))
      calc(var(--space-4) + env(safe-area-inset-bottom)) calc(var(--space-4) + env(safe-area-inset-left));
    background: linear-gradient(to top, var(--bg) 75%, transparent);
    transform: translateX(-50%);
  }
}

@media (max-width: 420px) {
  .drill__sentence {
    font-size: var(--text-lg);
  }
}
</style>
