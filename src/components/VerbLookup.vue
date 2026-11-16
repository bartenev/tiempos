<script setup lang="ts">
import { computed, ref } from 'vue'
import { VERBS, isRegularIn, isRegularVerb } from '../data/verbs'
import { VERB_RU } from '../data/verbRu'
import { gerundOf, hasTense } from '../lib/conjugate'
import { explainForm } from '../lib/explain'
import { stripDiacritics } from '../lib/normalize'
import type { Verb } from '../types'
import { TENSES, TENSE_LABELS, personsFor } from '../types'
import Icon from './Icon.vue'
import RuleHint from './RuleHint.vue'

/** Сколько подсказок показываем под полем. */
const MAX_SUGGESTIONS = 8

const query = ref('')
const selected = ref<Verb | null>(null)

const norm = (value: string) => stripDiacritics(value.toLowerCase().trim())

/** Сначала — инфинитивы с этого начала, потом — где буквы внутри, потом — по переводу. */
const suggestions = computed<Verb[]>(() => {
  const q = norm(query.value)
  if (!q) return []
  const starts = VERBS.filter((v) => norm(v.infinitive).startsWith(q))
  const inside = VERBS.filter((v) => !starts.includes(v) && norm(v.infinitive).includes(q))
  const byRu = VERBS.filter(
    (v) => !starts.includes(v) && !inside.includes(v) && norm(VERB_RU[v.infinitive] ?? '').includes(q),
  )
  return [...starts, ...inside, ...byRu].slice(0, MAX_SUGGESTIONS)
})

function pick(verb: Verb) {
  selected.value = verb
  query.value = ''
}

function clear() {
  selected.value = null
}

/** Enter — первый из подсказок. */
function pickFirst() {
  const first = suggestions.value[0]
  if (first) pick(first)
}

/** Чем глагол особенный: чередование, особая форма yo, неправильный participio… */
const tags = computed<string[]>(() => {
  const verb = selected.value
  if (!verb) return []
  const out = [`-${verb.group}`]
  // какие времена не по правилу — видно у заголовков времён
  if (isRegularVerb(verb)) out.push('правильный')
  if (verb.stemChange) out.push(`чередование ${verb.stemChange.replace('>', ' → ')}`)
  if (verb.presentYo) out.push(`yo: ${verb.presentYo}`)
  if (verb.indefinidoStem) out.push(`indefinido: ${verb.indefinidoStem}-`)
  if (verb.participle) out.push(`participio: ${verb.participle}`)
  if (hasTense(verb, 'gerundio') && !isRegularIn(verb, 'gerundio')) out.push(`gerundio: ${gerundOf(verb)}`)
  if (verb.forms) out.push('неправильные формы')
  return out
})

/** Все времена: формы по лицам в раскладке подсказки (окончание выделено). */
const tenses = computed(() => {
  const verb = selected.value
  if (!verb) return []
  return TENSES.map((tense) => ({
    tense,
    available: hasTense(verb, tense),
    regular: isRegularIn(verb, tense),
    hint: hasTense(verb, tense)
      ? {
          rule: '',
          row: explainForm(verb, tense, personsFor(tense)[0]!).row.map((item) => ({ ...item, current: false })),
        }
      : null,
  }))
})
</script>

