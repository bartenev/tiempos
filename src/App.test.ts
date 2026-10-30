import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App.vue'
import DrillPanel from './components/DrillPanel.vue'
import HomePanel from './components/HomePanel.vue'
import { loadBookStats } from './lib/stats'
import type { BookConfig, BookCard } from './types'

const config: BookConfig = { units: [22], size: 10, mode: 'smart', answer: 'text' }

async function startSession() {
  const wrapper = mount(App)
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
    const total = drill.props('total')

    drill.vm.$emit('wrong', 'другая фраза')
    await flushPromises()
    expect(loadBookStats()[card.key]).toMatchObject({ ok: 0, bad: 1 })
    expect(drill.props('wrong')).toBe(1)
    expect(drill.props('total')).toBe(total + 1) // ошибка вернётся повтором

    drill.vm.$emit('revert')
    drill.vm.$emit('correct')
    drill.vm.$emit('next')
    await flushPromises()
    expect(loadBookStats()[card.key]).toMatchObject({ ok: 1, bad: 0, streak: 1 })
    expect(drill.props('wrong')).toBe(0)
    expect(drill.props('correct')).toBe(1)
    expect(drill.props('total')).toBe(total)
    expect(drill.props('index')).toBe(1)
  })
})
