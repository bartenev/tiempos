<script setup lang="ts">
import { computed } from 'vue'
import { CHAPTERS, SECTIONS } from '../data/book'
import { chapterProgress, chapterSize } from '../lib/book'
import {
  defaultSelection,
  isThemeActive,
  onlyUnits,
  selectedUnits,
  toggleTheme,
  toggleUnit,
} from '../lib/bookSelection'
import { settings } from '../lib/settingsState'
import { loadBookStats } from '../lib/stats'
import type { BookSection, BookTheme, Chapter } from '../types'

const stats = loadBookStats()

const picked = computed(() => selectedUnits(settings.bookSelection))

function chaptersOf(section: BookSection): Chapter[] {
  return CHAPTERS.filter((c) => c.section === section)
}

function pickedOf(section: BookSection): number {
  return chaptersOf(section).filter((c) => picked.value.includes(c.unit)).length
}

function isActive(theme: BookTheme): boolean {
  return isThemeActive(settings.bookSelection, theme)
}

function pickTheme(theme: BookTheme) {
  settings.bookSelection = toggleTheme(settings.bookSelection, theme)
}

function pickUnit(unit: number) {
  settings.bookSelection = toggleUnit(settings.bookSelection, unit)
}

function selectUnits(units: number[]) {
  settings.bookSelection = onlyUnits(units)
}

function selectAll() {
  settings.bookSelection = defaultSelection()
}

function chapterMeta(chapter: Chapter): string {
  const { solid, weak } = chapterProgress(chapter, stats)
  const parts = [`${chapterSize(chapter)} упр.`]
  if (solid > 0) parts.push(`выучено ${solid}`)
  if (weak > 0) parts.push(`слабых ${weak}`)
  return parts.join(' · ')
}
</script>

<template>
  <fieldset class="group book-picker__themes">
    <legend class="group__legend book-picker__themes-legend">Тема</legend>
    <div v-for="s in SECTIONS" :key="s.section" class="book-picker__section">
      <p v-if="SECTIONS.length > 1" class="book-picker__section-title">{{ s.title }}</p>
      <div class="book-picker__tags">
        <button
          class="book-picker__tag"
          :class="{ 'book-picker__tag--active': isActive({ section: s.section }) }"
          type="button"
          :aria-pressed="isActive({ section: s.section })"
          @click="pickTheme({ section: s.section })"
        >
          {{ s.all }}
        </button>
        <button
          v-for="{ tag, label } in s.tags"
          :key="tag"
          class="book-picker__tag"
          :class="{ 'book-picker__tag--active': isActive({ section: s.section, tag }) }"
          type="button"
          :aria-pressed="isActive({ section: s.section, tag })"
          @click="pickTheme({ section: s.section, tag })"
        >
          {{ label }}
        </button>
      </div>
    </div>
    <p class="group__note book-picker__themes-note">
      Можно отметить несколько тем. Лишние главы снимаются в списке ниже.
    </p>
  </fieldset>

  <fieldset class="group book-picker__chapters">
    <legend class="group__legend book-picker__chapters-legend">Главы</legend>
    <div class="book-picker__actions">
      <button class="link-button book-picker__select-all" type="button" @click="selectAll">
        Выбрать все
      </button>
      <button class="link-button book-picker__select-none" type="button" @click="selectUnits([])">
        Отключить все
      </button>
    </div>
    <details v-for="s in SECTIONS" :key="s.section" class="book-picker__group">
      <summary class="book-picker__group-title">
        {{ s.title }}
        <span class="book-picker__group-count">{{ pickedOf(s.section) }} из {{ chaptersOf(s.section).length }}</span>
      </summary>
      <div v-for="chapter in chaptersOf(s.section)" :key="chapter.unit" class="book-picker__chapter">
        <label class="choice book-picker__choice">
          <input
            class="choice__input book-picker__input"
            type="checkbox"
            :checked="picked.includes(chapter.unit)"
            @change="pickUnit(chapter.unit)"
          />
          <span class="choice__label book-picker__label">
            <b class="book-picker__number">{{ chapter.unit }}</b>
            {{ chapter.ru }}
            <span class="book-picker__meta">{{ chapterMeta(chapter) }}</span>
          </span>
        </label>
        <button
          class="link-button book-picker__only"
          type="button"
          @click="selectUnits([chapter.unit])"
        >
          только
        </button>
      </div>
    </details>
  </fieldset>
</template>

<style scoped lang="scss">
/* ===== book-picker: выбор темы и глав учебника ===== */

.book-picker__section + .book-picker__section {
  margin-top: var(--space-3);
}

.book-picker__section-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--ink);
}

.book-picker__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.book-picker__tag {
  min-height: var(--tap);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--card);
  font: inherit;
  font-size: var(--text-sm);
  color: var(--ink);
  cursor: pointer;
}

.book-picker__tag--active {
  border-color: var(--accent);
  background: var(--accent-soft);
  font-weight: var(--weight-semibold);
  color: var(--accent);
}

.book-picker__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-4);
  margin-bottom: var(--space-1);
}

.book-picker__group + .book-picker__group {
  margin-top: var(--space-2);
}

.book-picker__group-title {
  min-height: var(--tap);
  padding: var(--space-2) 0;
  font-weight: var(--weight-semibold);
  color: var(--ink);
  cursor: pointer;
}

.book-picker__group-count {
  margin-left: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  color: var(--muted);
}

.book-picker__chapter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-1) 0;
  border-bottom: 1px solid var(--line);
}

.book-picker__chapter:last-child {
  border-bottom: none;
}

.book-picker__choice {
  flex: 1;
  min-width: 0;
}

.book-picker__number {
  font-variant-numeric: tabular-nums;
}

.book-picker__meta {
  display: block;
  font-size: var(--text-xs);
  line-height: 1.4;
  color: var(--muted);
}

.book-picker__only {
  flex: none;
}
</style>
