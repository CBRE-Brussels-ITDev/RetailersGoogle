import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // ArcGIS requires these aliases for proper module resolution
      '@arcgis/core': '@arcgis/core'
    }
  },
  optimizeDeps: {
    // Exclude ArcGIS modules from pre-bundling to avoid issues
    exclude: ['@arcgis/core']
  },
  build: {
    // Increase chunk size limit for ArcGIS modules
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better loading
        manualChunks(id) {
          if (id.includes('@arcgis/core')) {
            return 'arcgis-core';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    // Add headers for better ArcGIS module loading
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  }
})