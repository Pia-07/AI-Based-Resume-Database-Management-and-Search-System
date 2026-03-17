import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,          // DISABLED: saves ~150MB of memory during build
    minify: 'esbuild',         // esbuild is faster and lighter than terser
    chunkSizeWarningLimit: 700,
    target: 'es2015',
    rollupOptions: {
      output: {
        // Manual chunk splitting reduces peak memory by parallelising output
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs') || id.includes('chartjs-plugin')) {
              return 'chart-vendor';
            }
            if (id.includes('react-markdown') || id.includes('remark')) {
              return 'markdown-vendor';
            }
            // All other node_modules go into a shared vendor chunk
            return 'vendor';
          }
        },
      },
      // Limit concurrent file handles to avoid OOM
      maxParallelFileOps: 5,
    },
  },
  server: {
    port: 5173,
  },
  // Optimise dependency pre-bundling memory usage
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'chart.js',
      'react-chartjs-2',
      'chartjs-plugin-datalabels',
      'react-markdown',
      'remark-gfm',
      '@react-oauth/google',
    ],
  },
})
