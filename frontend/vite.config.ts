import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '../custom_components/cowork/www',
    emptyOutDir: true,
    lib: {
      entry: 'src/main.ts',
      name: 'CoworkPanel',
      formats: ['es'],
      fileName: 'cowork-panel'
    },
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
