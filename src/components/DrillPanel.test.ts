import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { findVerb } from '../data/verbs'
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

describe('DrillPanel — oral (self-check)', () => {
  let wrapper: ReturnType<typeof mountOral> | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountOral() {
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
      },
    })
  }

  it('hides the answer until a tap, without a text field', async () => {
    wrapper = mountOral()
    expect(wrapper.find('#answer').exists()).toBe(false)
    expect(wrapper.find('.blank').text()).toBe('___')
    expect(wrapper.find('.grade-actions').exists()).toBe(false)

    await wrapper.find('.prompt-card').trigger('click')
    expect(wrapper.find('.blank').text()).toBe('habló')
    expect(wrapper.find('.rule-hint').exists()).toBe(true)
    expect(wrapper.find('.grade-actions').exists()).toBe(true)
  })

  it('«Сказал верно» counts as correct and moves on', async () => {
    wrapper = mountOral()
    await wrapper.find('.reveal-btn').trigger('click')
    await wrapper.find('.grade.ok').trigger('click')
    expect(wrapper.emitted('correct')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('«Ошибся» counts as a mistake and moves on', async () => {
    wrapper = mountOral()
    await wrapper.find('.reveal-btn').trigger('click')
    await wrapper.find('.grade.bad').trigger('click')
    expect(wrapper.emitted('wrong')).toEqual([['']])
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('keyboard: space reveals, → correct, ← mistake', async () => {
    wrapper = mountOral()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(wrapper.emitted('correct')).toBeUndefined()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.blank').text()).toBe('habló')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(wrapper.emitted('wrong')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
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
