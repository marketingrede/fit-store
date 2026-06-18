import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tailwindcss()],
  publicDir: false,
  build: {
    outDir: 'public/assets',
    emptyOutDir: false,
    manifest: 'manifest.json',
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'resources/js/app.js'),
        admin: resolve(__dirname, 'resources/js/admin.js'),
      },
    },
  },
});
