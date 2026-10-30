<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  /** Путь от public/, напр. `book/18.1.jpg`. */
  src: string
  alt: string
}>()

const zoomed = ref(false)

/** Сайт живёт в подпапке — путь от корня домена здесь не сработает. */
function url(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') zoomed.value = false
}

watch(zoomed, (open) => {
  if (open) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})

// новая карточка — новая картинка: увеличение не переносим
watch(
  () => props.src,
  () => (zoomed.value = false),
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="zoom-image">
    <!-- stop: в устном режиме тап по карточке открывает ответ, а здесь нужна картинка -->
    <button class="zoom-image__open" type="button" aria-label="Увеличить картинку" @click.stop="zoomed = true">
      <img class="zoom-image__picture" :src="url(src)" :alt="alt" />
    </button>
    <div
      v-if="zoomed"
      class="zoom-image__overlay"
      role="dialog"
      aria-label="Картинка крупно"
      @click.stop="zoomed = false"
    >
      <img class="zoom-image__full" :src="url(src)" :alt="alt" />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ===== zoom-image: картинка упражнения, по тапу — на весь экран ===== */

.zoom-image {
  margin: 0 auto var(--space-3);
}

.zoom-image__open {
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: #fff;
  cursor: zoom-in;
  overflow: hidden;
}

.zoom-image__picture {
  display: block;
  width: 100%;
  max-height: 16rem;
  object-fit: contain;
}

.zoom-image__overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3);
  background: rgb(0 0 0 / 85%);
  cursor: zoom-out;
}

.zoom-image__full {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--radius-sm);
  background: #fff;
}
</style>
