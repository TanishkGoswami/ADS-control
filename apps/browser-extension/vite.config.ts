import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { copyFileSync } from 'node:fs';

export default defineConfig({
  plugins: [{ name: 'copy-manifest', closeBundle: () => copyFileSync('manifest.json', 'dist/manifest.json') }],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.tsx'),
        popup: resolve(__dirname, 'popup.html')
      },
      output: { entryFileNames: '[name].js' }
    }
  }
});
