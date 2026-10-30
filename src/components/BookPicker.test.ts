import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaultSelection, onlyUnits, selectedUnits } from '../lib/bookSelection'
import { settings } from '../lib/settingsState'
import BookPicker from './BookPicker.vue'

function tag(wrapper: ReturnType<typeof mount>, label: string) {
  return wrapper.findAll('.book-picker__tag').find((b) => b.text() === label)!
}

function chapter(wrapper: ReturnType<typeof mount>, unit: number) {
  return wrapper
    .findAll('.book-picker__chapter')
    .find((row) => row.find('.book-picker__number').text() === String(unit))!
}

describe('BookPicker', () => {
  beforeEach(() => {
    settings.bookSelection = defaultSelection()
  })

  it('a tap on a theme narrows the selection and lights it up', async () => {
    const wrapper = mount(BookPicker)
    await tag(wrapper, 'С императивом').trigger('click')
    expect(selectedUnits(settings.bookSelection)).toEqual([39, 77, 78])
    expect(tag(wrapper, 'С императивом').classes()).toContain('book-picker__tag--active')
    expect(tag(wrapper, 'Все местоимения').classes()).not.toContain('book-picker__tag--active')
  })

  it('combines themes', async () => {
    const wrapper = mount(BookPicker)
    await tag(wrapper, 'С императивом').trigger('click')
    await tag(wrapper, 'Me gusta').trigger('click')
    expect(selectedUnits(settings.bookSelection)).toEqual([39, 55, 77, 78])
  })

  it('a chapter taken off keeps the theme and updates the counter', async () => {
    const wrapper = mount(BookPicker)
    await tag(wrapper, 'С императивом').trigger('click')
    expect(wrapper.find('.book-picker__group-count').text()).toBe('3 из 26')
    await chapter(wrapper, 77).find('input').trigger('change')
    expect(selectedUnits(settings.bookSelection)).toEqual([39, 78])
    expect(tag(wrapper, 'С императивом').classes()).toContain('book-picker__tag--active')
    expect(wrapper.find('.book-picker__group-count').text()).toBe('2 из 26')
  })

  it('«только» leaves one chapter', async () => {
    const wrapper = mount(BookPicker)
    await chapter(wrapper, 41).find('.book-picker__only').trigger('click')
    expect(settings.bookSelection).toEqual(onlyUnits([41]))
    const box = chapter(wrapper, 41).find('input').element as HTMLInputElement
    expect(box.checked).toBe(true)
  })

  it('selects everything and nothing', async () => {
    const wrapper = mount(BookPicker)
    await wrapper.find('.book-picker__select-none').trigger('click')
    expect(selectedUnits(settings.bookSelection)).toEqual([])
    await wrapper.find('.book-picker__select-all').trigger('click')
    expect(tag(wrapper, 'Все местоимения').classes()).toContain('book-picker__tag--active')
  })
})
