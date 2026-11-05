import { describe, expect, it, vi } from 'vitest'
import { setupUpdates, type UpdateDeps } from './updates'

/** Фальшивые navigator.serviceWorker и document: события вызываем руками. */
function fakes(opts: { controlled: boolean; busy?: boolean }) {
  const listeners: Record<string, (() => void)[]> = {}
  const on = (type: string, fn: () => void) => {
    ;(listeners[type] ??= []).push(fn)
  }
  const fire = (type: string) => listeners[type]?.forEach((fn) => fn())
  const update = vi.fn(() => Promise.resolve())
  const doc = { visibilityState: 'visible' as DocumentVisibilityState, addEventListener: on }
  let busy = opts.busy ?? false
  const deps = {
    container: {
      controller: opts.controlled ? ({} as ServiceWorker) : null,
      register: vi.fn(() => Promise.resolve({ update } as unknown as ServiceWorkerRegistration)),
      addEventListener: on,
    },
    doc,
    reload: vi.fn(),
    isBusy: () => busy,
  }
  return {
    deps: deps as unknown as UpdateDeps,
    reload: deps.reload,
    update,
    register: deps.container.register,
    fire,
    setVisible(v: boolean) {
      doc.visibilityState = v ? 'visible' : 'hidden'
      fire('visibilitychange')
    },
    setBusy(v: boolean) {
      busy = v
    },
  }
}

describe('setupUpdates', () => {
  it('регистрирует sw.js по переданному адресу', async () => {
    const f = fakes({ controlled: false })
    await setupUpdates('/tiempos/sw.js', f.deps)
    expect(f.register).toHaveBeenCalledWith('/tiempos/sw.js')
  })

  it('первая установка воркера — не обновление, страницу не перезагружает', async () => {
    const f = fakes({ controlled: false })
    await setupUpdates('/sw.js', f.deps)
    f.fire('controllerchange')
    expect(f.reload).not.toHaveBeenCalled()
  })

  it('новая версия, пользователь не тренируется — перезагрузка сразу', async () => {
    const f = fakes({ controlled: true })
    await setupUpdates('/sw.js', f.deps)
    f.fire('controllerchange')
    expect(f.reload).toHaveBeenCalledTimes(1)
  })

  it('новая версия посреди тренировки — перезагрузка, когда вкладка уйдёт с экрана', async () => {
    const f = fakes({ controlled: true, busy: true })
    await setupUpdates('/sw.js', f.deps)
    f.fire('controllerchange')
    expect(f.reload).not.toHaveBeenCalled()
    f.setVisible(false)
    expect(f.reload).toHaveBeenCalledTimes(1)
  })

  it('уход с экрана без обновления ничего не перезагружает', async () => {
    const f = fakes({ controlled: true })
    await setupUpdates('/sw.js', f.deps)
    f.setVisible(false)
    expect(f.reload).not.toHaveBeenCalled()
  })

  it('возвращение на экран — просит браузер проверить обновление', async () => {
    const f = fakes({ controlled: true })
    await setupUpdates('/sw.js', f.deps)
    f.setVisible(false)
    f.setVisible(true)
    expect(f.update).toHaveBeenCalledTimes(1)
  })

  it('перезагружает не больше одного раза', async () => {
    const f = fakes({ controlled: true, busy: true })
    await setupUpdates('/sw.js', f.deps)
    f.fire('controllerchange')
    f.setVisible(false)
    f.fire('controllerchange')
    f.setVisible(false)
    expect(f.reload).toHaveBeenCalledTimes(1)
  })

  it('без поддержки офлайна (регистрация не удалась) приложение не падает', async () => {
    const f = fakes({ controlled: false })
    f.register.mockImplementationOnce(() => Promise.reject(new Error('blocked')))
    await expect(setupUpdates('/sw.js', f.deps)).resolves.toBeUndefined()
  })
})
