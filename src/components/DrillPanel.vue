<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
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
}>()

const emit = defineEmits<{
  correct: []
  wrong: []
  skip: []
  quit: []
  next: []
}>()

const input = ref('')
const feedback = ref<AnswerCheck | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

const progress = computed(() => `${props.index + 1} / ${props.total}`)
const revealed = computed(() => feedback.value !== null)
const canCheck = computed(() => input.value.trim().length > 0)
const canSubmit = computed(() => revealed.value || canCheck.value)

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

watch(
  () => [props.card.sentence, props.card.verb.infinitive, props.card.answer],
  async () => {
    input.value = ''
    feedback.value = null
    await nextTick()
    inputEl.value?.focus()
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
  feedback.value = result
  if (result === 'exact') emit('correct')
  else emit('wrong')
}

function skip() {
  if (feedback.value === null) emit('skip')
  emit('next')
}
</script>

<template>
  <section class="panel drill">
    <header class="bar">
      <button class="ghost" type="button" @click="emit('quit')">‹ выход</button>
      <span class="prog">{{ progress }}</span>
      <span class="score">
        ✓ {{ correct }} · ✗ {{ wrong }}
      </span>
    </header>

    <div class="prompt-card">
      <div class="meta">{{ TENSE_LABELS[card.tense] }}</div>
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
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        :readonly="revealed"
        :class="{
          ok: feedback === 'exact',
          almost: feedback === 'almost',
          bad: feedback === 'wrong',
        }"
        placeholder="вставьте форму в пропуск…"
      />

      <p v-if="feedback === 'exact'" class="hint ok-text">Верно!</p>
      <p v-else-if="feedback === 'almost'" class="hint almost-text">
        Почти — проверьте ударения. Правильно: <b>{{ card.answer }}</b>
      </p>
      <p v-else-if="feedback === 'wrong'" class="hint bad-text">
        Неверно. Правильно: <b>{{ card.answer }}</b>
      </p>

      <div class="actions">
        <button class="primary" type="submit" :disabled="!canSubmit">
          {{ revealed ? 'Дальше' : 'Проверить' }}
        </button>
        <button class="ghost" type="button" @click="skip">Пропустить</button>
      </div>
    </form>
  </section>
</template>
