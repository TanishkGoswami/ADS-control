import { defineConfig, build } from 'vite';
import { resolve } from 'node:path';
import { copyFileSync } from 'node:fs';

export default defineConfig({
  plugins: [
    {
      name: 'build-extension-scripts',
      async closeBundle() {
        // 1. Build content script as a standalone IIFE bundle (no import/export syntax)
        await build({
          configFile: false,
          build: {
            outDir: 'dist',
            emptyOutDir: false,
            minify: false,
            lib: {
              entry: resolve(__dirname, 'src/content.tsx'),
              name: 'AdsControlContent',
              formats: ['iife'],
              fileName: () => 'content.js'
            }
          }
        });

        // 2. Build background service worker as a standalone IIFE bundle
        await build({
          configFile: false,
          build: {
            outDir: 'dist',
            emptyOutDir: false,
            minify: false,
            lib: {
              entry: resolve(__dirname, 'src/background.ts'),
              name: 'AdsControlBackground',
              formats: ['iife'],
              fileName: () => 'background.js'
            }
          }
        });

        // 3. Copy manifest.json
        copyFileSync('manifest.json', 'dist/manifest.json');
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html')
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  }
});
