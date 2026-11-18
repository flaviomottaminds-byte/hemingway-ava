import React, { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Presentation,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Download,
  Languages,
  Clock,
  Sparkles,
  Link2,
  RotateCcw,
  Award,
  BookOpen,
  Eye,
} from 'lucide-react'
import type { SupabaseLesson, UsefulLink, AssessmentQuestion } from '../../../types'
import { extractYouTubeId, formatGoogleDriveEmbedUrl } from '../../../services/lessonService'
import { assessmentService } from '../../../services/assessmentService'
import { SlideViewer } from '../../classroom/components/SlideViewer'

export interface StudentLessonPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  lesson:
    | SupabaseLesson
    | {
        id?: string
        title?: string
        course_id?: string
        courseId?: string
        discipline_id?: string
        disciplineId?: string
        sequence_order?: number | string
        sequenceOrder?: number | string
        duration_minutes?: number | string
        durationMinutes?: number | string
        content_text?: string
        contentText?: string
        content?: string
        video_url?: string
        videoUrl?: string
        youtube_url?: string
        youtubeUrl?: string
        pdf_url?: string
        pdfUrl?: string
        pdf_name?: string
        pdfName?: string
        slides_url?: string
        slidesUrl?: string
        slides_url_pt?: string
        slidesUrlPt?: string
        slides_url_en?: string
        slidesUrlEn?: string
        slides_url_es?: string
        slidesUrlEs?: string
        exam_drive_url?: string
        examDriveUrl?: string
        useful_links?: UsefulLink[]
        usefulLinks?: UsefulLink[]
        materials?: any[]
      }
    | null
  courseTitle?: string
  disciplineName?: string
}

