<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { RULES } from '../lib/articles/algorithm'
import type { RuleCode } from '../lib/articles/algorithm'
import type { SchemeForm, SchemeNodeId, SchemeOption } from '../lib/articles/scheme'
import { DEFAULT_SCHEME_FORM, SCHEME, SCHEME_KINDS, schemeForm } from '../lib/articles/scheme'

/** Схема в PDF — рядом, в public/articles. */
const pdfUrl = `${import.meta.env.BASE_URL}articles/algorithm-v2.pdf`

interface Step {
  node: SchemeNodeId
  option: SchemeOption
}

/** Пройденные вопросы и выбранные ответы. */
const trail = ref<Step[]>([])
const form = reactive<SchemeForm>({ ...DEFAULT_SCHEME_FORM })

const last = computed(() => trail.value[trail.value.length - 1])

/** Флаги, выставленные по пути: существительное опущено; тип или количество (для Ø). */
const flags = computed(() => Object.assign({}, ...trail.value.map((s) => s.option.set ?? {})) as SchemeOption['set'] & {})

const nodeId = computed<SchemeNodeId>(() => last.value?.option.next ?? 'start')
const node = computed(() => SCHEME[nodeId.value])

const result = computed(() => last.value?.option.res ?? null)

const rule = computed<RuleCode | null>(() => last.value?.option.rule ?? flags.value.z ?? null)

const ruleParts = computed(() => {
  if (!rule.value) return null
  const text: string = RULES[rule.value]
  const cut = text.indexOf(': ')
  return cut > 0 ? { source: text.slice(0, cut), text: text.slice(cut + 2) } : { source: '', text }
})

const output = computed(() =>
  result.value === 'def' || result.value === 'indef' ? schemeForm(result.value, form) : null,
)

/** Текущий вопрос или итог — после ответа он уезжает вниз под цепочкой; подтягиваем к верху. */
const stepEl = ref<HTMLElement | null>(null)

function revealStep() {
  void nextTick(() => {
    const el = stepEl.value
    if (el && el.getBoundingClientRect().top > window.innerHeight * 0.45) {
      el.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  })
}

function syncOmit() {
  form.omit = !!flags.value.omit
}

function choose(option: SchemeOption) {
  trail.value.push({ node: nodeId.value, option })
  if (option.form) Object.assign(form, option.form)
  syncOmit()
  revealStep()
}

/** Вернуться к вопросу i (ответ на него снимается). */
function backTo(i: number) {
  trail.value = trail.value.slice(0, i)
  syncOmit()
}

function back() {
  backTo(trail.value.length - 1)
}

function reset() {
  trail.value = []
  Object.assign(form, DEFAULT_SCHEME_FORM)
}

type Choice<K extends keyof SchemeForm> = { value: SchemeForm[K]; label: string }

function set<K extends keyof SchemeForm>(key: K, value: SchemeForm[K]) {
  form[key] = value
}

const GENDER: Choice<'g'>[] = [
  { value: 'm', label: 'мужской' },
  { value: 'f', label: 'женский' },
]
const NUMBER: Choice<'n'>[] = [
  { value: 'sg', label: 'единственное' },
  { value: 'pl', label: 'множественное' },
]
const TONIC: Choice<'at'>[] = [
  { value: false, label: 'обычное' },
  { value: true, label: 'ударное a- / ha-' },
]
const PREP: Choice<'prep'>[] = [
  { value: '', label: 'ничего' },
  { value: 'a', label: 'a' },
  { value: 'de', label: 'de' },
]
const OMIT: Choice<'omit'>[] = [
  { value: false, label: 'есть' },
  { value: true, label: 'опущено' },
]
</script>

<template>
  <section class="scheme">
    <h1 class="screen__title scheme__title">Схема</h1>
    <p class="screen__lead scheme__lead">
      Как выбрать артикль: шаг за шагом по правилам двух учебников.
      <a class="scheme__pdf" :href="pdfUrl">Схема в PDF</a>
    </p>

    <ol v-if="trail.length" class="scheme__trail">
      <li v-for="(step, i) in trail" :key="i" class="scheme__trail-item">
        <button class="scheme__trail-button" type="button" @click="backTo(i)">
          <span class="scheme__trail-number">{{ i + 1 }}</span>
          <span class="scheme__trail-text">
            {{ SCHEME[step.node].q }}
            <span class="scheme__trail-answer">→ {{ step.option.l }}</span>
          </span>
        </button>
      </li>
    </ol>

    <div v-if="!result" ref="stepEl" class="group scheme__step">
      <p class="scheme__question">{{ node.q }}</p>
      <p v-if="node.hint" class="scheme__hint" lang="es">{{ node.hint }}</p>
      <div class="scheme__options">
        <button
          v-for="(option, i) in node.opts"
          :key="i"
          class="scheme__option"
          type="button"
          @click="choose(option)"
        >
          {{ option.l }}
          <em v-if="option.h" class="scheme__option-example" lang="es">{{ option.h }}</em>
        </button>
      </div>
    </div>

    <div v-else ref="stepEl" class="group scheme__result">
      <p class="scheme__kind">
        {{ SCHEME_KINDS[result].title }}: <b lang="es">{{ SCHEME_KINDS[result].forms }}</b>
      </p>
      <p v-if="ruleParts" class="scheme__rule">
        <span v-if="ruleParts.source" class="scheme__rule-source">{{ ruleParts.source }}</span>
        {{ ruleParts.text }}
      </p>
      <p v-if="result === 'zero' && flags.z === 'C.cantidad'" class="scheme__note">
        Число: исчисляемое — во множественном (Compra huevos), неисчисляемое — в единственном (Compra aceite).
      </p>
      <p v-if="result === 'asis'" class="scheme__note">
        С предлогом артикль названия не сливается: a El Cairo, de El Salvador.
      </p>

      <div v-if="output" class="scheme__form">
        <div class="scheme__form-row">
          <span class="scheme__form-name">Род</span>
          <div class="segmented scheme__form-switch">
            <button
              v-for="c in GENDER"
              :key="c.label"
              class="segmented__item"
              :class="{ 'segmented__item--active': form.g === c.value }"
              type="button"
              :aria-pressed="form.g === c.value"
              @click="set('g', c.value)"
            >{{ c.label }}</button>
          </div>
        </div>
        <div class="scheme__form-row">
          <span class="scheme__form-name">Число</span>
          <div class="segmented scheme__form-switch">
            <button
              v-for="c in NUMBER"
              :key="c.label"
              class="segmented__item"
              :class="{ 'segmented__item--active': form.n === c.value }"
              type="button"
              :aria-pressed="form.n === c.value"
              @click="set('n', c.value)"
            >{{ c.label }}</button>
          </div>
        </div>
        <div v-if="form.g === 'f' && form.n === 'sg' && !form.omit" class="scheme__form-row">
          <span class="scheme__form-name">Начало слова (артикль вплотную)</span>
          <div class="segmented scheme__form-switch">
            <button
              v-for="c in TONIC"
              :key="c.label"
              class="segmented__item"
              :class="{ 'segmented__item--active': form.at === c.value }"
              type="button"
              :aria-pressed="form.at === c.value"
              @click="set('at', c.value)"
            >{{ c.label }}</button>
          </div>
        </div>
        <div v-if="result === 'def'" class="scheme__form-row">
          <span class="scheme__form-name">Перед артиклем</span>
          <div class="segmented scheme__form-switch">
            <button
              v-for="c in PREP"
              :key="c.label"
              class="segmented__item"
              :class="{ 'segmented__item--active': form.prep === c.value }"
              type="button"
              :aria-pressed="form.prep === c.value"
              @click="set('prep', c.value)"
            >{{ c.label }}</button>
          </div>
        </div>
        <div class="scheme__form-row">
          <span class="scheme__form-name">Существительное</span>
          <div class="segmented scheme__form-switch">
            <button
              v-for="c in OMIT"
              :key="c.label"
              class="segmented__item"
              :class="{ 'segmented__item--active': form.omit === c.value }"
              type="button"
              :aria-pressed="form.omit === c.value"
              @click="set('omit', c.value)"
            >{{ c.label }}</button>
          </div>
        </div>
        <p class="scheme__output">
          <b class="scheme__output-article" lang="es">{{ output.article }}</b>
          <span class="scheme__output-notes">{{ output.notes.length ? output.notes.join('; ') : 'форма по роду и числу' }}</span>
        </p>
      </div>
    </div>

    <div v-if="trail.length" class="scheme__actions">
      <button class="button button--ghost scheme__back" type="button" @click="back">Назад</button>
      <button class="button scheme__reset" :class="result ? 'button--primary' : 'button--ghost'" type="button" @click="reset">
        {{ result ? 'Новое предложение' : 'Сначала' }}
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
/* ===== scheme: пошаговая схема выбора артикля ===== */

.scheme__step,
.scheme__result {
  scroll-margin-top: var(--space-4);
}

.scheme__pdf {
  color: var(--accent);
  white-space: nowrap;
}

.scheme__trail {
  display: grid;
  gap: var(--space-1);
  margin: 0 0 var(--space-4);
  padding: 0;
  list-style: none;
}

.scheme__trail-button {
  display: flex;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--muted);
  font: inherit;
  font-size: var(--text-sm);
  text-align: left;
  cursor: pointer;
}

