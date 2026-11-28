<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cardBlanks } from '../lib/cards'
import { explainForm } from '../lib/explain'
import type { AnswerCheck } from '../lib/normalize'
import { checkBlanks, overallCheck } from '../lib/normalize'
import { settings } from '../lib/settingsState'
import type { Trend } from '../lib/tempo'
import type { AnswerTiming } from '../lib/timing'
import type { AnyCard } from '../types'
import { isBookCard } from '../types'
import AnswerForm from './AnswerForm.vue'
import DrillPrompt from './DrillPrompt.vue'
import Icon from './Icon.vue'
import OralDock from './OralDock.vue'
import RuleHint from './RuleHint.vue'

const props = defineProps<{
  card: AnyCard
  index: number
  /** Сколько карточек в сессии; null — бесконечная сессия (умный режим). */
  total: number | null
  correct: number
  wrong: number
  streak: number
  /** Устный режим: сказать форму вслух / про себя, открыть ответ и оценить себя. */
  oral?: boolean
  /** Устный режим: прошлую самооценку можно отменить. */
  canUndo?: boolean
  /** К карточке вернулись отменой — ответ сразу открыт, ждём новую оценку. */
  reopened?: boolean
  /**
   * Что решил умный режим («Разогрев пройден», «похоже на усталость») — экраном
   * вместо карточки: прочитали, тап — и карточка; её время считается с этого момента.
   */
  notice?: string | null
  /** Как идёт занятие («Лаборатория» → «Стрелка темпа»); null — не показываем. */
  trend?: Trend | null
}>()

const emit = defineEmits<{
  /** timing — сколько заняла карточка; null — время не годится (вкладка была скрыта, повторная оценка). */
  correct: [timing: AnswerTiming | null]
  wrong: [given: string, timing: AnswerTiming | null]
  skip: []
  quit: []
  next: []
  undo: []
  /** Снять только что засчитанную ошибку: ответ был верным. */
  revert: []
  /** Подсказку прочитали — показать карточку. */
  dismiss: []
}>()

/** Проверка по полям ввода; null — ещё не проверяли или ответ принят. */
const checks = ref<AnswerCheck[] | null>(null)
/** Устный режим: ответ открыт, ждём самооценку. */
const shown = ref(false)
/**
 * Кнопки оценки появляются ровно под пальцем, которым открыли ответ, —
 * короткая пауза, чтобы двойной тап не поставил оценку случайно.
 */
const GRADE_GUARD_MS = 350
let shownAt = 0

/** Когда карточка появилась, когда начали печатать / открыли ответ — время ответа. */
let cardAt = 0
let recalledAt: number | null = null
/** Вкладку скрывали, пока карточка была на экране: время не о вспоминании. */
let away = false

function onVisibility() {
  if (document.hidden) away = true
}

/** Время ответа на текущую карточку; null, если его нельзя считать честным. */
function timing(): AnswerTiming | null {
  if (away || props.reopened) return null
  const now = Date.now()
  return { ms: (recalledAt ?? now) - cardAt, total: now - cardAt }
}

function onType() {
  recalledAt ??= Date.now()
}
/** Короткая зелёная вспышка: прошлый ответ верный, уже следующая карточка. */
const flashOk = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | undefined

const progress = computed(() =>
  props.total === null ? `${props.index + 1}` : `${props.index + 1} / ${props.total}`,
)
const TREND_LABELS: Record<Trend, string> = {
  up: 'темп лучше обычного',
  flat: 'темп как обычно',
  down: 'темп хуже обычного',
}

const answered = computed(() => props.correct + props.wrong)
const accuracy = computed(() =>
  answered.value === 0 ? null : Math.round((props.correct / answered.value) * 100),
)

/** Ответ открыт: устно после тапа или текстом после ошибки. */
const answerShown = computed(() => shown.value || checks.value !== null)

