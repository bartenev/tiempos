<script setup lang="ts">
import { computed } from 'vue'
import type { TenseHeat } from '../lib/heat'
import { heatByCell, sumByTensePerson } from '../lib/heat'
import { loadStats } from '../lib/stats'
import { endingsRow } from '../lib/tables'
import { theme } from '../lib/theme'
import type { Person, Tense, Verb } from '../types'
import { TENSES, TENSE_LABELS, personLabel, personsFor } from '../types'

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

const stats = computed(() => {
  // theme — пересчёт оттенков; loadStats — свежие счётчики
  void theme.value
  return loadStats()
})

const heat = computed(() => {
  const map = {} as Record<Tense, TenseHeat>
  for (const tense of TENSES) {
    map[tense] = heatByCell(stats.value, tense)
  }
  return map
})

/** Цвет ячейки — по своей группе (-ar / -er / -ir), а не по всей строке. */
function cellStyle(tense: Tense, person: Person, verb: Verb): { backgroundColor: string } {
  return { backgroundColor: heat.value[tense][person]![verb.group].color }
}

/** Итог строки под местоимением: верные минус ошибки по всем трём группам. */
function rowSum(tense: Tense, person: Person): number {
  return sumByTensePerson(stats.value, tense, person)
}
</script>

<template>
  <section class="tables">
    <h1 class="screen__title tables__title">Таблицы</h1>
    <p class="screen__lead tables__lead">
      Окончания правильных глаголов на примерах
      <b class="tables__example">hablar</b>, <b class="tables__example">comer</b>, <b class="tables__example">vivir</b>.
    </p>
    <p class="tables__legend">
      <span class="tables__swatch tables__swatch--cold" /> знаю лучше
      <span class="tables__legend-sep">→</span>
      <span class="tables__swatch tables__swatch--hot" /> знаю хуже
      <span class="tables__legend-note">
        Цвет ячейки — ваши ответы в правильных глаголах на -ar / -er / -ir
        для этого времени и лица; число под лицом — верные минус ошибки по строке.
      </span>
    </p>
    <p class="tables__shared-note">
      <b class="tables__shared-sample">ía</b> — окончание совпадает у разных спряжений
      (например, -er и -ir в imperfecto).
    </p>

    <section v-for="tense in TENSES" :key="tense" class="tables__tense">
      <h2 class="tables__tense-title">{{ TENSE_LABELS[tense] }}</h2>
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
                {{ tense === 'imperativo' ? personLabel(tense, person) : PERSON_SHORT[person] }}
                <span class="tables__sum">{{ rowSum(tense, person) }}</span>
              </th>
              <td
                v-for="(cell, i) in endingsRow(EXAMPLES, tense, person)"
                :key="EXAMPLES[i]!.infinitive + person"
                class="tables__cell tables__form"
                :style="cellStyle(tense, person, EXAMPLES[i]!)"
              >
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

.tables__shared-note {
  margin: 0 0 var(--space-4);
  font-size: var(--text-sm);
  color: var(--muted);
}

.tables__tense-title {
  margin: var(--space-6) 0 var(--space-3);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.tables__tense:first-of-type .tables__tense-title {
  margin-top: var(--space-2);
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
