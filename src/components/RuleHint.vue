<script setup lang="ts">
import type { FormHint } from '../lib/explain'

defineProps<{
  hint: FormHint
}>()
</script>

<template>
  <div class="rule-hint">
    <p class="rule">{{ hint.rule }}</p>
    <p v-if="hint.stem && hint.ending !== undefined" class="formula">
      <span class="stem">{{ hint.stem }}</span>
      <span class="plus">+</span>
      <span class="ending">-{{ hint.ending }}</span>
    </p>
    <ul class="row">
      <li v-for="item in hint.row" :key="item.person" :class="{ current: item.current }">
        <span class="p">{{ item.label }}</span>
        <span class="v">{{ item.value }}</span>
      </li>
    </ul>
    <p v-if="hint.note" class="note">{{ hint.note }}</p>
  </div>
</template>
