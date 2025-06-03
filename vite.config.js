import { defineConfig } from 'vite';

export default defineConfig({
  base: '/goit-js-hw-12/',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        manualChunks: undefined,
      },
    },
  },
}); 