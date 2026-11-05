import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
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
 * со списком всех файлов. Версия кэша — хэш списка файлов и содержимого тех, у кого
 * имя не меняется от сборки к сборке (index.html, файлы из public вроде articulos/):
 * иначе их правка не обновила бы кэш. Картинки учебника лежат в своём постоянном кэше.
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
      const isImage = (f: string) => f.startsWith('book/')
      const precache = ['./', ...files.filter((f) => !isImage(f))]
      const hash = createHash('sha256').update(precache.join('\n'))
      const page = bundle['index.html']
      if (page?.type === 'asset') hash.update(page.source)
      const publicDir = join(import.meta.dirname, 'public')
      for (const f of precache) {
        if (f !== './' && !(f in bundle)) hash.update(readFileSync(join(publicDir, f)))
      }
      const version = hash.digest('hex').slice(0, 12)

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const CACHE = 'tiempos-${version}'
const IMAGES = 'tiempos-images'
const PRECACHE = ${JSON.stringify(precache)}
const IMAGE_FILES = ${JSON.stringify(files.filter(isImage))}

// Докачиваем только новые картинки; неудача не мешает установке — догрузится при показе.
async function syncImages() {
  const cache = await caches.open(IMAGES)
  const wanted = IMAGE_FILES.map((file) => new URL(file, self.registration.scope).href)
  const stale = (await cache.keys()).filter((request) => !wanted.includes(request.url))
  await Promise.all(stale.map((request) => cache.delete(request)))
  await Promise.all(
    wanted.map(async (url) => {
      if (!(await cache.match(url))) await cache.add(url).catch(() => {})
    }),
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // cache: 'reload' — мимо HTTP-кэша браузера (GitHub Pages отдаёт max-age=600),
      // иначе в новый кэш могла бы попасть старая копия файла с тем же именем
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(syncImages)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE && k !== IMAGES).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  // Отдельные страницы из public (например, articulos/) — сеть, офлайн — их собственный файл из кэша.
  // Главную ('./') ими не подменяем.
  const root = new URL('./', self.registration.scope).pathname
  if (request.mode === 'navigate' && new URL(request.url).pathname !== root) {
    const file = new URL(request.url)
    if (file.pathname.endsWith('/')) file.pathname += 'index.html'
    event.respondWith(fetch(request, { cache: 'no-cache' }).catch(() => caches.match(file.href, { ignoreVary: true })))
    return
  }

  // Страница: сначала сеть (свежая версия), офлайн — из кэша.
  // no-cache: сверяемся с сервером (короткий ответ 304, если не менялось), а не берём HTTP-кэш.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
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
            const name = new URL(request.url).pathname.includes('/book/') ? IMAGES : CACHE
            caches.open(name).then((cache) => cache.put(request, copy))
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
