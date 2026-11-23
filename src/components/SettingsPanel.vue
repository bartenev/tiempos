<script setup lang="ts">
import { computed } from 'vue'
import { settings } from '../lib/settingsState'
import { setTheme, theme } from '../lib/theme'
import type { SettingsMode, Track } from '../types'
import Icon from './Icon.vue'

const SIZES = [10, 20, 30]

const MODES: { mode: SettingsMode; label: string; hint: Record<Track, string> }[] = [
  {
    mode: 'smart',
    label: 'Умная',
    hint: {
      verbs: 'Новое — порциями, ошибки — всегда, выученное — реже. Без конца: закончите, когда захотите.',
      articles:
        'Новое — упражнение за упражнением, ошибки — всегда, выученное — реже. Без конца: закончите, когда захотите.',
      book: 'Новое — глава за главой, ошибки — всегда, выученное — реже. Без конца: закончите, когда захотите.',
    },
  },
  {
    mode: 'random',
    label: 'Проверка',
    hint: {
      verbs: 'Всё выбранное вперемешку, без подсказок очереди: ошибки не возвращаются — честная точность.',
      articles: 'Всё выбранное вперемешку, без подсказок очереди: ошибки не возвращаются — честная точность.',
      book: 'Всё выбранное вперемешку, без подсказок очереди: ошибки не возвращаются — честная точность.',
    },
  },
]

const modeHint = computed(() => MODES.find((m) => m.mode === settings.mode)!.hint[settings.track])

const ANSWER_NOTES: Record<Track, { text: string; oral: string }> = {
  verbs: {
    text: 'Впишите форму глагола в пропуск.',
    oral: 'Скажите форму вслух, откройте её и отметьте себя.',
  },
  articles: {
    text: 'Выберите артикль кнопкой.',
    oral: 'Скажите артикль вслух, откройте ответ и отметьте себя.',
  },
  book: {
    text: 'Впишите ответ в пропуск или выберите вариант.',
    oral: 'Скажите ответ вслух, откройте его и отметьте себя.',
  },
}

const answerNote = computed(() => ANSWER_NOTES[settings.track][settings.answer])
</script>

<template>
  <section class="settings">
    <h1 class="screen__title settings__title">Настройки</h1>

    <fieldset class="group settings__mode">
      <legend class="group__legend settings__mode-legend">Режим</legend>
      <div class="segmented settings__mode-switch" role="radiogroup" aria-label="Режим">
        <button
          v-for="m in MODES"
          :key="m.mode"
          class="segmented__item settings__mode-item"
          :class="{ 'segmented__item--active': settings.mode === m.mode }"
          type="button"
          role="radio"
          :aria-checked="settings.mode === m.mode"
          @click="settings.mode = m.mode"
        >
          {{ m.label }}
        </button>
      </div>
      <p class="group__note settings__mode-note">{{ modeHint }}</p>
    </fieldset>

    <!-- умная сессия бесконечная — длина только у проверки -->
    <fieldset v-if="settings.mode === 'random'" class="group settings__size">
      <legend class="group__legend settings__size-legend">Длина проверки</legend>
      <div class="segmented settings__size-switch" role="radiogroup" aria-label="Длина проверки">
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

    <fieldset class="group settings__answer">
      <legend class="group__legend settings__answer-legend">Ответ</legend>
      <div class="segmented settings__answer-switch" role="radiogroup" aria-label="Как отвечать">
        <button
          class="segmented__item settings__answer-text"
          :class="{ 'segmented__item--active': settings.answer === 'text' }"
          type="button"
          role="radio"
          :aria-checked="settings.answer === 'text'"
          @click="settings.answer = 'text'"
        >
          <Icon name="keyboard" />Текст
        </button>
        <button
          class="segmented__item settings__answer-oral"
          :class="{ 'segmented__item--active': settings.answer === 'oral' }"
          type="button"
          role="radio"
          :aria-checked="settings.answer === 'oral'"
          @click="settings.answer = 'oral'"
        >
          <Icon name="speech" />Устно
        </button>
      </div>
      <p class="group__note settings__answer-note">{{ answerNote }}</p>
      <!-- только глаголы: упражнения учебника и артикли без предложения не имеют смысла -->
      <label class="choice settings__simple">
        <input v-model="settings.simpleCards" class="choice__input settings__simple-input" type="checkbox" />
        <span class="choice__label settings__simple-label">
          Глаголы без предложений
          <span class="settings__simple-hint">только местоимение и глагол с переводом</span>
        </span>
      </label>
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

    <fieldset class="group settings__labs">
      <legend class="group__legend settings__labs-legend">Лаборатория</legend>
      <p class="group__note settings__labs-note">
        Функции в разработке: могут меняться и работать неидеально.
      </p>
      <label class="choice settings__lab">
        <input v-model="settings.labs.book" class="choice__input settings__lab-input" type="checkbox" />
        <span class="choice__label settings__lab-label">
          Учебник
          <span class="settings__lab-hint">упражнения по главам Gramática de uso</span>
        </span>
      </label>
      <label class="choice settings__lab">
        <input v-model="settings.labs.briefHints" class="choice__input settings__lab-input" type="checkbox" />
        <span class="choice__label settings__lab-label">
          Короткие пояснения
          <span class="settings__lab-hint">в артиклях после ошибки — одна строка своими словами вместо разбора по правилам</span>
        </span>
      </label>
      <label class="choice settings__lab">
        <input v-model="settings.labs.hideVerbTranslation" class="choice__input settings__lab-input" type="checkbox" />
        <span class="choice__label settings__lab-label">
          Глаголы без перевода
          <span class="settings__lab-hint">не показывать русский перевод предложения на карточке</span>
        </span>
      </label>
    </fieldset>
  </section>
</template>

<style scoped lang="scss">
/* ===== settings: экран настроек ===== */

.settings__labs-note {
  margin: 0 0 var(--space-2);
}

.settings__lab {
  padding: var(--space-1) 0;
}

.settings__simple {
  margin-top: var(--space-2);
  padding: var(--space-1) 0;
}

.settings__lab-hint,
.settings__simple-hint {
  display: block;
  font-size: var(--text-sm);
  line-height: 1.4;
  color: var(--muted);
}
</style>
