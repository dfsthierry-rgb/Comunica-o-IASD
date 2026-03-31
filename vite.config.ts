import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'fix-mime-types-and-paths',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url) {
              // 1. Force correct MIME type for scripts
              const url = req.url.split('?')[0];
              if (url.endsWith('.ts') || url.endsWith('.tsx') || url.endsWith('.js') || url.endsWith('.jsx')) {
                res.setHeader('Content-Type', 'application/javascript');
              }

              // 2. Handle proxy subpaths by stripping potential prefixes
              if (req.url.includes('/src/') || req.url.includes('/node_modules/') || req.url.startsWith('/@')) {
                const matches = req.url.match(/(\/src\/|\/node_modules\/|(\/@.*))/);
                if (matches && matches[0]) {
                  req.url = req.url.substring(req.url.indexOf(matches[0]));
                }
              }
            }
            next();
          });
        },
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