export const StudentLessonPreviewModal: React.FC<StudentLessonPreviewModalProps> = ({
  isOpen,
  onClose,
  lesson,
  courseTitle = 'Hemingway School',
  disciplineName = 'Disciplina do Módulo',
}) => {
  // Normalização segura de campos (suporta snake_case e camelCase sem quebrar com undefined)
  const raw = (lesson || {}) as Record<string, any>
  const lessonId = raw.id ? String(raw.id) : undefined
  const lessonTitle = String(raw.title || 'Aula sem Título').trim() || 'Aula sem Título'
  const courseId = String(raw.course_id ?? raw.courseId ?? '')
  const disciplineId = String(raw.discipline_id ?? raw.disciplineId ?? '')
  const sequenceOrder = Number(raw.sequence_order ?? raw.sequenceOrder ?? 1) || 1
  const durationMinutes = Number(raw.duration_minutes ?? raw.durationMinutes ?? 20) || 20
  const contentText = String(raw.content_text ?? raw.contentText ?? raw.content ?? '')
  const videoUrl = String(
    raw.video_url ?? raw.videoUrl ?? raw.youtube_url ?? raw.youtubeUrl ?? '',
  ).trim()
  const pdfUrl = String(raw.pdf_url ?? raw.pdfUrl ?? '').trim()
  const pdfName = String(raw.pdf_name ?? raw.pdfName ?? 'Apostila-Oficial.pdf').trim() || 'Apostila-Oficial.pdf'
  const slidesUrlBase = String(raw.slides_url ?? raw.slidesUrl ?? '').trim()
  const slidesUrlPt = String(raw.slides_url_pt ?? raw.slidesUrlPt ?? slidesUrlBase ?? '').trim()
  const slidesUrlEn = String(raw.slides_url_en ?? raw.slidesUrlEn ?? '').trim()
  const slidesUrlEs = String(raw.slides_url_es ?? raw.slidesUrlEs ?? '').trim()
  const slidesUrl = slidesUrlBase || slidesUrlPt || slidesUrlEn || slidesUrlEs
  const examDriveUrl = String(raw.exam_drive_url ?? raw.examDriveUrl ?? '').trim()

  const rawUsefulLinks = raw.useful_links ?? raw.usefulLinks
  const usefulLinks: UsefulLink[] = Array.isArray(rawUsefulLinks)
    ? rawUsefulLinks
        .filter((l: any) => l && typeof l === 'object' && (l.title || l.url))
        .map((l: any, idx: number) => ({
          id: String(l.id || `link-${idx}`),
          title: String(l.title || l.url || `Link #${idx + 1}`),
          url: String(l.url || '#'),
          description: l.description ? String(l.description) : '',
        }))
    : []

  const rawMaterials = raw.materials
  const materials: any[] = Array.isArray(rawMaterials) ? rawMaterials.filter(Boolean) : []

  // Todos os Hooks no topo (NUNCA após um return condicional)
  const [previewLang, setPreviewLang] = useState<'pt' | 'en' | 'es'>('pt')
  const [quizQuestions, setQuizQuestions] = useState<AssessmentQuestion[]>([])
  const [quizTitle, setQuizTitle] = useState<string>('Quiz Interativo da Aula (AVA)')
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [revealedFeedbacks, setRevealedFeedbacks] = useState<Record<string, boolean>>({})
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false)
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0)

  // Dados resolvidos por idioma
  const resolvedSlideUrl =
    previewLang === 'pt'
      ? slidesUrlPt || slidesUrl
      : previewLang === 'en'
        ? slidesUrlEn || slidesUrlPt || slidesUrl
        : slidesUrlEs || slidesUrlPt || slidesUrl

  const hasVideo = Boolean(videoUrl.length > 0)
  const youtubeId = hasVideo ? extractYouTubeId(videoUrl) : null
  const hasSlides = Boolean(resolvedSlideUrl || slidesUrl || slidesUrlPt || slidesUrlEn || slidesUrlEs)
  const hasPdf = Boolean(pdfUrl.length > 0)

  const [subTabSlidesApostila, setSubTabSlidesApostila] = useState<'slides' | 'apostila'>(
    hasSlides ? 'slides' : 'apostila',
  )

  useEffect(() => {
    if (hasSlides) {
      setSubTabSlidesApostila('slides')
    } else {
      setSubTabSlidesApostila('apostila')
    }
  }, [hasSlides, hasPdf])

  // Reinicia para a primeira etapa sempre que o modal de pré-visualização é aberto
  useEffect(() => {
    if (isOpen) {
      setCurrentStageIndex(0)
    }
  }, [isOpen])

  // Carrega questões reais da avaliação associadas à aula ou disciplina no Supabase
  useEffect(() => {
    if (!isOpen || !lesson) return

    setIsLoadingQuiz(true)
    assessmentService
      .getAssessmentForLesson({
        lesson_id: lessonId,
        discipline_id: disciplineId || undefined,
        course_id: courseId || undefined,
      })
      .then((found) => {
        if (found && Array.isArray(found.questions) && found.questions.length > 0) {
          setQuizQuestions(found.questions)
          setQuizTitle(found.title || 'Quiz Interativo da Aula (AVA)')
        } else {
          setQuizQuestions([])
          setQuizTitle('Quiz Interativo da Aula (AVA)')
        }
      })
      .catch(() => {
        setQuizQuestions([])
      })
      .finally(() => {
        setIsLoadingQuiz(false)
      })

    setSelectedAnswers({})
    setRevealedFeedbacks({})
  }, [isOpen, lessonId, courseId, disciplineId])

  // Trilha paginada passo a passo (Vídeo -> Slides Gamma / Apostila -> Links Úteis -> Prova/Quiz)
  const activeStages = useMemo(() => {
    const stages: {
      id: 'video' | 'slides_apostila' | 'links_materiais' | 'avaliacao_quiz'
      title: string
      shortTitle: string
      description: string
      icon: React.ComponentType<{ className?: string }>
    }[] = [
      {
        id: 'video',
        title: 'Página 1 — Vídeo Aula',
        shortTitle: 'Vídeo Aula',
        description: 'Assista à videoaula do professor com exemplos e diretrizes práticas.',
        icon: Play,
      },
      {
        id: 'slides_apostila',
        title: 'Página 2 — Slides Gamma & Apostila',
        shortTitle: 'Slides & Apostila',
        description: 'Acesse os slides interativos no Gamma.app e leia a apostila oficial do curso.',
        icon: Presentation,
      },
      {
        id: 'links_materiais',
        title: 'Página 3 — Links Úteis & Materiais',
        shortTitle: 'Links Úteis',
        description: 'Acesse artigos oficiais, referências regulatórias e documentação complementar.',
        icon: Link2,
      },
      {
        id: 'avaliacao_quiz',
        title: 'Página 4 — Prova / Quiz da Aula',
        shortTitle: 'Prova / Quiz',
        description: 'Teste seus conhecimentos com auto-correção e gabarito comentado oficial.',
        icon: Award,
      },
    ]

    return stages.map((st, idx) => ({
      ...st,
      stepNumber: idx + 1,
    }))
  }, [])

  // Agora sim podemos retornar null com segurança após todos os hooks terem sido executados
  if (!isOpen || !lesson) return null

  const safeStageIndex = Math.min(
    Math.max(0, currentStageIndex),
    Math.max(0, activeStages.length - 1),
  )
  const currentStage = activeStages[safeStageIndex] || activeStages[0]

  const isFirstStage = safeStageIndex === 0
  const isLastStage = safeStageIndex === activeStages.length - 1

  const handlePrevStage = () => {
    if (safeStageIndex > 0) {
      setCurrentStageIndex(safeStageIndex - 1)
    }
  }

  const handleNextStage = () => {
    if (safeStageIndex < activeStages.length - 1) {
      setCurrentStageIndex(safeStageIndex + 1)
    } else {
      onClose()
    }
  }

  const progressPercent =
    activeStages.length > 0 ? Math.round(((safeStageIndex + 1) / activeStages.length) * 100) : 100

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }))
    setRevealedFeedbacks((prev) => ({ ...prev, [questionId]: true }))
  }

  const handleResetQuiz = () => {
    setSelectedAnswers({})
    setRevealedFeedbacks({})
  }

  return (
    <div className="fixed inset-0 z-[70] bg-[#0F1B2F]/95 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* 1. BARRA SUPERIOR DE PRÉ-VISUALIZAÇÃO DO ALUNO */}
      <header className="bg-[#0A1220] border-b border-[#C59E5D]/40 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg select-none">
        {/* Esquerda: Identificação do Modo Pré-visualização */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-[#C59E5D] text-[#0F1B2F] shadow-sm shrink-0">
            <Eye className="w-5 h-5 text-[#0F1B2F]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#C59E5D] text-[#0F1B2F]">
                Visão do Aluno
              </span>
              <span className="text-xs text-[#EADBBE] font-bold hidden md:inline">
                Simulação em Tempo Real
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate mt-0.5">
              Modo Pré-visualização — Você está visualizando esta aula exatamente como seu estudante
            </p>
          </div>
        </div>

        {/* Direita: Seletor de Idioma (PT | EN | ES) e Botão Voltar para Edição */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* Seletor de Idioma da Pré-visualização */}
          <div className="flex items-center gap-1 p-1 bg-[#162338] rounded-xl border border-[#C59E5D]/30 shadow-inner">
            <Languages className="w-3.5 h-3.5 text-[#C59E5D] ml-1.5 mr-0.5 hidden sm:inline" />
            <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline mr-1">
              Idioma:
            </span>
            <button
              type="button"
              onClick={() => setPreviewLang('pt')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewLang === 'pt'
                  ? 'bg-[#C59E5D] text-[#0F1B2F] shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Testar em Português"
            >
              PT
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewLang === 'en'
                  ? 'bg-[#C59E5D] text-[#0F1B2F] shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Testar em Inglês (EN)"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang('es')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewLang === 'es'
                  ? 'bg-[#C59E5D] text-[#0F1B2F] shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Testar em Espanhol (ES)"
            >
              ES
            </button>
          </div>

          {/* Botão "Voltar para Edição" */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] shadow-md shadow-[#C59E5D]/25 transition-all transform active:scale-95 cursor-pointer"
            title="Voltar para Edição"
          >
            <ArrowLeft className="w-4 h-4 text-[#0F1B2F]" />
            <span>Voltar para Edição</span>
          </button>
        </div>
      </header>

      {/* 2. ÁREA CENTRAL SCROLLÁVEL DA SALA DE AULA DO ALUNO */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FAF8F2] space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Breadcrumb e Título da Aula */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="font-bold text-[#0F1B2F]">{courseTitle || 'Hemingway School'}</span>
              <span>•</span>
              <span className="text-blue-700 font-semibold">{disciplineName || 'Disciplina do Módulo'}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C59E5D]/20 text-[#0F1B2F] border border-[#C59E5D]/40">
                Aula {sequenceOrder}
              </span>
              <span>•</span>
              <span className="text-slate-400">
                Testando em: <strong className="text-[#0F1B2F]">{previewLang.toUpperCase()}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F1B2F] tracking-tight">
              {lessonTitle}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C59E5D]" />
                <span>Duração estimada: {durationMinutes} min</span>
              </span>
              <span>•</span>
              <span>Professor: Leonardo Dias</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                AVA Hemingway School
              </span>
            </div>
          </div>

          {/* 1. BARRA DE PROGRESSO E TRILHA PAGINADA NO TOPO DA AULA (SIMULAÇÃO) */}
          <div className="bg-white rounded-3xl border-2 border-[#C59E5D]/40 p-4 sm:p-5 shadow-sm space-y-4">
            {/* Topo: Etapa X de Y e Porcentagem */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-2xl bg-[#0F1B2F] text-[#C59E5D] font-extrabold text-sm flex items-center justify-center shadow-xs border border-[#C59E5D]/30">
                  {currentStage.stepNumber}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase text-[#C59E5D] tracking-wider block">
                      Etapa {currentStage.stepNumber} de {activeStages.length}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                      {currentStage.description}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0F1B2F] mt-0.5">
                    {currentStage.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                  Progresso Simulado:
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#C59E5D]/20 text-[#0F1B2F] border border-[#C59E5D]/40 font-mono">
                  {progressPercent}% Concluído
                </span>
              </div>
            </div>

            {/* Barra de Progresso Visual */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#C59E5D] via-[#B38C4B] to-[#0F1B2F] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Pílulas/Abas das Etapas Ativas (clicáveis para navegação direta) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">
                Etapas da Trilha:
              </span>
              {activeStages.map((stage, idx) => {
                const isActive = idx === safeStageIndex
                const isCompletedBefore = idx < safeStageIndex
                const StageIcon = stage.icon

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setCurrentStageIndex(idx)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md shadow-[#0F1B2F]/20 border border-[#C59E5D]'
                        : isCompletedBefore
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {isCompletedBefore ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <StageIcon
                        className={`w-3.5 h-3.5 ${isActive ? 'text-[#C59E5D]' : 'text-slate-500'}`}
                      />
                    )}
                    <span>
                      {stage.stepNumber}. {stage.shortTitle}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. CONTEÚDO DA ETAPA ATUAL */}

          {/* PÁGINA 1 — VÍDEO AULA */}
          {currentStage.id === 'video' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {hasVideo && youtubeId ? (
                <div className="relative aspect-video w-full rounded-3xl bg-slate-950 overflow-hidden shadow-2xl border-2 border-[#0F1B2F] flex items-center justify-center">
                  <iframe
                    className="w-full h-full border-0 rounded-3xl"
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&enablejsapi=1`}
                    title={lessonTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
                  <Play className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Nenhum vídeo cadastrado nesta aula
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Insira a URL de um vídeo do YouTube no formulário para disponibilizar a aula em vídeo aos alunos, ou avance para a próxima etapa.
                  </p>
                </div>
              )}

              {/* Card de Resumo Pedagógico e Objetivo da Lição */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Objetivo Pedagógico da Lição
                  </h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Capacitar trabalhadores imigrantes com conteúdo visual e prático, preparando-os para as próximas etapas de leitura e avaliação.
                </p>
                <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#C59E5D]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold text-[#0F1B2F]">Navegação Guiada:</span>
                    <span>
                      Ao concluir o vídeo, clique em &quot;Próxima Página&quot; para avançar aos slides Gamma e apostila.
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleNextStage}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#C59E5D] hover:underline cursor-pointer shrink-0"
                  >
                    <span>Avançar para Slides ➡️</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PÁGINA 2 — APRESENTAÇÃO DE SLIDES & APOSTILA */}
          {currentStage.id === 'slides_apostila' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Seletor interno: Slides vs Apostila */}
              {hasSlides && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white rounded-2xl border-2 border-[#C59E5D]/40 shadow-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase text-[#0F1B2F] px-2.5 py-1 bg-[#C59E5D]/20 rounded-lg">
                      Material da Etapa 2:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubTabSlidesApostila('slides')}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        subTabSlidesApostila === 'slides'
                          ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md border border-[#C59E5D]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Presentation className="w-3.5 h-3.5 text-[#C59E5D]" />
                      <span>Apresentação de Slides (Gamma.app)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubTabSlidesApostila('apostila')}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        subTabSlidesApostila === 'apostila'
                          ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md border border-[#C59E5D]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-[#C59E5D]" />
                      <span>Apostila & Material Oficial</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-Aba 1: Apresentação de Slides */}
              {subTabSlidesApostila === 'slides' && hasSlides && (
                <SlideViewer
                  slidesUrl={resolvedSlideUrl || slidesUrl}
                  slidesUrlPt={slidesUrlPt || undefined}
                  slidesUrlEn={slidesUrlEn || undefined}
                  slidesUrlEs={slidesUrlEs || undefined}
                  preferredLanguage={previewLang}
                  lessonTitle={lessonTitle}
                />
              )}

              {/* Sub-Aba 2: Apostila Oficial (PDF ou Texto) */}
              {(subTabSlidesApostila === 'apostila' || !hasSlides) && (
                <div>
                  {hasPdf && pdfUrl ? (
                    <div className="rounded-3xl overflow-hidden border-2 border-[#0F1B2F] bg-white shadow-2xl ring-2 ring-[#C59E5D]/40">
                      <div className="bg-[#0F1B2F] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#C59E5D]/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-[#C59E5D]/20 text-[#C59E5D]">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#C59E5D] text-[#0F1B2F]">
                              Material Oficial
                            </span>
                            <p className="text-xs font-bold text-[#FAF8F2] truncate mt-0.5 font-mono">
                              {pdfName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1C2E4A] hover:bg-[#253e63] text-[#FAF8F2] border border-[#C59E5D]/40 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#C59E5D]" />
                            <span>Abrir em Nova Guia</span>
                          </a>
                          <a
                            href={pdfUrl}
                            download={pdfName}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] shadow-sm transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Baixar Apostila</span>
                          </a>
                        </div>
                      </div>

                      <div className="w-full bg-slate-900" style={{ height: '700px' }}>
                        <iframe
                          src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                          className="w-full h-full border-0"
                          title="Apostila"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>Conteúdo da Lição (Apostila em Texto)</span>
                        </span>
                        <span className="text-xs text-blue-600 font-medium">
                          Idioma: {previewLang.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-slate-50/70 p-5 rounded-2xl border border-slate-100 font-sans">
                        {contentText || 'Nenhum texto ou slide cadastrado para esta lição ainda.'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PÁGINA 3 — LINKS ÚTEIS & MATERIAIS COMPLEMENTARES */}
          {currentStage.id === 'links_materiais' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-[#C59E5D]/40 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-[#C59E5D]/20 text-[#0F1B2F]">
                      <Link2 className="w-4 h-4 text-[#C59E5D]" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#0F1B2F] text-base sm:text-lg">
                        Links Úteis & Materiais Complementares
                      </h3>
                      <p className="text-xs text-slate-500">
                        Documentação oficial, fontes governamentais e ferramentas complementares recomendadas
                      </p>
                    </div>
                  </div>

                  {usefulLinks.length > 0 && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FAF8F2] text-[#0F1B2F] border border-[#C59E5D]/40 self-start sm:self-auto">
                      {usefulLinks.length}{' '}
                      {usefulLinks.length === 1 ? 'link disponível' : 'links disponíveis'}
                    </span>
                  )}
                </div>

                {/* Grid de Links Úteis */}
                {usefulLinks.length === 0 ? (
                  <div className="p-10 text-center bg-[#FAF8F2]/60 rounded-3xl border border-dashed border-[#C59E5D]/40 space-y-2">
                    <Link2 className="w-8 h-8 text-[#C59E5D]/60 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800">
                      Nenhum link complementar cadastrado para esta aula
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Clique em &quot;Próxima Página ➡️&quot; abaixo para prosseguir diretamente para a avaliação da aula.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {usefulLinks.map((link, idx) => {
                      const safeUrl = String(link.url || '#')
                      const safeTitle = String(link.title || safeUrl)
                      return (
                        <a
                          key={link.id || idx}
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group p-5 rounded-2xl bg-[#FAF8F2] hover:bg-white border-2 border-slate-200 hover:border-[#C59E5D] hover:shadow-lg transition-all flex flex-col justify-between gap-3 cursor-pointer text-left"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-bold text-sm sm:text-base text-[#0F1B2F] group-hover:text-[#B38C4B] transition-colors leading-snug">
                                {safeTitle}
                              </h4>
                              <span className="p-1.5 rounded-xl bg-white group-hover:bg-[#C59E5D] text-slate-400 group-hover:text-[#0F1B2F] border border-slate-200 group-hover:border-[#C59E5D] transition-all shadow-xs shrink-0">
                                <ExternalLink className="w-4 h-4" />
                              </span>
                            </div>

                            {link.description && (
                              <p className="text-xs text-slate-600 font-sans leading-relaxed line-clamp-3">
                                {link.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-400 group-hover:text-[#0F1B2F]">
                            <span className="truncate max-w-[260px] text-[11px]">
                              {safeUrl.replace(/^https?:\/\//i, '')}
                            </span>
                            <span className="text-xs font-bold text-[#C59E5D] group-hover:underline flex items-center gap-1 font-sans">
                              <span>Acessar</span>
                              <span>↗</span>
                            </span>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                )}

                {/* Materiais Anexados (se houver) */}
                {materials.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Materiais Complementares Anexados
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {materials.map((item, mIdx) => (
                        <div
                          key={item?.id || mIdx}
                          className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-slate-800 truncate">
                                {item?.name || item?.title || 'Material Complementar'}
                              </p>
                              <p className="text-[11px] text-slate-400">{item?.size || ''}</p>
                            </div>
                          </div>
                          {item?.url && item.url !== '#' && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:border-blue-400 transition"
                            >
                              Abrir
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PÁGINA 4 — AVALIAÇÃO / QUIZ FINAL */}
          {currentStage.id === 'avaliacao_quiz' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Modalidade Google Drive ou Google Forms */}
              {examDriveUrl &&
                (() => {
                  const driveEmbed = formatGoogleDriveEmbedUrl(examDriveUrl)

                  return (
                    <div className="p-5 sm:p-6 bg-white rounded-3xl border-2 border-[#C59E5D]/40 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-2xl bg-[#0F1B2F] text-[#C59E5D]">
                            <ExternalLink className="w-5 h-5 text-[#C59E5D]" />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-extrabold text-[#0F1B2F] flex items-center gap-2">
                              <span>
                                {driveEmbed?.isForm
                                  ? 'Avaliação Oficial via Google Forms'
                                  : 'Avaliação no Google Drive'}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C59E5D] text-[#0F1B2F]">
                                {driveEmbed?.isForm ? 'Formulário' : 'Documento'}
                              </span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Preencha a avaliação oficial online ou visualize o documento interativo incorporado abaixo.
                            </p>
                          </div>
                        </div>

                        <a
                          href={examDriveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] border border-[#C59E5D]/50 transition shadow-sm cursor-pointer self-start sm:self-auto shrink-0"
                        >
                          <span>
                            Abrir Avaliação no {driveEmbed?.isForm ? 'Google Forms' : 'Google Drive'}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#C59E5D]" />
                        </a>
                      </div>

                      {driveEmbed?.embedUrl && (
                        <div
                          className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner"
                          style={{ height: '650px' }}
                        >
                          <iframe
                            src={driveEmbed.embedUrl}
                            className="w-full h-full border-0"
                            title="Avaliação Google Drive / Forms"
                          />
                        </div>
                      )}
                    </div>
                  )
                })()}

              {/* Quiz Interativo Nativo (AVA) */}
              {isLoadingQuiz ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-500 bg-white rounded-3xl border border-slate-200">
                  Carregando simulado e questões da aula...
                </div>
              ) : quizQuestions.length > 0 ? (
                <div className="space-y-5">
                  <div className="p-5 bg-white rounded-3xl border-2 border-[#C59E5D]/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-[#0F1B2F] text-[#C59E5D]">
                        <Award className="w-6 h-6 text-[#C59E5D]" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-[#0F1B2F]">
                          {quizTitle}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Teste as alternativas e verifique o gabarito comentado com a justificativa pedagógica.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetQuiz}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reiniciar Respostas</span>
                      </button>
                    </div>
                  </div>

                    <div className="space-y-5">
                      {quizQuestions.map((q, qIndex) => {
                        const qId = String(q?.id || `q-${qIndex}`)
                        const qOptions = Array.isArray(q?.options) ? q.options : []
                        const selectedOptId = selectedAnswers[qId]
                        const isAnswered = Boolean(selectedOptId || revealedFeedbacks[qId])
                        const selectedOption = qOptions.find((opt) => opt?.id === selectedOptId)
                        const isCorrect = selectedOption?.is_correct ?? false

                        return (
                          <div
                            key={qId}
                            className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-4"
                          >
                            {/* Enunciado da Questão */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <span className="w-7 h-7 rounded-xl bg-[#0F1B2F] text-[#C59E5D] text-xs font-extrabold flex items-center justify-center shrink-0">
                                  {qIndex + 1}
                                </span>
                                <div>
                                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Questão {qIndex + 1} • {q?.points || 5} Pontos
                                  </span>
                                  <p className="text-sm sm:text-base font-bold text-[#0F1B2F] mt-1 leading-snug">
                                    {q?.statement || ''}
                                  </p>
                                </div>
                              </div>

                              {isAnswered && (
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-red-100 text-red-800 border border-red-300'
                                  }`}
                                >
                                  {isCorrect ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Acertou</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                                      <span>Incorreta</span>
                                    </>
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Alternativas (A a E) */}
                            <div className="space-y-2.5 pt-1">
                              {qOptions.map((opt, optIdx) => {
                                const optId = String(opt?.id || `opt-${qIndex}-${optIdx}`)
                                const isSelected = selectedOptId === optId
                                let buttonStyle =
                                  'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'

                                if (isAnswered) {
                                  if (opt?.is_correct) {
                                    buttonStyle =
                                      'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold ring-1 ring-emerald-300'
                                  } else if (isSelected && !opt?.is_correct) {
                                    buttonStyle =
                                      'bg-red-50 border-red-400 text-red-900 line-through'
                                  }
                                } else if (isSelected) {
                                  buttonStyle =
                                    'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-200'
                                }

                                return (
                                  <button
                                    key={optId}
                                    type="button"
                                    onClick={() => handleSelectOption(qId, optId)}
                                    className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm flex items-center gap-3 transition-all cursor-pointer ${buttonStyle}`}
                                  >
                                    <span
                                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                        isSelected
                                          ? 'bg-[#0F1B2F] text-[#C59E5D]'
                                          : 'bg-white border border-slate-300 text-slate-700'
                                      }`}
                                    >
                                      {opt?.option_letter || String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span className="flex-1">{opt?.text || ''}</span>
                                    {isAnswered && opt?.is_correct && (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>

                            {/* Gabarito Comentado e Justificativa Pedagógica */}
                            {isAnswered && (
                              <div className="p-4 rounded-2xl bg-[#FAF8F2] border-2 border-[#C59E5D]/40 space-y-1.5 animate-in fade-in duration-150">
                                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F1B2F] uppercase tracking-wide">
                                  <BookOpen className="w-4 h-4 text-[#C59E5D]" />
                                  <span>Gabarito Comentado & Feedback Pedagógico</span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                  {q?.feedback ||
                                    'A alternativa correta alinha-se com a diretriz federal estabelecida no currículo de imigrantes da Hemingway School.'}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
              ) : (
                !examDriveUrl && (
                  <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
                    <Award className="w-10 h-10 text-slate-400 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">
                      Nenhuma avaliação / quiz vinculada a esta aula ou disciplina
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Cadastre ou importe uma prova na aba &quot;Avaliações &amp; Quizzes&quot; vinculada a esta disciplina ou aula para que as questões apareçam aqui automaticamente.
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {/* 3. BARRA DE NAVEGAÇÃO INFERIOR ("PÁGINA ANTERIOR" E "PRÓXIMA PÁGINA") */}
          <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md rounded-3xl border-2 border-[#0F1B2F] p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Esquerda: Botão Página Anterior */}
            <div className="w-full sm:w-auto">
              {!isFirstStage ? (
                <button
                  type="button"
                  onClick={handlePrevStage}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>⬅️ Página Anterior</span>
                </button>
              ) : (
                <div className="text-xs text-slate-400 font-medium hidden sm:block">
                  Início da Trilha de Aprendizado
                </div>
              )}
            </div>

            {/* Centro: Indicador de Etapa / Bolinhas de Navegação */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="text-[#0F1B2F]">
                Etapa {currentStage.stepNumber} de {activeStages.length}
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                {activeStages.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentStageIndex(dotIdx)}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      dotIdx === safeStageIndex
                        ? 'w-6 bg-[#C59E5D]'
                        : dotIdx < safeStageIndex
                          ? 'w-2.5 bg-emerald-500 hover:opacity-80'
                          : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                    }`}
                    title={`Ir para etapa ${dotIdx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Direita: Botão Próxima Página ou Voltar para Edição */}
            <div className="w-full sm:w-auto">
              {!isLastStage ? (
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] border border-[#C59E5D]/60 shadow-lg shadow-[#0F1B2F]/20 transition-all cursor-pointer transform active:scale-95"
                >
                  <span>
                    Próxima Página: {activeStages[safeStageIndex + 1]?.shortTitle || ''}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#C59E5D]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] shadow-lg shadow-[#C59E5D]/30 transition-all cursor-pointer transform active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#0F1B2F]" />
                  <span>Voltar para Edição ✔️</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
