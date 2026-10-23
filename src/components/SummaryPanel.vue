<script setup lang="ts">
import { computed } from 'vue'
import { currentStreak, daysLabel, loadDaily } from '../lib/daily'
import type { SessionResult } from '../types'
import { TENSE_SHORT, personLabel } from '../types'
import Icon from './Icon.vue'

const props = defineProps<{
  result: SessionResult
}>()

const emit = defineEmits<{
  again: []
  setup: []
  progress: []
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
    const key = `${m.infinitive}|${m.tense}|${m.person}`
    if (seen.has(key)) return false
    seen.add(key)
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

    <ul class="stat-list summary__stats">
      <li class="stat-list__item summary__total">
        <span class="stat-list__label">Всего карточек</span><b class="stat-list__value">{{ result.total }}</b>
      </li>
      <li class="stat-list__item stat-list__item--ok summary__correct">
        <span class="stat-list__label">Верно</span><b class="stat-list__value">{{ result.correct }}</b>
      </li>
      <li class="stat-list__item stat-list__item--bad summary__wrong">
        <span class="stat-list__label">Ошибки</span><b class="stat-list__value">{{ result.wrong }}</b>
      </li>
      <li class="stat-list__item summary__skipped">
        <span class="stat-list__label">Пропущено</span><b class="stat-list__value">{{ result.skipped }}</b>
      </li>
    </ul>

    <template v-if="uniqueMistakes.length > 0">
      <h2 class="screen__section-title summary__mistakes-title">Над чем поработать</h2>
      <ul class="form-list summary__mistakes">
        <li
          v-for="m in uniqueMistakes"
          :key="`${m.infinitive}|${m.tense}|${m.person}`"
          class="form-list__item summary__mistake"
        >
          <span class="form-list__meta summary__mistake-meta">{{ m.infinitive }} · {{ TENSE_SHORT[m.tense] }} · {{ personLabel(m.tense, m.person) }}</span>
          <span class="form-list__forms summary__mistake-forms">
            <s v-if="m.given" class="form-list__given summary__mistake-given">{{ m.given }}</s>
            <b class="form-list__answer form-list__answer--ok summary__mistake-answer">{{ m.answer }}</b>
          </span>
        </li>
      </ul>
    </template>

    <div class="screen__actions summary__actions">
      <button class="button button--primary summary__again" type="button" @click="emit('again')">Ещё раз</button>
      <button class="button button--ghost summary__to-progress" type="button" @click="emit('progress')">Прогресс</button>
      <button class="button button--ghost summary__to-setup" type="button" @click="emit('setup')">Главный экран</button>
    </div>
  </section>
</template>
