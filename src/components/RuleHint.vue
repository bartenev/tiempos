<script setup lang="ts">
import type { FormHint } from '../lib/explain'

defineProps<{
  hint: FormHint
}>()
</script>

<template>
  <div class="rule-hint">
    <p class="rule-hint__rule">{{ hint.rule }}</p>
    <p v-if="hint.stem && hint.ending !== undefined" class="rule-hint__formula">
      <span class="rule-hint__stem">{{ hint.stem }}</span>
      <span class="rule-hint__plus">+</span>
      <span class="rule-hint__ending">-{{ hint.ending }}</span>
    </p>
    <ul class="rule-hint__row">
      <li
        v-for="item in hint.row"
        :key="item.person"
        class="rule-hint__item"
        :class="{ 'rule-hint__item--current': item.current }"
      >
        <span class="rule-hint__person">{{ item.label }}</span>
        <span class="rule-hint__value">{{ item.value }}</span>
      </li>
    </ul>
    <p v-if="hint.note" class="rule-hint__note">{{ hint.note }}</p>
  </div>
</template>
