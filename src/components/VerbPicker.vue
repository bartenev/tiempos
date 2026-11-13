<script setup lang="ts">
import { computed, reactive } from 'vue'
import { IRREGULAR_INFINITIVES, findVerb } from '../data/verbs'
import { settings } from '../lib/settingsState'
import { describeVerbFilters } from '../lib/verbSummary'
import type { VerbSummary } from '../lib/verbSummary'
import type { Person } from '../types'
import { PERSONS, TENSES, TENSE_LABELS, VERB_GROUPS } from '../types'
import PickerBlock from './PickerBlock.vue'

const irregularList = IRREGULAR_INFINITIVES

type Block = keyof VerbSummary

const BLOCKS: { key: Block; label: string }[] = [
  { key: 'tenses', label: 'Времена' },
  { key: 'persons', label: 'Лица' },
  { key: 'groups', label: 'Окончания' },
  { key: 'verbs', label: 'Глаголы' },
]

/** Свёрнуты по умолчанию; раскрытость не запоминается — на главной всегда коротко. */
const open = reactive<Record<Block, boolean>>({
  tenses: false,
  persons: false,
  groups: false,
  verbs: false,
})

const summary = computed(() => describeVerbFilters(settings))

/** Подписи чекбоксов; usted / ustedes тренируются вместе с él / ellos. */
const PERSON_CHOICES: Record<Person, string> = {
  yo: 'yo',
  tú: 'tú',
  él: 'él / ella',
  nosotros: 'nosotros',
  vosotros: 'vosotros',
  ellos: 'ellos / ellas',
}

/** Неправильный глагол отсеян фильтром окончаний — показываем приглушённым. */
function irregularOff(infinitive: string): boolean {
  const verb = findVerb(infinitive)
  return verb ? !settings.groups[verb.group] : false
}

function setAllIrregular(value: boolean) {
  for (const inf of irregularList) {
    settings.selectedIrregular[inf] = value
  }
}
</script>

<template>
  <fieldset class="group verb-picker">
    <legend class="group__legend verb-picker__legend">Что тренируем</legend>
    <PickerBlock
      v-for="b in BLOCKS"
      :id="`verb-picker-${b.key}`"
      :key="b.key"
      v-model:open="open[b.key]"
      :class="`verb-picker__block--${b.key}`"
      :label="b.label"
      :value="summary[b.key]"
    >
      <template v-if="b.key === 'tenses'">
        <label v-for="tense in TENSES" :key="tense" class="choice verb-picker__tense">
          <input v-model="settings.selected[tense]" class="choice__input verb-picker__tense-input" type="checkbox" />
          <span class="choice__label verb-picker__tense-label">{{ TENSE_LABELS[tense] }}</span>
        </label>
      </template>

      <template v-else-if="b.key === 'persons'">
        <div class="verb-picker__persons-grid">
          <label v-for="person in PERSONS" :key="person" class="choice verb-picker__person">
            <input v-model="settings.persons[person]" class="choice__input verb-picker__person-input" type="checkbox" />
            <span class="choice__label verb-picker__person-label">{{ PERSON_CHOICES[person] }}</span>
          </label>
        </div>
        <p class="group__note verb-picker__persons-note">
          usted / ustedes — вместе с él / ellos; в imperativo формы yo нет.
        </p>
      </template>

      <template v-else-if="b.key === 'groups'">
        <div class="verb-picker__groups-row">
          <label v-for="group in VERB_GROUPS" :key="group" class="choice verb-picker__group">
            <input v-model="settings.groups[group]" class="choice__input verb-picker__group-input" type="checkbox" />
            <span class="choice__label verb-picker__group-label">-{{ group }}</span>
          </label>
        </div>
      </template>

      <template v-else>
        <label class="choice verb-picker__verb-kind verb-picker__verb-kind--regular">
          <input v-model="settings.includeRegular" class="choice__input verb-picker__verb-kind-input" type="checkbox" />
          <span class="choice__label verb-picker__verb-kind-label">Правильные</span>
        </label>
        <label class="choice verb-picker__verb-kind verb-picker__verb-kind--irregular">
          <input v-model="settings.includeIrregular" class="choice__input verb-picker__verb-kind-input" type="checkbox" />
          <span class="choice__label verb-picker__verb-kind-label">Неправильные и с чередованием</span>
        </label>

        <div v-if="settings.includeIrregular" class="verb-picker__irregular">
          <div class="verb-picker__irregular-head">
            <p class="verb-picker__irregular-title">Какие именно</p>
            <div class="verb-picker__irregular-actions">
              <button class="link-button verb-picker__select-all" type="button" @click="setAllIrregular(true)">
                Выбрать все
              </button>
              <button class="link-button verb-picker__select-none" type="button" @click="setAllIrregular(false)">
                Отключить все
              </button>
            </div>
          </div>
          <div class="verb-picker__irregular-grid">
            <label
              v-for="inf in irregularList"
              :key="inf"
              class="choice verb-picker__irregular-item"
              :class="{ 'verb-picker__irregular-item--off': irregularOff(inf) }"
            >
              <input v-model="settings.selectedIrregular[inf]" class="choice__input verb-picker__irregular-input" type="checkbox" />
              <span class="choice__label verb-picker__irregular-label">{{ inf }}</span>
            </label>
          </div>
        </div>
      </template>
    </PickerBlock>
  </fieldset>
</template>

<style scoped lang="scss">
/* ===== verb-picker: что тренируем в разделе «Глаголы» ===== */

.verb-picker__tense {
  padding: var(--space-1) 0;
}

.verb-picker__persons-grid {
  /* как таблица спряжения: слева ед. число, справа мн. */
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(3, auto);
  grid-auto-flow: column;
  column-gap: var(--space-3);
}

.verb-picker__groups-row {
  display: flex;
  gap: var(--space-6);
}

.verb-picker__irregular {
  margin-top: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--line);
}

.verb-picker__irregular-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-1) var(--space-3);
}

.verb-picker__irregular-title {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--muted);
}

.verb-picker__irregular-actions {
  display: flex;
  gap: var(--space-4);
}

.verb-picker__irregular-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: var(--space-3);
  max-height: 17.5rem;
  overflow-y: auto;
  padding-right: var(--space-1);
}

/* отсеян фильтром окончаний — в сессию не попадёт */
.verb-picker__irregular-item--off {
  opacity: 0.4;
}
</style>
