import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import DrillPanel from './components/DrillPanel.vue'
import HomePanel from './components/HomePanel.vue'
import HubPanel from './components/HubPanel.vue'
import SummaryPanel from './components/SummaryPanel.vue'
import { loadLastSession } from './lib/lastSession'
import { loadBookStats } from './lib/stats'
import type { AnswerTiming } from './lib/timing'
import { loadTimings } from './lib/timing'
import type { BookConfig, BookCard, DrillCard, SessionConfig } from './types'
import { PERSONS, VERB_GROUPS } from './types'

const config: BookConfig = { units: [22], size: 10, mode: 'smart', answer: 'text' }

async function startSession() {
  const wrapper = mount(App)
  // старт — список тренажёров; из него на главную тренажёра
  wrapper.findComponent(HubPanel).vm.$emit('open', 'book')
  await flushPromises()
  wrapper.findComponent(HomePanel).vm.$emit('start-book', config)
  await flushPromises()
  return { wrapper, drill: wrapper.findComponent(DrillPanel) }
}

describe('App — «Мой ответ верный»', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('takes back the mistake and counts the answer as correct', async () => {
    const { drill } = await startSession()
    const card = drill.props('card') as BookCard

    drill.vm.$emit('wrong', 'другая фраза')
    await flushPromises()
    expect(loadBookStats()[card.key]).toMatchObject({ ok: 0, bad: 1 })
    expect(drill.props('wrong')).toBe(1)

    drill.vm.$emit('revert')
    drill.vm.$emit('correct')
    drill.vm.$emit('next')
    await flushPromises()
    expect(loadBookStats()[card.key]).toMatchObject({ ok: 1, bad: 0, streak: 1 })
    expect(drill.props('wrong')).toBe(0)
    expect(drill.props('correct')).toBe(1)
    expect(drill.props('total')).toBeNull() // умная сессия бесконечная
    expect(drill.props('index')).toBe(1)
  })
})

describe('App — артикли', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('opens the articles trainer from the list and records answers in its own store', async () => {
    const wrapper = mount(App)
    wrapper.findComponent(HubPanel).vm.$emit('open', 'articles')
    await flushPromises()
    const home = wrapper.findComponent(HomePanel)
    expect(home.find('.article-picker').exists()).toBe(true)
    await home.find('.home__start').trigger('click')
    await flushPromises()
    const drill = wrapper.findComponent(DrillPanel)
    const card = drill.props('card') as BookCard
    expect(card.deck).toBe('articles')
    drill.vm.$emit('correct')
    await flushPromises()
    const store = JSON.parse(localStorage.getItem('tiempos.articles.v1') ?? '{}') as Record<string, { ok: number }>
    expect(store[card.key]?.ok).toBe(1)
    expect(loadBookStats()).toEqual({})
  })
})

