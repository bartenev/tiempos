<script setup lang="ts">
import { computed } from 'vue'
import type { TenseHeat } from '../lib/heat'
import type { TableStatus } from '../lib/heat'
import { FADE_FROM_DAYS, heatByCell, lastByCell, sumByTensePerson, tableStatus } from '../lib/heat'
import { pluralRu } from '../lib/plural'
import { GREEN_RUN, loadRuns } from '../lib/runs'
import { loadStats } from '../lib/stats'
import { endingsRow } from '../lib/tables'
import { slowTableCells } from '../lib/tempo'
import Icon from './Icon.vue'
import { theme } from '../lib/theme'
import type { Person, Tense, Verb } from '../types'
import { TENSES, TENSE_LABELS, personLabel, personsFor } from '../types'
import VerbLookup from './VerbLookup.vue'

const EXAMPLES: Verb[] = [
  { infinitive: 'hablar', group: 'ar' },
  { infinitive: 'comer', group: 'er' },
  { infinitive: 'vivir', group: 'ir' },
]

const PERSON_SHORT: Record<Person, string> = {
  yo: 'yo',
  tú: 'tú',
  él: 'él',
  nosotros: 'nosotros',
  vosotros: 'vosotros',
  ellos: 'ellos',
}

// Панель создаётся заново при каждом открытии вкладки — счётчики свежие.
const stats = loadStats()
const runs = loadRuns()
/** Темп и давность: медленные клетки не зеленее жёлтой, давно не тренированные бледнеют. */
const extras = { slow: slowTableCells(), last: lastByCell(stats) }

const heat = computed(() => {
  // theme — пересчёт оттенков
  void theme.value
  const map = {} as Record<Tense, TenseHeat>
  for (const tense of TENSES) {
    map[tense] = heatByCell(runs, tense, extras)
  }
  return map
})

/** Состояние каждой таблицы: сколько до зелёной, сколько клеток медленных и остывших. */
const status = computed(() => {
  const map = {} as Record<Tense, TableStatus>
  for (const tense of TENSES) map[tense] = tableStatus(heat.value[tense])
  return map
})

const cells = (n: number) => `${n} ${pluralRu(n, 'клетка', 'клетки', 'клеток')}`

/** Подпись таблицы: «вся зелёная» — только когда все клетки ярко-зелёные. */
function statusText({ need, slow, cold }: TableStatus): string {
  if (need > 0) return `ещё ${need} ${pluralRu(need, 'верный ответ', 'верных ответа', 'верных ответов')} до зелёной таблицы`
  const left: string[] = []
  if (slow > 0) left.push(`${cells(slow)} ${pluralRu(slow, 'медленная', 'медленные', 'медленных')}`)
  if (cold > 0) left.push(`${cells(cold)} ${pluralRu(cold, 'остыла', 'остыли', 'остыли')}`)
  if (left.length === 0) return 'вся таблица зелёная ✓'
  return `серии собраны, но ${left.join(', ')}`
}

const isDone = (s: TableStatus) => s.need === 0 && s.slow === 0 && s.cold === 0

/** Цвет ячейки — по своей группе (-ar / -er / -ir), а не по всей строке. */
function cellStyle(tense: Tense, person: Person, verb: Verb): { backgroundColor: string } {
  return { backgroundColor: heat.value[tense][person]![verb.group].color }
}

function heatOf(tense: Tense, person: Person, verb: Verb) {
  return heat.value[tense][person]![verb.group]
}

function cellTitle(tense: Tense, person: Person, verb: Verb): string {
  const { run, slow, days } = heatOf(tense, person, verb)
  if (run === undefined) return 'Ответов ещё не было'
  const parts = [run === 0 ? 'Последний ответ — ошибка' : `${Math.min(run, GREEN_RUN)} из ${GREEN_RUN} верных подряд`]
  if (slow) parts.push('вспоминается медленно')
  if (days !== null && days >= FADE_FROM_DAYS) parts.push(`не было ${days} ${pluralRu(days, 'день', 'дня', 'дней')}`)
  return parts.join(' · ')
}

/** Итог строки под местоимением: верные минус ошибки по всем трём группам. */
function rowSum(tense: Tense, person: Person): number {
  return sumByTensePerson(stats, tense, person)
}
</script>

