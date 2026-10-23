<script setup lang="ts">
import type { SessionResult } from '../types'

defineProps<{
  result: SessionResult
}>()

const emit = defineEmits<{
  again: []
  setup: []
}>()
</script>

<template>
  <section class="panel">
    <h1>¡Listo!</h1>
    <p class="lead">Сессия завершена.</p>

    <ul class="stats">
      <li><span>Всего</span><b>{{ result.total }}</b></li>
      <li class="ok-text"><span>Верно</span><b>{{ result.correct }}</b></li>
      <li class="bad-text"><span>Ошибки</span><b>{{ result.wrong }}</b></li>
      <li><span>Пропущено</span><b>{{ result.skipped }}</b></li>
    </ul>

    <div class="actions">
      <button class="primary" type="button" @click="emit('again')">Ещё раз</button>
      <button class="ghost" type="button" @click="emit('setup')">Настройки</button>
    </div>
  </section>
</template>
