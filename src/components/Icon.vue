<script setup lang="ts">
/**
 * Единый набор иконок (контур 2px, цвет = currentColor) вместо эмодзи,
 * которые на разных платформах рисуются по-разному.
 * Пути — Feather Icons (MIT), кроме flame.
 */
export type IconName =
  | 'back'
  | 'forward'
  | 'check'
  | 'cross'
  | 'sun'
  | 'moon'
  | 'flame'
  | 'keyboard'
  | 'speech'
  | 'settings'
  | 'practice'
  | 'progress'
  | 'tables'

defineProps<{
  name: IconName
}>()
</script>

<template>
  <svg
    class="icon"
    :class="`icon--${name}`"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-if="name === 'back'" d="M15 18l-6-6 6-6" />
    <path v-else-if="name === 'forward'" d="M9 18l6-6-6-6" />
    <path v-else-if="name === 'check'" d="M20 6L9 17l-5-5" />
    <path v-else-if="name === 'cross'" d="M18 6L6 18M6 6l12 12" />
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
      />
    </template>
    <path v-else-if="name === 'moon'" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    <path
      v-else-if="name === 'flame'"
      d="M12 22c4 0 7-2.7 7-7 0-3.5-2.2-5.6-3.6-7.1-.4 1.6-1.3 2.8-2.4 3.3C13.4 8 12.4 4.6 9.5 2c.3 3.4-1.4 5.2-2.9 7C5.6 10.3 5 11.9 5 15c0 4.3 3 7 7 7z"
    />
    <template v-else-if="name === 'keyboard'">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
    </template>
    <path
      v-else-if="name === 'speech'"
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
    />
    <path
      v-else-if="name === 'settings'"
      d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
    />
    <path
      v-else-if="name === 'practice'"
      d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
    />
    <path v-else-if="name === 'progress'" d="M18 20V10M12 20V4M6 20v-6" />
    <template v-else-if="name === 'tables'">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </template>
  </svg>
</template>
