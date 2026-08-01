import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(rootDir, 'src/host.tsx'),
      name: 'PLMWorkbenchV2',
      formats: ['iife'],
      fileName: () => 'plm-workbench-v2.iife.js',
    },
    minify: 'oxc',
    sourcemap: false,
  },
})
