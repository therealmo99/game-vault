// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://myraya.de',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [react()],
  output: 'static',
  adapter: undefined,
  compressHTML: true,
  prefetch: true,
});