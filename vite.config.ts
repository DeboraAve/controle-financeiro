import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/impulsa/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Impulsa',
        short_name: 'Impulsa',
        description: 'Seu negócio de personal, em ritmo — alunos, pacotes, agenda e caixa.',
        lang: 'pt-BR',
        start_url: '/impulsa/',
        scope: '/impulsa/',
        display: 'standalone',
        background_color: '#FFF7F3',
        theme_color: '#FF3D7F',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // jsPDF's optional .html() renderer (html2canvas/dompurify/canvg) — never called,
        // dynamically imported only when a PDF is actually generated, so it shouldn't be
        // downloaded upfront for every install.
        globIgnores: ['**/html2canvas-*.js', '**/purify.es-*.js', '**/index.es-*.js'],
      },
    }),
  ],
})
