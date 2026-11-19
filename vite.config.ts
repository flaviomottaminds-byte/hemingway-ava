import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'gdrive-pdf-proxy',
      configureServer(server) {
        server.middlewares.use('/api/gdrive-pdf', async (req, res) => {
          try {
            const urlObj = new URL(req.url || '', 'http://localhost')
            const fileId = urlObj.searchParams.get('id')?.trim()
            if (!fileId) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing id' }))
              return
            }

            const candidateUrls = [
              `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}&confirm=t`,
              `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`,
              `https://docs.google.com/document/d/${encodeURIComponent(fileId)}/export?format=txt`,
              `https://docs.google.com/document/d/${encodeURIComponent(fileId)}/export?format=pdf`,
            ]

            for (const targetUrl of candidateUrls) {
              try {
                const upstream = await fetch(targetUrl, { redirect: 'follow' })
                if (!upstream.ok) continue
                const contentType = upstream.headers.get('content-type') || ''
                const ab = await upstream.arrayBuffer()
                const buf = Buffer.from(ab)
                const isPdf =
                  buf.length > 4 &&
                  buf[0] === 0x25 &&
                  buf[1] === 0x50 &&
                  buf[2] === 0x44 &&
                  buf[3] === 0x46

                if (isPdf || contentType.includes('application/pdf')) {
                  res.setHeader('Access-Control-Allow-Origin', '*')
                  res.setHeader('Content-Type', 'application/pdf')
                  res.statusCode = 200
                  res.end(buf)
                  return
                }

                if (
                  contentType.includes('text/plain') &&
                  !buf.toString('utf8', 0, 100).includes('<!DOCTYPE html')
                ) {
                  res.setHeader('Access-Control-Allow-Origin', '*')
                  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
                  res.statusCode = 200
                  res.end(buf)
                  return
                }
              } catch {
                // tenta próxima URL
              }
            }

            res.statusCode = 502
            res.end(JSON.stringify({ error: 'Unable to fetch Google Drive file' }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(e) }))
          }
        })
      },
    },
  ],
})