const hint = computed(() => {
  if (!answerShown.value) return null
  const { card } = props
  if (!isBookCard(card)) return explainForm(card.verb, card.tense, card.person)
  // «Лаборатория» → «Короткие пояснения»: одна строка своими словами вместо разбора
  if (card.brief && settings.labs.briefHints) return { rule: card.brief, row: [], source: card.source }
  return { rule: card.rule, row: [], steps: card.steps, notes: card.notes, source: card.source }
})

watch(
  () => [props.card, props.index],
  () => {
    checks.value = null
    shown.value = Boolean(props.oral && props.reopened)
    shownAt = Date.now()
    cardAt = shownAt
    recalledAt = null
    away = false
  },
  { immediate: true },
)

/** Подсказка на экране: клавиша, которой ответили на прошлую карточку, её не закрывает. */
const NOTICE_GUARD_MS = 400
let noticeAt = 0

watch(
  () => props.notice,
  (text, before) => {
    if (text) noticeAt = Date.now()
    else if (before) {
      // время карточки — с момента, когда её стало видно
      cardAt = Date.now()
      recalledAt = null
      away = false
    }
  },
  { immediate: true },
)

function dismiss() {
  if (!props.notice || Date.now() - noticeAt < NOTICE_GUARD_MS) return
  emit('dismiss')
}

/** Пока подсказка на экране, любая клавиша её закрывает и не попадает в поле ответа. */
function onNoticeKey(event: KeyboardEvent) {
  if (!props.notice || event.metaKey || event.ctrlKey || event.altKey) return
  event.preventDefault()
  event.stopImmediatePropagation()
  dismiss()
}

/** Верно — сразу к следующему заданию, без «Дальше». */
function acceptCorrect(time: AnswerTiming | null = timing()) {
  emit('correct', time)
  emit('next')
  flashOk.value = false
  clearTimeout(flashTimer)
  // снять класс и поставить заново в следующем тике — анимация перезапустится
  nextTick(() => {
    flashOk.value = true
    flashTimer = setTimeout(() => (flashOk.value = false), 600)
  })
}

function check(inputs: string[]) {
  const result = checkBlanks(inputs, cardBlanks(props.card))
  if (overallCheck(result) === 'exact') {
    acceptCorrect()
    return
  }
  checks.value = result
  emit('wrong', inputs.length > 1 ? inputs.map((value) => value || '—').join('; ') : inputs[0]!, timing())
}

/** Ответ верный, просто его нет среди вариантов: ошибка не считается. */
function acceptOwn() {
  emit('revert')
  acceptCorrect(null)
}

function skip() {
  emit('skip')
  emit('next')
}

function reveal() {
  if (!props.oral || shown.value || props.notice) return
  shown.value = true
  shownAt = Date.now()
  recalledAt = shownAt
}

