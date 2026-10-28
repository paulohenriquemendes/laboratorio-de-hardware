import {offlineBuild} from './offline-build.js';
import { defineConfig } from 'vite';
export default defineConfig({plugins:[offlineBuild()],base:'./',build:{rollupOptions:{input:{game:'index.html',admin:'admin/index.html',legacyAdmin:'admin.html'}}}});
