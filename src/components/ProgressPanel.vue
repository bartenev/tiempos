<script setup lang="ts">
import { computed, ref } from 'vue'
import { VERBS, isRegularVerb } from '../data/verbs'
import { conjugate, hasTense } from '../lib/conjugate'
import type { CellStat, Mastery } from '../lib/stats'
import { cellKey, errorRate, loadStats, masteryOf, recoveryStreak } from '../lib/stats'
import type { Person, Tense, Verb } from '../types'
import { TENSES, TENSE_SHORT, personLabel, personsFor } from '../types'

const emit = defineEmits<{
  'train-weak': []
}>()

const stats = loadStats()

interface CellInfo {
  verb: Verb
  tense: Tense
  person: Person
  stat: CellStat | undefined
  mastery: Mastery
}

const MASTERY_LABELS: Record<Mastery, string> = {
  new: 'не встречалась',
  weak: 'слабая',
  learning: 'учу',
  solid: 'выучена',
}

const cells: CellInfo[] = []
for (const verb of VERBS) {
  for (const tense of TENSES) {
    if (!hasTense(verb, tense)) continue
    for (const person of personsFor(tense)) {
      const stat = stats[cellKey(verb.infinitive, tense, person)]
      cells.push({ verb, tense, person, stat, mastery: masteryOf(stat) })
    }
  }
}

const byKey = new Map(cells.map((c) => [cellKey(c.verb.infinitive, c.tense, c.person), c]))

const totals = computed(() => {
  let ok = 0
  let bad = 0
  const counts: Record<Mastery, number> = { new: 0, weak: 0, learning: 0, solid: 0 }
  for (const c of cells) {
    ok += c.stat?.ok ?? 0
    bad += c.stat?.bad ?? 0
    counts[c.mastery] += 1
  }
  const answered = ok + bad
  return {
    answered,
    accuracy: answered === 0 ? null : Math.round((ok / answered) * 100),
    counts,
    total: cells.length,
  }
})

/** Топ слабых: больше ошибок и выше доля ошибок — выше в списке. */
const topWeak = computed(() =>
  cells
    .filter((c) => c.mastery === 'weak')
    .sort((a, b) => {
      // у слабых форм stat всегда есть
      const sa = a.stat!.bad * (1 + errorRate(a.stat!))
      const sb = b.stat!.bad * (1 + errorRate(b.stat!))
      if (sb !== sa) return sb - sa
      return (b.stat?.last ?? 0) - (a.stat?.last ?? 0)
    })
    .slice(0, 12),
)

const TAB_LABELS: Record<Tense, string> = {
  presente: 'Presente',
  indefinido: 'Indefinido',
  imperfecto: 'Imperfecto',
  imperativo: 'Imperativo',
}

/** Короткие заголовки колонок сетки. */
const COLUMN_LABELS: Record<string, string> = {
  nosotros: 'nos.',
  vosotros: 'vos.',
  usted: 'ud.',
  ustedes: 'uds.',
}

const tense = ref<Tense>('presente')
const selectedKey = ref<string | null>(null)

const groups = [
  { title: 'Правильные', verbs: VERBS.filter(isRegularVerb) },
  { title: 'Неправильные и с чередованием', verbs: VERBS.filter((v) => !isRegularVerb(v)) },
]

/** В сетке — только глаголы, начатые в этом времени: есть ответ хотя бы по одному лицу. */
const visibleGroups = computed(() =>
  groups
    .map((g) => ({
      ...g,
      verbs: g.verbs.filter(
        (v) => hasTense(v, tense.value) && personsFor(tense.value).some((p) => cellOf(v, p).stat),
      ),
    }))
    .filter((g) => g.verbs.length > 0),
)

const selected = computed(() =>
  selectedKey.value ? byKey.get(selectedKey.value) ?? null : null,
)

function cellOf(verb: Verb, person: Person): CellInfo {
  return byKey.get(cellKey(verb.infinitive, tense.value, person))!
}

