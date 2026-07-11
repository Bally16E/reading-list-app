import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { recognizeCoverImage } from './src/server/recognizeCover.ts'

// Emulates the /api/recognize-cover Vercel function during local development,
// so the same endpoint works both with `npm run dev` and once deployed.
function recognizeCoverDevMiddleware(): Plugin {
  return {
    name: 'recognize-cover-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/recognize-cover', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json')
          try {
            const { imageDataUrl } = JSON.parse(body) as { imageDataUrl?: string }
            if (!imageDataUrl) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'imageDataUrl is required' }))
              return
            }
            const result = await recognizeCoverImage(imageDataUrl)
            res.end(JSON.stringify(result))
          } catch (err) {
            console.error(err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'recognition failed' }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY

  return {
    plugins: [
      react(),
      tailwindcss(),
      recognizeCoverDevMiddleware(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: '読書リスト',
          short_name: '読書リスト',
          description: '積読・読書進捗を写真とかんたん入力で管理するアプリ',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],
    server: {
      host: true,
    },
  }
})
