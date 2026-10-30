<script setup lang="ts">
import { computed } from 'vue'
import { cardBlanks } from '../lib/cards'
import type { AnswerCheck } from '../lib/normalize'
import type { AnyCard } from '../types'
import { TENSE_LABELS, isBookCard } from '../types'
import ZoomImage from './ZoomImage.vue'

const props = defineProps<{
  card: AnyCard
  oral?: boolean
  /** Проверка по полям; null — ещё не проверяли. */
  checks: AnswerCheck[] | null
  /** Устный режим: ответ открыт, ждём самооценку. */
  shown: boolean
  /** Короткая зелёная вспышка: прошлый ответ верный. */
  flash: boolean
}>()

const emit = defineEmits<{
  reveal: []
}>()

const CHECK_CLASS: Record<AnswerCheck, string> = {
  exact: 'drill__blank--ok',
  almost: 'drill__blank--almost',
  wrong: 'drill__blank--bad',
}

/** Упражнение учебника; у глагола — null. */
const book = computed(() => (isBookCard(props.card) ? props.card : null))

const label = computed(() => {
  const { card } = props
  return isBookCard(card) ? `Глава ${card.unit}` : TENSE_LABELS[card.tense]
})

/** Подсказка в скобках у пропуска; устно варианты уходят сюда с кнопок. */
const cue = computed(() => {
  const { card } = props
  if (!isBookCard(card)) return card.verb.infinitive
  return (props.oral && card.options?.join(' / ')) || card.cue
})

/** Части предложения вокруг пропусков `___`. */
const parts = computed(() => props.card.sentence.split('___'))

const blankCount = computed(() => parts.value.length - 1)

const answers = computed(() => cardBlanks(props.card).map(([main]) => main))

const filled = computed(() => props.shown || props.checks !== null)

function blankClass(i: number): string | undefined {
  const check = props.checks?.[i]
  return check && CHECK_CLASS[check]
}
</script>

<template>
  <div
    class="drill__card"
    :class="{ 'drill__card--flash': flash, 'drill__card--tappable': oral && !shown }"
    @click="emit('reveal')"
  >
    <div class="drill__tense">
      {{ label }}
      <span v-if="card.retry" class="drill__retry">повтор</span>
    </div>
    <p v-if="book" class="drill__task">{{ book.task }}</p>
    <p v-if="book?.bank" class="drill__bank" lang="es">{{ book.bank }}</p>
    <p v-if="book?.prompt" class="drill__prompt">{{ book.prompt }}</p>
    <ZoomImage v-if="book?.image" class="drill__image" :src="book.image" alt="Иллюстрация из учебника" />
    <p
      class="drill__sentence"
      :class="{ 'drill__sentence--stimulus': book && blankCount === 0 }"
    >
      <template v-for="(part, i) in parts" :key="i">
        <span class="drill__sentence-part">{{ part }}</span>
        <template v-if="i < blankCount">
          <!-- пустой пропуск — неразрывный пробел: линию рисует border-bottom -->
          <span class="drill__blank" :class="blankClass(i)">
            <template v-if="filled">{{ answers[i] }}</template>
            <span v-else-if="blankCount > 1" class="drill__blank-number">{{ i + 1 }}</span>
            <template v-else>&nbsp;</template>
          </span>
          <span v-if="cue && blankCount === 1" class="drill__infinitive">({{ cue }})</span>
        </template>
      </template>
      <span v-if="cue && blankCount !== 1" class="drill__infinitive">({{ cue }})</span>
    </p>
    <p class="drill__translation">{{ card.translation }}</p>
  </div>
</template>

<style scoped lang="scss">
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

/* упражнение учебника: что сделать */
.drill__task {
  margin: var(--space-2) 0 0;
}

.drill__bank {
  margin: 0 0 var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--line);
  color: var(--ink);
  font-size: var(--text-sm);
  font-style: italic;
}

.drill__prompt {
  margin: 0 0 var(--space-2);
  color: var(--muted);
  font-size: var(--text-sm);
}

.drill__sentence {
  margin: var(--space-3) 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  line-height: 1.45;
  color: var(--ink);
  text-wrap: balance;
}

.drill__sentence--stimulus {
  font-size: var(--text-lg);
  color: var(--ink);
}

.drill__blank {
  display: inline-block;
  min-width: 4ch;
  padding: 0 var(--space-1);
  border-bottom: 2px solid var(--accent);
  font-weight: var(--weight-bold);
  color: var(--accent);
}

.drill__blank--ok {
  border-color: var(--ok);
  color: var(--ok);
}

.drill__blank--almost {
  border-color: var(--almost);
  color: var(--almost);
}

.drill__blank--bad {
  border-color: var(--bad);
  color: var(--bad);
}

.drill__blank-number {
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  color: var(--muted);
}

.drill__infinitive {
  font-weight: var(--weight-regular);
  color: var(--muted);
  white-space: nowrap;
}

.drill__translation {
  margin: 0;
}

@media (prefers-reduced-motion: reduce) {
  .drill__card--flash {
    animation: none;
  }
}

@media (max-width: 420px) {
  .drill__sentence {
    font-size: var(--text-lg);
  }
}
</style>
