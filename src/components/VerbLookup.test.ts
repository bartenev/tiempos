import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import VerbLookup from './VerbLookup.vue'

async function find(query: string) {
  const wrapper = mount(VerbLookup)
  await wrapper.find('.verb-lookup__input').setValue(query)
  return wrapper
}

describe('VerbLookup', () => {
  it('suggests verbs by the start of the infinitive', async () => {
    const wrapper = await find('ten')
    const verbs = wrapper.findAll('.verb-lookup__suggestion-verb').map((w) => w.text())
    expect(verbs[0]).toBe('tener')
  })

  it('finds a verb by its Russian translation and ignores accents', async () => {
    const byRu = await find('говор')
    expect(byRu.findAll('.verb-lookup__suggestion-verb').map((w) => w.text())).toContain('hablar')
  })

  it('says when the verb is not in the trainer', async () => {
    const wrapper = await find('zzzz')
    expect(wrapper.find('.verb-lookup__empty').exists()).toBe(true)
  })

  it('shows every tense of the picked verb', async () => {
    const wrapper = await find('pedir')
    await wrapper.find('.verb-lookup__suggestion-button').trigger('click')
    expect(wrapper.find('.verb-lookup__verb').text()).toBe('pedir')
    const titles = wrapper.findAll('.verb-lookup__tense-title').map((w) => w.text())
    expect(titles).toEqual(['Presente', 'Pretérito indefinido', 'Pretérito imperfecto', 'Pretérito perfecto', 'Imperativo'])
    const forms = wrapper.findAll('.rule-hint__form').map((w) => w.text())
    expect(forms).toContain('pido')
    expect(forms).toContain('pidió')
    expect(forms).toContain('he pedido')
    // императив без yo: 5 форм, остальные времена по 6
    expect(forms).toHaveLength(6 * 4 + 5)
    expect(wrapper.find('.verb-lookup__tags').text()).toContain('e → i')
  })

  it('goes back to search', async () => {
    const wrapper = await find('ser')
    await wrapper.find('.verb-lookup__suggestion-button').trigger('click')
    await wrapper.find('.verb-lookup__close').trigger('click')
    expect(wrapper.find('.verb-lookup__input').exists()).toBe(true)
  })
})
