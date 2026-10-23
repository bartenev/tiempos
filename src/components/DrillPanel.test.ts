import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { findVerb } from '../data/verbs'
import { buildCard } from '../lib/session'
import { FakeRecognition, installFakeRecognition, removeFakeRecognition } from '../lib/speech.fake'
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

describe('DrillPanel — voice', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installFakeRecognition()
  })

  afterEach(() => {
    vi.useRealTimers()
    removeFakeRecognition()
  })

  function mountVoice() {
    return mount(DrillPanel, {
      props: {
        card: buildCard(findVerb('hablar')!, 'indefinido', 'él'),
        index: 0,
        total: 10,
        correct: 0,
        wrong: 0,
        streak: 0,
        voice: true,
      },
    })
  }

  it('listens right away, without a text field', async () => {
    const wrapper = mountVoice()
    await wrapper.vm.$nextTick()
    expect(FakeRecognition.last.started).toBe(true)
    expect(wrapper.find('#answer').exists()).toBe(false)
    expect(wrapper.text()).toContain('Слушаю')
  })

  it('right form in any alternative → next card', async () => {
    const wrapper = mountVoice()
    FakeRecognition.last.say('hable', 'habló')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('correct')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('stress is not checked by ear: «hablo» counts for «habló»', async () => {
    const wrapper = mountVoice()
    FakeRecognition.last.say('hablo')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('correct')).toHaveLength(1)
  })

  it('wrong form → hint, then saying the right form moves on', async () => {
    const wrapper = mountVoice()
    FakeRecognition.last.say('hablaba')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('wrong')).toEqual([['hablaba']])
    expect(wrapper.find('.rule-hint').exists()).toBe(true)
    expect(wrapper.text()).toContain('Услышал: «hablaba»')

    vi.advanceTimersByTime(200)
    FakeRecognition.last.say('habló')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('correct')).toBeUndefined()
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('stops the microphone when the card screen closes', () => {
    const wrapper = mountVoice()
    const rec = FakeRecognition.last
    wrapper.unmount()
    expect(rec.aborted).toBe(true)
  })
})
