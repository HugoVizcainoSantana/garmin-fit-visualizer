import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': '/src',
      '@/components': '/src/components',
      '@/utils': '/src/utils',
      '@/types': '/src/types',
      '@/i18n': '/src/i18n',
      '@/state': '/src/state',
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})