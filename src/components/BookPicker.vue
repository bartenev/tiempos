<script setup lang="ts">
import { computed } from 'vue'
import { CHAPTERS, TAGS } from '../data/book'
import { chapterProgress, chapterSize, unitsWithTag } from '../lib/book'
import { selectedUnitList } from '../lib/settings'
import { settings } from '../lib/settingsState'
import { loadBookStats } from '../lib/stats'
import type { BookTag, Chapter } from '../types'

const stats = loadBookStats()

/** Тема подсвечена, когда отмечены ровно её главы. */
const activeTag = computed<BookTag | undefined>(() => {
  const picked = selectedUnitList(settings.selectedUnits)
  return TAGS.find(({ tag }) => {
    const units = unitsWithTag(tag)
    return units.length === picked.length && units.every((u) => picked.includes(u))
  })?.tag
})

function selectUnits(units: number[]) {
  for (const { unit } of CHAPTERS) settings.selectedUnits[unit] = units.includes(unit)
}

function selectAll() {
  selectUnits(CHAPTERS.map((c) => c.unit))
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
    <div class="book-picker__tags">
      <button
        v-for="{ tag, label } in TAGS"
        :key="tag"
        class="book-picker__tag"
        :class="{ 'book-picker__tag--active': activeTag === tag }"
        type="button"
        :aria-pressed="activeTag === tag"
        @click="selectUnits(unitsWithTag(tag))"
      >
        {{ label }}
      </button>
    </div>
    <p class="group__note book-picker__themes-note">
      Тема отмечает все свои главы. Ниже можно снять лишние.
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
    <div v-for="chapter in CHAPTERS" :key="chapter.unit" class="book-picker__chapter">
      <label class="choice book-picker__choice">
        <input
          v-model="settings.selectedUnits[chapter.unit]"
          class="choice__input book-picker__input"
          type="checkbox"
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
  </fieldset>
</template>

<style scoped lang="scss">
/* ===== book-picker: выбор темы и глав учебника ===== */

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
