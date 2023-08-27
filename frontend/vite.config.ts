import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
    {
      name: "deep-index",
      configureServer(server) {
        server.middlewares.use(
            (req, res, next) => {
              if (req.url === '/') {
                req.url = './src/iccrypt_frontend/index.html';
              }
              next();
            }
        )
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        app: './src/iccrypt_frontend/index.html',
      },
    },
  }
})
