<script setup lang="ts">
import { IRREGULAR_INFINITIVES, findVerb } from '../data/verbs'
import { settings } from '../lib/settingsState'
import { setTheme, theme } from '../lib/theme'
import type { Person } from '../types'
import { PERSONS, TENSES, TENSE_LABELS, TENSE_RU, VERB_GROUPS } from '../types'
import Icon from './Icon.vue'

const irregularList = IRREGULAR_INFINITIVES

const SIZES = [10, 20, 30]

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
  <section class="settings">
    <h1 class="screen__title settings__title">Настройки</h1>

    <fieldset class="group settings__tenses">
      <legend class="group__legend settings__tenses-legend">Времена</legend>
      <label v-for="tense in TENSES" :key="tense" class="choice settings__tense">
        <input v-model="settings.selected[tense]" class="choice__input settings__tense-input" type="checkbox" />
        <span class="choice__label settings__tense-label">
          {{ TENSE_LABELS[tense] }}
          <span class="settings__tense-ru">{{ TENSE_RU[tense] }}</span>
        </span>
      </label>
    </fieldset>

    <fieldset class="group settings__persons">
      <legend class="group__legend settings__persons-legend">Лица</legend>
      <div class="settings__persons-grid">
        <label v-for="person in PERSONS" :key="person" class="choice settings__person">
          <input v-model="settings.persons[person]" class="choice__input settings__person-input" type="checkbox" />
          <span class="choice__label settings__person-label">{{ PERSON_CHOICES[person] }}</span>
        </label>
      </div>
      <p class="group__note settings__persons-note">
        usted / ustedes — вместе с él / ellos; в imperativo формы yo нет.
      </p>
    </fieldset>

    <fieldset class="group settings__groups">
      <legend class="group__legend settings__groups-legend">Окончания</legend>
      <div class="settings__groups-row">
        <label v-for="group in VERB_GROUPS" :key="group" class="choice settings__group">
          <input v-model="settings.groups[group]" class="choice__input settings__group-input" type="checkbox" />
          <span class="choice__label settings__group-label">-{{ group }}</span>
        </label>
      </div>
    </fieldset>

    <fieldset class="group settings__verbs">
      <legend class="group__legend settings__verbs-legend">Глаголы</legend>
      <label class="choice settings__verb-kind settings__verb-kind--regular">
        <input v-model="settings.includeRegular" class="choice__input settings__verb-kind-input" type="checkbox" />
        <span class="choice__label settings__verb-kind-label">Правильные</span>
      </label>
      <label class="choice settings__verb-kind settings__verb-kind--irregular">
        <input v-model="settings.includeIrregular" class="choice__input settings__verb-kind-input" type="checkbox" />
        <span class="choice__label settings__verb-kind-label">Неправильные и с чередованием</span>
      </label>

      <div v-if="settings.includeIrregular" class="settings__irregular">
        <div class="settings__irregular-head">
          <p class="settings__irregular-title">Какие именно</p>
          <div class="settings__irregular-actions">
            <button class="link-button settings__select-all" type="button" @click="setAllIrregular(true)">
              Выбрать все
            </button>
            <button class="link-button settings__select-none" type="button" @click="setAllIrregular(false)">
              Отключить все
            </button>
          </div>
        </div>
        <div class="settings__irregular-grid">
          <label
            v-for="inf in irregularList"
            :key="inf"
            class="choice settings__irregular-item"
            :class="{ 'settings__irregular-item--off': irregularOff(inf) }"
          >
            <input v-model="settings.selectedIrregular[inf]" class="choice__input settings__irregular-input" type="checkbox" />
            <span class="choice__label settings__irregular-label">{{ inf }}</span>
          </label>
        </div>
      </div>
    </fieldset>

    <fieldset class="group settings__size">
      <legend class="group__legend settings__size-legend">Длина сессии</legend>
      <div class="segmented settings__size-switch" role="radiogroup" aria-label="Длина сессии">
        <button
          v-for="n in SIZES"
          :key="n"
          class="segmented__item settings__size-item"
          :class="{ 'segmented__item--active': settings.size === n }"
          type="button"
          role="radio"
          :aria-checked="settings.size === n"
          @click="settings.size = n"
        >
          {{ n }}
        </button>
      </div>
    </fieldset>

    <fieldset class="group settings__theme">
      <legend class="group__legend settings__theme-legend">Оформление</legend>
      <div class="segmented settings__theme-switch" role="radiogroup" aria-label="Тема">
        <button
          class="segmented__item settings__theme-light"
          :class="{ 'segmented__item--active': theme === 'light' }"
          type="button"
          role="radio"
          :aria-checked="theme === 'light'"
          @click="setTheme('light')"
        >
          <Icon name="sun" />Светлая
        </button>
        <button
          class="segmented__item settings__theme-dark"
          :class="{ 'segmented__item--active': theme === 'dark' }"
          type="button"
          role="radio"
          :aria-checked="theme === 'dark'"
          @click="setTheme('dark')"
        >
          <Icon name="moon" />Тёмная
        </button>
      </div>
    </fieldset>
  </section>
</template>
