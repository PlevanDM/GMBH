import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { compression } from 'vite-plugin-compression2'
import { mockBuyerUsersApi } from './vite-plugin-mock-buyer-users'
import { mockAuthApi } from './vite-plugin-mock-auth'

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    mockBuyerUsersApi(),
    mockAuthApi(),
    // Gzip pre-compression for production
    mode === 'production' && compression({ algorithm: 'gzip', threshold: 1024 }),
    mode === 'production' && compression({ algorithm: 'brotliCompress', threshold: 1024 }),
  ].filter(Boolean),
  server: { port: 5173, host: true, allowedHosts: true },
  resolve: {
    alias: { '@': path.resolve(dir, 'src') },
  },
  build: {
    target: 'es2020',
    cssTarget: 'chrome80',
    // Remove console.log/warn in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react-vendor'
          if (id.includes('node_modules/react-router')) return 'router'
          if (id.includes('node_modules/motion/')) return 'motion'
          if (id.includes('node_modules/xlsx/')) return 'xlsx'
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'i18n'
          if (id.includes('node_modules/lucide-react')) return 'icons'
        },
      },
    },
    // Source map only for error tracking, not client
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    // Inline assets smaller than 8kb
    assetsInlineLimit: 8192,
  },
  // Optimize deps for faster cold start
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-i18next'],
  },
}))
