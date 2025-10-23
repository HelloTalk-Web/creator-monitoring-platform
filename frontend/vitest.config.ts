import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        '.next/',
        'out/',
        '**/*.config.*',
        '**/types/**',
        '**/*.d.ts'
      ]
    },
    include: ['app/**/*.{test,spec}.{js,jsx,ts,tsx}', 'components/**/*.{test,spec}.{js,jsx,ts,tsx}', 'lib/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules/', '.next/', 'out/']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});
