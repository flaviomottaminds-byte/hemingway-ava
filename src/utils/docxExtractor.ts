import mammoth from 'mammoth'

/**
 * Extrai texto limpo de arquivos Word (.docx) usando a biblioteca mammoth
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return (result.value || '').trim()
  } catch (error) {
    console.warn('Erro ao extrair texto do DOCX via mammoth:', error)
    return ''
  }
}
