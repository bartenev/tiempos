/**
 * Обновление приложения без ручного сброса кэша.
 *
 * - Регистрируем sw.js. Новый воркер сам ставится и вытесняет старый (skipWaiting + clients.claim),
 *   а старые кэши удаляет — но уже открытая вкладка продолжает работать на старом коде.
 * - Поэтому: когда вкладка снова на экране, просим браузер проверить sw.js (приложение, установленное
 *   на телефон, может неделями висеть в фоне без перезагрузок).
 * - Когда управление перешло к новому воркеру (controllerchange), перезагружаем страницу —
 *   сразу, если пользователь не занят, иначе в момент, когда вкладка уйдёт с экрана.
 *   Посреди тренировки не перезагружаем: сессия живёт только в памяти.
 */

export interface UpdateDeps {
  container: Pick<ServiceWorkerContainer, 'register' | 'controller' | 'addEventListener'>
  doc: Pick<Document, 'visibilityState' | 'addEventListener'>
  reload: () => void
  /** Занят ли пользователь (идёт тренировка) — тогда перезагрузку откладываем. */
  isBusy: () => boolean
}

export function setupUpdates(url: string, deps: UpdateDeps): Promise<void> {
  const { container, doc, reload, isBusy } = deps
  // Первая установка тоже вызывает controllerchange — это не обновление.
  let hadController = container.controller !== null
  let pending = false
  let reloaded = false

  const reloadOnce = () => {
    if (reloaded) return
    reloaded = true
    reload()
  }

  container.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true
      return
    }
    pending = true
    if (doc.visibilityState === 'hidden' || !isBusy()) reloadOnce()
  })

  return container
    .register(url)
    .then((registration) => {
      doc.addEventListener('visibilitychange', () => {
        if (doc.visibilityState === 'hidden') {
          if (pending) reloadOnce()
          return
        }
        registration.update().catch(() => {
          /* нет сети — проверим в следующий раз */
        })
      })
    })
    .catch(() => {
      /* офлайн-режим недоступен — приложение работает и без него */
    })
}
