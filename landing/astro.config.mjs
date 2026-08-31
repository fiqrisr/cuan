import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://cuan.fiqri.dev',
  vite: {
    plugins: [tailwindcss()],
  },
});
