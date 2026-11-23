import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { SessionResult } from '../types'
import SummaryPanel from './SummaryPanel.vue'

const result: SessionResult = {
  correct: 8,
  wrong: 1,
  skipped: 0,
  total: 9,
  bestStreak: 5,
  seconds: 90,
  mistakes: [],
}

describe('SummaryPanel — темп', () => {
  it('shows before → after per group, faster in green', () => {
    const wrapper = mount(SummaryPanel, {
      props: {
        result: {
          ...result,
          tempo: [{ key: 'presente|ar|yo', label: 'Presente · -ar · yo', before: 6100, after: 2300 }],
        },
      },
    })
    expect(wrapper.find('.summary__tempo-group').text()).toBe('Presente · -ar · yo')
    expect(wrapper.find('.summary__tempo-times').text()).toBe('6,1 с → 2,3 с')
    expect(wrapper.find('.summary__tempo-after--faster').exists()).toBe(true)
  })

  it('no tempo block without timed answers; the previous session is labelled', () => {
    const wrapper = mount(SummaryPanel, { props: { result, previous: true } })
    expect(wrapper.find('.summary__tempo').exists()).toBe(false)
    expect(wrapper.text()).toContain('Итог прошлой сессии')
  })
})
