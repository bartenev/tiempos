import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/tiempos/',
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
  },
})
