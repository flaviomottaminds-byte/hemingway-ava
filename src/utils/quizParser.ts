import type { AssessmentQuestion, AssessmentOption } from '../types'

export interface ParsedQuestionResult {
  questions: AssessmentQuestion[]
  rawExtractedCount: number
  warnings: string[]
}

/**
 * Parser calibrado para o padrão pedagógico Hemingway School:
 * - Divisão de blocos: Questão 1 (...), Questão 2, Q1, 1., etc.
 * - Texto-base e Enunciado preservados e formatados
 * - 5 Alternativas (- A) até - E))
 * - Gabarito Comentado com letra e explicação gravada no feedback
 */
export function parseHemingwayExamText(rawText: string): ParsedQuestionResult {
  const warnings: string[] = []
  if (!rawText || !rawText.trim()) {
    return { questions: [], rawExtractedCount: 0, warnings: ['O texto fornecido está vazio.'] }
  }

  // Normaliza quebras de linha e espaços não quebráveis
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')

  // Divide o texto em blocos de questões.
  // Procura por linhas que iniciam com "Questão X", "Q X", "X." etc.
  const questionDelimiterRegex = /(?:^|\n)(?=Quest[aã]o\s*\d+|\bQ\d+[:.\-\s]|\b\d+[\.\)]\s+[A-ZÀ-Ú])/i
  const rawBlocks = normalized
    .split(questionDelimiterRegex)
    .map((b) => b.trim())
    .filter((b) => b.length > 20)

  const parsedQuestions: AssessmentQuestion[] = []

  rawBlocks.forEach((block, idx) => {
    try {
      // 1. Extrai o Gabarito Comentado
      // Padrões aceitos:
      // "Gabarito Comentado: Alternativa X. Explicação..."
      // "Gabarito Comentado: X - Explicação..."
      // "Gabarito: Alternativa X. Explicação..."
      let correctLetter = 'A'
      let explanation = ''
      const gabaritoRegex = /(?:Gabarito(?:\s+Comentado)?|Resposta(?:\s+Correta)?)\s*:\s*(?:Alternativa\s*)?([A-Ea-e])[\.\:\-\)\s]*(.*)$/im
      const gabaritoMatch = block.match(gabaritoRegex)

      if (gabaritoMatch) {
        correctLetter = gabaritoMatch[1].toUpperCase()
        explanation = (gabaritoMatch[2] || '').trim()
      } else {
        // Tenta padrão alternativo: "Gabarito: X" em uma linha e "Comentário: ..." na linha seguinte
        const altGabarito = block.match(/(?:Gabarito|Resposta)\s*:\s*([A-Ea-e])/i)
        if (altGabarito) {
          correctLetter = altGabarito[1].toUpperCase()
          const altExpl = block.match(/Coment[aá]rio\s*:\s*(.*)$/im)
          if (altExpl) {
            explanation = altExpl[1].trim()
          }
        } else {
          warnings.push(`Questão ${idx + 1}: "Gabarito Comentado:" não encontrado. Padrão A atribuído.`)
        }
      }

      // Remove a linha do gabarito para isolar alternativas e enunciado
      const blockWithoutGabarito = block.replace(gabaritoRegex, '').trim()

      // 2. Extrai as alternativas (- A) até - E))
      const options: AssessmentOption[] = []
      const optLetterRegex = /(?:^|\n)\s*(?:[-–•*]\s*)?([A-Ea-e])[\)\.\:\-\]]\s*/g
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
            .trim()

          options.push({
            id: `opt-parsed-${Date.now()}-${idx}-${letter}`,
            option_letter: letter,
            text: optText,
            is_correct: letter === correctLetter,
          })
        }
      }

      // Garante que existam 5 alternativas (A, B, C, D, E)
      const expectedLetters = ['A', 'B', 'C', 'D', 'E']
      expectedLetters.forEach((letter) => {
        if (!options.some((o) => o.option_letter === letter)) {
          options.push({
            id: `opt-parsed-${Date.now()}-${idx}-${letter}`,
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
        /(?:^|\n)\s*(?:[-–•*]\s*)?[A-Ea-e][\)\.\:\-\]]/,
      )
      if (firstOptIndex !== -1) {
        statementArea = blockWithoutGabarito.substring(0, firstOptIndex).trim()
      }

      // Remove apenas o cabeçalho "Questão X (...)" do topo se presente
      statementArea = statementArea
        .replace(
          /^(?:Quest[aã]o\s*\d+|Q\d+[\.:\-\s]*)(?:\s*\([^\)]*\))?[\.\:\-\s]*/i,
          '',
        )
        .trim()

      if (!statementArea) {
        statementArea = `Questão ${idx + 1}`
      }

      parsedQuestions.push({
        id: `q-parsed-${Date.now()}-${idx + 1}`,
        sequence_order: idx + 1,
        statement: statementArea,
        points: 1,
        feedback:
          explanation ||
          'Gabarito oficial Hemingway School com justificativa comentada da resposta correta.',
        is_expanded: idx === 0, // expande a primeira para preview inicial
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
