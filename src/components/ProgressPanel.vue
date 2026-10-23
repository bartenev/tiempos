<script setup lang="ts">
import { computed, ref } from 'vue'
import { VERBS, isRegularVerb } from '../data/verbs'
import { conjugate } from '../lib/conjugate'
import { PROGRESS_TENSES, loadProgress } from '../lib/progress'
import type { CellStat, Mastery } from '../lib/stats'
import { cellKey, errorRate, loadStats, masteryOf } from '../lib/stats'
import type { Person, Tense, Verb } from '../types'
import { PERSONS, TENSE_SHORT } from '../types'

const emit = defineEmits<{
  back: []
  'train-weak': []
}>()

const stats = loadStats()
const progress = loadProgress()

interface CellInfo {
  verb: Verb
  tense: Tense
  person: Person
  stat: CellStat | undefined
  score: number
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
  for (const tense of PROGRESS_TENSES) {
    for (const person of PERSONS) {
      const stat = stats[cellKey(verb.infinitive, tense, person)]
      const score = progress[verb.infinitive]?.[tense]?.[person] ?? 0
      cells.push({ verb, tense, person, stat, score, mastery: masteryOf(stat, score) })
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
      const sa = a.stat ? a.stat.bad * (1 + errorRate(a.stat)) : -a.score
      const sb = b.stat ? b.stat.bad * (1 + errorRate(b.stat)) : -b.score
      if (sb !== sa) return sb - sa
      return (b.stat?.last ?? 0) - (a.stat?.last ?? 0)
    })
    .slice(0, 12),
)

const TAB_LABELS: Record<Tense, string> = {
  presente: 'Presente',
  indefinido: 'Indefinido',
  imperfecto: 'Imperfecto',
}

const tense = ref<Tense>('presente')
const selectedKey = ref<string | null>(null)

const groups = [
  { title: 'Правильные', verbs: VERBS.filter(isRegularVerb) },
  { title: 'Неправильные и с чередованием', verbs: VERBS.filter((v) => !isRegularVerb(v)) },
]

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
  if (!c.stat) return c.score !== 0 ? `счёт ${c.score}` : 'ещё не было'
  return `✓ ${c.stat.ok} · ✗ ${c.stat.bad} · серия ${c.stat.streak}`
}
</script>

<template>
  <section class="panel progress-panel">
    <header class="bar">
      <button class="ghost small" type="button" @click="emit('back')">‹ назад</button>
      <span class="prog">Прогресс</span>
      <span />
    </header>

    <div class="big-stats">
      <div class="big-stat">
        <b>{{ totals.answered }}</b>
        <span>ответов</span>
      </div>
      <div class="big-stat">
        <b>{{ totals.accuracy === null ? '—' : `${totals.accuracy}%` }}</b>
        <span>точность</span>
      </div>
      <div class="big-stat">
        <b>{{ totals.counts.solid }}</b>
        <span>выучено из {{ totals.total }}</span>
      </div>
    </div>

    <h2 class="section-title">
      Слабые формы
      <span class="badge" :class="{ hot: totals.counts.weak > 0 }">{{ totals.counts.weak }}</span>
    </h2>
    <p v-if="topWeak.length === 0" class="muted small-text">
      Пока нет — ошибки появятся здесь, и умная очередь будет показывать их чаще.
    </p>
    <ul v-else class="mistakes weak-list">
      <li v-for="c in topWeak" :key="cellKey(c.verb.infinitive, c.tense, c.person)">
        <span class="m-meta">{{ c.verb.infinitive }} · {{ TENSE_SHORT[c.tense] }} · {{ c.person }}</span>
        <span class="m-forms">
          <b>{{ conjugate(c.verb, c.tense, c.person) }}</b>
          <small class="muted">{{ statLine(c) }}</small>
        </span>
      </li>
    </ul>
    <div class="actions">
      <button
        class="primary"
        type="button"
        :disabled="totals.counts.weak === 0"
        @click="emit('train-weak')"
      >
        Тренировать слабые
      </button>
    </div>

    <h2 class="section-title">Сетка форм</h2>
    <div class="tabs" role="tablist">
      <button
        v-for="t in PROGRESS_TENSES"
        :key="t"
        type="button"
        role="tab"
        class="tab"
        :class="{ active: tense === t }"
        :aria-selected="tense === t"
        @click="tense = t; selectedKey = null"
      >
        {{ TAB_LABELS[t] }}
      </button>
    </div>

    <p class="legend">
      <span v-for="m in (['solid', 'learning', 'weak', 'new'] as Mastery[])" :key="m" class="legend-item">
        <span class="dot" :class="m" /> {{ MASTERY_LABELS[m] }} · {{ currentCounts[m] }}
      </span>
    </p>

    <div v-for="g in groups" :key="g.title" class="grid-group">
      <p class="grid-title">{{ g.title }}</p>
      <table class="mastery-grid">
        <thead>
          <tr>
            <th class="verb-col" />
            <th v-for="p in PERSONS" :key="p" scope="col">{{ p === 'nosotros' ? 'nos.' : p === 'vosotros' ? 'vos.' : p }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="verb in g.verbs" :key="verb.infinitive">
            <th scope="row">{{ verb.infinitive }}</th>
            <td v-for="p in PERSONS" :key="p">
              <button
                type="button"
                class="cell"
                :class="[cellOf(verb, p).mastery, { picked: selectedKey === cellKey(verb.infinitive, tense, p) }]"
                :aria-label="`${verb.infinitive}, ${p}: ${MASTERY_LABELS[cellOf(verb, p).mastery]}`"
                @click="select(verb, p)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selected" class="cell-detail">
      <b>{{ conjugate(selected.verb, selected.tense, selected.person) }}</b>
      <span>{{ selected.verb.infinitive }} · {{ selected.person }} · {{ MASTERY_LABELS[selected.mastery] }}</span>
      <small class="muted">{{ statLine(selected) }}</small>
    </div>
  </section>
</template>