<template>
  <section class="verb-lookup">
    <h2 class="screen__section-title verb-lookup__title">Формы глагола</h2>

    <div v-if="!selected" class="verb-lookup__search">
      <input
        v-model="query"
        class="verb-lookup__input"
        type="search"
        inputmode="text"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        lang="es"
        enterkeyhint="search"
        placeholder="Найти глагол: tener, ir, говорить…"
        aria-label="Найти глагол"
        @keydown.enter.prevent="pickFirst"
      />
      <ul v-if="suggestions.length" class="verb-lookup__suggestions">
        <li v-for="verb in suggestions" :key="verb.infinitive" class="verb-lookup__suggestion">
          <button class="verb-lookup__suggestion-button" type="button" @click="pick(verb)">
            <b class="verb-lookup__suggestion-verb" lang="es">{{ verb.infinitive }}</b>
            <span class="verb-lookup__suggestion-ru">{{ VERB_RU[verb.infinitive] }}</span>
          </button>
        </li>
      </ul>
      <p v-else-if="query.trim()" class="verb-lookup__empty">
        Такого глагола в тренажёре нет — здесь только глаголы из тренировки.
      </p>
    </div>

    <div v-else class="verb-lookup__card">
      <header class="verb-lookup__head">
        <div class="verb-lookup__head-text">
          <p class="verb-lookup__verb" lang="es">{{ selected.infinitive }}</p>
          <p class="verb-lookup__ru">{{ VERB_RU[selected.infinitive] }}</p>
        </div>
        <button class="button button--ghost button--small verb-lookup__close" type="button" @click="clear">
          <Icon name="cross" />Другой
        </button>
      </header>
      <p class="verb-lookup__tags">
        <span v-for="tag in tags" :key="tag" class="verb-lookup__tag" lang="es">{{ tag }}</span>
      </p>

      <section v-for="t in tenses" :key="t.tense" class="verb-lookup__tense">
        <h3 class="verb-lookup__tense-title">
          {{ TENSE_LABELS[t.tense] }}
          <span
            v-if="t.available"
            class="verb-lookup__regularity"
            :class="{ 'verb-lookup__regularity--irregular': !t.regular }"
          >{{ t.regular ? 'по правилу' : 'неправильно' }}</span>
        </h3>
        <RuleHint v-if="t.hint" class="verb-lookup__forms" :hint="t.hint" />
        <p v-else class="verb-lookup__none">В тренажёре этого времени у глагола нет.</p>
      </section>
    </div>
  </section>
</template>

<style scoped lang="scss">
/* ===== verb-lookup: все формы глагола в «Справке» ===== */

.verb-lookup {
  margin-bottom: var(--space-6);
}

.verb-lookup__title {
  margin-top: 0;
}

.verb-lookup__input {
  width: 100%;
  min-height: var(--tap);
  padding: var(--space-2) var(--space-4);
  border: 1.5px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--card);
  color: var(--ink);
  font: inherit;
}

.verb-lookup__input:focus {
  border-color: var(--accent);
  outline: none;
}

.verb-lookup__suggestions {
  margin: var(--space-2) 0 0;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--card);
  list-style: none;
  overflow: hidden;
}

.verb-lookup__suggestion + .verb-lookup__suggestion {
  border-top: 1px solid var(--line);
}

.verb-lookup__suggestion-button {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  width: 100%;
  min-height: var(--tap);
  padding: var(--space-2) var(--space-4);
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.verb-lookup__suggestion-button:hover {
  background: var(--accent-soft);
}

.verb-lookup__suggestion-ru {
  min-width: 0;
  font-size: var(--text-sm);
  color: var(--muted);
}

.verb-lookup__empty,
.verb-lookup__none {
  margin: var(--space-2) 0 0;
  font-size: var(--text-sm);
  color: var(--muted);
}

.verb-lookup__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.verb-lookup__verb {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
}

.verb-lookup__ru {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--muted);
}

.verb-lookup__close {
  flex: none;
}

.verb-lookup__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin: var(--space-2) 0 0;
}

.verb-lookup__tag {
  padding: 0 var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--surface);
  font-size: var(--text-xs);
  color: var(--muted);
}

.verb-lookup__tense-title {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin: var(--space-4) 0 0;
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
}

/* по правилу / неправильно — в этом времени (tener: imperfecto по правилу) */
.verb-lookup__regularity {
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  color: var(--muted);
}

.verb-lookup__regularity--irregular {
  color: var(--bad);
}

/* сетка форм как в подсказке после ошибки, но без отступа сверху */
.verb-lookup__forms {
  margin-top: var(--space-2);
}

/* строки правила здесь нет — сетка сразу от верха рамки */
.verb-lookup__forms :deep(.rule-hint__row) {
  margin-top: 0;
}
</style>
