<script setup lang="ts">
import Icon from './Icon.vue'

/** Строка «что тренируем»: слева название, справа выбранное; тап раскрывает чекбоксы. */
defineProps<{
  /** id тела — для aria-controls. */
  id: string
  label: string
  value: string
}>()

/** Свёрнут по умолчанию; раскрытость не запоминается — на главной всегда коротко. */
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <div class="picker-block" :class="{ 'picker-block--open': open }">
    <button
      class="picker-block__head"
      type="button"
      :aria-expanded="open"
      :aria-controls="id"
      @click="open = !open"
    >
      <span class="picker-block__name">{{ label }}</span>
      <span class="picker-block__value">{{ value }}</span>
      <Icon class="picker-block__chevron" name="forward" />
    </button>

    <div v-if="open" :id="id" class="picker-block__body">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ===== picker-block: сворачиваемая строка «что тренируем» ===== */

.picker-block + .picker-block {
  border-top: 1px solid var(--line);
}

.picker-block__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: var(--tap);
  padding: var(--space-2) 0;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.picker-block__name {
  flex: none;
  color: var(--muted);
}

.picker-block__value {
  flex: 1 1 auto;
  min-width: 0;
  font-weight: var(--weight-semibold);
  text-align: right;
}

.picker-block__chevron {
  flex: none;
  color: var(--muted);
  transition: transform 0.15s ease;
}

.picker-block--open .picker-block__chevron {
  transform: rotate(90deg);
}

.picker-block__head:hover .picker-block__chevron {
  color: var(--accent);
}

.picker-block__body {
  padding: 0 0 var(--space-2);
}

@media (prefers-reduced-motion: reduce) {
  .picker-block__chevron {
    transition: none;
  }
}
</style>
