<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { cardBlanks } from '../lib/cards'
import type { FormHint } from '../lib/explain'
import type { AnswerCheck } from '../lib/normalize'
import { normalizeAnswer, overallCheck } from '../lib/normalize'
import type { AnyCard } from '../types'
import { isBookCard } from '../types'
import RuleHint from './RuleHint.vue'

const props = defineProps<{
  card: AnyCard
  index: number
  /** Проверка по полям; null — ещё не проверяли. */
  checks: AnswerCheck[] | null
  hint: FormHint | null
}>()

const emit = defineEmits<{
  check: [inputs: string[]]
  next: []
  skip: []
  /** Ответ не совпал с вариантами, но он верный. */
  own: []
}>()

/** Буквы, которых нет на русской/английской раскладке. */
const ACCENTS = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü']

const CHECK_CLASS: Record<AnswerCheck, string> = {
  exact: 'drill__input--ok',
  almost: 'drill__input--almost',
  wrong: 'drill__input--bad',
}

const inputs = ref<string[]>([])
/** Поле, в которое вставлять букву с ударением. */
const active = ref(0)
const fieldEls: (HTMLInputElement | null)[] = []
const submitEl = ref<HTMLButtonElement | null>(null)

const book = computed(() => (isBookCard(props.card) ? props.card : null))

const blanks = computed(() => cardBlanks(props.card))

const options = computed(() => book.value?.options)

const multi = computed(() => blanks.value.length > 1)

const revealed = computed(() => props.checks !== null)

const feedback = computed(() => props.checks && overallCheck(props.checks))

const canCheck = computed(() => inputs.value.some((value) => value.trim().length > 0))

const canSubmit = computed(() => revealed.value || canCheck.value)

const canClaim = computed(() => book.value !== null && !options.value && revealed.value)

const placeholder = computed(() => {
  if (!book.value) return 'форма глагола…'
  return book.value.kind === 'rewrite' ? 'фраза целиком…' : 'ответ…'
})

function fieldLabel(i: number): string {
  if (multi.value) return `Пропуск ${i + 1}`
  return book.value ? 'Ответ' : 'Форма глагола'
}

function isAccepted(option: string): boolean {
  return blanks.value[0]!.some((answer) => normalizeAnswer(answer) === normalizeAnswer(option))
}

function focusField(i: number) {
  active.value = i
  // preventScroll: на телефоне не прыгаем к полю при каждом фокусе
  fieldEls[i]?.focus({ preventScroll: true })
}

watch(
  () => [props.card, props.index],
  async () => {
    inputs.value = blanks.value.map(() => '')
    await nextTick()
    focusField(0)
  },
  { immediate: true },
)

watch(
  () => props.checks,
  (checks) => {
    if (!checks) return
    // с вариантами поля нет — Enter должен попасть в «Дальше»
    if (options.value) submitEl.value?.focus({ preventScroll: true })
    else focusField(active.value)
  },
  { flush: 'post' },
)

function submit() {
  if (revealed.value) {
    emit('next')
    return
  }
  if (canCheck.value) emit('check', inputs.value.map((value) => value.trim()))
}

/** Enter ведёт к следующему пропуску, с последнего — проверка. */
function onEnter(i: number) {
  if (!revealed.value && i < blanks.value.length - 1) focusField(i + 1)
  else submit()
}

function choose(option: string) {
  if (revealed.value) return
  inputs.value = [option]
  submit()
}

function insertAccent(ch: string) {
  if (revealed.value) return
  const i = active.value
  const value = inputs.value[i] ?? ''
  const el = fieldEls[i]
  const start = el?.selectionStart ?? value.length
  const end = el?.selectionEnd ?? value.length
  inputs.value[i] = value.slice(0, start) + ch + value.slice(end)
  nextTick(() => {
    el?.setSelectionRange(start + ch.length, start + ch.length)
    focusField(i)
  })
}
</script>

