import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.'
        },
        {
          src: 'assets',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        'content': 'content_scripts/main.js',
        'popup': 'popup/popup.html'
      },
      output: {
        entryFileNames: chunkInfo => {
          return chunkInfo.name === 'content' ? 'content.js' : 'popup/[name].js';
        },
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'popup/[name].[ext]'
      }
    }
  }
}); 