function select(verb: Verb, person: Person) {
  const key = cellKey(verb.infinitive, tense.value, person)
  selectedKey.value = selectedKey.value === key ? null : key
}

function tenseCounts(t: Tense): Record<Mastery, number> {
  const counts: Record<Mastery, number> = { new: 0, weak: 0, learning: 0, solid: 0 }
  for (const c of cells) if (c.tense === t) counts[c.mastery] += 1
  return counts
}

const currentCounts = computed(() => tenseCounts(tense.value))

function statLine(c: CellInfo): string {
  if (!c.stat) return 'ещё не было'
  // у слабой формы видно, сколько верных подряд осталось до выхода из слабых
  const streak =
    c.mastery === 'weak'
      ? `серия ${c.stat.streak} из ${recoveryStreak(c.stat.bad)}`
      : `серия ${c.stat.streak}`
  return `✓ ${c.stat.ok} · ✗ ${c.stat.bad} · ${streak}`
}
</script>

<template>
  <section class="progress">
    <h1 class="screen__title progress__title">Прогресс</h1>

    <div class="stat-tiles progress__tiles">
      <div class="stat-tiles__item progress__answered">
        <b class="stat-tiles__value progress__answered-value">{{ totals.answered }}</b>
        <span class="stat-tiles__label progress__answered-label">ответов</span>
      </div>
      <div class="stat-tiles__item progress__accuracy">
        <b class="stat-tiles__value progress__accuracy-value">{{ totals.accuracy === null ? '—' : `${totals.accuracy}%` }}</b>
        <span class="stat-tiles__label progress__accuracy-label">точность</span>
      </div>
      <div class="stat-tiles__item progress__solid">
        <b class="stat-tiles__value progress__solid-value">{{ totals.counts.solid }}</b>
        <span class="stat-tiles__label progress__solid-label">выучено из {{ totals.total }}</span>
      </div>
    </div>

    <h2 class="screen__section-title progress__weak-title">
      Слабые формы
      <span class="badge progress__weak-count" :class="{ 'badge--hot': totals.counts.weak > 0 }">{{ totals.counts.weak }}</span>
    </h2>
    <p v-if="topWeak.length === 0" class="progress__weak-empty">
      Пока нет — ошибки появятся здесь, и умная очередь будет показывать их чаще.
    </p>
    <ul v-else class="form-list progress__weak-list">
      <li
        v-for="c in topWeak"
        :key="cellKey(c.verb.infinitive, c.tense, c.person)"
        class="form-list__item progress__weak-item"
      >
        <span class="form-list__meta progress__weak-meta">{{ c.verb.infinitive }} · {{ TENSE_SHORT[c.tense] }} · {{ personLabel(c.tense, c.person) }}</span>
        <span class="form-list__forms progress__weak-forms">
          <b class="form-list__answer progress__weak-answer">{{ conjugate(c.verb, c.tense, c.person) }}</b>
          <small class="form-list__stat progress__weak-stat">{{ statLine(c) }}</small>
        </span>
      </li>
    </ul>
    <div class="screen__actions progress__actions">
      <button
        class="button button--primary progress__train"
        type="button"
        :disabled="totals.counts.weak === 0"
        @click="emit('train-weak')"
      >
        Тренировать слабые
      </button>
    </div>

    <h2 class="screen__section-title progress__grid-title">Сетка форм</h2>
    <div class="tabs progress__tabs" role="tablist">
      <button
        v-for="t in TENSES"
        :key="t"
        class="tabs__tab progress__tab"
        :class="{ 'tabs__tab--active': tense === t }"
        type="button"
        role="tab"
        :aria-selected="tense === t"
        @click="tense = t; selectedKey = null"
      >
        {{ TAB_LABELS[t] }}
      </button>
    </div>

    <p class="progress__legend">
      <span v-for="m in (['solid', 'learning', 'weak', 'new'] as Mastery[])" :key="m" class="progress__legend-item">
        <span class="progress__dot" :class="`progress__dot--${m}`" /> {{ MASTERY_LABELS[m] }} · {{ currentCounts[m] }}
      </span>
    </p>

    <p v-if="visibleGroups.length === 0" class="progress__grid-empty">
      В этом времени вы ещё ничего не отвечали.
    </p>
    <div v-for="g in visibleGroups" :key="g.title" class="progress__group">
      <p class="progress__group-title">{{ g.title }}</p>
      <table class="progress__grid">
        <thead class="progress__grid-head">
          <tr class="progress__grid-head-row">
            <th class="progress__col progress__col--verb" />
            <th v-for="p in personsFor(tense)" :key="p" class="progress__col" scope="col">{{ COLUMN_LABELS[personLabel(tense, p)] ?? p }}</th>
          </tr>
        </thead>
        <tbody class="progress__grid-body">
          <tr v-for="verb in g.verbs" :key="verb.infinitive" class="progress__row">
            <th class="progress__verb" scope="row">{{ verb.infinitive }}</th>
            <td v-for="p in personsFor(tense)" :key="p" class="progress__td">
              <button
                class="progress__cell"
                :class="[
                  `progress__cell--${cellOf(verb, p).mastery}`,
                  { 'progress__cell--picked': selectedKey === cellKey(verb.infinitive, tense, p) },
                ]"
                type="button"
                :aria-label="`${verb.infinitive}, ${p}: ${MASTERY_LABELS[cellOf(verb, p).mastery]}`"
                @click="select(verb, p)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selected" class="progress__detail">
      <b class="progress__detail-form">{{ conjugate(selected.verb, selected.tense, selected.person) }}</b>
      <span class="progress__detail-meta">{{ selected.verb.infinitive }} · {{ personLabel(selected.tense, selected.person) }} · {{ MASTERY_LABELS[selected.mastery] }}</span>
      <small class="progress__detail-stat">{{ statLine(selected) }}</small>
    </div>
  </section>
