import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'rekapi',
      fileName: 'rekapi',
      formats: ['umd'],
    },
    rollupOptions: {
      external: ['shifty'],
      output: {
        globals: {
          shifty: 'shifty',
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.js'],
    exclude: ['test/index.js', 'test/test-utils.js', 'test/setup.js', 'test/canvas.js'],
    globals: true,
    setupFiles: ['test/setup.js'],
  },
});