describe('App — бесконечная умная сессия', () => {
  const verbs: SessionConfig = {
    tenses: ['presente'],
    persons: [...PERSONS],
    groups: [...VERB_GROUPS],
    size: 20,
    mode: 'smart',
    answer: 'text',
    includeRegular: true,
    includeIrregular: false,
    selectedIrregular: [],
  }

  beforeEach(() => {
    localStorage.clear()
  })

  async function startVerbs(config: SessionConfig = verbs) {
    const wrapper = mount(App)
    wrapper.findComponent(HubPanel).vm.$emit('open', 'verbs')
    await flushPromises()
    wrapper.findComponent(HomePanel).vm.$emit('start', config)
    await flushPromises()
    return wrapper
  }

  async function answer(wrapper: VueWrapper, timing: AnswerTiming | null = { ms: 1200, total: 2000 }) {
    const drill = wrapper.findComponent(DrillPanel)
    drill.vm.$emit('correct', timing)
    drill.vm.$emit('next')
    await flushPromises()
  }

  it('keeps going past the first chunk and records answer times', async () => {
    const wrapper = await startVerbs()
    expect(wrapper.findComponent(DrillPanel).props('total')).toBeNull()
    for (let i = 0; i < 25; i++) await answer(wrapper)
    const drill = wrapper.findComponent(DrillPanel)
    expect(drill.exists()).toBe(true)
    expect(drill.props('index')).toBe(25)
    const timings = loadTimings()
    expect(timings).toHaveLength(25)
    expect(timings[0]).toMatchObject({ ms: 1200, total: 2000, ok: true, oral: false })
    expect(timings[0]!.k).toMatch(/\|presente\|/)
  })

  it('logs what was typed on a mistake and why the card came', async () => {
    const wrapper = await startVerbs()
    const drill = wrapper.findComponent(DrillPanel)
    drill.vm.$emit('wrong', 'hablas', { ms: 3000, total: 4000 })
    drill.vm.$emit('next')
    await flushPromises()
    const [entry] = loadTimings()
    expect(entry).toMatchObject({ ok: false, given: 'hablas' })
    // без истории всё — новое
    expect(entry!.reason).toBe('new')
    // повтор после ошибки — через RETRY_GAP карточек, и в логе он помечен
    for (let i = 0; i < 3; i++) await answer(wrapper)
    expect((wrapper.findComponent(DrillPanel).props('card') as DrillCard).retry).toBe(true)
    await answer(wrapper)
    expect(loadTimings().at(-1)).toMatchObject({ retry: true, reason: 'retry' })
  })

  it('undo takes the answer time back', async () => {
    const wrapper = await startVerbs({ ...verbs, answer: 'oral' })
    await answer(wrapper)
    expect(loadTimings()).toHaveLength(1)
    wrapper.findComponent(DrillPanel).vm.$emit('undo')
    await flushPromises()
    expect(loadTimings()).toHaveLength(0)
  })

  it('«закончить» leads to the summary; without answers — back home', async () => {
    const empty = await startVerbs()
    empty.findComponent(DrillPanel).vm.$emit('quit')
    await flushPromises()
    expect(empty.findComponent(HomePanel).exists()).toBe(true)

    const wrapper = await startVerbs()
    await answer(wrapper)
    await answer(wrapper)
    wrapper.findComponent(DrillPanel).vm.$emit('quit')
    await flushPromises()
    const summary = wrapper.findComponent(SummaryPanel)
    expect(summary.props('result')).toMatchObject({ correct: 2, total: 2 })
    // в фильтре одни -ar в presente: два быстрых ответа в одной группе — уже «было → стало»
    expect(Array.isArray(summary.props('result').tempo)).toBe(true)
    expect(summary.props('previous')).toBe(false)
    expect(loadLastSession()).toBeNull()
  })

  it('shows the summary of a session closed without it, once', async () => {
    const wrapper = await startVerbs()
    await answer(wrapper)
    wrapper.findComponent(DrillPanel).vm.$emit('wrong', 'hablas', null)
    await flushPromises()
    wrapper.unmount()

    const again = mount(App)
    await flushPromises()
    const summary = again.findComponent(SummaryPanel)
    expect(summary.exists()).toBe(true)
    expect(summary.props('previous')).toBe(true)
    expect(summary.props('result')).toMatchObject({ correct: 1, wrong: 1, total: 2 })
    expect(summary.props('result').mistakes).toHaveLength(1)
    expect(summary.text()).toContain('Итог прошлой сессии')

    // «Ещё раз» — новая сессия по настройкам
    await summary.find('.summary__again').trigger('click')
    await flushPromises()
    expect(again.findComponent(DrillPanel).exists()).toBe(true)

    expect(mount(App).findComponent(SummaryPanel).exists()).toBe(false)
  })

  it('starts with a warm-up of what cooled down, labelled on the card', async () => {
    const old = Date.now() - 10 * 24 * 60 * 60 * 1000
    localStorage.setItem(
      'tiempos.stats.v1',
      JSON.stringify({ 'hablar|presente|tú': { ok: 4, bad: 0, streak: 4, last: old } }),
    )
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const wrapper = await startVerbs({ ...verbs, persons: ['tú'] })
    const drill = wrapper.findComponent(DrillPanel)
    expect(drill.props('notice')).toBe('Сначала разогрев: 1 группа медленная или остыла.')
    expect((drill.props('card') as DrillCard).reason).toBe('cold')
    // проба быстрая — группа сразу вышла из разогрева
    await answer(wrapper)
    expect(wrapper.findComponent(DrillPanel).props('notice')).toBe('Разогрев пройден — дальше новое и повторение.')
    random.mockRestore()
  })

  it('says out loud when it starts something new', async () => {
    const wrapper = await startVerbs()
    expect(wrapper.findComponent(DrillPanel).props('notice')).toBe('Начинаем с нового: «Presente · -ar»')
  })

  it('says when a group turns slow', async () => {
    const wrapper = await startVerbs({ ...verbs, groups: ['ar'] })
    for (let i = 0; i < 4; i++) await answer(wrapper)
    const drill = wrapper.findComponent(DrillPanel)
    drill.vm.$emit('wrong', 'xxx', { ms: 3000, total: 4000 })
    drill.vm.$emit('next')
    await flushPromises()
    expect(wrapper.findComponent(DrillPanel).props('notice')).toMatch(/^«Presente · -ar · .+» вспоминается медленно/)
  })

  it('«Проверка» keeps its length', async () => {
    const wrapper = await startVerbs({ ...verbs, mode: 'random', size: 10 })
    expect(wrapper.findComponent(DrillPanel).props('total')).toBe(10)
    for (let i = 0; i < 10; i++) await answer(wrapper)
    expect(wrapper.findComponent(SummaryPanel).exists()).toBe(true)
  })
})