</template>

<style scoped lang="scss">
/* ===== progress ===== */

.progress__weak-empty {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--muted);
}

.progress__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  margin: var(--space-3) 0;
  font-size: var(--text-xs);
  color: var(--muted);
}

.progress__legend-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.progress__dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: var(--radius-xs);
}

.progress__dot--solid,
.progress__cell--solid {
  background: var(--m-solid);
}

.progress__dot--learning,
.progress__cell--learning {
  background: var(--m-learning);
}

.progress__dot--weak,
.progress__cell--weak {
  background: var(--m-weak);
}

.progress__dot--new,
.progress__cell--new {
  background: var(--m-new);
}

.progress__group {
  margin-bottom: var(--space-4);
}

.progress__grid-empty {
  margin: var(--space-3) 0;
  font-size: var(--text-sm);
  color: var(--muted);
}

.progress__group-title {
  margin: var(--space-3) 0 var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--muted);
}

.progress__grid {
  width: 100%;
  border-collapse: separate;
  border-spacing: 3px;
  table-layout: fixed;
}

.progress__col {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--muted);
}

.progress__col--verb {
  width: 6.5rem;
}

.progress__verb {
  padding-right: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress__td {
  padding: 0;
}

.progress__cell {
  display: block;
  width: 100%;
  height: 1.75rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-xs);
  cursor: pointer;
}

.progress__cell--picked {
  outline: 2px solid var(--ink);
  outline-offset: 1px;
}

.progress__detail {
  /* прилипает над нижней панелью вкладок, а не под ней */
  position: sticky;
  bottom: calc(var(--tabbar-height) + var(--space-3) + env(safe-area-inset-bottom));
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-1) var(--space-3);
  margin: var(--space-3) 0 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  background: var(--card);
  box-shadow: var(--shadow);
  font-size: var(--text-sm);
}

.progress__detail-form {
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}

.progress__detail-stat {
  font-size: var(--text-xs);
  color: var(--muted);
}

@media (max-width: 380px) {
  .progress__col--verb {
    width: 5.75rem;
  }
}
</style>
