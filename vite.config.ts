import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Explicit JSX konfiguráció - egyszerűsített
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      // Az előzőleg definiált babel rész eltávolítva
    }),
  ],
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom'], // Alapvető React függőségek
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Az aliases 'react/jsx-runtime': 'react/jsx-runtime.js' eltávolítva, ami hibát okozott
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    minify: 'terser', // Terser a jobb minifikációhoz
    terserOptions: {
      compress: {
        drop_console: true, // Konzol kimenetek eltávolítása
        passes: 2, // Többszörös optimalizációs menet
      },
    },
    rollupOptions: {
      input: 'index.html', // Ez adja meg a belépési pontot
      output: {
        // Cache busting: hash in filename for all assets
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        manualChunks: {
          // Kód-felosztás a fő könyvtárak szerint
          'react-vendor': ['react', 'react-dom'],
          routing: ['react-router-dom'],
          'ui-components': ['@dnd-kit/core', '@dnd-kit/sortable', 'react-resizable-panels'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