/** Самооценка в устном режиме; обе кнопки ведут к следующей карточке. */
function grade(ok: boolean) {
  if (props.notice || !shown.value || Date.now() - shownAt < GRADE_GUARD_MS) return
  if (ok) {
    acceptCorrect()
    return
  }
  emit('wrong', '', timing())
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
  // раньше обработчика устного режима: клавиша, закрывшая подсказку, не оценивает карточку
  window.addEventListener('keydown', onNoticeKey, { capture: true })
  if (props.oral) window.addEventListener('keydown', onKey)
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  clearTimeout(flashTimer)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keydown', onNoticeKey, { capture: true })
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <section class="drill" :class="{ 'drill--oral': oral }">
    <header class="topbar drill__bar">
      <button class="button button--ghost button--small topbar__back drill__quit" type="button" @click="emit('quit')"><Icon name="back" />{{ answered > 0 ? 'закончить' : 'выход' }}</button>
      <span class="topbar__title drill__counter">{{ progress }}</span>
      <span class="topbar__aside drill__score">
        <Icon name="check" />{{ correct }}
        <Icon name="cross" />{{ wrong }}
      </span>
    </header>

    <div class="drill__meter" aria-live="polite">
      <!-- в бесконечной сессии полоски нет: заканчиваете, когда хотите -->
      <div v-if="total !== null" class="drill__meter-track">
        <div class="drill__meter-fill" :style="{ width: `${(index / total) * 100}%` }" />
      </div>
      <span class="drill__meter-stats">
        <span
          v-if="trend"
          class="drill__trend"
          :class="`drill__trend--${trend}`"
          role="img"
          :aria-label="TREND_LABELS[trend]"
          :title="TREND_LABELS[trend]"
        ><Icon name="trend" /></span>
        <span v-if="accuracy !== null" class="drill__accuracy">{{ accuracy }}%</span>
        <span v-if="streak >= 2" class="drill__streak"><Icon name="flame" />{{ streak }}</span>
      </span>
    </div>

    <div class="drill__body">
    <!-- поле ответа остаётся в фокусе (клавиатура на телефоне не прячется), карточка закрыта -->
    <div
      v-if="notice"
      class="drill__notice"
      role="status"
      @pointerdown.prevent
      @mousedown.prevent
      @click="dismiss"
    >
      <p class="drill__notice-text">{{ notice }}</p>
      <p class="drill__notice-hint">тап или любая клавиша — дальше</p>
    </div>

    <DrillPrompt
      :card="card"
      :oral="oral"
      :checks="checks"
      :shown="shown"
      :flash="flashOk"
      @reveal="reveal"
    />

    <p v-if="answerShown" class="drill__answer" lang="es">{{ card.answer }}</p>

    <template v-if="oral">
      <RuleHint v-if="hint" class="drill__hint" :hint="hint" />
      <!-- на телефоне док прибит к низу экрана поверх всего — пока подсказка, его нет -->
      <OralDock
        v-if="!notice"
        :shown="shown"
        :can-undo="canUndo"
        :subject="isBookCard(card) ? 'ответ' : 'форму'"
        @reveal="reveal"
        @grade="grade"
        @undo="emit('undo')"
      />
    </template>

    <AnswerForm
      v-else
      :card="card"
      :index="index"
      :checks="checks"
      :hint="hint"
      @check="check"
      @next="emit('next')"
      @skip="skip"
      @own="acceptOwn"
      @type="onType"
    />
    </div>
  </section>
</template>

<style scoped lang="scss">
/* ===== drill: верх экрана ===== */

.drill__body {
  position: relative;
}

/* подсказка умного режима — поверх карточки и поля ответа, пока не прочитали */
.drill__notice {
  position: absolute;
  inset: 0;
  /* выше прилипших к низу кнопок «Проверить / Пропустить» */
  z-index: 4;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-5);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--card);
  text-align: center;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.drill__notice-text {
  margin: 0;
  max-width: 32ch;
  font-size: var(--text-lg);
  line-height: 1.45;
  text-wrap: balance;
}

.drill__notice-hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--muted);
}

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
  /* без полоски (бесконечная сессия) — всё равно справа */
  margin-left: auto;
  gap: var(--space-3);
  min-width: 5.5rem;
  font-variant-numeric: tabular-nums;
}

.drill__trend {
  display: inline-flex;
  align-items: center;
}

.drill__trend .icon {
  width: 1.4em;
  height: 1.4em;
  stroke-width: 2.5;
  transition: transform 0.4s ease, color 0.4s ease;
}

.drill__trend--up {
  color: var(--ok);
}

.drill__trend--up .icon {
  transform: rotate(-45deg);
}

.drill__trend--flat {
  color: var(--almost);
}

.drill__trend--down {
  color: var(--bad);
}

.drill__trend--down .icon {
  transform: rotate(45deg);
}

.drill__streak {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: var(--weight-semibold);
  color: var(--ink);
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

@media (prefers-reduced-motion: reduce) {
  .drill__answer {
    animation: none;
  }
}

/* телефон: контент прокручивается над зоной оценки */
@media (max-width: 640px) {
  .drill--oral {
    padding-bottom: calc(8rem + env(safe-area-inset-bottom));
  }
}
</style>
