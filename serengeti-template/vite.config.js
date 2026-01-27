import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        about: resolve(__dirname, 'src/about.html'),
        accommodation: resolve(__dirname, 'src/accommodation.html'),
        room: resolve(__dirname, 'src/room-single.html'),
        contact: resolve(__dirname, 'src/contact.html'),
        blog: resolve(__dirname, 'src/blog.html'),
        post: resolve(__dirname, 'src/post-single.html'),
        search: resolve(__dirname, 'src/search-results.html'),
      }
    }
  },
  server: {
    port: 5174,
    open: true
  }
});
