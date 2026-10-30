import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { findVerb } from '../data/verbs'
import { cardsForUnits } from '../lib/book'
import { buildCard } from '../lib/session'
import DrillPanel from './DrillPanel.vue'

function mountDrill() {
  return mount(DrillPanel, {
    props: {
      card: buildCard(findVerb('hablar')!, 'presente', 'yo'),
      index: 0,
      total: 10,
      correct: 0,
      wrong: 0,
      streak: 0,
    },
  })
}

describe('DrillPanel', () => {
  it('correct answer goes straight to the next card', async () => {
    const wrapper = mountDrill()
    await wrapper.find('#answer').setValue('hablo')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('correct')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
    expect(wrapper.find('.rule-hint').exists()).toBe(false)
  })

  it('wrong answer stays with the hint until Enter', async () => {
    const wrapper = mountDrill()
    await wrapper.find('#answer').setValue('hablas')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('wrong')).toEqual([['hablas']])
    expect(wrapper.emitted('next')).toBeUndefined()
    expect(wrapper.find('.rule-hint').exists()).toBe(true)
    // после проверки клавиши с ударениями не нужны
    expect(wrapper.find('.drill__accents').exists()).toBe(false)
    expect(wrapper.find('.drill__answer').text()).toBe('hablo')

    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('accent-only mistake («almost») does not auto-advance', async () => {
    const wrapper = mountDrill()
    await wrapper.setProps({ card: buildCard(findVerb('hablar')!, 'indefinido', 'yo') })
    await wrapper.find('#answer').setValue('hable')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('next')).toBeUndefined()
    expect(wrapper.text()).toContain('Почти')
  })
})

