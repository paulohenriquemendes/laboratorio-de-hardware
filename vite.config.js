import { defineConfig } from 'vite';
export default defineConfig({base:'./',build:{rollupOptions:{input:{game:'index.html',admin:'admin/index.html',legacyAdmin:'admin.html'}}}});
