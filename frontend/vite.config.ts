import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  // Le plugin Tailwind lit les classes utilisées dans le code
  plugins: [react(), tailwindcss()],
});