import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
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
    include: ['test/**/*.ts'],
    exclude: ['test/index.ts', 'test/test-utils.ts', 'test/setup.ts'],
    globals: true,
    setupFiles: ['test/setup.ts'],
  },
});
