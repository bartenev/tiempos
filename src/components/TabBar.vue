<script setup lang="ts">
import type { Screen } from '../types'
import type { IconName } from './Icon.vue'
import Icon from './Icon.vue'

type Tab = 'setup' | 'progress' | 'tables' | 'settings'

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
  { screen: 'settings', label: 'Настройки', icon: 'settings' },
]

/** Итоги завершают тренировку — подсвечиваем «Тренировку». */
function isActive(tab: Tab): boolean {
  return tab === 'setup' ? props.screen === 'setup' || props.screen === 'summary' : props.screen === tab
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

<style scoped lang="scss">
/* ===== tabbar: нижняя панель разделов ===== */

.tabbar {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  width: 100%;
  max-width: 460px;
  padding: var(--space-1) var(--space-2) calc(var(--space-1) + env(safe-area-inset-bottom));
  border-top: 1px solid var(--line);
  background: var(--card);
  transform: translateX(-50%);
}

/* шире телефона панель не во всю ширину — оформляем её как отдельную плашку */
@media (min-width: 461px) {
  .tabbar {
    border: 1px solid var(--line);
    border-bottom: none;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
  }
}

.tabbar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 3.5rem;
  border: none;
  background: transparent;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--muted);
  cursor: pointer;
}

.tabbar__item--active {
  color: var(--accent);
}

.tabbar__icon {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
