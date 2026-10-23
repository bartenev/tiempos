<script setup lang="ts">
import { computed } from 'vue'
import { conjugate } from '../lib/conjugate'
import { heatByPerson } from '../lib/heat'
import { loadStats } from '../lib/stats'
import { theme } from '../lib/theme'
import type { Person, Tense, Verb } from '../types'
import { TENSES, TENSE_LABELS, personLabel, personsFor } from '../types'

const emit = defineEmits<{
  back: []
}>()

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

const heat = computed(() => {
  // theme — пересчёт оттенков; loadStats — свежие счётчики
  void theme.value
  const stats = loadStats()
  const map = {} as Record<Tense, ReturnType<typeof heatByPerson>>
  for (const tense of TENSES) {
    map[tense] = heatByPerson(stats, tense)
  }
  return map
})

function form(verb: Verb, tense: Tense, person: Person): string {
  return conjugate(verb, tense, person)
}

function cellStyle(tense: Tense, person: Person): { backgroundColor: string } {
  return { backgroundColor: heat.value[tense]![person]!.color }
}
</script>

<template>
  <section class="tables">
    <header class="topbar tables__bar">
      <button class="button button--ghost topbar__back tables__back" type="button" @click="emit('back')">‹ назад</button>
      <span class="topbar__title tables__bar-title">Таблицы</span>
      <span class="topbar__aside tables__bar-aside" />
    </header>

    <h1 class="screen__title tables__title">Окончания</h1>
    <p class="screen__lead tables__lead">
      Регулярные парадигмы на примерах
      <b class="tables__example">hablar</b>, <b class="tables__example">comer</b>, <b class="tables__example">vivir</b>.
    </p>
    <p class="tables__legend">
      <span class="tables__swatch tables__swatch--cold" /> лучше знаю
      <span class="tables__legend-sep">→</span>
      <span class="tables__swatch tables__swatch--hot" /> хуже знаю
      <span class="tables__legend-note">(правильные глаголы: верный +1, ошибка −1)</span>
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
              <th class="tables__cell tables__person" scope="row" :style="cellStyle(tense, person)">
                {{ tense === 'imperativo' ? personLabel(tense, person) : PERSON_SHORT[person] }}
                <span class="tables__sum">{{ heat[tense][person]!.sum }}</span>
              </th>
              <td
                v-for="verb in EXAMPLES"
                :key="verb.infinitive + person"
                class="tables__cell tables__form"
                :style="cellStyle(tense, person)"
              >
                {{ form(verb, tense, person) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
