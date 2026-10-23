<script setup lang="ts">
import { computed } from 'vue'
import { conjugate } from '../lib/conjugate'
import { heatByPerson, loadProgress } from '../lib/progress'
import { theme } from '../lib/theme'
import type { Person, Tense, Verb } from '../types'
import { PERSONS, TENSE_LABELS } from '../types'

const emit = defineEmits<{
  back: []
}>()

const EXAMPLES: Verb[] = [
  { infinitive: 'hablar', group: 'ar' },
  { infinitive: 'comer', group: 'er' },
  { infinitive: 'vivir', group: 'ir' },
]

const TENSES: Tense[] = ['presente', 'indefinido', 'imperfecto']

const PERSON_SHORT: Record<Person, string> = {
  yo: 'yo',
  tú: 'tú',
  él: 'él',
  nosotros: 'nosotros',
  vosotros: 'vosotros',
  ellos: 'ellos',
}

const heat = computed(() => {
  // theme — пересчёт оттенков; loadProgress — свежие счётчики верных
  void theme.value
  const progress = loadProgress()
  const map = {} as Record<Tense, ReturnType<typeof heatByPerson>>
  for (const tense of TENSES) {
    map[tense] = heatByPerson(progress, tense)
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
  <section class="panel tables">
    <header class="bar">
      <button class="ghost" type="button" @click="emit('back')">‹ назад</button>
      <span class="prog">Таблицы</span>
      <span />
    </header>

    <h1>Окончания</h1>
    <p class="lead">
      Регулярные парадигмы на примерах
      <b>hablar</b>, <b>comer</b>, <b>vivir</b>.
    </p>
    <p class="heat-legend">
      <span class="swatch cold" /> лучше знаю
      <span class="sep">→</span>
      <span class="swatch hot" /> хуже знаю
      <span class="note">(правильные глаголы: верный +1, ошибка −1)</span>
    </p>

    <section v-for="tense in TENSES" :key="tense" class="tense-block">
      <h2>{{ TENSE_LABELS[tense] }}</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col" />
              <th v-for="verb in EXAMPLES" :key="verb.infinitive" scope="col">
                -{{ verb.group }}
                <span class="ex">{{ verb.infinitive }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="person in PERSONS" :key="person">
              <th scope="row" :style="cellStyle(tense, person)">
                {{ PERSON_SHORT[person] }}
                <span class="sum">{{ heat[tense][person].sum }}</span>
              </th>
              <td
                v-for="verb in EXAMPLES"
                :key="verb.infinitive + person"
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
