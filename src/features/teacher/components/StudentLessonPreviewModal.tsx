import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Play,
  Presentation,
  FileText,
  HelpCircle,
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
        title: string
        course_id?: string
        discipline_id?: string
        sequence_order?: number
        duration_minutes?: number
        content_text?: string
        video_url?: string
        pdf_url?: string
        pdf_name?: string
        slides_url?: string
        slides_url_pt?: string
        slides_url_en?: string
        slides_url_es?: string
        exam_drive_url?: string
        useful_links?: UsefulLink[]
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
  const [previewLang, setPreviewLang] = useState<'pt' | 'en' | 'es'>('pt')
  const [activeMediaTab, setActiveMediaTab] = useState<'video' | 'slides' | 'pdf' | 'quiz'>('video')
  
  // Estado do Simulado / Prova da Aula
  const [quizQuestions, setQuizQuestions] = useState<AssessmentQuestion[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [revealedFeedbacks, setRevealedFeedbacks] = useState<Record<string, boolean>>({})
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false)

  // Determina a mídia padrão inicial quando o modal abre
  useEffect(() => {
    if (!isOpen || !lesson) return

    const hasVideo = Boolean(lesson.video_url && lesson.video_url.trim().length > 0)
    const hasSlides = Boolean(
      lesson.slides_url || lesson.slides_url_pt || lesson.slides_url_en || lesson.slides_url_es,
    )
    const hasPdf = Boolean(lesson.pdf_url)

    if (hasVideo) {
      setActiveMediaTab('video')
    } else if (hasSlides) {
      setActiveMediaTab('slides')
    } else if (hasPdf) {
      setActiveMediaTab('pdf')
    } else {
      setActiveMediaTab('video')
    }

    // Carrega questões do simulado associadas à aula ou disciplina
    setIsLoadingQuiz(true)
    assessmentService
      .getAssessments({ course_id: lesson.course_id, discipline_id: lesson.discipline_id })
      .then((assessments) => {
        // Tenta encontrar avaliação específica desta aula
        let found = assessments.find((a) => a.lesson_id && a.lesson_id === lesson.id)
        if (!found && assessments.length > 0) {
          found = assessments[0]
        }

        if (found && found.questions && found.questions.length > 0) {
          setQuizQuestions(found.questions)
        } else {
          // Questões formativas padrão de teste para visualização de simulado com gabarito comentado
          setQuizQuestions([
            {
              id: 'demo-q1',
              sequence_order: 1,
              statement:
                'Com base nos conteúdos e orientações apresentados nesta aula, qual é a principal diretriz a ser aplicada na prática profissional?',
              points: 5,
              feedback:
                'Gabarito Comentado Hemingway School: A alternativa B reflete a conformidade regulatória e a aplicação exata dos conceitos tributários e trabalhistas norte-americanos discutidos no material desta aula.',
              options: [
                {
                  id: 'demo-opt-1-a',
                  option_letter: 'A',
                  text: 'Ignorar as obrigações formais quando a remuneração for inferior ao piso estadual.',
                  is_correct: false,
                },
                {
                  id: 'demo-opt-1-b',
                  option_letter: 'B',
                  text: 'Manter a documentação fiscal e relatórios de horas estritamente alinhados às diretrizes oficiais do IRS e do Department of Labor.',
                  is_correct: true,
                },
                {
                  id: 'demo-opt-1-c',
                  option_letter: 'C',
                  text: 'Transferir a responsabilidade fiscal integral ao contratante sem verificação prévia dos formulários emitidos.',
                  is_correct: false,
                },
                {
                  id: 'demo-opt-1-d',
                  option_letter: 'D',
                  text: 'Dispensar a retenção dos impostos FICA em contratos temporários de prestação de serviço.',
                  is_correct: false,
                },
                {
                  id: 'demo-opt-1-e',
                  option_letter: 'E',
                  text: 'Submeter declarações fiscais apenas após decorridos dois anos de atividade contínua.',
                  is_correct: false,
                },
              ],
            },
            {
              id: 'demo-q2',
              sequence_order: 2,
              statement:
                'Segundo as normas fundamentais do padrão corporativo norte-americano, como deve ser calculada a remuneração de horas extras (Overtime)?',
              points: 5,
              feedback:
                'Gabarito Comentado Hemingway School: Conforme a FLSA, qualquer hora trabalhada além de 40 horas na semana laboral deve ser remunerada com no mínimo 1.5x o valor da hora normal (Time and a Half).',
              options: [
                {
                  id: 'demo-opt-2-a',
                  option_letter: 'A',
                  text: 'Mesmo valor da hora regular sem nenhum adicional legal.',
                  is_correct: false,
                },
                {
                  id: 'demo-opt-2-b',
                  option_letter: 'B',
                  text: 'Adicional de 10% sobre o total semanal acumulado.',
                  is_correct: false,
                },
                {
                  id: 'demo-opt-2-c',
                  option_letter: 'C',
                  text: 'No mínimo 1.5 vezes a taxa horária regular (Time and a Half) para horas que excederem 40 semanais.',
                  is_correct: true,
                },
                {
                  id: 'demo-opt-2-d',
                  option_letter: 'D',
                  text: 'Exclusivamente por meio de folgas compensatórias no trimestre seguinte.',
                  is_correct: false,
                },
                {
                  id: 'demo-opt-2-e',
                  option_letter: 'E',
                  text: 'Apenas quando expressamente autorizado por acordo sindical internacional.',
                  is_correct: false,
                },
              ],
            },
          ])
        }
      })
      .finally(() => {
        setIsLoadingQuiz(false)
      })

    // Limpa respostas anteriores
    setSelectedAnswers({})
    setRevealedFeedbacks({})
  }, [isOpen, lesson])

  if (!isOpen || !lesson) return null

  // Dados resolvidos por idioma
  const resolvedSlideUrl =
    previewLang === 'pt'
      ? lesson.slides_url_pt || lesson.slides_url
      : previewLang === 'en'
        ? lesson.slides_url_en || lesson.slides_url_pt || lesson.slides_url
        : lesson.slides_url_es || lesson.slides_url_pt || lesson.slides_url

  const hasVideo = Boolean(lesson.video_url && lesson.video_url.trim().length > 0)
  const youtubeId = hasVideo ? extractYouTubeId(lesson.video_url || '') : null
  const hasSlides = Boolean(
    resolvedSlideUrl || lesson.slides_url || lesson.slides_url_pt || lesson.slides_url_en || lesson.slides_url_es,
  )
  const hasPdf = Boolean(lesson.pdf_url)
  const usefulLinks = lesson.useful_links && Array.isArray(lesson.useful_links) ? lesson.useful_links : []

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }))
    // Ao selecionar, já revela automaticamente o feedback comentado para teste do Admin/Professor
    setRevealedFeedbacks((prev) => ({ ...prev, [questionId]: true }))
  }

  const handleResetQuiz = () => {
    setSelectedAnswers({})
    setRevealedFeedbacks({})
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0F1B2F]/95 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* 1. BARRA SUPERIOR DE PRÉ-VISUALIZAÇÃO DO ALUNO */}
      <header className="bg-[#0A1220] border-b border-[#C59E5D]/40 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg select-none">
        {/* Esquerda: Identificação do Modo Pré-visualização */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-[#C59E5D] text-[#0F1B2F] shadow-sm shrink-0">
            <Sparkles className="w-5 h-5 text-[#0F1B2F]" />
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

        {/* Direita: Seletor de Idioma (PT | EN | ES) e Botão Voltar */}
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

          {/* Botão "Voltar para Gestão de Aulas" */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] shadow-md shadow-[#C59E5D]/25 transition-all transform active:scale-95 cursor-pointer"
            title="Voltar para Gestão de Aulas"
          >
            <ArrowLeft className="w-4 h-4 text-[#0F1B2F]" />
            <span className="hidden sm:inline">Voltar para Gestão de Aulas</span>
            <span className="sm:hidden">Voltar</span>
          </button>
        </div>
      </header>

      {/* 2. ÁREA CENTRAL SCROLLÁVEL DA SALA DE AULA DO ALUNO */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FAF8F2] space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Breadcrumb e Título da Aula */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="font-bold text-[#0F1B2F]">{courseTitle}</span>
              <span>•</span>
              <span className="text-blue-700 font-semibold">{disciplineName}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C59E5D]/20 text-[#0F1B2F] border border-[#C59E5D]/40">
                Aula {lesson.sequence_order || 1}
              </span>
              <span>•</span>
              <span className="text-slate-400">
                Testando em: <strong className="text-[#0F1B2F]">{previewLang.toUpperCase()}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F1B2F] tracking-tight">
              {lesson.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C59E5D]" />
                <span>Duração estimada: {lesson.duration_minutes || 20} min</span>
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

          {/* 3. SELETOR DE FORMATO / ABAS DA SALA DE AULA */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white rounded-2xl border-2 border-[#C59E5D]/40 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase text-[#0F1B2F] px-2.5 py-1 bg-[#C59E5D]/20 rounded-lg">
                Abas da Aula:
              </span>

              {/* Aba 1: Vídeo da Aula */}
              <button
                type="button"
                onClick={() => setActiveMediaTab('video')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMediaTab === 'video'
                    ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md shadow-[#0F1B2F]/20 border border-[#C59E5D]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Play className="w-3.5 h-3.5 text-[#C59E5D]" />
                <span>Vídeo Principal</span>
                {hasVideo && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Vídeo cadastrado" />
                )}
              </button>

              {/* Aba 2: Apresentação de Slides (Gamma.app / PDF) */}
              <button
                type="button"
                onClick={() => setActiveMediaTab('slides')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMediaTab === 'slides'
                    ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md shadow-[#0F1B2F]/20 border border-[#C59E5D]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Presentation className="w-3.5 h-3.5 text-[#C59E5D]" />
                <span>Apresentação de Slides</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#C59E5D] text-[#0F1B2F]">
                  Gamma / PDF
                </span>
              </button>

              {/* Aba 3: Apostila para Download */}
              <button
                type="button"
                onClick={() => setActiveMediaTab('pdf')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMediaTab === 'pdf'
                    ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md shadow-[#0F1B2F]/20 border border-[#C59E5D]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#C59E5D]" />
                <span>Apostila (PDF)</span>
                {hasPdf && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="PDF anexado" />
                )}
              </button>

              {/* Aba 4: Avaliação / Quiz da Aula */}
              <button
                type="button"
                onClick={() => setActiveMediaTab('quiz')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMediaTab === 'quiz'
                    ? 'bg-[#0F1B2F] text-[#FAF8F2] shadow-md shadow-[#0F1B2F]/20 border border-[#C59E5D]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-[#C59E5D]" />
                <span>Avaliação / Quiz</span>
                {quizQuestions.length > 0 ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-600 text-white">
                    {quizQuestions.length} Questões
                  </span>
                ) : (lesson as any)?.exam_drive_url ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#C59E5D] text-[#0F1B2F]">
                    Google Drive
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {/* 4. CONTEÚDO DA ABA SELECIONADA */}

          {/* ABA 1: VÍDEO PRINCIPAL */}
          {activeMediaTab === 'video' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {hasVideo && youtubeId ? (
                <div className="relative aspect-video w-full rounded-3xl bg-slate-950 overflow-hidden shadow-2xl border-2 border-[#0F1B2F] flex items-center justify-center">
                  <iframe
                    className="w-full h-full border-0 rounded-3xl"
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&enablejsapi=1`}
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
                  <Play className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">Nenhum vídeo cadastrado nesta aula</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Insira a URL de um vídeo do YouTube no formulário para disponibilizar a aula em vídeo aos alunos.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ABA 2: APRESENTAÇÃO DE SLIDES (GAMMA.APP / PDF) */}
          {activeMediaTab === 'slides' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {hasSlides ? (
                <SlideViewer
                  slidesUrl={resolvedSlideUrl || lesson.slides_url}
                  slidesUrlPt={lesson.slides_url_pt}
                  slidesUrlEn={lesson.slides_url_en}
                  slidesUrlEs={lesson.slides_url_es}
                  preferredLanguage={previewLang}
                  lessonTitle={lesson.title}
                />
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
                  <Presentation className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Nenhum link do Gamma.app ou PDF de slides configurado
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Cole o link do Gamma.app (ou código &lt;iframe&gt;) ou envie um PDF exportado no editor da aula para carregar aqui.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ABA 3: APOSTILA PARA DOWNLOAD / PDF */}
          {activeMediaTab === 'pdf' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {hasPdf ? (
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
                          {lesson.pdf_name || 'Apostila-Oficial.pdf'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={lesson.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1C2E4A] hover:bg-[#253e63] text-[#FAF8F2] border border-[#C59E5D]/40 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#C59E5D]" />
                        <span>Abrir em Nova Guia</span>
                      </a>
                      <a
                        href={lesson.pdf_url}
                        download={lesson.pdf_name || 'Apostila.pdf'}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] shadow-sm transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar Apostila</span>
                      </a>
                    </div>
                  </div>

                  <div className="w-full bg-slate-900" style={{ height: '700px' }}>
                    <iframe
                      src={`${lesson.pdf_url}#toolbar=1&navpanes=0&scrollbar=1`}
                      className="w-full h-full border-0"
                      title="Apostila"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">Nenhuma apostila em PDF anexada</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Faça o upload do PDF da apostila no painel de edição para que os alunos possam visualizá-la e baixá-la aqui.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ABA 4: PROVA / SIMULADO DA AULA (INTERATIVO COM GABARITO COMENTADO + GOOGLE DRIVE/FORMS) */}
          {activeMediaTab === 'quiz' && (() => {
            const currentExamDriveUrl = ((lesson as any)?.exam_drive_url as string | undefined)?.trim()
            const driveEmbed = currentExamDriveUrl ? formatGoogleDriveEmbedUrl(currentExamDriveUrl) : null

            return (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Card e Embed da Avaliação via Google Drive ou Google Forms */}
                {currentExamDriveUrl && (
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
                        href={currentExamDriveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] border border-[#C59E5D]/50 transition shadow-sm cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        <span>Abrir Avaliação no {driveEmbed?.isForm ? 'Google Forms' : 'Google Drive'}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#C59E5D]" />
                      </a>
                    </div>

                    {driveEmbed?.embedUrl && (
                      <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner" style={{ height: '650px' }}>
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
                            Teste as 5 alternativas (A a E) e verifique o gabarito comentado com a justificativa pedagógica.
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

                {/* Feedback caso não haja questões nem Google Drive */}
                {!currentExamDriveUrl && quizQuestions.length === 0 && !isLoadingQuiz && (
                  <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                    <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">Nenhuma avaliação cadastrada para esta aula</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Configure um Quiz Interativo ou cole o link de uma prova no Google Drive/Forms na edição da aula.
                    </p>
                  </div>
                )}

                {isLoadingQuiz && (
                  <div className="p-10 text-center bg-white rounded-3xl border border-slate-200">
                    <div className="w-6 h-6 border-2 border-[#C59E5D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">Carregando banco de questões da aula...</p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* 5. SEÇÕES COMPLEMENTARES: LINKS ÚTEIS E TEXTO DA AULA */}
          {usefulLinks.length > 0 && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#C59E5D]/20 text-[#0F1B2F]">
                  <Link2 className="w-4 h-4 text-[#C59E5D]" />
                </div>
                <h4 className="text-sm font-bold text-[#0F1B2F]">
                  Links Úteis & Materiais Complementares ({usefulLinks.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {usefulLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-[#FAF8F2] border border-slate-200 hover:border-[#C59E5D] transition flex items-center justify-between text-xs group"
                  >
                    <span className="font-semibold text-slate-800 truncate pr-2 group-hover:text-blue-600">
                      {link.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#C59E5D] shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Texto-base / Apostila Escrita */}
          {lesson.content_text && lesson.content_text.trim().length > 0 && (
            <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Conteúdo & Transcrição da Aula</span>
              </h4>
              <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-slate-50/70 p-5 rounded-2xl border border-slate-100 font-sans">
                {lesson.content_text}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
