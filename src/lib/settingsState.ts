import { reactive, watch } from 'vue'
import { loadSettings, saveSettings } from './settings'

/**
 * Настройки — одно состояние на главную и экран «Настройки».
 * Сохраняются в localStorage при любом изменении.
 */
export const settings = reactive(loadSettings())

watch(settings, (value) => saveSettings(value), { deep: true })

// Учебник выключили в «Лаборатории» — его нет в списке тренажёров, открываем глаголы.
watch(
  () => settings.labs.book,
  (on) => {
    if (!on && settings.track === 'book') settings.track = 'verbs'
  },
)
