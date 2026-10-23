<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IRREGULAR_INFINITIVES } from '../data/verbs'
import {
  loadSettings,
  saveSettings,
  selectedIrregularList,
} from '../lib/settings'
import type { SessionConfig, Tense } from '../types'
import { TENSE_LABELS } from '../types'

const emit = defineEmits<{
  start: [config: SessionConfig]
  tables: []
}>()

const saved = loadSettings()

const selected = ref({ ...saved.selected })
const includeRegular = ref(saved.includeRegular)
const includeIrregular = ref(saved.includeIrregular)
const selectedIrregular = ref({ ...saved.selectedIrregular })
const size = ref(saved.size)

const irregularList = IRREGULAR_INFINITIVES

watch(
  [selected, includeRegular, includeIrregular, selectedIrregular, size],
  () => {
    saveSettings({
      selected: { ...selected.value },
      includeRegular: includeRegular.value,
      includeIrregular: includeIrregular.value,
      selectedIrregular: { ...selectedIrregular.value },
      size: size.value,
    })
  },
  { deep: true },
)

const tenses = computed(() =>
  (Object.keys(selected.value) as Tense[]).filter((t) => selected.value[t]),
)

const irregularPicked = computed(() =>
  selectedIrregularList(selectedIrregular.value),
)

const canStart = computed(() => {
  if (tenses.value.length === 0) return false
  if (!includeRegular.value && !includeIrregular.value) return false
  if (includeIrregular.value && irregularPicked.value.length === 0) return false
  return true
})

function start() {
  if (!canStart.value) return
  emit('start', {
    tenses: tenses.value,
    size: size.value,
    includeRegular: includeRegular.value,
    includeIrregular: includeIrregular.value,
    selectedIrregular: includeIrregular.value ? irregularPicked.value : [],
  })
}

function setAllIrregular(value: boolean) {
  const next = { ...selectedIrregular.value }
  for (const inf of irregularList) {
    next[inf] = value
  }
  selectedIrregular.value = next
}
</script>

<template>
  <section class="panel">
    <h1>Tiempos</h1>
    <p class="lead">
      Предложение с пропуском — впишите глагол в нужной форме
      (presente, indefinido, imperfecto).
    </p>

    <fieldset class="block">
      <legend>Времена</legend>
      <label v-for="(label, tense) in TENSE_LABELS" :key="tense" class="check">
        <input v-model="selected[tense as Tense]" type="checkbox" />
        <span>{{ label }}</span>
      </label>
    </fieldset>

    <fieldset class="block">
      <legend>Глаголы</legend>
      <label class="check">
        <input v-model="includeRegular" type="checkbox" />
        <span>Только правильные</span>
      </label>
      <label class="check">
        <input v-model="includeIrregular" type="checkbox" />
        <span>Только неправильные</span>
      </label>

      <div v-if="includeIrregular" class="irregular-list">
        <div class="irregular-head">
          <p class="irregular-title">Неправильные глаголы</p>
          <div class="irregular-actions">
            <button class="linkish" type="button" @click="setAllIrregular(true)">
              Выбрать все
            </button>
            <button class="linkish" type="button" @click="setAllIrregular(false)">
              Отключить все
            </button>
          </div>
        </div>
        <div class="irregular-grid">
          <label
            v-for="inf in irregularList"
            :key="inf"
            class="check irregular-item"
          >
            <input v-model="selectedIrregular[inf]" type="checkbox" />
            <span>{{ inf }}</span>
          </label>
        </div>
      </div>
    </fieldset>

    <fieldset class="block">
      <legend>Длина сессии</legend>
      <div class="sizes">
        <label v-for="n in [10, 20, 30]" :key="n" class="radio">
          <input v-model="size" type="radio" :value="n" />
          <span>{{ n }}</span>
        </label>
      </div>
    </fieldset>

    <div class="actions">
      <button class="primary" type="button" :disabled="!canStart" @click="start">
        Empezar
      </button>
      <button class="ghost" type="button" @click="emit('tables')">
        Таблицы
      </button>
    </div>
  </section>
</template>
