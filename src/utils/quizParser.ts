import type { AssessmentQuestion, AssessmentOption } from '../types'

export interface ParsedQuestionResult {
  questions: AssessmentQuestion[]
  rawExtractedCount: number
  warnings: string[]
}

/**
 * Parser calibrado para o padrão pedagógico Hemingway School (incluindo PDFs lidos via pdfjs-dist):
 * - Divisão de blocos: Questão 1 (...), Questão 2, Q1, 1., etc.
 * - Texto-base e Enunciado preservados e formatados
 * - Alternativas clicáveis (A), B), C), D), E))
 * - Gabarito / Gabarito Comentado com letra correta e justificativa gravada no feedback
 */
export function parseHemingwayExamText(rawText: string): ParsedQuestionResult {
  const warnings: string[] = []
  if (!rawText || !rawText.trim()) {
    return { questions: [], rawExtractedCount: 0, warnings: ['O texto fornecido está vazio.'] }
  }

  // Normaliza quebras de linha, espaços especiais e marcadores inline vindos de PDFs
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    // Garante quebra de linha antes de "Questão X" mesmo quando extraído inline pelo PDF
    .replace(/([^\n])\s+(?=Quest[aã]o\s+\d+\b)/gi, '$1\n')
    // Garante quebra de linha antes de alternativas "- A)", "A)", "B)", "C)", "D)", "E)" quando precedidas de pontuação ou espaço
    .replace(/([^\n])\s+(?=(?:[-–•*]\s*)?[A-E]\)\s+)/g, '$1\n')
    // Garante quebra de linha antes de "Gabarito:" ou "Gabarito Comentado:" ou "Resposta:"
    .replace(
      /([^\n])\s+(?=(?:✅\s*)?(?:Gabarito(?:\s+Comentado)?|Resposta(?:\s+Correta)?)\s*:)/gi,
      '$1\n',
    )

  // Divide o texto em blocos de questões ("Questão 1", "Q1", "1.", etc.)
  const questionDelimiterRegex =
    /(?:^|\n)(?=Quest[aã]o\s*\d+|\bQ\d+[:.\-\s]|\b\d{1,2}[\.\)]\s+[A-ZÀ-Ú])/i
  const rawBlocks = normalized
    .split(questionDelimiterRegex)
    .map((b) => b.trim())
    .filter((b) => b.length > 20 && /(?:[A-Da-d][\)\.\:\-\]]\s+\S)/.test(b))

  const parsedQuestions: AssessmentQuestion[] = []

  rawBlocks.forEach((block, idx) => {
    try {
      // 1. Extrai o Gabarito / Gabarito Comentado (suporta explicação em múltiplas linhas até o fim do bloco)
      let correctLetter = 'A'
      let explanation = ''
      const gabaritoRegex =
        /(?:^|\n)\s*(?:✅\s*)?(?:Gabarito(?:\s+Comentado)?|Resposta(?:\s+Correta)?)\s*[\:\-]\s*(?:Alternativa\s*|Letra\s*)?([A-Ea-e])[\.\:\-\)\s]*([\s\S]*)$/i
      const gabaritoMatch = block.match(gabaritoRegex)

      if (gabaritoMatch) {
        correctLetter = gabaritoMatch[1].toUpperCase()
        explanation = (gabaritoMatch[2] || '')
          .replace(/^(?:Coment[aá]rio|Justificativa|Explica[cç][aã]o)\s*:\s*/i, '')
          .replace(/\s*\n\s*/g, ' ')
          .trim()
      } else {
        const altGabarito = block.match(/(?:Gabarito|Resposta)\s*:\s*([A-Ea-e])/i)
        if (altGabarito) {
          correctLetter = altGabarito[1].toUpperCase()
          const altExpl = block.match(/(?:Coment[aá]rio|Justificativa)\s*:\s*([\s\S]*)$/i)
          if (altExpl) {
            explanation = altExpl[1].replace(/\s*\n\s*/g, ' ').trim()
          }
        } else {
          warnings.push(
            `Questão ${idx + 1}: "Gabarito:" não encontrado. Padrão A atribuído.`,
          )
        }
      }

      // Remove o bloco do gabarito para isolar alternativas e enunciado
      const blockWithoutGabarito = block.replace(gabaritoRegex, '').trim()

      // 2. Extrai as alternativas (A) até E))
      const options: AssessmentOption[] = []
      const optLetterRegex = /(?:^|\n)\s*(?:[-–•*]\s*)?([A-Ea-e])[\)\.\:\-\]]\s+/g
      const optMatches = Array.from(blockWithoutGabarito.matchAll(optLetterRegex))

      if (optMatches.length > 0) {
        for (let i = 0; i < optMatches.length; i++) {
          const match = optMatches[i]
          const letter = match[1].toUpperCase()
          const startIdx = (match.index || 0) + match[0].length
          const endIdx =
            i + 1 < optMatches.length
              ? optMatches[i + 1].index || blockWithoutGabarito.length
              : blockWithoutGabarito.length
          const optText = blockWithoutGabarito
            .substring(startIdx, endIdx)
            .replace(/\n\s*[-–•*]?\s*$/, '')
            .replace(/\s*\n\s*/g, ' ')
            .trim()

          if (!options.some((o) => o.option_letter === letter)) {
            options.push({
              id: `opt-parsed-${idx}-${letter}`,
              option_letter: letter,
              text: optText,
              is_correct: letter === correctLetter,
            })
          }
        }
      }

      // Garante alternativas mínimas A-D (e E caso o documento use 5 alternativas ou gabarito E)
      const hasOptionE = options.some((o) => o.option_letter === 'E') || correctLetter === 'E'
      const expectedLetters =
        options.length < 4 || hasOptionE ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D']
      expectedLetters.forEach((letter) => {
        if (!options.some((o) => o.option_letter === letter)) {
          options.push({
            id: `opt-parsed-${idx}-${letter}`,
            option_letter: letter,
            text: `[Alternativa ${letter} a preencher]`,
            is_correct: letter === correctLetter,
          })
        }
      })

      // Ordena opções de A a E
      options.sort((a, b) => a.option_letter.localeCompare(b.option_letter))

      // 3. Extrai o Enunciado e Texto-base
      let statementArea = blockWithoutGabarito
      const firstOptIndex = blockWithoutGabarito.search(
        /(?:^|\n)\s*(?:[-–•*]\s*)?[A-Ea-e][\)\.\:\-\]]\s+/,
      )
      if (firstOptIndex !== -1) {
        statementArea = blockWithoutGabarito.substring(0, firstOptIndex).trim()
      }

      // Remove apenas o cabeçalho "Questão X (...)" do topo se presente
      statementArea = statementArea
        .replace(
          /^(?:Quest[aã]o\s*\d+|Q\d+[\.:\-\s]*|\d{1,2}[\.\)])(?:\s*\([^\)]*\))?[\.\:\-\s]*/i,
          '',
        )
        .trim()

      if (!statementArea) {
        statementArea = `Questão ${idx + 1}`
      }

      parsedQuestions.push({
        id: `q-parsed-${idx + 1}`,
        sequence_order: idx + 1,
        statement: statementArea,
        points: 1,
        feedback:
          explanation ||
          'A alternativa correta está alinhada com o conteúdo oficial da aula na Hemingway School.',
        is_expanded: idx === 0,
        options,
      })
    } catch (err) {
      warnings.push(`Erro ao processar bloco ${idx + 1}: ${String(err)}`)
    }
  })

  return {
    questions: parsedQuestions,
    rawExtractedCount: parsedQuestions.length,
    warnings,
  }
}
