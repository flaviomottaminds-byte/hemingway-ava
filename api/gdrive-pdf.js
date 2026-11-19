export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const fileId = req.query?.id
  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({ error: 'Parâmetro id (FILE_ID do Google Drive) é obrigatório.' })
  }

  const cleanId = fileId.trim()
  const candidateUrls = [
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(cleanId)}&confirm=t`,
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(cleanId)}&export=download&confirm=t`,
    `https://docs.google.com/document/d/${encodeURIComponent(cleanId)}/export?format=txt`,
    `https://docs.google.com/document/d/${encodeURIComponent(cleanId)}/export?format=pdf`,
  ]

  for (const targetUrl of candidateUrls) {
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/pdf,text/plain,*/*',
        },
      })

      if (!response.ok) continue

      const contentType = response.headers.get('content-type') || ''
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Verifica se o arquivo retornado é um PDF real (começa com %PDF-)
      const isPdfMagic =
        buffer.length > 4 &&
        buffer[0] === 0x25 && // %
        buffer[1] === 0x50 && // P
        buffer[2] === 0x44 && // D
        buffer[3] === 0x46 // F

      if (isPdfMagic || contentType.includes('application/pdf')) {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Cache-Control', 'public, max-age=300')
        return res.status(200).send(buffer)
      }

      // Se for exportação de texto do Google Docs (sem ser página HTML de login/erro)
      if (contentType.includes('text/plain') && !buffer.toString('utf8', 0, 100).includes('<!DOCTYPE html')) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.setHeader('Cache-Control', 'public, max-age=300')
        return res.status(200).send(buffer)
      }
    } catch (err) {
      // Tenta a próxima URL candidata
    }
  }

  return res.status(502).json({
    error: 'Não foi possível baixar o PDF do Google Drive. Verifique se o link está compartilhado como "Qualquer pessoa com o link".',
  })
}
