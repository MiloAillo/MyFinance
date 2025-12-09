import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'MyFinance',
        short_name: 'MyFinance',
        description: 'MyFinance allow you to effortlessly manage your finance',
        theme_color: '#f7f7f7',
        icons: [
          {
              "src": "/icons/32x32.png",
              "type": "image/png", "sizes": "32x32", purpose: "any"
          },
          {
              "src": "/icons/128x128.png",
              "type": "image/png", "sizes": "128x128", purpose: "any"
          },
          {
              "src": "/icons/256x256.png",
              "type": "image/png", "sizes": "256x256", purpose: "any"
          },
          {
              "src": "/icons/512x512.png",
              "type": "image/png", "sizes": "512x512", purpose: "any"
          }
        ]
      }
    })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
