<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cardBlanks } from '../lib/cards'
import { explainForm } from '../lib/explain'
import type { AnswerCheck } from '../lib/normalize'
import { checkBlanks, overallCheck } from '../lib/normalize'
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
  /** Снять только что засчитанную ошибку: ответ был верным. */
  revert: []
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
/** Короткая зелёная вспышка: прошлый ответ верный, уже следующая карточка. */
const flashOk = ref(false)
let flashTimer: ReturnType<typeof setTimeout> | undefined

const progress = computed(() => `${props.index + 1} / ${props.total}`)
const answered = computed(() => props.correct + props.wrong)
const accuracy = computed(() =>
  answered.value === 0 ? null : Math.round((props.correct / answered.value) * 100),
)

/** Ответ открыт: устно после тапа или текстом после ошибки. */
const answerShown = computed(() => shown.value || checks.value !== null)

const hint = computed(() => {
  if (!answerShown.value) return null
  const { card } = props
  return isBookCard(card)
    ? { rule: card.rule, row: [] }
    : explainForm(card.verb, card.tense, card.person)
})

watch(
  () => [props.card, props.index],
  () => {
    checks.value = null
    shown.value = Boolean(props.oral && props.reopened)
    shownAt = Date.now()
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

function check(inputs: string[]) {
  const result = checkBlanks(inputs, cardBlanks(props.card))
  if (overallCheck(result) === 'exact') {
    acceptCorrect()
    return
  }
  checks.value = result
  emit('wrong', inputs.length > 1 ? inputs.map((value) => value || '—').join('; ') : inputs[0]!)
}

/** Ответ верный, просто его нет среди вариантов: ошибка не считается. */
function acceptOwn() {
  emit('revert')
  acceptCorrect()
}

function skip() {
  emit('skip')
  emit('next')
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
      <OralDock
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
    />
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
