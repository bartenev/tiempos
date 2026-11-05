import { createApp } from 'vue'
import App from './App.vue'
import { legacyBookKeys } from './lib/book'
import { migrateBookStats } from './lib/stats'
import { removeObsoleteKeys, requestPersistentStorage } from './lib/storage'
import { setupUpdates } from './lib/updates'
import './style.css'

removeObsoleteKeys()
migrateBookStats(legacyBookKeys())
void requestPersistentStorage()
createApp(App).mount('#app')

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void setupUpdates(`${import.meta.env.BASE_URL}sw.js`, {
      container: navigator.serviceWorker,
      doc: document,
      reload: () => window.location.reload(),
      // идёт тренировка — экран DrillPanel
      isBusy: () => document.querySelector('.drill') !== null,
    })
  })
}
