<script setup lang="ts">
import type { Screen } from '../types'
import type { IconName } from './Icon.vue'
import Icon from './Icon.vue'

type Tab = 'setup' | 'progress' | 'tables'

const props = defineProps<{
  screen: Screen
}>()

const emit = defineEmits<{
  go: [screen: Tab]
}>()

const TABS: { screen: Tab; label: string; icon: IconName }[] = [
  { screen: 'setup', label: 'Тренировка', icon: 'practice' },
  { screen: 'progress', label: 'Прогресс', icon: 'progress' },
  { screen: 'tables', label: 'Таблицы', icon: 'tables' },
]

/** Настройки открываются с главной, итоги завершают тренировку — подсвечиваем «Тренировку». */
const TRAINING_SCREENS: Screen[] = ['setup', 'settings', 'summary']

function isActive(tab: Tab): boolean {
  return tab === 'setup' ? TRAINING_SCREENS.includes(props.screen) : props.screen === tab
}
</script>

<template>
  <nav class="tabbar" aria-label="Разделы">
    <button
      v-for="tab in TABS"
      :key="tab.screen"
      class="tabbar__item"
      :class="{ 'tabbar__item--active': isActive(tab.screen) }"
      type="button"
      :aria-current="isActive(tab.screen) ? 'page' : undefined"
      @click="emit('go', tab.screen)"
    >
      <Icon class="tabbar__icon" :name="tab.icon" />
      <span class="tabbar__label">{{ tab.label }}</span>
    </button>
  </nav>
</template>
