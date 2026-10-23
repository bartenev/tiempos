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
    <p class="rule-hint__formula"><span class="rule-hint__stem">{{ hint.form.stem }}</span><span v-if="hint.form.ending" class="rule-hint__ending">{{ hint.form.ending }}</span></p>
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
