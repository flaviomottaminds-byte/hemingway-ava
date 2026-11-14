import React, { useState } from 'react'
import {
  X,
  Upload,
  FileText,
  FileCheck,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  Database,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type {
  AssessmentQuestion,
  SupabaseCourse,
  SupabaseDiscipline,
  SupabaseAssessment,
} from '../../../types'
import { extractTextFromDocx } from '../../../utils/docxExtractor'
import { extractTextFromPdf } from '../../../utils/pdfExtractor'
import { parseHemingwayExamText } from '../../../utils/quizParser'
import { LESSON_1_1_QUESTIONS, LESSON_1_1_RAW_TEXT } from '../../../data/lesson1_1_questions'
import { assessmentService } from '../../../services/assessmentService'

export interface SmartExamImporterModalProps {
  isOpen: boolean
  onClose: () => void
  courses?: SupabaseCourse[]
  disciplines?: SupabaseDiscipline[]
  defaultCourseId?: string
  defaultDisciplineId?: string
  defaultLessonId?: string
  activeCourseId?: string
  activeDisciplineId?: string
  onQuestionsImported?: (questions: AssessmentQuestion[], title?: string) => void
  onSaveToDatabaseSuccess?: (assessment: SupabaseAssessment) => void
}

export const SmartExamImporterModal: React.FC<SmartExamImporterModalProps> = ({
  isOpen,
  onClose,
  onQuestionsImported,
  onSaveToDatabaseSuccess,
  courses = [],
  disciplines = [],
  defaultCourseId,
  defaultDisciplineId,
  defaultLessonId,
  activeCourseId,
  activeDisciplineId,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'preset'>('preset')
  const [pastedText, setPastedText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [parsedQuestions, setParsedQuestions] = useState<AssessmentQuestion[]>(LESSON_1_1_QUESTIONS)
  const [warnings, setWarnings] = useState<string[]>([])
  const [previewTitle, setPreviewTitle] = useState('Avaliação Oficial — Aula 1.1: FOH vs. BOH')
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({ 0: true })
  const [isSavingToDb, setIsSavingToDb] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  if (!isOpen) return null

  // Processa arquivo Word ou PDF
  const handleFileUpload = async (file: File) => {
    setSelectedFile(file)
    setIsProcessing(true)
    setStatusMessage(`Extraindo texto de ${file.name}...`)
    setWarnings([])

    try {
      let text = ''
      const fileNameLower = file.name.toLowerCase()

      if (fileNameLower.endsWith('.docx')) {
        setStatusMessage('Processando documento Word (.docx) com mammoth...')
        text = await extractTextFromDocx(file)
      } else if (fileNameLower.endsWith('.pdf')) {
        setStatusMessage('Processando documento PDF (.pdf) com pdfjs-dist...')
        text = await extractTextFromPdf(file)
      } else if (fileNameLower.endsWith('.txt')) {
        text = await file.text()
      } else {
        setWarnings(['Formato não suportado. Por favor, envie um arquivo .docx ou .pdf.'])
        setIsProcessing(false)
        return
      }

      if (!text.trim()) {
        setWarnings(['Nenhum texto pôde ser extraído do arquivo enviado.'])
        setIsProcessing(false)
        return
      }

      setPastedText(text)
      setStatusMessage('Calibrando e reconhecendo questões pelo padrão Hemingway School...')
      const result = parseHemingwayExamText(text)
      setParsedQuestions(result.questions)
      setWarnings(result.warnings)
      setPreviewTitle(file.name.replace(/\.[^/.]+$/, ''))
      // Expande a primeira questão para visualização
      setExpandedIndices({ 0: true })
    } catch (err) {
      console.error('Erro na extração do arquivo:', err)
      setWarnings([`Falha ao processar arquivo: ${String(err)}`])
    } finally {
      setIsProcessing(false)
      setStatusMessage(null)
    }
  }

  // Processa texto digitado ou colado
  const handleParseText = () => {
    if (!pastedText.trim()) return
    setIsProcessing(true)
    try {
      const result = parseHemingwayExamText(pastedText)
      setParsedQuestions(result.questions)
      setWarnings(result.warnings)
      setExpandedIndices({ 0: true })
    } finally {
      setIsProcessing(false)
    }
  }

  // Atalho rápido: Banco da Aula 1.1
  const handleLoadPresetAula1_1 = () => {
    setPastedText(LESSON_1_1_RAW_TEXT)
    setParsedQuestions(LESSON_1_1_QUESTIONS)
    setPreviewTitle('Avaliação Oficial — Aula 1.1: FOH vs. BOH (15 Questões)')
    setWarnings([])
    setExpandedIndices({ 0: true })
  }

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  // Concluir e aplicar no construtor
  const handleApplyQuestions = () => {
    if (parsedQuestions.length === 0) return
    if (onQuestionsImported) {
      onQuestionsImported(parsedQuestions, previewTitle)
    }
    onClose()
  }

  // Salvar diretamente no banco de dados Supabase via assessmentService
  const handleSaveDirectlyToDatabase = async () => {
    if (parsedQuestions.length === 0) return
    setIsSavingToDb(true)
    try {
      const targetCourseId = defaultCourseId || activeCourseId || (courses.length > 0 ? courses[0].id : 'crs-101')
      const targetDisciplineId = defaultDisciplineId || activeDisciplineId || (disciplines.length > 0 ? disciplines[0].id : 'disc-01')
      const targetLessonId = defaultLessonId || 'les-01'

      const saved = await assessmentService.createAssessment({
        course_id: targetCourseId,
        discipline_id: targetDisciplineId,
        scope_type: 'lesson_specific',
        lesson_id: targetLessonId,
        title: previewTitle,
        description: 'Banco de questões com gabarito comentado importado pelo Importador Inteligente da Hemingway School.',
        max_score: parsedQuestions.length,
        passing_score: Math.round(parsedQuestions.length * 0.7),
        max_attempts: 3,
        time_limit_minutes: 45,
        questions: parsedQuestions,
      })

      setSaveSuccess(true)
      if (onSaveToDatabaseSuccess) {
        onSaveToDatabaseSuccess(saved)
      }
      if (onQuestionsImported) {
        onQuestionsImported(parsedQuestions, previewTitle)
      }
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      console.error('Erro ao salvar no banco:', err)
      setWarnings([`Erro ao gravar prova no banco: ${String(err)}`])
    } finally {
      setIsSavingToDb(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#EADBBE] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Cabeçalho do Modal */}
        <div className="p-5 sm:p-6 bg-[#0F1B2F] text-[#FAF8F2] flex items-center justify-between border-b border-[#C59E5D]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C2E4A] border border-[#C59E5D]/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#C59E5D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-[#FAF8F2]">
                  Importador Inteligente de Provas
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#C59E5D]/20 border border-[#C59E5D]/40 text-[#C59E5D] text-[10px] font-bold">
                  Word · PDF · Texto
                </span>
              </div>
              <p className="text-xs text-[#EADBBE]/80">
                Padrão Hemingway School · 5 Alternativas com Gabarito Comentado Integrado
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#FAF8F2]/70 hover:text-white hover:bg-[#1C2E4A] rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Superiores de Seleção de Fonte */}
        <div className="bg-[#FAF8F2] border-b border-[#EADBBE] px-6 pt-3 flex gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'preset'
                ? 'bg-white text-[#0F1B2F] border-t-2 border-[#C59E5D] shadow-xs'
                : 'text-slate-600 hover:text-[#0F1B2F] hover:bg-slate-100/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#C59E5D]" />
            <span>Banco Oficial Aula 1.1 (FOH vs. BOH)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-[#0F1B2F] border-t-2 border-[#C59E5D] shadow-xs'
                : 'text-slate-600 hover:text-[#0F1B2F] hover:bg-slate-100/60'
            }`}
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Upload de Arquivo (.docx / .pdf)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white text-[#0F1B2F] border-t-2 border-[#C59E5D] shadow-xs'
                : 'text-slate-600 hover:text-[#0F1B2F] hover:bg-slate-100/60'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Colar Texto Bruto</span>
          </button>
        </div>

        {/* Conteúdo Rolável do Modal */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Aba 1: Atalho Banco Padrão Aula 1.1 */}
          {activeTab === 'preset' && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0F1B2F] via-[#1C2E4A] to-[#0A1220] text-white border border-[#C59E5D]/40 shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C59E5D]/20 text-[#C59E5D] text-[11px] font-bold border border-[#C59E5D]/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Banco Homologado Hemingway School
                  </span>
                  <h3 className="text-base font-extrabold text-[#FAF8F2]">
                    Carregar Banco Padrão — Aula 1.1 (15 Questões FOH vs. BOH)
                  </h3>
                  <p className="text-xs text-[#EADBBE]/80 leading-relaxed">
                    Conjunto oficial completo de 15 questões estruturadas com texto-base, enunciados contextualizados dos EUA, 5 alternativas e gabaritos comentados para vincular com 1 clique à Aula 1.1.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLoadPresetAula1_1}
                  className="px-5 py-3 rounded-xl bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] font-extrabold text-xs sm:text-sm shadow-md shadow-[#C59E5D]/30 transition transform hover:-translate-y-0.5 cursor-pointer shrink-0 inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#0F1B2F]" />
                  <span>Carregar 15 Questões da Aula 1.1</span>
                </button>
              </div>
              <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-[#C59E5D]/10 blur-2xl pointer-events-none" />
            </div>
          )}

          {/* Aba 2: Upload de Arquivo Word (.docx) ou PDF (.pdf) */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-[#C59E5D] bg-white p-6 rounded-2xl text-center transition">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Arraste ou selecione seu arquivo de prova
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos suportados: <strong>Microsoft Word (.docx)</strong> ou <strong>Adobe PDF (.pdf)</strong>
                </p>

                <div className="mt-4">
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F1B2F] hover:bg-[#1C2E4A] text-white text-xs font-bold transition shadow-xs cursor-pointer">
                    <FileCheck className="w-4 h-4 text-[#C59E5D]" />
                    <span>Escolher Arquivo do Computador</span>
                    <input
                      type="file"
                      accept=".docx,.pdf,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                      }}
                    />
                  </label>
                </div>

                {selectedFile && (
                  <p className="text-xs text-emerald-700 mt-3 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Aba 3: Colar Texto Diretamente */}
          {activeTab === 'text' && (
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cole o Texto da Prova / Avaliação
                </label>
                <span className="text-[11px] text-slate-400">
                  Reconhece: Questão 1, Texto-base, Enunciado, - A) a - E), Gabarito Comentado
                </span>
              </div>

              <textarea
                rows={7}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Exemplo de formatação reconhecida:\n\nQuestão 1 (A Metáfora do Teatro)\nTexto-base: Na indústria da hospitalidade nos Estados Unidos...\nEnunciado: Com base nessa analogia, qual a principal distinção operacional entre o FOH e o BOH?\n- A) O FOH atua apenas no controle...\n- B) O BOH é responsável pelo...\n- C) O FOH engloba tudo o que está à vista do cliente...\n- D) O FOH atua apenas...\n- E) Ambos compartilham...\nGabarito Comentado: Alternativa C. O FOH engloba tudo o que está à vista do cliente...`}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 leading-relaxed text-slate-800"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setPastedText('')}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Limpar Caixa de Texto
                </button>

                <button
                  type="button"
                  onClick={handleParseText}
                  disabled={!pastedText.trim()}
                  className="px-4 py-2 bg-[#0F1B2F] hover:bg-[#C59E5D] text-white hover:text-[#0F1B2F] rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C59E5D]" />
                  <span>Processar e Atualizar Preview</span>
                </button>
              </div>
            </div>
          )}

          {/* Indicador de Processamento */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3 animate-in fade-in">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-bold">{statusMessage || 'Processando prova...'}</p>
                <p className="text-[11px] text-blue-700">Identificando questões, 5 alternativas e gabaritos comentados...</p>
              </div>
            </div>
          )}

          {/* Avisos de Parsing */}
          {warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Observações do Importador:</span>
              </p>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-amber-800">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* SUCESSO DE SALVAMENTO */}
          {saveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold">Prova e Questões Salvas com Sucesso no Supabase!</p>
                <p className="text-[11px] text-emerald-700">A prova foi vinculada e já está pronta para uso dos alunos.</p>
              </div>
            </div>
          )}

          {/* Seção de Revisão das Questões Identificadas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>Revisão das Questões Identificadas</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    {parsedQuestions.length} questões prontas
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const all: Record<number, boolean> = {}
                    parsedQuestions.forEach((_, i) => (all[i] = true))
                    setExpandedIndices(all)
                  }}
                  className="text-xs text-blue-700 hover:underline cursor-pointer"
                >
                  Expandir Todas
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setExpandedIndices({})}
                  className="text-xs text-blue-700 hover:underline cursor-pointer"
                >
                  Recolher Todas
                </button>
              </div>
            </div>

            {/* Lista das Questões em Cards de Revisão */}
            <div className="space-y-3.5">
              {parsedQuestions.map((q, idx) => {
                const isExpanded = Boolean(expandedIndices[idx])
                const correctOpt = q.options.find((o) => o.is_correct)?.option_letter || 'A'

                return (
                  <div
                    key={q.id || idx}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
                  >
                    {/* Topo do Card de Questão */}
                    <div
                      onClick={() => toggleExpand(idx)}
                      className="p-4 bg-slate-50/70 hover:bg-slate-100/70 transition flex items-center justify-between cursor-pointer border-b border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-[#0F1B2F] text-[#C59E5D] text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="line-clamp-1 text-xs font-bold text-slate-800 max-w-xl">
                          {q.statement.substring(0, 95)}...
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold">
                          Gabarito: {correctOpt}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Detalhes da Questão (Quando Expandido) */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
                        {/* Enunciado e Texto-base */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Texto-Base & Enunciado Completo
                          </label>
                          <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-medium">
                            {q.statement}
                          </p>
                        </div>

                        {/* 5 Alternativas A a E com destaque visual na correta */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            5 Alternativas Hemingway School (A a E)
                          </label>
                          <div className="space-y-2">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id || opt.option_letter}
                                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                                  opt.is_correct
                                    ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-semibold shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                    opt.is_correct
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {opt.option_letter}
                                </span>
                                <span className="pt-0.5 leading-relaxed flex-1">{opt.text}</span>
                                {opt.is_correct && (
                                  <span className="text-[11px] text-emerald-700 font-bold shrink-0 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Correta
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Gabarito Comentado (Feedback para o Aluno) */}
                        <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#EADBBE]">
                          <label className="block text-[11px] font-bold text-[#0F1B2F] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#C59E5D]" />
                            <span>Gabarito Comentado (Exibido ao Aluno após Resposta)</span>
                          </label>
                          <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-2.5 rounded-lg border border-[#EADBBE]/60">
                            "{q.feedback}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Rodapé de Ações do Modal */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>{parsedQuestions.length} questões</strong> calibradas no padrão pedagógico oficial.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveDirectlyToDatabase}
              disabled={isSavingToDb || parsedQuestions.length === 0}
              className="px-4 py-2.5 bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSavingToDb ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C59E5D]" />
                  <span>Gravando no Supabase...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-[#C59E5D]" />
                  <span>Salvar Prova no Banco</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleApplyQuestions}
              disabled={parsedQuestions.length === 0}
              className="px-5 py-2.5 bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs font-extrabold rounded-xl transition shadow-md shadow-[#C59E5D]/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Aplicar no Construtor</span>
              <ArrowRight className="w-4 h-4 text-[#0F1B2F]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
