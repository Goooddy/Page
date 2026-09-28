import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Relative base so the build works from any folder (GitHub Pages, artifact hosting).
export default defineConfig({
  base: './',
  plugins: [react()],
});
