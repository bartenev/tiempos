<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { explainForm } from '../lib/explain'
import type { AnswerCheck } from '../lib/normalize'
import { checkAnswer } from '../lib/normalize'
import type { DrillCard } from '../types'
import { TENSE_LABELS } from '../types'

const props = defineProps<{
  card: DrillCard
  index: number
  total: number
  correct: number
  wrong: number
  streak: number
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
    await nextTick()
    focusInput()
  },
  { immediate: true },
)

function submit() {
  if (feedback.value !== null) {
    emit('next')
    return
  }
  if (!canCheck.value) return
  const result = checkAnswer(input.value, props.card.answer)
  if (result === 'exact') {
    // Верно — сразу к следующему заданию, без «Дальше».
    emit('correct')
    emit('next')
    flashOk.value = false
    clearTimeout(flashTimer)
    // снять класс и поставить заново в следующем тике — анимация перезапустится
    nextTick(() => {
      flashOk.value = true
      flashTimer = setTimeout(() => (flashOk.value = false), 600)
    })
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
