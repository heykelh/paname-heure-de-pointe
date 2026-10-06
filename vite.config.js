import { defineConfig } from 'vite';
// base './' : les chemins relatifs sont indispensables pour l'app mobile (Capacitor)
export default defineConfig({ base: './', build: { outDir: 'dist', assetsInlineLimit: 0 } });
