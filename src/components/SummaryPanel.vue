<script setup lang="ts">
import { computed } from 'vue'
import { currentStreak, daysLabel, loadDaily } from '../lib/daily'
import type { SessionResult } from '../types'
import { TENSE_SHORT, personLabel } from '../types'

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
  <section class="panel">
    <h1>¡Listo!</h1>
    <p class="lead">
      Сессия завершена<template v-if="days > 0"> · 🔥 {{ daysLabel(days) }} подряд</template>.
    </p>

    <div class="big-stats">
      <div class="big-stat">
        <b>{{ accuracy }}%</b>
        <span>точность</span>
      </div>
      <div class="big-stat">
        <b>{{ result.bestStreak }}</b>
        <span>лучшая серия</span>
      </div>
      <div class="big-stat">
        <b>{{ duration }}</b>
        <span>время</span>
      </div>
    </div>

    <ul class="stats">
      <li><span>Всего карточек</span><b>{{ result.total }}</b></li>
      <li class="ok-text"><span>Верно</span><b>{{ result.correct }}</b></li>
      <li class="bad-text"><span>Ошибки</span><b>{{ result.wrong }}</b></li>
      <li><span>Пропущено</span><b>{{ result.skipped }}</b></li>
    </ul>

    <template v-if="uniqueMistakes.length > 0">
      <h2 class="section-title">Над чем поработать</h2>
      <ul class="mistakes">
        <li v-for="m in uniqueMistakes" :key="`${m.infinitive}|${m.tense}|${m.person}`">
          <span class="m-meta">{{ m.infinitive }} · {{ TENSE_SHORT[m.tense] }} · {{ personLabel(m.tense, m.person) }}</span>
          <span class="m-forms">
            <s class="bad-text">{{ m.given }}</s>
            <b class="ok-text">{{ m.answer }}</b>
          </span>
        </li>
      </ul>
    </template>

    <div class="actions">
      <button class="primary" type="button" @click="emit('again')">Ещё раз</button>
      <button class="ghost" type="button" @click="emit('progress')">Прогресс</button>
      <button class="ghost" type="button" @click="emit('setup')">Настройки</button>
    </div>
  </section>
</template>
