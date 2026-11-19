import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  Languages,
  Subtitles,
  Database,
  ExternalLink,
  Award,
  Pencil,
  Link2,
  Presentation,
  Play,
  RotateCcw,
  BookOpen,
  Sparkles,
  Loader2,
} from 'lucide-react'
import type { Lesson, SupabaseLesson, UserProfile, UsefulLink, AssessmentQuestion } from '../../types'
import type { SupportedLanguageCode } from '../../locales/i18n'
import { lessonService, extractYouTubeId, formatGoogleDriveEmbedUrl } from '../../services/lessonService'
import { assessmentService } from '../../services/assessmentService'
import { extractTextFromGoogleDrivePdf } from '../../utils/pdfExtractor'
import { parseHemingwayExamText } from '../../utils/quizParser'
import { CompletionStatementModal } from '../../components/certificate/CompletionStatementModal'
import { LessonEditModal } from '../teacher/components/LessonEditModal'
import { SlideViewer } from './components/SlideViewer'

interface LessonViewProps {
  lesson: Lesson
  user?: UserProfile
  onBackToDashboard: () => void
}

export const LessonView: React.FC<LessonViewProps> = ({ lesson, user, onBackToDashboard }) => {
  const { t, i18n } = useTranslation()
  const currentLang = (i18n.language?.slice(0, 2) as SupportedLanguageCode) || 'pt'
  const [isCompleted, setIsCompleted] = useState(lesson.isCompleted)
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const canEdit = user?.role === 'admin' || user?.role === 'teacher'

  // Estado da aula real do Supabase
  const [supabaseLesson, setSupabaseLesson] = useState<SupabaseLesson | null>(null)

  useEffect(() => {
    lessonService.getLessonsWithStatus().then((res) => {
      if (res.data && res.data.length > 0) {
        // Encontra a aula requisitada ou seleciona a primeira
        const targetLesson =
          res.data.find((l) =>
            l.title.toLowerCase().includes('compreendendo o formulário w-2'),
          ) || res.data[0]

        setSupabaseLesson(targetLesson)
      }
    })
  }, [])

  // Título e dados prioritários vindos do Supabase
  const currentTitle = supabaseLesson
    ? supabaseLesson.title
    : lesson.title[currentLang] || lesson.title.en

  const moduleTitle = lesson.moduleTitle[currentLang] || lesson.moduleTitle.en
  const transcriptionText = supabaseLesson?.content_text || lesson.transcription[currentLang] || lesson.transcription.en
  const instructorRole = lesson.instructor.role[currentLang] || lesson.instructor.role.en

  // Extração do ID do YouTube a partir da URL da aula do Supabase
  const rawVideoUrl = supabaseLesson?.video_url ?? (lesson.videoUrl || '')
  const hasVideo = Boolean(rawVideoUrl && rawVideoUrl.trim().length > 0)
  const videoUrl = hasVideo ? rawVideoUrl : ''
  const youtubeId = hasVideo ? (supabaseLesson?.video_youtube_id || extractYouTubeId(videoUrl)) : null

  // Material em PDF oficial da aula (Supabase Storage)
  const pdfUrl =
    supabaseLesson?.pdf_url ||
    lesson.pdf_url ||
    lesson.materials.find((m) => m.type === 'pdf' && m.url && m.url !== '#')?.url ||
    null
  const pdfName =
    supabaseLesson?.pdf_name ||
    lesson.pdf_name ||
    lesson.materials.find((m) => m.type === 'pdf')?.title ||
    'Material-Oficial-Aula.pdf'

  // Apresentação de Slides oficial da aula (Gamma, Canva, Google Slides, PPTX ou PDF)
  const slidesUrl =
    supabaseLesson?.slides_url ||
    lesson.slides_url ||
    lesson.materials?.find((m) => m.type === 'slides' && m.url && m.url !== '#')?.url ||
    null
  const slidesUrlPt = supabaseLesson?.slides_url_pt || lesson.slides_url_pt || slidesUrl || null
  const slidesUrlEn = supabaseLesson?.slides_url_en || lesson.slides_url_en || null
  const slidesUrlEs = supabaseLesson?.slides_url_es || lesson.slides_url_es || null
  const hasSlides = Boolean(slidesUrl || slidesUrlPt || slidesUrlEn || slidesUrlEs)

  // Avaliação Oficial da Aula (Link de PDF do Google Drive lido automaticamente via pdfjs-dist)
  const examDriveUrl = (supabaseLesson?.exam_drive_url || lesson.exam_drive_url || '').trim()
  const { embedUrl: examEmbedUrl, isForm: isGoogleFormUrl } = formatGoogleDriveEmbedUrl(examDriveUrl)
  const isDrivePdfOrDocUrl =
    Boolean(examDriveUrl) &&
    !isGoogleFormUrl &&
    (examDriveUrl.includes('drive.google.com') ||
      examDriveUrl.includes('docs.google.com/document') ||
      examDriveUrl.toLowerCase().includes('.pdf'))

  const [quizQuestions, setQuizQuestions] = useState<AssessmentQuestion[]>([])
  const [isLoadingDriveQuiz, setIsLoadingDriveQuiz] = useState<boolean>(false)
  const [driveQuizError, setDriveQuizError] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false)
  const [isSavingResult, setIsSavingResult] = useState<boolean>(false)
  const [resultSavedInDb, setResultSavedInDb] = useState<boolean>(false)
  const [attemptsUsed, setAttemptsUsed] = useState<number>(0)
  const maxAttempts = 3

  useEffect(() => {
    setQuizQuestions([])
    setSelectedAnswers({})
    setIsQuizSubmitted(false)
    setResultSavedInDb(false)
    setAttemptsUsed(0)
    setDriveQuizError(null)

    if (!examDriveUrl || !isDrivePdfOrDocUrl) {
      setIsLoadingDriveQuiz(false)
      return
    }

    let isActive = true
    setIsLoadingDriveQuiz(true)

    extractTextFromGoogleDrivePdf(examDriveUrl)
      .then((res) => {
        if (!isActive) return
        if (res.text && res.text.trim().length > 20) {
          const parsed = parseHemingwayExamText(res.text)
          if (parsed.questions.length > 0) {
            setQuizQuestions(parsed.questions)
            setDriveQuizError(null)
            return
          }
        }
        setQuizQuestions([])
        setDriveQuizError(
          res.error ||
            'Não foi possível identificar questões no formato padrão (Questão 1, A), B), C), D), E) e Gabarito:) neste PDF do Google Drive.',
        )
      })
      .catch((err) => {
        if (!isActive) return
        setQuizQuestions([])
        setDriveQuizError(String(err))
      })
      .finally(() => {
        if (isActive) setIsLoadingDriveQuiz(false)
      })

    return () => {
      isActive = false
    }
  }, [examDriveUrl, isDrivePdfOrDocUrl])

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isQuizSubmitted) return
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  const totalQuestionsCount = quizQuestions.length
  const answeredQuestionsCount = quizQuestions.filter((q, idx) => {
    const qId = String(q?.id || `q-${idx}`)
    return Boolean(selectedAnswers[qId])
  }).length

  const correctAnswersCount = quizQuestions.reduce((acc, q, idx) => {
    const qId = String(q?.id || `q-${idx}`)
    const selId = selectedAnswers[qId]
    const qOptions = Array.isArray(q?.options) ? q.options : []
    const isRight = qOptions.some(
      (opt, oIdx) => String(opt?.id || `opt-${idx}-${oIdx}`) === selId && opt?.is_correct,
    )
    return acc + (isRight ? 1 : 0)
  }, 0)

  const calculatedScoreNumber =
    totalQuestionsCount > 0
      ? Number(((correctAnswersCount / totalQuestionsCount) * 10).toFixed(1))
      : 0
  const formattedScoreText = calculatedScoreNumber.toFixed(1).replace('.', ',')

  const handleFinalizeQuiz = async () => {
    const nextAttempt = attemptsUsed + 1
    setAttemptsUsed(nextAttempt)
    setIsQuizSubmitted(true)
    setIsSavingResult(true)
    try {
      await assessmentService.saveQuizAttemptResult({
        lesson_id: supabaseLesson?.id || lesson.id,
        discipline_id: supabaseLesson?.discipline_id || (lesson as any).discipline_id,
        course_id: supabaseLesson?.course_id || (lesson as any).course_id,
        student_id: user?.id,
        student_name: user?.name,
        score: calculatedScoreNumber,
        max_score: 10,
        correct_count: correctAnswersCount,
        total_questions: totalQuestionsCount,
        attempt_number: nextAttempt,
        answers: selectedAnswers,
      })
      setResultSavedInDb(true)
    } catch {
      // fallback silencioso
    } finally {
      setIsSavingResult(false)
    }
  }

  const handleResetQuiz = () => {
    if (attemptsUsed >= maxAttempts) return
    setSelectedAnswers({})
    setIsQuizSubmitted(false)
    setResultSavedInDb(false)
  }

  // Links Úteis e Materiais Complementares da aula
  const usefulLinks: UsefulLink[] =
    supabaseLesson?.useful_links && Array.isArray(supabaseLesson.useful_links)
      ? supabaseLesson.useful_links
      : lesson.useful_links && Array.isArray(lesson.useful_links)
        ? lesson.useful_links
        : []

  // Definição da Trilha Paginada Passo a Passo (Etapas Sequenciais)
  const activeStages = useMemo(() => {
    const stages: {
      id: 'video' | 'slides_apostila' | 'links_materiais' | 'avaliacao_quiz'
      title: string
      shortTitle: string
      description: string
      icon: React.ComponentType<{ className?: string }>
    }[] = []

    // Página 1 — Vídeo Aula: Exibe exclusivamente o player de vídeo da aula em destaque
    if (hasVideo && youtubeId) {
      stages.push({
        id: 'video',
        title: 'Página 1 — Vídeo Aula',
        shortTitle: 'Vídeo Aula',
        description: 'Assista à videoaula do professor com exemplos e diretrizes práticas.',
        icon: Play,
      })
    }

    // Página 2 — Apresentação de Slides & Apostila
    if (hasSlides || pdfUrl || (transcriptionText && transcriptionText.trim().length > 0) || stages.length === 0) {
      stages.push({
        id: 'slides_apostila',
        title: 'Página 2 — Apresentação de Slides & Apostila',
        shortTitle: 'Slides & Apostila',
        description: 'Acesse a apresentação de slides da aula e leia a apostila oficial do curso.',
        icon: Presentation,
      })
    }

    // Página 3 — Links Úteis & Materiais Complementares
    if (usefulLinks.length > 0 || (lesson.materials && lesson.materials.length > 0)) {
      stages.push({
        id: 'links_materiais',
        title: 'Página 3 — Links Úteis & Materiais Complementares',
        shortTitle: 'Links & Materiais',
        description: 'Acesse artigos oficiais, referências do IRS e documentação complementar.',
        icon: Link2,
      })
    }

    // Página 4 — Avaliação Oficial da Aula
    stages.push({
      id: 'avaliacao_quiz',
      title: 'Página 4 — Avaliação Oficial da Aula',
      shortTitle: 'Avaliação & Prova',
      description: 'Realize a avaliação oficial desta aula.',
      icon: Award,
    })

    return stages.map((st, idx) => ({
      ...st,
      stepNumber: idx + 1,
    }))
  }, [hasVideo, youtubeId, hasSlides, pdfUrl, transcriptionText, usefulLinks.length, lesson.materials])

  // Controle de Navegação da Trilha Paginada
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0)
  const safeStageIndex = Math.min(Math.max(0, currentStageIndex), Math.max(0, activeStages.length - 1))
  const currentStage = activeStages[safeStageIndex] || activeStages[0]

  const isFirstStage = safeStageIndex === 0
  const isLastStage = safeStageIndex === activeStages.length - 1

  // Alternador interno de visualização da Página 2 (Slides vs Apostila)
  const [subTabSlidesApostila, setSubTabSlidesApostila] = useState<'slides' | 'apostila'>(
    hasSlides ? 'slides' : 'apostila',
  )

  useEffect(() => {
    if (hasSlides) {
      setSubTabSlidesApostila('slides')
    } else {
      setSubTabSlidesApostila('apostila')
    }
  }, [hasSlides, pdfUrl])

  const handlePrevStage = () => {
    if (safeStageIndex > 0) {
      setCurrentStageIndex(safeStageIndex - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNextStage = () => {
    if (safeStageIndex < activeStages.length - 1) {
      setCurrentStageIndex(safeStageIndex + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Concluir Aula e Avançar na última página
      setIsCompleted(true)
      setIsStatementModalOpen(true)
    }
  }

  const progressPercent = activeStages.length > 0
    ? Math.round(((safeStageIndex + 1) / activeStages.length) * 100)
    : 100

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F1B2F] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-[#C59E5D] animate-in slide-in-from-top-4 duration-200">
          <Database className="w-4 h-4 text-[#C59E5D]" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Barra de Navegação da Aula */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão "Editar esta Aula" (visível para Admin ou Professor) */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] border border-[#C59E5D] shadow-md shadow-[#C59E5D]/25 transition-all cursor-pointer"
              title="Editar título, vídeo, PDF ou conteúdo desta aula no Supabase"
            >
              <Pencil className="w-3.5 h-3.5 text-[#0F1B2F]" />
              <span>Editar esta Aula</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCompleted(!isCompleted)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs'
                : 'bg-[#0F1B2F] hover:bg-[#1C2E4A] text-white shadow-md shadow-[#0F1B2F]/20 border border-[#C59E5D]/40'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {isCompleted ? t('classroom.completedBadge') : t('classroom.markCompleted')}
            </span>
          </button>

          {/* Gatilho de Conclusão: Botão em Dourado (#C59E5D) com texto Azul Marinho (#0F1B2F) */}
          {isCompleted && (
            <button
              type="button"
              onClick={() => setIsStatementModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs font-bold shadow-md shadow-[#C59E5D]/30 transition-all cursor-pointer animate-in fade-in"
            >
              <Award className="w-4 h-4 text-[#0F1B2F]" />
              <span>{t('classroom.issueStatement')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Títulos e Identificação da Aula */}
      <div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-2">
          {moduleTitle}
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {currentTitle}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span>{t('classroom.duration')}: {supabaseLesson?.duration_minutes || 24} min</span>
          <span>•</span>
          <span>Prof. Leonardo Dias ({instructorRole})</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
            <Languages className="w-3.5 h-3.5" />
            Suporte nativo PT / EN / ES
          </span>
        </div>
      </div>

      {/* 1. BARRA DE PROGRESSO E TRILHA PAGINADA NO TOPO DA AULA */}
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
              Progresso da Aula:
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
                onClick={() => {
                  setCurrentStageIndex(idx)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
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
                  <StageIcon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C59E5D]' : 'text-slate-500'}`} />
                )}
                <span>
                  {stage.stepNumber}. {stage.shortTitle}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. CONTEÚDO EXCLUSIVO DA ETAPA ATUAL */}

      {/* PÁGINA 1 — VÍDEO AULA */}
      {currentStage.id === 'video' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {hasVideo && youtubeId ? (
            <div className="relative aspect-video w-full rounded-3xl bg-slate-950 overflow-hidden shadow-2xl border-2 border-[#0F1B2F] flex items-center justify-center">
              <iframe
                className="w-full h-full border-0 rounded-3xl"
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&enablejsapi=1`}
                title={currentTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
              <Play className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Nenhum vídeo cadastrado nesta aula</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Esta aula não possui vídeo gravado. Clique em "Próxima Página ➡️" para acessar os slides e a apostila.
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
                Objetivo & Ementa Pedagógica da Lição
              </h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Capacitar trabalhadores imigrantes a entender seus direitos fundamentais no ambiente corporativo norte-americano, prevenir a exploração salarial e dominar a declaração fiscal entre W-2 e 1099 perante o IRS.
            </p>
            <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#C59E5D]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-[#0F1B2F]">Dica de Estudo:</span>
                <span>Assista com atenção e anote os pontos principais. Na próxima etapa, você terá os slides e a apostila completa.</span>
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
          {/* Seletor interno: Slides vs Apostila (quando ambos existem) */}
          {(hasSlides && (pdfUrl || (transcriptionText && transcriptionText.trim().length > 0))) && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#FAF8F2] border-2 border-[#C59E5D]/40 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase text-[#0F1B2F] px-2.5 py-1 bg-[#C59E5D]/20 rounded-lg">
                  Material da Etapa 2:
                </span>
                <button
                  type="button"
                  onClick={() => setSubTabSlidesApostila('slides')}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    subTabSlidesApostila === 'slides'
                      ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md border border-[#C59E5D]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Presentation className="w-3.5 h-3.5 text-[#C59E5D]" />
                  <span>Apresentação de Slides</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubTabSlidesApostila('apostila')}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    subTabSlidesApostila === 'apostila'
                      ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md border border-[#C59E5D]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-[#C59E5D]" />
                  <span>Apostila & Material de Estudo</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-Aba 1: Apresentação de Slides */}
          {subTabSlidesApostila === 'slides' && hasSlides && (
            <SlideViewer
              slidesUrl={slidesUrl || undefined}
              slidesUrlPt={slidesUrlPt || undefined}
              slidesUrlEn={slidesUrlEn || undefined}
              slidesUrlEs={slidesUrlEs || undefined}
              preferredLanguage={currentLang as 'pt' | 'en' | 'es'}
              lessonTitle={currentTitle}
            />
          )}

          {/* Sub-Aba 2: Apostila Oficial (PDF ou Texto) */}
          {(subTabSlidesApostila === 'apostila' || !hasSlides) && (
            <div>
              {pdfUrl ? (
                <div className="rounded-3xl overflow-hidden border-2 border-[#0F1B2F] bg-white shadow-2xl ring-2 ring-[#C59E5D]/40 transition-all">
                  <div className="bg-[#0F1B2F] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#C59E5D]/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-2xl bg-[#C59E5D]/20 border border-[#C59E5D]/50 text-[#C59E5D] shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#C59E5D] text-[#0F1B2F] shadow-xs">
                            Apostila Oficial
                          </span>
                          <span className="text-xs text-[#EADBBE]/90 truncate font-mono">
                            {pdfName}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-[#FAF8F2] truncate mt-0.5">
                          {currentTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1C2E4A] hover:bg-[#253e63] text-[#FAF8F2] border border-[#C59E5D]/40 transition-colors shadow-xs"
                        title="Abrir PDF em nova guia ou tela cheia"
                      >
                        <ExternalLink className="w-4 h-4 text-[#C59E5D]" />
                        <span>Abrir em Nova Guia</span>
                      </a>
                      <a
                        href={pdfUrl}
                        download={pdfName}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] shadow-md transition-colors"
                        title="Baixar Material em PDF"
                      >
                        <Download className="w-4 h-4" />
                        <span>Baixar Apostila (PDF)</span>
                      </a>
                    </div>
                  </div>

                  <div className="relative w-full bg-slate-900" style={{ height: '800px' }}>
                    <iframe
                      src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                      className="w-full h-full border-0"
                      title={pdfName}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Subtitles className="w-4 h-4 text-blue-600" />
                      <span>Conteúdo da Lição (Apostila em Texto)</span>
                    </span>
                    <span className="text-xs text-blue-600 font-medium">Idioma: {currentLang.toUpperCase()}</span>
                  </div>
                  <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-slate-50/70 p-5 rounded-2xl border border-slate-100 font-sans">
                    {transcriptionText || 'Nenhum texto cadastrado para esta lição.'}
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
                <div className="p-2.5 rounded-xl bg-[#C59E5D]/20 text-[#0F1B2F] border border-[#C59E5D]/40">
                  <Link2 className="w-5 h-5 text-[#C59E5D]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0F1B2F] text-base sm:text-lg">
                    Links Úteis & Materiais Complementares
                  </h3>
                  <p className="text-xs text-slate-500">
                    Documentação oficial, fontes governamentais e ferramentas externas recomendadas pelo instrutor
                  </p>
                </div>
              </div>

              {usefulLinks.length > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FAF8F2] text-[#0F1B2F] border border-[#C59E5D]/40 self-start sm:self-auto">
                  {usefulLinks.length} {usefulLinks.length === 1 ? 'link disponível' : 'links disponíveis'}
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
                  Clique em "Próxima Página ➡️" abaixo para prosseguir diretamente para a avaliação da aula.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usefulLinks.map((link, idx) => (
                  <a
                    key={link.id || idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-5 rounded-2xl bg-[#FAF8F2] hover:bg-white border-2 border-slate-200 hover:border-[#C59E5D] hover:shadow-lg transition-all flex flex-col justify-between gap-3 cursor-pointer text-left"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold text-sm sm:text-base text-[#0F1B2F] group-hover:text-[#B38C4B] transition-colors leading-snug">
                          {link.title}
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
                        {link.url.replace(/^https?:\/\//i, '')}
                      </span>
                      <span className="text-xs font-bold text-[#C59E5D] group-hover:underline flex items-center gap-1 font-sans">
                        <span>Acessar</span>
                        <span>↗</span>
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Anexos Adicionais da Aula (se houver) */}
            {lesson.materials && lesson.materials.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Anexos Adicionais para Consulta
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lesson.materials.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-800 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-400">{item.size}</p>
                        </div>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:border-blue-400 transition"
                      >
                        Baixar
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PÁGINA 4 — AVALIAÇÃO OFICIAL DA AULA */}
      {currentStage.id === 'avaliacao_quiz' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {!examDriveUrl ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
              <Award className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm sm:text-base font-bold text-[#0F1B2F]">
                Nenhuma avaliação vinculada a esta aula no momento.
              </h3>
            </div>
          ) : isLoadingDriveQuiz ? (
            <div className="p-12 text-center bg-white rounded-3xl border-2 border-[#C59E5D]/40 shadow-xs space-y-3">
              <Loader2 className="w-9 h-9 text-[#C59E5D] animate-spin mx-auto" />
              <h3 className="text-sm sm:text-base font-extrabold text-[#0F1B2F]">
                Lendo PDF da Avaliação e Preparando Quiz Interativo...
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Extraindo questões, alternativas (A a E) e gabarito comentado automaticamente via pdfjs-dist.
              </p>
            </div>
          ) : quizQuestions.length > 0 ? (
            <div className="space-y-5">
              {/* Cabeçalho Oficial da Avaliação da Aula */}
              <div className="p-5 sm:p-6 bg-white rounded-3xl border-2 border-[#C59E5D]/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-[#0F1B2F] text-[#C59E5D] shadow-xs border border-[#C59E5D]/40">
                    <Award className="w-6 h-6 text-[#C59E5D]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-extrabold text-[#0F1B2F]">
                        Avaliação Oficial da Aula
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#C59E5D] text-[#0F1B2F]">
                        {totalQuestionsCount} Questões Interativas
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Selecione uma alternativa para cada questão e clique em &quot;Finalizar Prova e Ver Nota&quot; ao final.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F2] text-[#0F1B2F] border border-[#C59E5D]/40">
                    Respondidas: {answeredQuestionsCount} / {totalQuestionsCount}
                  </span>
                  {isQuizSubmitted && attemptsUsed < maxAttempts && (
                    <button
                      type="button"
                      onClick={handleResetQuiz}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#0F1B2F] bg-[#C59E5D] hover:bg-[#B38C4B] transition cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Refazer Avaliação</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card de Resultado e Nota Final (0 a 10) */}
              {isQuizSubmitted && (
                <div
                  className={`p-5 sm:p-6 rounded-3xl border-2 shadow-md animate-in fade-in duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    calculatedScoreNumber >= 7
                      ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950'
                      : 'bg-amber-50/90 border-amber-400 text-amber-950'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                          calculatedScoreNumber >= 7
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {calculatedScoreNumber >= 7
                          ? '✓ Aprovado na Avaliação'
                          : 'Atenção • Revisão Recomendada'}
                      </span>
                      <span className="text-xs font-bold opacity-80">
                        Tentativa {attemptsUsed} de {maxAttempts}
                      </span>
                      {resultSavedInDb && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white/80 text-slate-700 border border-slate-200">
                          ✓ Resultado salvo no Supabase
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg sm:text-xl font-extrabold text-[#0F1B2F]">
                      Nota: {formattedScoreText} / 10 — {correctAnswersCount} de{' '}
                      {totalQuestionsCount} acertos
                    </h4>
                    <p className="text-xs text-slate-700">
                      Confira abaixo a correção detalhada questão por questão e o{' '}
                      <strong>Gabarito Comentado</strong> oficial da Hemingway School.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {attemptsUsed < maxAttempts ? (
                      <button
                        type="button"
                        onClick={handleResetQuiz}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] border border-[#C59E5D]/50 shadow-sm transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-[#C59E5D]" />
                        <span>
                          Refazer Avaliação ({maxAttempts - attemptsUsed}{' '}
                          {maxAttempts - attemptsUsed === 1
                            ? 'tentativa restante'
                            : 'tentativas restantes'}
                          )
                        </span>
                      </button>
                    ) : (
                      <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/80 text-slate-700 border border-slate-300">
                        Limite de {maxAttempts} tentativas atingido
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Lista de Questões Interativas Clicáveis */}
              <div className="space-y-5">
                {quizQuestions.map((q, qIndex) => {
                  const qId = String(q?.id || `q-${qIndex}`)
                  const qOptions = Array.isArray(q?.options) ? q.options : []
                  const selectedOptId = selectedAnswers[qId]
                  const selectedOption = qOptions.find(
                    (opt, oIdx) => String(opt?.id || `opt-${qIndex}-${oIdx}`) === selectedOptId,
                  )
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
                              Questão {qIndex + 1} de {totalQuestionsCount}
                            </span>
                            <p className="text-sm sm:text-base font-bold text-[#0F1B2F] mt-1 leading-snug whitespace-pre-line">
                              {q?.statement || ''}
                            </p>
                          </div>
                        </div>

                        {isQuizSubmitted && (
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
                                <span>Correta</span>
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

                      {/* Alternativas Clicáveis (A a E) */}
                      <div className="space-y-2.5 pt-1">
                        {qOptions.map((opt, optIdx) => {
                          const optId = String(opt?.id || `opt-${qIndex}-${optIdx}`)
                          const isSelected = selectedOptId === optId
                          let buttonStyle =
                            'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'

                          if (isQuizSubmitted) {
                            if (opt?.is_correct) {
                              buttonStyle =
                                'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-300'
                            } else if (isSelected && !opt?.is_correct) {
                              buttonStyle =
                                'bg-red-50 border-2 border-red-400 text-red-900 line-through'
                            }
                          } else if (isSelected) {
                            buttonStyle =
                              'bg-[#FAF8F2] border-2 border-[#0F1B2F] text-[#0F1B2F] font-semibold ring-2 ring-[#C59E5D]/30'
                          }

                          return (
                            <button
                              key={optId}
                              type="button"
                              disabled={isQuizSubmitted}
                              onClick={() => handleSelectOption(qId, optId)}
                              className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm flex items-center gap-3 transition-all ${
                                isQuizSubmitted ? 'cursor-default' : 'cursor-pointer'
                              } ${buttonStyle}`}
                            >
                              <span
                                className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                                  isQuizSubmitted && opt?.is_correct
                                    ? 'bg-emerald-600 text-white'
                                    : isQuizSubmitted && isSelected && !opt?.is_correct
                                      ? 'bg-red-600 text-white'
                                      : isSelected
                                        ? 'bg-[#0F1B2F] text-[#C59E5D]'
                                        : 'bg-white border border-slate-300 text-slate-700'
                                }`}
                              >
                                {opt?.option_letter || String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1">{opt?.text || ''}</span>
                              {isQuizSubmitted && opt?.is_correct && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                              {isQuizSubmitted && isSelected && !opt?.is_correct && (
                                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Gabarito Comentado após a entrega */}
                      {isQuizSubmitted && (
                        <div className="p-4 rounded-2xl bg-[#FAF8F2] border-2 border-[#C59E5D]/40 space-y-1.5 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F1B2F] uppercase tracking-wide">
                            <BookOpen className="w-4 h-4 text-[#C59E5D]" />
                            <span>Gabarito Comentado &amp; Feedback Pedagógico</span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {q?.feedback ||
                              'A alternativa correta alinha-se com a diretriz operacional e técnica estabelecida no currículo oficial da Hemingway School.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Rodapé da Prova: Botão "Finalizar Prova e Ver Nota" (de 0 a 10) */}
              <div className="p-5 sm:p-6 bg-white rounded-3xl border-2 border-[#0F1B2F] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                {!isQuizSubmitted ? (
                  <>
                    <div className="text-center sm:text-left">
                      <h4 className="text-sm font-extrabold text-[#0F1B2F]">
                        Pronto para concluir sua Avaliação Oficial?
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Você respondeu <strong>{answeredQuestionsCount}</strong> de{' '}
                        <strong>{totalQuestionsCount}</strong> questões. Ao finalizar, sua nota (0 a 10) e o gabarito comentado serão exibidos imediatamente.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleFinalizeQuiz}
                      disabled={isSavingResult || totalQuestionsCount === 0}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] shadow-lg shadow-[#C59E5D]/30 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#0F1B2F]" />
                      <span>
                        {isSavingResult
                          ? 'Calculando Nota...'
                          : 'Finalizar Prova e Ver Nota'}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-center sm:text-left">
                      <h4 className="text-sm sm:text-base font-extrabold text-[#0F1B2F]">
                        Nota Final: {formattedScoreText} / 10 — {correctAnswersCount} de{' '}
                        {totalQuestionsCount} acertos
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Avaliação corrigida com Gabarito Comentado exibido em todas as questões acima.
                      </p>
                    </div>

                    {attemptsUsed < maxAttempts && (
                      <button
                        type="button"
                        onClick={handleResetQuiz}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] border border-[#C59E5D]/60 shadow-md transition-all cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-4 h-4 text-[#C59E5D]" />
                        <span>Refazer Avaliação</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : examEmbedUrl ? (
            <div className="space-y-3">
              {driveQuizError && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  {driveQuizError}
                </div>
              )}
              <div className="rounded-3xl overflow-hidden border-2 border-[#0F1B2F] bg-white shadow-2xl ring-2 ring-[#C59E5D]/40">
                <div className="bg-[#0F1B2F] text-white px-5 py-4 flex items-center justify-between gap-3 border-b border-[#C59E5D]/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#C59E5D]/20 border border-[#C59E5D]/50 text-[#C59E5D] shrink-0">
                      <Award className="w-5 h-5 text-[#C59E5D]" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#C59E5D] text-[#0F1B2F] shadow-xs">
                        Etapa 4 do AVA
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-[#FAF8F2] mt-0.5">
                        Avaliação Oficial da Aula
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-white min-h-[650px]">
                  <iframe
                    src={examEmbedUrl}
                    title="Avaliação Oficial da Aula"
                    className="w-full min-h-[650px] h-[720px] border-0"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
              <Award className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm sm:text-base font-bold text-[#0F1B2F]">
                Nenhuma avaliação vinculada a esta aula no momento.
              </h3>
            </div>
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
                onClick={() => {
                  setCurrentStageIndex(dotIdx)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
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

        {/* Direita: Botão Próxima Página ou Concluir Aula */}
        <div className="w-full sm:w-auto">
          {!isLastStage ? (
            <button
              type="button"
              onClick={handleNextStage}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] border border-[#C59E5D]/60 shadow-lg shadow-[#0F1B2F]/20 transition-all cursor-pointer transform active:scale-95"
            >
              <span>Próxima Página: {activeStages[safeStageIndex + 1]?.shortTitle || ''}</span>
              <ArrowRight className="w-4 h-4 text-[#C59E5D]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextStage}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] shadow-lg shadow-[#C59E5D]/30 transition-all cursor-pointer transform active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-[#0F1B2F]" />
              <span>Concluir Aula e Avançar ✔️</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de Conclusão de Estudos com Botão de Destaque */}
      {isCompleted && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F1B2F] via-[#1C2E4A] to-[#0A1220] border border-[#C59E5D]/40 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 animate-in slide-in-from-bottom-2">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C59E5D]/20 text-[#C59E5D] text-xs font-bold border border-[#C59E5D]/30">
              <Award className="w-3.5 h-3.5" />
              <span>{t('classroom.completedBadge')}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#FAF8F2]">
              Parabéns! Você completou os requisitos desta disciplina.
            </h3>
            <p className="text-xs sm:text-sm text-[#EADBBE]/90 max-w-xl">
              Sua Declaração Oficial de Conclusão da Hemingway School está pronta para emissão imediata, com validade profissional e acadêmica nos EUA.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsStatementModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs sm:text-sm font-bold shadow-lg shadow-[#C59E5D]/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer transform active:scale-95"
          >
            <Award className="w-4 h-4 text-[#0F1B2F]" />
            <span>{t('classroom.finishCourseAndIssue')}</span>
          </button>
        </div>
      )}

      {/* Modal Formal de Declaração de Conclusão (Suporte A4 / Impressão / PDF) */}
      <CompletionStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        studentName={user?.name || 'Mateo Silva Santos'}
        studentDocumentType={user?.document_type || 'Passaporte Internacional'}
        studentDocumentNumber={user?.document_number || 'USA-8839201'}
        courseTitle={currentTitle}
        completionDate={new Date().toISOString()}
        enrollmentId="HEM-2026-MAT-8849"
      />

      {/* Modal de Edição Completa da Aula (UPDATE no Supabase) */}
      <LessonEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lesson={
          supabaseLesson ||
          ({
            id: lesson.id,
            title: currentTitle,
            content_text: transcriptionText,
            video_url: videoUrl,
            sequence_order: 1,
            duration_minutes: 25,
            course_id: '',
            discipline_id: '',
            materials: [],
            pdf_url: pdfUrl || undefined,
            pdf_name: pdfName || undefined,
            exam_drive_url: examDriveUrl || undefined,
            useful_links: usefulLinks,
            created_at: new Date().toISOString(),
          } as SupabaseLesson)
        }
        onSaved={(updated) => {
          setSupabaseLesson(updated)
          showToast('Aula atualizada com sucesso!')
        }}
      />
    </div>
  )
}
