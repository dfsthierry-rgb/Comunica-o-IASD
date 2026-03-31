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
              // 1. Handle proxy subpaths by stripping potential prefixes
              // We look for common Vite/Source patterns and strip everything before them
              const match = req.url.match(/(\/src\/|(\/@.*)|\/node_modules\/)/);
              if (match && match.index !== undefined && match.index > 0) {
                const newUrl = req.url.substring(match.index);
                console.log(`[Proxy Fix] Redirecting ${req.url} -> ${newUrl}`);
                req.url = newUrl;
              }

              // 2. Force correct MIME type for scripts
              const cleanUrl = req.url.split('?')[0];
              if (
                cleanUrl.endsWith('.ts') ||
                cleanUrl.endsWith('.tsx') ||
                cleanUrl.endsWith('.js') ||
                cleanUrl.endsWith('.jsx') ||
                cleanUrl.includes('/@vite/') ||
                cleanUrl.includes('/node_modules/.vite/')
              ) {
                res.setHeader('Content-Type', 'text/javascript');
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
      host: true,
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
