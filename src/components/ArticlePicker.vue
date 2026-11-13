<script setup lang="ts">
import { computed, reactive } from 'vue'
import { articleCount, ruleSize } from '../lib/articles/cards'
import type { TopicInfo } from '../lib/articles/topics'
import { ARTICLE_RULES, ARTICLE_TOPICS } from '../lib/articles/topics'
import { articleConfigFromSettings } from '../lib/settings'
import { settings } from '../lib/settingsState'
import type { ArticleRule, ArticleTopic } from '../types'
import PickerBlock from './PickerBlock.vue'

/** Свёрнуты по умолчанию; раскрытость не запоминается. */
const open = reactive<Partial<Record<ArticleTopic, boolean>>>({})

/** Сколько заданий у каждого правила — рядом с чекбоксом. */
const sizes = Object.fromEntries(ARTICLE_RULES.map((rule) => [rule, ruleSize(rule)])) as Record<ArticleRule, number>

const total = computed(() => articleCount(articleConfigFromSettings(settings).rules))

/** «все» — отмечено всё, «—» — ничего, иначе короткие названия выбранного. */
function summary(topic: TopicInfo): string {
  const picked = topic.rules.filter((r) => settings.articleRules[r.rule])
  if (picked.length === 0) return '—'
  if (picked.length === topic.rules.length) return 'все'
  return picked.map((r) => r.short).join(', ')
}

function setAll(value: boolean) {
  for (const rule of ARTICLE_RULES) settings.articleRules[rule] = value
}

/** Только правила этой темы. */
function only(topic: TopicInfo) {
  const own = new Set(topic.rules.map((r) => r.rule))
  for (const rule of ARTICLE_RULES) settings.articleRules[rule] = own.has(rule)
}
</script>

<template>
  <fieldset class="group article-picker">
    <legend class="group__legend article-picker__legend">Что тренируем</legend>
    <PickerBlock
      v-for="t in ARTICLE_TOPICS"
      :id="`article-picker-${t.topic}`"
      :key="t.topic"
      v-model:open="open[t.topic]"
      :class="`article-picker__topic--${t.topic}`"
      :label="t.label"
      :value="summary(t)"
    >
      <label v-for="r in t.rules" :key="r.rule" class="choice article-picker__rule">
        <input v-model="settings.articleRules[r.rule]" class="choice__input article-picker__rule-input" type="checkbox" />
        <span class="choice__label article-picker__rule-label">{{ r.label }}</span>
        <span class="article-picker__rule-count">{{ sizes[r.rule] }}</span>
      </label>
      <button class="link-button article-picker__only" type="button" @click="only(t)">Только эта тема</button>
    </PickerBlock>

    <div class="article-picker__footer">
      <span class="article-picker__total">Заданий: {{ total }}</span>
      <span class="article-picker__actions">
        <button class="link-button article-picker__all" type="button" @click="setAll(true)">Выбрать все</button>
        <button class="link-button article-picker__none" type="button" @click="setAll(false)">Снять все</button>
      </span>
    </div>
  </fieldset>
</template>

<style scoped lang="scss">
/* ===== article-picker: что тренируем в артиклях ===== */

.article-picker__rule {
  padding: var(--space-1) 0;
}

.article-picker__rule-label {
  flex: 1 1 auto;
  min-width: 0;
}

.article-picker__rule-count {
  flex: none;
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

.article-picker__only {
  margin-top: var(--space-1);
}

.article-picker__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-1) var(--space-3);
  padding: var(--space-3) 0 var(--space-1);
  border-top: 1px solid var(--line);
  font-size: var(--text-sm);
}

.article-picker__total {
  color: var(--muted);
}

.article-picker__actions {
  display: flex;
  gap: var(--space-4);
}
</style>