describe('DrillPanel — textbook exercises', () => {
  function mountExercise(find: string, oral = false) {
    const card = cardsForUnits([35, 38, 39]).find((c) => c.sentence.startsWith(find))!
    return mount(DrillPanel, {
      props: { card, index: 0, total: 10, correct: 0, wrong: 0, streak: 0, oral },
    })
  }

  it('shows the chapter and the task instead of the tense', () => {
    const wrapper = mountExercise('¿Dónde está Andrés?')
    expect(wrapper.find('.drill__tense').text()).toBe('Глава 35')
    expect(wrapper.find('.drill__task').text()).toContain('lo, la, los')
  })

  it('accepts a typed answer and any variant', async () => {
    const wrapper = mountExercise('¿Dónde están las cucharas?')
    await wrapper.find('#answer').setValue('las')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('correct')).toHaveLength(1)
  })

  it('ignores punctuation in a whole phrase', async () => {
    const wrapper = mountExercise('Ama a tus padres.')
    await wrapper.find('#answer').setValue('Ámalos.')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('correct')).toHaveLength(1)
  })

  it('a wrong answer shows the rule without a conjugation table', async () => {
    const wrapper = mountExercise('¿Dónde está Andrés?')
    await wrapper.find('#answer').setValue('la')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('wrong')).toEqual([['la']])
    expect(wrapper.find('.rule-hint__rule').text().length).toBeGreaterThan(0)
    expect(wrapper.find('.rule-hint__row').exists()).toBe(false)
  })

  it('offers buttons instead of a field for a choice', async () => {
    const wrapper = mountExercise('—¿Quieres este libro?')
    expect(wrapper.find('#answer').exists()).toBe(false)
    expect(wrapper.find('.drill__accents').exists()).toBe(false)
    const right = wrapper.findAll('.drill__option').find((b) => b.text() === 'lo')!
    await right.trigger('click')
    expect(wrapper.emitted('correct')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('a wrong choice marks both buttons and waits for «Дальше»', async () => {
    const wrapper = mountExercise('—¿Quieres este libro?')
    await wrapper.findAll('.drill__option').find((b) => b.text() === 'le')!.trigger('click')
    expect(wrapper.emitted('wrong')).toEqual([['le']])
    expect(wrapper.emitted('next')).toBeUndefined()
    expect(wrapper.find('.drill__option--ok').text()).toBe('lo')
    expect(wrapper.find('.drill__option--bad').text()).toBe('le')

    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('resolves a picture against the site base and zooms it on tap', async () => {
    vi.stubEnv('BASE_URL', '/tiempos/')
    const card = cardsForUnits([18]).find((c) => c.image)!
    const wrapper = mount(DrillPanel, {
      props: { card, index: 0, total: 10, correct: 0, wrong: 0, streak: 0 },
    })
    expect(wrapper.find('.zoom-image__picture').attributes('src')).toBe(`/tiempos/${card.image}`)
    vi.unstubAllEnvs()

    expect(wrapper.find('.zoom-image__overlay').exists()).toBe(false)
    await wrapper.find('.zoom-image__open').trigger('click')
    expect(wrapper.find('.zoom-image__overlay').exists()).toBe(true)
    await wrapper.find('.zoom-image__overlay').trigger('click')
    expect(wrapper.find('.zoom-image__overlay').exists()).toBe(false)
  })

  it('a tap on the picture does not reveal the answer orally', async () => {
    const card = cardsForUnits([18]).find((c) => c.image)!
    const wrapper = mount(DrillPanel, {
      props: { card, index: 0, total: 10, correct: 0, wrong: 0, streak: 0, oral: true },
    })
    await wrapper.find('.zoom-image__open').trigger('click')
    expect(wrapper.find('.drill__answer').exists()).toBe(false)
  })

  it('orally the options go next to the blank', () => {
    const wrapper = mountExercise('—¿Quieres este libro?', true)
    expect(wrapper.find('.drill__options').exists()).toBe(false)
    expect(wrapper.find('.drill__infinitive').text()).toMatch(/lo \/ le|le \/ lo/)
  })
})

describe('DrillPanel — oral (self-check)', () => {
  let wrapper: ReturnType<typeof mountOral> | undefined

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.useRealTimers()
  })

  function mountOral(extra: { canUndo?: boolean; reopened?: boolean } = {}) {
    return mount(DrillPanel, {
      attachTo: document.body,
      props: {
        card: buildCard(findVerb('hablar')!, 'indefinido', 'él'),
        index: 0,
        total: 10,
        correct: 0,
        wrong: 0,
        streak: 0,
        oral: true,
        ...extra,
      },
    })
  }

  it('hides the answer until a tap, without a text field', async () => {
    wrapper = mountOral()
    expect(wrapper.find('#answer').exists()).toBe(false)
    // пустой пропуск — только линия (border), без символов «___»
    expect(wrapper.find('.drill__blank').text()).toBe('')
    expect(wrapper.find('.drill__grades').exists()).toBe(false)

    expect(wrapper.find('.drill__answer').exists()).toBe(false)
    await wrapper.find('.drill__card').trigger('click')
    expect(wrapper.find('.drill__blank').text()).toBe('habló')
    expect(wrapper.find('.drill__answer').text()).toBe('habló')
    expect(wrapper.find('.rule-hint').exists()).toBe(true)
    expect(wrapper.find('.drill__grades').exists()).toBe(true)
  })

  it('«Сказал верно» counts as correct and moves on', async () => {
    wrapper = mountOral()
    await wrapper.find('.drill__reveal').trigger('click')
    vi.advanceTimersByTime(400)
    await wrapper.find('.drill__grade--ok').trigger('click')
    expect(wrapper.emitted('correct')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('«Ошибся» counts as a mistake and moves on', async () => {
    wrapper = mountOral()
    await wrapper.find('.drill__reveal').trigger('click')
    vi.advanceTimersByTime(400)
    await wrapper.find('.drill__grade--bad').trigger('click')
    expect(wrapper.emitted('wrong')).toEqual([['']])
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('keyboard: space reveals, → correct, ← mistake', async () => {
    wrapper = mountOral()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(wrapper.emitted('correct')).toBeUndefined()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.drill__blank').text()).toBe('habló')

    vi.advanceTimersByTime(400)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(wrapper.emitted('wrong')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('a double tap does not grade by accident', async () => {
    wrapper = mountOral()
    await wrapper.find('.drill__reveal').trigger('click')
    vi.advanceTimersByTime(100)
    await wrapper.find('.drill__grade--ok').trigger('click')
    expect(wrapper.emitted('correct')).toBeUndefined()
    expect(wrapper.emitted('next')).toBeUndefined()

    vi.advanceTimersByTime(300)
    await wrapper.find('.drill__grade--ok').trigger('click')
    expect(wrapper.emitted('correct')).toHaveLength(1)
  })

  it('offers to undo the previous grade only when there is one', async () => {
    wrapper = mountOral()
    expect(wrapper.find('.drill__undo').exists()).toBe(false)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }))
    expect(wrapper.emitted('undo')).toBeUndefined()

    await wrapper.setProps({ canUndo: true })
    await wrapper.find('.drill__undo').trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }))
    expect(wrapper.emitted('undo')).toHaveLength(2)
  })

  it('a card reopened by undo shows the answer and waits for a new grade', async () => {
    wrapper = mountOral({ reopened: true })
    expect(wrapper.find('.drill__reveal').exists()).toBe(false)
    expect(wrapper.find('.drill__blank').text()).toBe('habló')
    // тот же быстрый тап, что вызвал отмену, не ставит оценку снова
    await wrapper.find('.drill__grade--ok').trigger('click')
    expect(wrapper.emitted('correct')).toBeUndefined()
    vi.advanceTimersByTime(400)
    await wrapper.find('.drill__grade--bad').trigger('click')
    expect(wrapper.emitted('wrong')).toHaveLength(1)
  })

  it('stops listening to the keyboard when the screen closes', () => {
    const off = vi.spyOn(window, 'removeEventListener')
    wrapper = mountOral()
    wrapper.unmount()
    wrapper = undefined
    expect(off).toHaveBeenCalledWith('keydown', expect.any(Function))
    off.mockRestore()
  })
})
