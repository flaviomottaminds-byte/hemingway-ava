import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

// Configura o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

/**
 * Extrai texto estruturado de um ArrayBuffer / Uint8Array de PDF via pdfjs-dist,
 * preservando as quebras de linha reais pela coordenada Y (transform[5]) e hasEOL.
 */
export async function extractTextFromPdfBuffer(
  data: ArrayBuffer | Uint8Array,
): Promise<string> {
  try {
    const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data)
    const loadingTask = pdfjsLib.getDocument({
      data: uint8,
      useSystemFonts: true,
    })
    const pdf = await loadingTask.promise
    const pagesText: string[] = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const lines: string[] = []
      let currentLine = ''
      let lastY: number | null = null

      for (const rawItem of textContent.items) {
        if (!('str' in rawItem)) continue
        const item = rawItem as {
          str: string
          transform?: number[]
          hasEOL?: boolean
        }
        const text = item.str || ''
        const y =
          Array.isArray(item.transform) && typeof item.transform[5] === 'number'
            ? item.transform[5]
            : null

        if (lastY !== null && y !== null && Math.abs(y - lastY) > 2.5) {
          if (currentLine.trim().length > 0) {
            lines.push(currentLine.trim())
          }
          currentLine = text
        } else {
          if (
            currentLine.length > 0 &&
            !currentLine.endsWith(' ') &&
            !text.startsWith(' ') &&
            text.length > 0
          ) {
            currentLine += ' ' + text
          } else {
            currentLine += text
          }
        }

        if (y !== null) {
          lastY = y
        }

        if (item.hasEOL) {
          if (currentLine.trim().length > 0) {
            lines.push(currentLine.trim())
          }
          currentLine = ''
          lastY = null
        }
      }

      if (currentLine.trim().length > 0) {
        lines.push(currentLine.trim())
      }

      if (lines.length > 0) {
        pagesText.push(lines.join('\n'))
      }
    }

    return pagesText.join('\n\n')
  } catch (error) {
    console.warn('Erro ao extrair texto do PDF via pdfjs-dist:', error)
    return ''
  }
}

/**
 * Extrai texto completo de um arquivo PDF carregado pelo usuário
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    return await extractTextFromPdfBuffer(arrayBuffer)
  } catch (error) {
    console.warn('Erro ao ler arquivo PDF:', error)
    return ''
  }
}

/**
 * Extrai o [FILE_ID] de qualquer URL do Google Drive ou Google Docs
 * Exemplos:
 * - https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing
 * - https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz
 * - https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || !url.trim()) return null
  const trimmed = url.trim()

  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1]

  const docDMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
  if (docDMatch && docDMatch[1]) return docDMatch[1]

  const genericDMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{15,})/)
  if (genericDMatch && genericDMatch[1]) return genericDMatch[1]

  const queryIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (queryIdMatch && queryIdMatch[1]) return queryIdMatch[1]

  return null
}

/**
 * Verifica se um buffer binário possui a assinatura mágica "%PDF-" nos primeiros bytes
 */
function hasPdfSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false
  const limit = Math.min(bytes.length - 4, 64)
  for (let i = 0; i < limit; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 // F
    ) {
      return true
    }
  }
  return false
}

/**
 * Baixa e extrai automaticamente o texto de um PDF hospedado no Google Drive via pdfjs-dist,
 * utilizando a URL direta de download, API route (/api/gdrive-pdf), proxy CORS e fallback
 * automático para Google Docs (/export?format=txt).
 */
export async function extractTextFromGoogleDrivePdf(url: string): Promise<{
  text: string
  fileId: string | null
  error?: string
}> {
  const fileId = extractGoogleDriveFileId(url)

  // Caso seja uma URL direta de PDF fora do Google Drive
  if (!fileId) {
    if (url.toLowerCase().includes('.pdf')) {
      try {
        const res = await fetch(url)
        if (res.ok) {
          const ab = await res.arrayBuffer()
          const text = await extractTextFromPdfBuffer(ab)
          if (text.trim()) {
            return { text, fileId: null }
          }
        }
      } catch {
        // fallback
      }
    }
    return {
      text: '',
      fileId: null,
      error: 'Não foi possível identificar o FILE_ID do Google Drive na URL informada.',
    }
  }

  const cacheKey = `ava_gdrive_pdf_text_v1_${fileId}`
  try {
    const cachedText = sessionStorage.getItem(cacheKey)
    if (cachedText && cachedText.trim().length > 40) {
      return { text: cachedText, fileId }
    }
  } catch {
    // prossegue sem cache de sessão
  }

  const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
  const googleDocsTxtUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`

  const candidateEndpoints: string[] = [
    `/api/gdrive-pdf?id=${encodeURIComponent(fileId)}`,
    directDownloadUrl,
    `https://corsproxy.io/?${encodeURIComponent(directDownloadUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(directDownloadUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(directDownloadUrl)}`,
    googleDocsTxtUrl,
    `https://corsproxy.io/?${encodeURIComponent(googleDocsTxtUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(googleDocsTxtUrl)}`,
  ]

  for (const endpoint of candidateEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
      })
      if (!response.ok) continue

      const arrayBuffer = await response.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      if (bytes.length < 15) continue

      // 1. Se o retorno for binário PDF (%PDF-), extrai com pdfjs-dist
      if (hasPdfSignature(bytes)) {
        const extractedText = await extractTextFromPdfBuffer(bytes)
        if (extractedText && extractedText.trim().length > 20) {
          try {
            sessionStorage.setItem(cacheKey, extractedText)
          } catch {
            // ignora erro de quota
          }
          return { text: extractedText, fileId }
        }
        continue
      }

      // 2. Se o retorno for texto puro (ex: fallback Google Docs /export?format=txt)
      const decodedText = new TextDecoder('utf-8').decode(bytes)
      const trimmedText = decodedText.trim()
      const looksLikeHtml =
        trimmedText.startsWith('<!DOCTYPE') ||
        trimmedText.startsWith('<html') ||
        trimmedText.includes('<title>Google Drive')

      if (!looksLikeHtml && trimmedText.length > 30) {
        try {
          sessionStorage.setItem(cacheKey, trimmedText)
        } catch {
          // ignora
        }
        return { text: trimmedText, fileId }
      }
    } catch {
      // Tenta próximo endpoint / proxy da fila
    }
  }

  return {
    text: '',
    fileId,
    error:
      'Não foi possível ler o PDF do Google Drive. Certifique-se de que o arquivo está compartilhado como "Qualquer pessoa com o link pode visualizar".',
  }
}
