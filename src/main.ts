import { createApp } from 'vue'
import App from './App.vue'
import { removeObsoleteKeys } from './lib/storage'
import './style.css'

removeObsoleteKeys()
createApp(App).mount('#app')

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* офлайн-режим недоступен — приложение работает и без него */
    })
  })
}