.scheme__trail-button:hover {
  border-color: var(--accent);
}

.scheme__trail-number {
  flex: none;
  font-variant-numeric: tabular-nums;
}

.scheme__trail-answer {
  display: block;
  color: var(--ink);
  font-weight: var(--weight-semibold);
}

.scheme__question {
  margin: var(--space-1) 0 var(--space-2);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  line-height: 1.35;
}

.scheme__hint {
  margin: 0 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--muted);
}

.scheme__options {
  display: grid;
  gap: var(--space-2);
  padding-bottom: var(--space-2);
}

.scheme__option {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1.5px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--card);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.scheme__option:hover {
  border-color: var(--accent);
}

.scheme__option-example {
  font-size: var(--text-sm);
  color: var(--muted);
}

.scheme__kind {
  margin: var(--space-1) 0 var(--space-2);
  font-size: var(--text-lg);
}

.scheme__rule {
  margin: 0 0 var(--space-2);
  line-height: 1.45;
}

.scheme__rule-source {
  display: inline-block;
  margin-right: var(--space-1);
  padding: 0 var(--space-1);
  border-radius: var(--radius-xs);
  background: var(--surface);
  font-size: var(--text-xs);
  color: var(--muted);
}

.scheme__note {
  margin: 0 0 var(--space-2);
  font-size: var(--text-sm);
  color: var(--muted);
}

.scheme__form {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-3);
  padding: var(--space-3) 0 var(--space-2);
  border-top: 1px solid var(--line);
}

.scheme__form-name {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--text-sm);
  color: var(--muted);
}

.scheme__output {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-1) var(--space-3);
  margin: 0;
}

.scheme__output-article {
  font-size: var(--text-2xl);
  color: var(--accent);
}

.scheme__output-notes {
  font-size: var(--text-sm);
  color: var(--muted);
}

.scheme__actions {
  display: flex;
  gap: var(--space-2);
}

.scheme__actions .button {
  flex: 1 1 0;
}
</style>
