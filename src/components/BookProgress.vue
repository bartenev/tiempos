<script setup lang="ts">
import { computed } from 'vue'
import { CHAPTERS } from '../data/book'
import { chapterProgress, chapterSize } from '../lib/book'
import type { Mastery } from '../lib/stats'
import { loadBookStats } from '../lib/stats'

const emit = defineEmits<{
  'train-weak': []
}>()

const stats = loadBookStats()

const MASTERY_LABELS: Record<Mastery, string> = {
  solid: 'выучено',
  learning: 'учу',
  weak: 'слабое',
  new: 'не встречалось',
}

const SEGMENTS: Mastery[] = ['solid', 'learning', 'weak']

const rows = CHAPTERS.map((chapter) => ({
  chapter,
  total: chapterSize(chapter),
  counts: chapterProgress(chapter, stats),
}))

const totals = computed(() => {
  const counts: Record<Mastery, number> = { new: 0, weak: 0, learning: 0, solid: 0 }
  for (const row of rows) {
    for (const m of Object.keys(counts) as Mastery[]) counts[m] += row.counts[m]
  }
  let ok = 0
  let bad = 0
  for (const stat of Object.values(stats)) {
    ok += stat.ok
    bad += stat.bad
  }
  const answered = ok + bad
  return {
    answered,
    accuracy: answered === 0 ? null : Math.round((ok / answered) * 100),
    counts,
    total: rows.reduce((sum, row) => sum + row.total, 0),
  }
})
</script>

<template>
  <section class="book-progress">
    <h1 class="screen__title book-progress__title">Прогресс</h1>

    <div class="stat-tiles book-progress__tiles">
      <div class="stat-tiles__item book-progress__answered">
        <b class="stat-tiles__value book-progress__answered-value">{{ totals.answered }}</b>
        <span class="stat-tiles__label book-progress__answered-label">ответов</span>
      </div>
      <div class="stat-tiles__item book-progress__accuracy">
        <b class="stat-tiles__value book-progress__accuracy-value">{{ totals.accuracy === null ? '—' : `${totals.accuracy}%` }}</b>
        <span class="stat-tiles__label book-progress__accuracy-label">точность</span>
      </div>
      <div class="stat-tiles__item book-progress__solid">
        <b class="stat-tiles__value book-progress__solid-value">{{ totals.counts.solid }}</b>
        <span class="stat-tiles__label book-progress__solid-label">выучено из {{ totals.total }}</span>
      </div>
    </div>

    <div class="screen__actions book-progress__actions">
      <button
        class="button button--primary book-progress__train"
        type="button"
        :disabled="totals.counts.weak === 0"
        @click="emit('train-weak')"
      >
        Тренировать слабые
        <span class="badge book-progress__weak-count" :class="{ 'badge--hot': totals.counts.weak > 0 }">{{ totals.counts.weak }}</span>
      </button>
    </div>

    <h2 class="screen__section-title book-progress__chapters-title">Главы</h2>
    <p class="book-progress__legend">
      <span v-for="m in SEGMENTS" :key="m" class="book-progress__legend-item">
        <span class="book-progress__dot" :class="`book-progress__dot--${m}`" /> {{ MASTERY_LABELS[m] }}
      </span>
    </p>
    <ul class="book-progress__list">
      <li v-for="{ chapter, total, counts } in rows" :key="chapter.unit" class="book-progress__row">
        <span class="book-progress__name">
          <b class="book-progress__number">{{ chapter.unit }}</b>
          {{ chapter.ru }}
        </span>
        <span class="book-progress__bar" role="img" :aria-label="`${chapter.ru}: выучено ${counts.solid} из ${total}`">
          <span
            v-for="m in SEGMENTS"
            :key="m"
            class="book-progress__segment"
            :class="`book-progress__segment--${m}`"
            :style="{ width: `${(counts[m] / total) * 100}%` }"
          />
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
/* ===== book-progress: прогресс по главам учебника ===== */

.book-progress__train {
  flex: 1 1 100%;
  gap: var(--space-2);
}

.book-progress__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-3);
  margin: 0 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--muted);
}

.book-progress__legend-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.book-progress__dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: var(--radius-pill);
}

.book-progress__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.book-progress__row {
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--line);
}

.book-progress__row:last-child {
  border-bottom: none;
}

.book-progress__name {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--text-sm);
}

.book-progress__number {
  font-variant-numeric: tabular-nums;
}

.book-progress__bar {
  display: flex;
  height: 6px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--m-new);
}

.book-progress__dot--solid,
.book-progress__segment--solid {
  background: var(--m-solid);
}

.book-progress__dot--learning,
.book-progress__segment--learning {
  background: var(--m-learning);
}

.book-progress__dot--weak,
.book-progress__segment--weak {
  background: var(--m-weak);
}
</style>
