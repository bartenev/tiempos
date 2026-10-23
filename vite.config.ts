import { createHash } from 'node:crypto'
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import vue from '@vitejs/plugin-vue'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

function listFiles(dir: string, root = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return listFiles(full, root)
    return [relative(root, full).split('\\').join('/')]
  })
}

/**
 * Офлайн-режим без зависимостей: после сборки кладём в dist sw.js
 * со списком всех файлов (хэш списка = версия кэша).
 */
function serviceWorker(): Plugin {
  return {
    name: 'tiempos-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = [
        ...Object.keys(bundle),
        ...listFiles(join(import.meta.dirname, 'public')),
      ]
        .filter((f) => f !== 'index.html' && !f.endsWith('.map'))
        .sort()
      const precache = ['./', ...files]
      const version = createHash('sha256')
        .update(precache.join('\n'))
        .digest('hex')
        .slice(0, 12)

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const CACHE = 'tiempos-${version}'
const PRECACHE = ${JSON.stringify(precache)}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  // Страница: сначала сеть (свежая версия), офлайн — из кэша.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('./', copy))
          return response
        })
        .catch(() => caches.match('./', { ignoreVary: true })),
    )
    return
  }

  // Ассеты с хэшем в имени: сначала кэш.
  // ignoreVary: module-скрипты идут с Origin, а сервер может отвечать Vary: Origin.
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})
`,
      })
    },
  }
}

export default defineConfig({
  base: '/tiempos/',
  plugins: [vue(), serviceWorker()],
  test: {
    environment: 'happy-dom',
  },
})
