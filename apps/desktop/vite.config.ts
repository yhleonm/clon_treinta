import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@treinta/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
