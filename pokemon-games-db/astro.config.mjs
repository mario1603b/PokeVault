import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // Esto carga las integraciones de React y Tailwind
  integrations: [react(), tailwind()]
});