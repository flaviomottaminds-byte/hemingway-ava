import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

// Configura o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

/**
 * Extrai texto completo de um arquivo PDF carregado pelo usuário
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    })
    const pdf = await loadingTask.promise
    const pagesText: string[] = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageStrings = textContent.items
        .map((item) => ('str' in item ? (item as { str: string }).str : ''))
        .filter((str) => str.trim().length > 0)

      if (pageStrings.length > 0) {
        pagesText.push(pageStrings.join(' '))
      }
    }

    return pagesText.join('\n\n')
  } catch (error) {
    console.warn('Erro ao extrair texto do PDF via pdfjs-dist:', error)
    return ''
  }
}