<template>
  <section class="tables">
    <h1 class="screen__title tables__title">Справка</h1>

    <VerbLookup />

    <h2 class="screen__section-title tables__endings-title">Окончания</h2>
    <p class="screen__lead tables__lead">
      Окончания правильных глаголов на примерах
      <b class="tables__example">hablar</b>, <b class="tables__example">comer</b>, <b class="tables__example">vivir</b>.
    </p>
    <p class="tables__legend">
      <span class="tables__swatch tables__swatch--hot" /> ошибка
      <span class="tables__legend-sep">→</span>
      <span class="tables__swatch tables__swatch--cold" /> {{ GREEN_RUN }} верных подряд
      <span class="tables__legend-note">
        Цвет ячейки — серия верных ответов подряд в правильных глаголах на -ar / -er / -ir
        для этого времени и лица; ошибка обнуляет серию. Число под лицом — верные минус ошибки по строке.
      </span>
      <span class="tables__legend-note tables__legend-tempo">
        <Icon name="clock" class="tables__legend-clock" /> верно, но медленно — клетка не зеленее жёлтой,
        пока не разгонитесь. Не тренировали {{ FADE_FROM_DAYS }} дня и больше — клетка бледная
        (остыла, умный режим её проверит).
      </span>
    </p>
    <p class="tables__shared-note">
      <b class="tables__shared-sample">ía</b> — окончание совпадает у разных спряжений
      (например, -er и -ir в imperfecto).
    </p>

    <section v-for="tense in TENSES" :key="tense" class="tables__tense">
      <header class="tables__tense-head">
        <h2 class="tables__tense-title">{{ TENSE_LABELS[tense] }}</h2>
        <span
          class="tables__goal"
          :class="{ 'tables__goal--done': isDone(status[tense]) }"
          :title="`Каждой ячейке нужно ${GREEN_RUN} верных ответов подряд в правильных глаголах её группы; ошибка обнуляет серию ячейки.`"
        >
          {{ statusText(status[tense]) }}
        </span>
      </header>
      <div class="tables__wrap">
        <table class="tables__table">
          <thead class="tables__thead">
            <tr class="tables__head-row">
              <th class="tables__cell tables__head" scope="col" />
              <th v-for="verb in EXAMPLES" :key="verb.infinitive" class="tables__cell tables__head" scope="col">
                -{{ verb.group }}
                <span class="tables__head-verb">{{ verb.infinitive }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="tables__tbody">
            <tr v-for="person in personsFor(tense)" :key="person" class="tables__row">
              <th class="tables__cell tables__person" scope="row">
                {{ tense === 'imperativo' || tense === 'gerundio' ? personLabel(tense, person) : PERSON_SHORT[person] }}
                <span class="tables__sum">{{ rowSum(tense, person) }}</span>
              </th>
              <td
                v-for="(cell, i) in endingsRow(EXAMPLES, tense, person)"
                :key="EXAMPLES[i]!.infinitive + person"
                class="tables__cell tables__form"
                :class="{ 'tables__form--compound': cell.stem.includes(' ') }"
                :style="cellStyle(tense, person, EXAMPLES[i]!)"
                :title="cellTitle(tense, person, EXAMPLES[i]!)"
              >
                <Icon
                  v-if="heatOf(tense, person, EXAMPLES[i]!).slow"
                  name="clock"
                  class="tables__slow"
                />
                <span class="tables__form-stem">{{ cell.stem }}</span><span
                  class="tables__form-ending"
                  :class="{ 'tables__form-ending--shared': cell.shared }"
                >{{ cell.ending }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<style scoped lang="scss">
/* ===== tables ===== */

.tables__example {
  font-weight: var(--weight-bold);
  color: var(--ink);
}

.tables__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-2);
  margin: calc(-1 * var(--space-3)) 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--muted);
}

.tables__swatch {
  width: 0.875rem;
  height: 0.875rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
}

.tables__swatch--hot {
  background: var(--heat-hot); /* красный — хуже */
}

.tables__swatch--cold {
  background: var(--heat-cold); /* зелёный — лучше */
}

.tables__legend-sep {
  margin: 0 var(--space-1);
}

.tables__legend-note {
  width: 100%;
  font-size: var(--text-xs);
}

.tables__legend-clock {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
}

/* медленная клетка: часики в углу */
.tables__form {
  position: relative;
}

.tables__slow {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 0.75rem;
  height: 0.75rem;
  color: var(--muted);
}

.tables__shared-note {
  margin: 0 0 var(--space-4);
  font-size: var(--text-sm);
  color: var(--muted);
}

.tables__tense-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-1) var(--space-3);
  margin: var(--space-6) 0 var(--space-3);
}

.tables__tense:first-of-type .tables__tense-head {
  margin-top: var(--space-2);
}

.tables__tense-title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.tables__goal {
  padding: 0.125rem var(--space-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: var(--text-xs);
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.tables__goal--done {
  border-color: transparent;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: var(--weight-semibold);
}

.tables__wrap {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--card);
}

.tables__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.tables__cell {
  padding: var(--space-2);
  border-bottom: 1px solid var(--line);
  text-align: left;
  white-space: nowrap;
}

.tables__head {
  vertical-align: bottom;
  background: var(--surface);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--muted);
}

.tables__head-verb {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  color: var(--ink);
}

.tables__person {
  font-weight: var(--weight-semibold);
  color: var(--ink);
}

.tables__sum {
  display: block;
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  color: var(--muted);
}

/* he hablado: на узком экране haber переносится на свою строку, таблица влезает без прокрутки. */
.tables__form--compound {
  white-space: normal;
}

.tables__row:last-child .tables__cell {
  border-bottom: none;
}

/*
 * Окончание совпадает у разных спряжений в этой строке.
 * Жирный цвет текста читается на любой heat-заливке ячейки,
 * пометку даёт акцентное подчёркивание.
 */
.tables__shared-sample,
.tables__form-ending--shared {
  font-weight: var(--weight-bold);
  color: var(--ink);
  text-decoration: underline 2px var(--accent);
  text-underline-offset: 3px;
}
</style>
