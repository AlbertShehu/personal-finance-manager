import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: mode !== 'production', // disable sourcemaps in production
    minify: 'esbuild',
    target: 'es2020',
    cssMinify: true, // nëse përdor "lightningcss", vendose: 'lightningcss'
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react')) return 'react'
          if (id.includes('react-router')) return 'router'
          if (/recharts|react-chartjs-2/.test(id)) return 'charts'
          if (/i18next|react-i18next|i18next-browser-languagedetector/.test(id)) return 'i18n'
          if (/@radix-ui|lucide-react/.test(id)) return 'ui'
          return 'vendor'
        },
      },
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },
  preview: {
    port: 4173,
  },
}))
