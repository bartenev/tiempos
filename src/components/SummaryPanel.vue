<script setup lang="ts">
import { computed } from 'vue'
import { currentStreak, daysLabel, loadDaily } from '../lib/daily'
import { pluralRu } from '../lib/plural'
import type { SessionResult } from '../types'
import Icon from './Icon.vue'

const props = defineProps<{
  result: SessionResult
}>()

const emit = defineEmits<{
  again: []
}>()

const answered = computed(() => props.result.correct + props.result.wrong)

const accuracy = computed(() =>
  answered.value === 0 ? 0 : Math.round((props.result.correct / answered.value) * 100),
)

const duration = computed(() => {
  const s = props.result.seconds
  const m = Math.floor(s / 60)
  return m > 0 ? `${m} мин ${s % 60} с` : `${s} с`
})

const days = currentStreak(loadDaily())

/** Ошибки без дублей (повтор той же формы). */
const uniqueMistakes = computed(() => {
  const seen = new Set<string>()
  return props.result.mistakes.filter((m) => {
    if (seen.has(m.key)) return false
    seen.add(m.key)
    return true
  })
})
</script>

<template>
  <section class="summary">
    <h1 class="screen__title summary__title">¡Listo!</h1>
    <p class="screen__lead summary__lead">
      Сессия завершена<template v-if="days > 0"> · <Icon name="flame" />{{ daysLabel(days) }} подряд</template>.
    </p>

    <div class="stat-tiles summary__tiles">
      <div class="stat-tiles__item summary__accuracy">
        <b class="stat-tiles__value summary__accuracy-value">{{ accuracy }}%</b>
        <span class="stat-tiles__label summary__accuracy-label">точность</span>
      </div>
      <div class="stat-tiles__item summary__best-streak">
        <b class="stat-tiles__value summary__best-streak-value">{{ result.bestStreak }}</b>
        <span class="stat-tiles__label summary__best-streak-label">лучшая серия</span>
      </div>
      <div class="stat-tiles__item summary__time">
        <b class="stat-tiles__value summary__time-value">{{ duration }}</b>
        <span class="stat-tiles__label summary__time-label">время</span>
      </div>
    </div>

    <p class="summary__counts">
      <span class="summary__count summary__count--ok">{{ result.correct }} верно</span>
      <span class="summary__count summary__count--bad">{{ result.wrong }} {{ pluralRu(result.wrong, 'ошибка', 'ошибки', 'ошибок') }}</span>
      <span v-if="result.skipped > 0" class="summary__count summary__count--skipped">{{ result.skipped }} пропущено</span>
    </p>

    <template v-if="uniqueMistakes.length > 0">
      <h2 class="screen__section-title summary__mistakes-title">Над чем поработать</h2>
      <ul class="form-list summary__mistakes">
        <li
          v-for="m in uniqueMistakes"
          :key="m.key"
          class="form-list__item summary__mistake"
        >
          <span class="form-list__meta summary__mistake-meta">{{ m.meta }}</span>
          <span class="form-list__forms summary__mistake-forms">
            <s v-if="m.given" class="form-list__given summary__mistake-given">{{ m.given }}</s>
            <b class="form-list__answer form-list__answer--ok summary__mistake-answer">{{ m.answer }}</b>
          </span>
        </li>
      </ul>
    </template>

    <div class="screen__actions summary__actions">
      <button class="button button--primary summary__again" type="button" @click="emit('again')">Ещё раз</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
/* ===== summary ===== */

/* длинное предложение упражнения не сжимает ответ в столбик */
.summary__mistake-forms {
  flex: none;
  max-width: 55%;
}

.summary__counts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-2);
  margin: 0 0 var(--space-4);
  color: var(--muted);
}

.summary__count {
  font-weight: var(--weight-semibold);
  color: var(--ink);
}

/* разделитель «·» — перед следующим числом, чтобы при переносе не висел в конце строки */
.summary__count + .summary__count::before {
  content: '·';
  margin-right: var(--space-2);
  font-weight: var(--weight-regular);
  color: var(--muted);
}

.summary__count--ok {
  color: var(--ok);
}

.summary__count--bad {
  color: var(--bad);
}
</style>
