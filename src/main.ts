import { createApp } from 'vue'
import App from './App.vue'
import { legacyBookKeys } from './lib/book'
import { migrateBookStats } from './lib/stats'
import { removeObsoleteKeys, requestPersistentStorage } from './lib/storage'
import './style.css'

removeObsoleteKeys()
migrateBookStats(legacyBookKeys())
void requestPersistentStorage()
createApp(App).mount('#app')

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* офлайн-режим недоступен — приложение работает и без него */
    })
  })
}
