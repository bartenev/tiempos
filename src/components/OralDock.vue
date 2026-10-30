<script setup lang="ts">
import Icon from './Icon.vue'

defineProps<{
  /** Ответ открыт, ждём самооценку. */
  shown: boolean
  /** Прошлую самооценку можно отменить. */
  canUndo?: boolean
  /** Как назвать то, что говорим вслух. */
  subject: string
}>()

const emit = defineEmits<{
  reveal: []
  grade: [ok: boolean]
  undo: []
}>()
</script>

<template>
  <!-- На телефоне закреплено внизу экрана — под большой палец. -->
  <div class="drill__dock">
    <button v-if="canUndo" class="drill__undo" type="button" @click="emit('undo')">
      <Icon name="back" />Вернуть прошлую карточку
    </button>
    <button v-if="!shown" class="drill__reveal" type="button" @click="emit('reveal')">
      Скажите {{ subject }} вслух или про себя —<br class="drill__reveal-break" />тапните, чтобы проверить
    </button>
    <div v-else class="drill__grades">
      <button class="drill__grade drill__grade--bad" type="button" @click="emit('grade', false)"><Icon name="cross" />Ошибся</button>
      <button class="drill__grade drill__grade--ok" type="button" @click="emit('grade', true)"><Icon name="check" />Сказал верно</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ===== drill: устный режим ===== */

.drill__dock {
  margin-top: var(--space-4);
}

.drill__undo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border: none;
  border-radius: var(--radius-pill);
  background: var(--card);
  font: inherit;
  font-size: var(--text-sm);
  color: var(--muted);
  cursor: pointer;
}

.drill__undo:hover {
  color: var(--ink);
}

.drill__reveal {
  width: 100%;
  min-height: 6rem;
  padding: var(--space-4);
  border: 1.5px dashed var(--line);
  border-radius: var(--radius-md);
  background: var(--card);
  font: inherit;
  line-height: 1.45;
  color: var(--muted);
  cursor: pointer;
}

.drill__reveal:hover {
  border-color: var(--accent);
  color: var(--ink);
}

.drill__grades {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.drill__grade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 6rem;
  border: 1.5px solid transparent;
  border-radius: var(--radius-md);
  font: inherit;
  font-weight: var(--weight-bold);
  cursor: pointer;
}

.drill__grade--bad {
  border-color: var(--bad);
  background: var(--bad-bg);
  color: var(--bad);
}

.drill__grade--ok {
  border-color: var(--ok);
  background: var(--ok-bg);
  color: var(--ok);
}

/* телефон: зона тапа и оценки — внизу экрана, контент прокручивается над ней */
@media (max-width: 640px) {
  .drill__dock {
    position: fixed;
    left: 50%;
    bottom: 0;
    z-index: 3;
    width: 100%;
    max-width: 460px;
    margin: 0;
    padding: var(--space-5) calc(var(--space-4) + env(safe-area-inset-right))
      calc(var(--space-4) + env(safe-area-inset-bottom)) calc(var(--space-4) + env(safe-area-inset-left));
    background: linear-gradient(to top, var(--bg) 75%, transparent);
    transform: translateX(-50%);
  }
}
</style>
