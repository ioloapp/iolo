import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        app: './src/iccrypt_frontend/index.html',
      },
    },
  },
  server: {
    open: './src/iccrypt_frontend/index.html',
  },
})