<template>
  <form class="drill__form" @submit.prevent="submit">
    <div v-if="options" class="drill__options" role="group" aria-label="Варианты ответа">
      <button
        v-for="option in options"
        :key="option"
        class="drill__option"
        :class="{
          'drill__option--ok': revealed && isAccepted(option),
          'drill__option--bad': revealed && option === inputs[0],
        }"
        type="button"
        :disabled="revealed"
        @click="choose(option)"
      >
        {{ option }}
      </button>
    </div>

    <template v-else>
      <div v-for="(_, i) in blanks" :key="i" class="drill__field">
        <span v-if="multi" class="drill__field-number">{{ i + 1 }}</span>
        <input
          :id="i === 0 ? 'answer' : `answer-${i + 1}`"
          :ref="(el) => (fieldEls[i] = el as HTMLInputElement | null)"
          v-model="inputs[i]"
          class="drill__input"
          :class="checks?.[i] && CHECK_CLASS[checks[i]]"
          type="text"
          inputmode="text"
          :enterkeyhint="i < blanks.length - 1 ? 'next' : 'go'"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          lang="es"
          :aria-label="fieldLabel(i)"
          :readonly="revealed"
          :placeholder="placeholder"
          @focus="active = i"
          @keydown.enter.prevent="onEnter(i)"
        />
      </div>

      <p v-if="multi && !revealed" class="drill__fields-note">
        Если в пропуске ничего не нужно, оставьте поле пустым.
      </p>

      <div v-if="!revealed" class="drill__accents" role="group" aria-label="Буквы с ударением">
        <button
          v-for="ch in ACCENTS"
          :key="ch"
          class="drill__accent"
          type="button"
          tabindex="-1"
          @pointerdown.prevent
          @click="insertAccent(ch)"
        >
          {{ ch }}
        </button>
      </div>
    </template>

    <!-- правильная форма уже крупно под карточкой — здесь только вердикт -->
    <p v-if="feedback === 'almost'" class="notice notice--almost drill__feedback">
      Почти — проверьте ударения.
    </p>
    <p v-else-if="feedback === 'wrong'" class="notice notice--bad drill__feedback">
      Неверно.
    </p>

    <RuleHint v-if="hint" class="drill__hint" :hint="hint" />

    <div class="screen__actions drill__actions">
      <button
        v-if="revealed || !options"
        ref="submitEl"
        class="button button--primary drill__submit"
        type="submit"
        :disabled="!canSubmit"
      >
        {{ revealed ? 'Дальше' : 'Проверить' }}
      </button>
      <button v-if="canClaim" class="button button--ghost drill__own" type="button" @click="emit('own')">
        Мой ответ верный
      </button>
      <button v-if="!revealed" class="button button--ghost drill__skip" type="button" @click="emit('skip')">
        Пропустить
      </button>
    </div>
  </form>
</template>

<style scoped lang="scss">
/* ===== drill: варианты на выбор ===== */

.drill__options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(6rem, 1fr));
  gap: var(--space-2);
}

.drill__option {
  min-height: 3.25rem;
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--card);
  font: inherit;
  font-size: var(--text-lg);
  color: var(--ink);
  cursor: pointer;
}

.drill__option:active:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.drill__option:disabled {
  cursor: default;
}

.drill__option--ok {
  border-color: var(--ok);
  background: var(--ok-bg);
  color: var(--ok);
}

.drill__option--bad {
  border-color: var(--bad);
  background: var(--bad-bg);
  color: var(--bad);
}

/* ===== drill: ввод текстом ===== */

.drill__field {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.drill__field + .drill__field {
  margin-top: var(--space-2);
}

.drill__field-number {
  flex: none;
  width: 1.25rem;
  text-align: center;
  font-size: var(--text-sm);
  color: var(--muted);
}

.drill__fields-note {
  margin: var(--space-2) 0 0;
  font-size: var(--text-sm);
  color: var(--muted);
}

.drill__input {
  width: 100%;
  min-height: 3.25rem;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--line);
  border-radius: var(--radius-md);
  outline: none;
  background: var(--input-bg);
  font: inherit;
  font-size: var(--text-lg);
  color: var(--ink);
}

.drill__input:focus {
  border-color: var(--accent);
}

.drill__input--ok {
  border-color: var(--ok);
  background: var(--ok-bg);
}

.drill__input--almost {
  border-color: var(--almost);
  background: var(--almost-bg);
}

.drill__input--bad {
  border-color: var(--bad);
  background: var(--bad-bg);
}

.drill__accents {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.drill__accent {
  min-height: var(--tap);
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--card);
  font: inherit;
  font-size: var(--text-lg);
  color: var(--ink);
  cursor: pointer;
}

.drill__accent:active:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.drill__submit {
  flex: 1;
}

/* телефон: «Проверить / Дальше» — у нижнего края, когда подсказка длинная */
@media (max-width: 640px) {
  .drill__actions {
    position: sticky;
    bottom: 0;
    z-index: 2;
    margin: var(--space-2) calc(-1 * var(--space-4)) 0;
    padding: var(--space-3) var(--space-4) calc(var(--space-3) + env(safe-area-inset-bottom));
    background: linear-gradient(to top, var(--bg) 70%, transparent);
  }
}
</style>
