<script setup lang="ts">
import type { FormHint } from '../lib/explain'
import type { Person } from '../types'

defineProps<{
  hint: FormHint
}>()

/**
 * Место в таблице спряжения: слева единственное число, справа множественное
 * (yo | nosotros, tú | vosotros, él | ellos). В императиве клетка yo пустая.
 */
const SLOT: Record<Person, string> = {
  yo: '1s',
  tú: '2s',
  él: '3s',
  nosotros: '1p',
  vosotros: '2p',
  ellos: '3p',
}
</script>

<template>
  <div class="rule-hint">
    <p class="rule-hint__rule">{{ hint.rule }}</p>
    <ul class="rule-hint__row">
      <li
        v-for="item in hint.row"
        :key="item.person"
        class="rule-hint__item"
        :class="[`rule-hint__item--${SLOT[item.person]}`, { 'rule-hint__item--current': item.current }]"
      >
        <span class="rule-hint__person">{{ item.label }}</span>
        <span class="rule-hint__form"><span class="rule-hint__form-stem">{{ item.stem }}</span><span v-if="item.ending" class="rule-hint__form-ending">{{ item.ending }}</span></span>
      </li>
    </ul>
    <p v-if="hint.note" class="rule-hint__note">{{ hint.note }}</p>
  </div>
</template>

<style scoped lang="scss">
/* ===== rule-hint: подсказка правила ===== */

.rule-hint {
  margin-top: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-md);
  background: var(--card);
  font-size: var(--text-sm);
}

.rule-hint__rule {
  margin: 0;
  line-height: 1.45;
}

.rule-hint__row {
  /* таблица спряжения: слева ед. число, справа мн. */
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(3, auto);
  gap: var(--space-1);
  margin: var(--space-3) 0 0;
  padding: 0;
  list-style: none;
}

.rule-hint__item--1s {
  grid-area: 1 / 1;
}

.rule-hint__item--2s {
  grid-area: 2 / 1;
}

.rule-hint__item--3s {
  grid-area: 3 / 1;
}

.rule-hint__item--1p {
  grid-area: 1 / 2;
}

.rule-hint__item--2p {
  grid-area: 2 / 2;
}

.rule-hint__item--3p {
  grid-area: 3 / 2;
}

.rule-hint__item {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

.rule-hint__item--current {
  background: var(--accent-soft);
  outline: 1.5px solid var(--accent);
}

.rule-hint__person {
  font-size: var(--text-xs);
  color: var(--muted);
}

.rule-hint__form {
  font-size: var(--text-base);
  overflow-wrap: anywhere;
}

.rule-hint__form-ending {
  color: var(--accent);
  font-weight: var(--weight-bold);
}

.rule-hint__note {
  margin: var(--space-2) 0 0;
  font-size: var(--text-xs);
  line-height: 1.4;
  color: var(--muted);
}

@media (max-width: 380px) {
  /* comprendisteis — в одну строку в колонке подсказки на 320 px */
  .rule-hint__form {
    font-size: var(--text-sm);
  }
}
</style>
