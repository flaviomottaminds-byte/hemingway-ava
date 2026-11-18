import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
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
  HelpCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react'
import type { Lesson, SupabaseLesson, UserProfile, UsefulLink, AssessmentQuestion } from '../../types'
import type { SupportedLanguageCode } from '../../locales/i18n'
import { lessonService, extractYouTubeId, formatGoogleDriveEmbedUrl } from '../../services/lessonService'
import { assessmentService } from '../../services/assessmentService'
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
  const initialHasPdf = Boolean(
    lesson.pdf_url ||
      lesson.materials?.some((m) => m.type === 'pdf' && m.url && m.url !== '#'),
  )
  const [activeTab, setActiveTab] = useState<
    'transcription' | 'overview' | 'resources' | 'useful_links' | 'notes' | 'slides'
  >(initialHasPdf ? 'overview' : 'transcription')
  const [isCompleted, setIsCompleted] = useState(lesson.isCompleted)
  const [userNote, setUserNote] = useState('')
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

  // Formato ativo de estudo do aluno: Sequência didática em 4 etapas
  // 1. Vídeo Aula | 2. Slides (Gamma / PDF) | 3. Apostila & Materiais | 4. Avaliação / Quiz
  const [activeMediaView, setActiveMediaView] = useState<'video' | 'slides' | 'pdf' | 'quiz'>('video')

  // Avaliação / Quiz da Aula (Nativo e Google Drive / Forms)
  const examDriveUrl = supabaseLesson?.exam_drive_url || lesson.exam_drive_url || ''
  const [quizQuestions, setQuizQuestions] = useState<AssessmentQuestion[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [revealedFeedbacks, setRevealedFeedbacks] = useState<Record<string, boolean>>({})
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false)

  // Carrega questões avaliativas específicas da aula ou disciplina
  useEffect(() => {
    const targetLessonId = supabaseLesson?.id || lesson.id
    const targetCourseId = supabaseLesson?.course_id || (lesson as any).course_id
    const targetDisciplineId = supabaseLesson?.discipline_id || (lesson as any).discipline_id

    setIsLoadingQuiz(true)
    assessmentService
      .getAssessments({ course_id: targetCourseId, discipline_id: targetDisciplineId })
      .then((assessments) => {
        let found = assessments.find((a) => a.lesson_id && a.lesson_id === targetLessonId)
        if (!found && assessments.length > 0) {
          found = assessments[0]
        }

        if (found && found.questions && found.questions.length > 0) {
          setQuizQuestions(found.questions)
        } else {
          // Questões formativas padrão de teste para visualização de simulado com gabarito comentado
          setQuizQuestions([
            {
              id: 'aula-q1',
              sequence_order: 1,
              statement:
                'Com base nos conteúdos e orientações apresentados nesta aula, qual é a principal diretriz a ser aplicada na prática profissional?',
              points: 5,
              feedback:
                'Gabarito Comentado Hemingway School: A alternativa B reflete a conformidade regulatória e a aplicação exata dos conceitos tributários e trabalhistas norte-americanos discutidos no material desta aula.',
              options: [
                {
                  id: 'aula-opt-1-a',
                  option_letter: 'A',
                  text: 'Ignorar as obrigações formais quando a remuneração for inferior ao piso estadual.',
                  is_correct: false,
                },
                {
                  id: 'aula-opt-1-b',
                  option_letter: 'B',
                  text: 'Manter a documentação fiscal e relatórios de horas estritamente alinhados às diretrizes oficiais do IRS e do Department of Labor.',
                  is_correct: true,
                },
                {
                  id: 'aula-opt-1-c',
                  option_letter: 'C',
                  text: 'Transferir a responsabilidade fiscal integral ao contratante sem verificação prévia dos formulários emitidos.',
                  is_correct: false,
                },
                {
                  id: 'aula-opt-1-d',
                  option_letter: 'D',
                  text: 'Dispensar a retenção dos impostos FICA em contratos temporários de prestação de serviço.',
                  is_correct: false,
                },
                {
                  id: 'aula-opt-1-e',
                  option_letter: 'E',
                  text: 'Submeter declarações fiscais apenas após decorridos dois anos de atividade contínua.',
                  is_correct: false,
                },
              ],
            },
            {
              id: 'aula-q2',
              sequence_order: 2,
              statement:
                'Segundo as normas fundamentais do padrão corporativo norte-americano, como deve ser calculada a remuneração de horas extras (Overtime)?',
              points: 5,
              feedback:
                'Gabarito Comentado Hemingway School: Conforme a FLSA, qualquer hora trabalhada além de 40 horas na semana laboral deve ser remunerada com no mínimo 1.5x o valor da hora normal (Time and a Half).',
              options: [
                {
                  id: 'aula-opt-2-a',
                  option_letter: 'A',
                  text: 'Mesmo valor da hora regular sem nenhum adicional legal.',
                  is_correct: false,
                },
                {
                  id: 'aula-opt-2-b',
                  option_letter: 'B',
                  text: 'Adicional de 10% sobre o total semanal acumulado.',
                  is_correct: false,
                },
                {
                  id: 'aula-opt-2-c',
                  option_letter: 'C',
                  text: 'No mínimo 1.5 vezes a taxa horária regular (Time and a Half) para horas que excederem 40 semanais.',
                  is_correct: true,
                },
                {
                  id: 'aula-opt-2-d',
                  option_letter: 'D',
                  text: 'Exclusivamente por meio de folgas compensatórias no trimestre seguinte.',
                  is_correct: false,
                },
                {
                  id: 'aula-opt-2-e',
                  option_letter: 'E',
                  text: 'Apenas quando expressamente autorizado por acordo sindical internacional.',
                  is_correct: false,
                },
              ],
            },
          ])
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar avaliação da aula:', err)
      })
      .finally(() => {
        setIsLoadingQuiz(false)
      })
  }, [supabaseLesson, lesson])

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }))
    setRevealedFeedbacks((prev) => ({ ...prev, [questionId]: true }))
  }

  const handleResetQuiz = () => {
    setSelectedAnswers({})
    setRevealedFeedbacks({})
  }

  useEffect(() => {
    if (hasVideo) {
      setActiveMediaView('video')
    } else if (hasSlides) {
      setActiveMediaView('slides')
    } else if (pdfUrl) {
      setActiveMediaView('pdf')
    } else {
      setActiveMediaView('quiz')
    }
  }, [hasVideo, hasSlides, pdfUrl])

  // Links Úteis e Materiais Complementares da aula
  const usefulLinks: UsefulLink[] =
    supabaseLesson?.useful_links && Array.isArray(supabaseLesson.useful_links)
      ? supabaseLesson.useful_links
      : lesson.useful_links && Array.isArray(lesson.useful_links)
        ? lesson.useful_links
        : []

  // Prioridade absoluta para o PDF diagramado: quando houver PDF anexado,
  // oculta completamente o bloco de texto corrido / transcrição gerada para evitar duplicidade.
  useEffect(() => {
    if (pdfUrl && activeTab === 'transcription') {
      setActiveTab(usefulLinks.length > 0 ? 'useful_links' : 'overview')
    }
  }, [pdfUrl, usefulLinks.length, activeTab])

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

      {/* Seletor de Sequência Didática em 4 Etapas da Aula */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-[#FAF8F2] border-2 border-[#C59E5D]/40 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase text-[#0F1B2F] px-2.5 py-1 bg-[#C59E5D]/20 rounded-lg">
            Sequência Didática:
          </span>

          {/* 1. Vídeo Aula */}
          <button
            type="button"
            onClick={() => setActiveMediaView('video')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMediaView === 'video'
                ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md shadow-[#0F1B2F]/20 border border-[#C59E5D]'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-[#C59E5D]" />
            <span>1. Vídeo Aula</span>
            {hasVideo && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Vídeo disponível" />
            )}
          </button>

          {/* 2. Slides (Gamma / PDF) */}
          <button
            type="button"
            onClick={() => setActiveMediaView('slides')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMediaView === 'slides'
                ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md shadow-[#0F1B2F]/20 border border-[#C59E5D]'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Presentation className="w-3.5 h-3.5 text-[#C59E5D]" />
            <span>2. Slides da Aula</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#C59E5D] text-[#0F1B2F]">
              Gamma / PDF
            </span>
          </button>

          {/* 3. Apostila & Materiais */}
          <button
            type="button"
            onClick={() => setActiveMediaView('pdf')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMediaView === 'pdf'
                ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md shadow-[#0F1B2F]/20 border border-[#C59E5D]'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#C59E5D]" />
            <span>3. Apostila & Materiais</span>
            {pdfUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Material em PDF disponível" />
            )}
          </button>

          {/* 4. Avaliação / Quiz */}
          <button
            type="button"
            onClick={() => setActiveMediaView('quiz')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMediaView === 'quiz'
                ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md shadow-[#0F1B2F]/20 border border-[#C59E5D]'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#C59E5D]" />
            <span>4. Avaliação / Quiz</span>
            {quizQuestions.length > 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-600 text-white">
                {quizQuestions.length} Qs
              </span>
            ) : examDriveUrl ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#C59E5D] text-[#0F1B2F]">
                Google Drive
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* 1. Player de Vídeo do YouTube */}
      {activeMediaView === 'video' && hasVideo && youtubeId && (
        <div className="relative aspect-video w-full rounded-3xl bg-slate-950 overflow-hidden shadow-2xl border-2 border-[#0F1B2F] flex items-center justify-center">
          <iframe
            className="w-full h-full border-0 rounded-3xl"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&enablejsapi=1`}
            title={currentTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}

      {/* 2. Player Inteligente de Apresentação de Slides */}
      {activeMediaView === 'slides' && hasSlides && (
        <SlideViewer
          slidesUrl={slidesUrl || undefined}
          slidesUrlPt={slidesUrlPt || undefined}
          slidesUrlEn={slidesUrlEn || undefined}
          slidesUrlEs={slidesUrlEs || undefined}
          preferredLanguage={currentLang as 'pt' | 'en' | 'es'}
          lessonTitle={currentTitle}
        />
      )}

      {/* 3. Visualizador Nativo do Material em PDF (Protagonista da Aula / Diagramação Original) */}
      {activeMediaView === 'pdf' && pdfUrl && (
        <div className="rounded-3xl overflow-hidden border-2 border-[#0F1B2F] bg-white shadow-2xl ring-2 ring-[#C59E5D]/40 transition-all">
          {/* Barra de Ferramentas Superior do PDF */}
          <div className="bg-[#0F1B2F] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#C59E5D]/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-2xl bg-[#C59E5D]/20 border border-[#C59E5D]/50 text-[#C59E5D] shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#C59E5D] text-[#0F1B2F] shadow-xs">
                    Material Oficial
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
              {/* Botão "Abrir em Nova Guia / Tela Cheia" */}
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1C2E4A] hover:bg-[#253e63] text-[#FAF8F2] border border-[#C59E5D]/40 transition-colors shadow-xs"
                title="Abrir PDF em nova guia ou tela cheia"
              >
                <ExternalLink className="w-4 h-4 text-[#C59E5D]" />
                <span>Abrir em Nova Guia / Tela Cheia</span>
              </a>

              {/* Botão "Baixar Material em PDF" */}
              <a
                href={pdfUrl}
                download={pdfName}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] shadow-md transition-colors"
                title="Baixar Material em PDF"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Material em PDF</span>
              </a>
            </div>
          </div>

          {/* Iframe Nativo com height: 800px e Diagramação Original Fiel */}
          <div className="relative w-full bg-slate-900" style={{ height: '800px' }}>
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-full border-0"
              title={pdfName}
            />
          </div>
        </div>
      )}

      {/* 4. Etapa 4: Avaliação / Quiz da Aula */}
      {activeMediaView === 'quiz' && (() => {
        const driveEmbed = examDriveUrl ? formatGoogleDriveEmbedUrl(examDriveUrl) : null

        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Modalidade Google Drive ou Google Forms */}
            {examDriveUrl && (
              <div className="p-5 sm:p-6 bg-white rounded-3xl border-2 border-[#C59E5D]/40 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#0F1B2F] text-[#C59E5D]">
                      <ExternalLink className="w-5 h-5 text-[#C59E5D]" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-[#0F1B2F] flex items-center gap-2">
                        <span>{driveEmbed?.isForm ? 'Avaliação Oficial via Google Forms' : 'Avaliação no Google Drive'}</span>
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
                    <span>Abrir Avaliação no {driveEmbed?.isForm ? 'Google Forms' : 'Google Drive'}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#C59E5D]" />
                  </a>
                </div>

                {driveEmbed?.embedUrl && (
                  <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner" style={{ height: '700px' }}>
                    <iframe
                      src={driveEmbed.embedUrl}
                      className="w-full h-full border-0"
                      title="Avaliação Google Drive / Forms"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Quiz Interativo Nativo (AVA) */}
            {quizQuestions.length > 0 && (
              <div className="space-y-5">
                <div className="p-5 bg-white rounded-3xl border-2 border-[#C59E5D]/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-[#0F1B2F] text-[#C59E5D]">
                      <Award className="w-6 h-6 text-[#C59E5D]" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-[#0F1B2F]">
                        Quiz Interativo da Aula (AVA)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Responda às 5 alternativas (A a E) para testar seus conhecimentos e confira o gabarito comentado oficial.
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
                    const selectedOptId = selectedAnswers[q.id]
                    const isAnswered = Boolean(selectedOptId || revealedFeedbacks[q.id])
                    const selectedOption = q.options.find((opt) => opt.id === selectedOptId)
                    const isCorrect = selectedOption?.is_correct ?? false

                    return (
                      <div
                        key={q.id || qIndex}
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
                                Questão {qIndex + 1} • {q.points || 5} Pontos
                              </span>
                              <p className="text-sm sm:text-base font-bold text-[#0F1B2F] mt-1 leading-snug">
                                {q.statement}
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
                          {q.options.map((opt) => {
                            const isSelected = selectedOptId === opt.id
                            let buttonStyle = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'

                            if (isAnswered) {
                              if (opt.is_correct) {
                                buttonStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold ring-1 ring-emerald-300'
                              } else if (isSelected && !opt.is_correct) {
                                buttonStyle = 'bg-red-50 border-red-400 text-red-900 line-through'
                              }
                            } else if (isSelected) {
                              buttonStyle = 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-200'
                            }

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectOption(q.id, opt.id)}
                                className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm flex items-center gap-3 transition-all cursor-pointer ${buttonStyle}`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'bg-[#0F1B2F] text-[#C59E5D]'
                                      : 'bg-white border border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {opt.option_letter}
                                </span>
                                <span className="flex-1">{opt.text}</span>
                                {isAnswered && opt.is_correct && (
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
                              {q.feedback ||
                                'A alternativa correta alinha-se com a diretriz federal estabelecida no currículo de imigrantes da Hemingway School.'}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Caso não haja nem link do drive nem questões no quiz */}
            {!examDriveUrl && quizQuestions.length === 0 && !isLoadingQuiz && (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">Nenhuma avaliação configurada para esta aula</h3>
                <p className="text-xs text-slate-500 mt-1">O professor ou administrador ainda não cadastrou o quiz interativo ou o link do Google Drive desta aula.</p>
              </div>
            )}
          </div>
        )
      })()}

      {/* Caso não haja vídeo, slides, PDF nem avaliação cadastrados */}
      {!hasVideo && !hasSlides && !pdfUrl && !examDriveUrl && quizQuestions.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Nenhum material de aula anexado</h3>
          <p className="text-xs text-slate-500 mt-1">O professor ou administrador ainda não realizou o upload de vídeo, slides ou PDF desta aula.</p>
        </div>
      )}

      {/* Bloco de Destaque: Links Úteis da Aula */}
      {usefulLinks.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF8F2] border-2 border-[#C59E5D]/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#0F1B2F] text-[#C59E5D] shrink-0">
              <Link2 className="w-5 h-5 text-[#C59E5D]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0F1B2F] flex items-center gap-2">
                <span>Links Úteis & Materiais Complementares</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#C59E5D] text-[#0F1B2F]">
                  {usefulLinks.length} {usefulLinks.length === 1 ? 'Link' : 'Links'}
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Esta aula possui referências externas, links do IRS e documentação complementar para consulta.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('useful_links')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] border border-[#C59E5D]/50 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#C59E5D]" />
            <span>Ver Links Úteis</span>
          </button>
        </div>
      )}

      {/* Abas de Conteúdo Pedagógico */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {/* Aba de Transcrição / Conteúdo da Aula (Exibida APENAS quando NÃO houver PDF anexado para evitar duplicidade) */}
          {!pdfUrl && (
            <button
              type="button"
              onClick={() => setActiveTab('transcription')}
              className={`px-5 py-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'transcription'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('classroom.tabs.transcription')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('classroom.tabs.overview')}
          </button>
          {hasSlides && (
            <button
              type="button"
              onClick={() => setActiveTab('slides')}
              className={`px-5 py-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'slides'
                  ? 'border-[#C59E5D] text-[#0F1B2F] bg-[#FAF8F2] font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Presentation className="w-4 h-4 text-[#C59E5D]" />
              <span>Slides da Aula</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('useful_links')}
            className={`px-5 py-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'useful_links'
                ? 'border-[#0F1B2F] text-[#0F1B2F] bg-[#FAF8F2] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-4 h-4 text-[#C59E5D]" />
            <span>Links Úteis & Complementares</span>
            {usefulLinks.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C59E5D] text-[#0F1B2F]">
                {usefulLinks.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resources')}
            className={`px-5 py-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'resources'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('classroom.tabs.resources')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-5 py-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('classroom.tabs.notes')}
          </button>
        </div>

        <div className="p-6">
          {/* Aba de Transcrição / Conteúdo da Aula (Exibida APENAS quando NÃO houver PDF anexado) */}
          {!pdfUrl && activeTab === 'transcription' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Subtitles className="w-4 h-4 text-blue-600" />
                  <span>Conteúdo & Apostila Oficial (Supabase)</span>
                </span>
                <span className="text-xs text-blue-600 font-medium">Idioma: {currentLang.toUpperCase()}</span>
              </div>
              <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                {transcriptionText}
              </div>
            </div>
          )}

          {/* Aba de Resumo e Ementa */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-sm text-slate-700">
              <h3 className="font-bold text-slate-900">Objetivo Pedagógico da Lição</h3>
              <p>
                Capacitar trabalhadores imigrantes a entender seus direitos fundamentais no ambiente corporativo norte-americano, prevenir a exploração salarial e dominar a declaração fiscal entre W-2 e 1099 perante o IRS.
              </p>
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-blue-900 text-xs">Vídeo Original</h4>
                  <p className="text-xs text-blue-700 truncate max-w-md">{videoUrl}</p>
                </div>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <span>Abrir no YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Aba de Apresentação de Slides */}
          {hasSlides && activeTab === 'slides' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <SlideViewer
                slidesUrl={slidesUrl || undefined}
                slidesUrlPt={slidesUrlPt || undefined}
                slidesUrlEn={slidesUrlEn || undefined}
                slidesUrlEs={slidesUrlEs || undefined}
                preferredLanguage={currentLang as 'pt' | 'en' | 'es'}
                lessonTitle={currentTitle}
              />
            </div>
          )}

          {/* Aba de Links Úteis & Materiais Complementares */}
          {activeTab === 'useful_links' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#C59E5D]/20 text-[#0F1B2F] border border-[#C59E5D]/40">
                    <Link2 className="w-5 h-5 text-[#C59E5D]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#0F1B2F] text-base">
                      Links Úteis & Materiais Complementares
                    </h3>
                    <p className="text-xs text-slate-500">
                      Documentação oficial, artigos complementares e ferramentas externas para aprofundar seu estudo
                    </p>
                  </div>
                </div>

                {usefulLinks.length > 0 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FAF8F2] text-[#0F1B2F] border border-[#C59E5D]/40 self-start sm:self-auto">
                    {usefulLinks.length} {usefulLinks.length === 1 ? 'link disponível' : 'links disponíveis'}
                  </span>
                )}
              </div>

              {usefulLinks.length === 0 ? (
                <div className="p-10 text-center bg-[#FAF8F2]/60 rounded-3xl border border-dashed border-[#C59E5D]/40 space-y-2">
                  <Link2 className="w-8 h-8 text-[#C59E5D]/60 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">
                    Nenhum link complementar cadastrado para esta aula ainda
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Quando o professor ou administrador adicionar materiais externos, regulamentações ou guias, eles aparecerão aqui prontos para acesso direto.
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
            </div>
          )}

          {/* Aba de Materiais Complementares */}
          {activeTab === 'resources' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Documentos e Apostilas para Download</h3>
              {lesson.materials.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <span className="text-xs text-slate-400">{item.size} • PDF Oficial</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Iniciando download simulado de: ${item.title}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar</span>
                  </button>
                </div>
              ))}

              {usefulLinks.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-[#C59E5D]" />
                    <span>Links Complementares da Aula ({usefulLinks.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {usefulLinks.map((link, idx) => (
                      <a
                        key={link.id || idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-xl bg-[#FAF8F2] border border-slate-200 hover:border-[#C59E5D] transition-all flex flex-col justify-between gap-1.5 group text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-[#0F1B2F] group-hover:text-[#B38C4B] line-clamp-1">
                            {link.title}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#C59E5D] shrink-0" />
                        </div>
                        {link.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">{link.description}</p>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 truncate">
                          {link.url.replace(/^https?:\/\//i, '')}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aba de Anotações do Aluno */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Caderno de Estudos Digital
              </label>
              <textarea
                rows={5}
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Escreva suas dúvidas sobre formulários fiscais, prazos ou termos em inglês para revisar posteriormente..."
                className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => alert('Suas anotações foram salvas localmente!')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Salvar no Meu Perfil
                </button>
              </div>
            </div>
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
