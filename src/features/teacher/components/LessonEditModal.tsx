import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Save,
  Pencil,
  FileText,
  UploadCloud,
  RefreshCw,
  Trash2,
  ExternalLink,
  Play,
  Clock,
  GraduationCap,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Link2,
  Plus,
  Presentation,
  Search,
  HelpCircle,
  Award,
  Sparkles,
  Eye,
} from 'lucide-react'
import type { SupabaseLesson, SupabaseCourse, SupabaseDiscipline, UsefulLink } from '../../../types'
import { lessonService, extractYouTubeId, formatGammaEmbedUrl } from '../../../services/lessonService'
import { courseService } from '../../../services/courseService'
import { curriculumService } from '../../../services/curriculumService'
import { assessmentService } from '../../../services/assessmentService'
import { extractTextFromPdf } from '../../../utils/pdfExtractor'
import { StudentLessonPreviewModal } from './StudentLessonPreviewModal'
import { SmartExamImporterModal } from './SmartExamImporterModal'

interface LessonEditModalProps {
  isOpen: boolean
  onClose: () => void
  lesson: SupabaseLesson | null
  onSaved: (savedLesson: SupabaseLesson) => void
  onDelete?: (lessonId: string) => void
}

export const LessonEditModal: React.FC<LessonEditModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onSaved,
  onDelete,
}) => {
  const isEditing = Boolean(lesson?.id)

  // Cursos e Disciplinas para os selects
  const [courses, setCourses] = useState<SupabaseCourse[]>([])
  const [disciplines, setDisciplines] = useState<SupabaseDiscipline[]>([])

  // Campos do formulário
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [disciplineId, setDisciplineId] = useState('')
  const [sequenceOrder, setSequenceOrder] = useState<number>(1)
  const [durationMinutes, setDurationMinutes] = useState<number>(20)
  const [videoUrl, setVideoUrl] = useState('')
  const [contentText, setContentText] = useState('')

  // Links Úteis da Aula
  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>([])

  // Gestão de PDF
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [pdfName, setPdfName] = useState<string>('')
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [isExtractingPdf, setIsExtractingPdf] = useState(false)
  const [isPdfDragging, setIsPdfDragging] = useState(false)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Gestão de Apresentação de Slides (PT / EN / ES)
  const [slidesUrlPt, setSlidesUrlPt] = useState<string>('')
  const [slidesUrlEn, setSlidesUrlEn] = useState<string>('')
  const [slidesUrlEs, setSlidesUrlEs] = useState<string>('')
  const [activeSlideLangTab, setActiveSlideLangTab] = useState<'pt' | 'en' | 'es'>('pt')
  const [isUploadingSlides, setIsUploadingSlides] = useState(false)
  const slidesFileInputRef = useRef<HTMLInputElement>(null)

  // Gestão de Provas / Avaliações da Aula (Quiz Nativo e Google Drive / Forms)
  const [examDriveUrl, setExamDriveUrl] = useState<string>('')
  const [lessonQuestionCount, setLessonQuestionCount] = useState<number>(0)
  const [isImporterOpenInModal, setIsImporterOpenInModal] = useState(false)

  // Estado de submissão e feedback
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Carrega opções de cursos e disciplinas
  useEffect(() => {
    if (isOpen) {
      Promise.all([courseService.getCourses(), curriculumService.getDisciplines()]).then(
        ([cList, dList]) => {
          setCourses(cList)
          setDisciplines(dList)
        },
      )
    }
  }, [isOpen])

  // Inicializa os dados com base na aula recebida
  useEffect(() => {
    if (isOpen && lesson) {
      setTitle(lesson.title || '')
      setCourseId(lesson.course_id || '')
      setDisciplineId(lesson.discipline_id || '')
      setSequenceOrder(lesson.sequence_order || 1)
      setDurationMinutes(lesson.duration_minutes || 20)
      setVideoUrl(lesson.video_url || '')
      setContentText(lesson.content_text || '')
      setPdfUrl(lesson.pdf_url || '')
      setPdfName(lesson.pdf_name || '')
      setSlidesUrlPt(lesson.slides_url_pt || lesson.slides_url || '')
      setSlidesUrlEn(lesson.slides_url_en || '')
      setSlidesUrlEs(lesson.slides_url_es || '')
      setExamDriveUrl(lesson.exam_drive_url || '')
      setUsefulLinks(
        lesson.useful_links && Array.isArray(lesson.useful_links)
          ? JSON.parse(JSON.stringify(lesson.useful_links))
          : [],
      )
      setErrorMessage(null)
      setSuccessMessage(null)

      if (lesson.id) {
        assessmentService
          .countQuestionsByLessonId(lesson.id)
          .then(setLessonQuestionCount)
          .catch(() => setLessonQuestionCount(0))
      } else {
        setLessonQuestionCount(0)
      }
    } else if (isOpen && !lesson) {
      setTitle('')
      setCourseId('')
      setDisciplineId('')
      setSequenceOrder(1)
      setDurationMinutes(20)
      setVideoUrl('')
      setContentText('')
      setPdfUrl('')
      setPdfName('')
      setSlidesUrlPt('')
      setSlidesUrlEn('')
      setSlidesUrlEs('')
      setExamDriveUrl('')
      setLessonQuestionCount(0)
      setUsefulLinks([])
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [isOpen, lesson])

  // Gerenciamento dinâmico de links úteis
  const handleAddUsefulLink = () => {
    setUsefulLinks((prev) => [
      ...prev,
      {
        id: `link-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        title: '',
        url: '',
        description: '',
      },
    ])
  }

  const handleUpdateUsefulLink = (index: number, field: keyof UsefulLink, value: string) => {
    setUsefulLinks((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleRemoveUsefulLink = (index: number) => {
    setUsefulLinks((prev) => prev.filter((_, i) => i !== index))
  }

  if (!isOpen) return null

  const detectedYouTubeId = extractYouTubeId(videoUrl)

  // Processa upload e substituição de PDF
  const handlePdfFile = async (file: File) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Por favor, selecione um arquivo em formato .pdf válido.')
      return
    }

    setErrorMessage(null)

    // Se o título estiver vazio, preenche automaticamente com o nome do PDF
    if (!title.trim()) {
      const autoTitle = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[-_]/g, ' ')
        .trim()
      setTitle(autoTitle)
    }

    setIsUploadingPdf(true)
    try {
      const uploadRes = await lessonService.uploadLessonPdf(file)
      setPdfUrl(uploadRes.url)
      setPdfName(uploadRes.name)
    } catch (err) {
      console.error('Erro ao enviar PDF:', err)
      setErrorMessage('Não foi possível enviar o PDF para o Supabase Storage.')
    } finally {
      setIsUploadingPdf(false)
    }

    // Extrai texto em segundo plano e preenche/complementa o texto da aula
    setIsExtractingPdf(true)
    try {
      const extracted = await extractTextFromPdf(file)
      if (extracted && extracted.trim()) {
        if (!contentText.trim()) {
          setContentText(extracted)
        }
      }
    } catch (e) {
      console.warn('Erro na extração de texto do PDF:', e)
    } finally {
      setIsExtractingPdf(false)
    }
  }

  const handleRemovePdf = () => {
    setPdfUrl('')
    setPdfName('')
  }

  // Upload de Apresentação de Slides (.pptx ou .pdf)
  const handleSlidesFileUpload = async (file: File) => {
    if (!file) return
    const lower = file.name.toLowerCase()
    const valid = lower.endsWith('.pptx') || lower.endsWith('.ppsx') || lower.endsWith('.ppt') || lower.endsWith('.pdf')
    if (!valid) {
      setErrorMessage('Formato de arquivo inválido. Por favor, envie uma apresentação em .pptx, .ppsx ou .pdf.')
      return
    }

    setIsUploadingSlides(true)
    setErrorMessage(null)
    try {
      const res = await lessonService.uploadLessonSlides(file)
      if (res.url) {
        if (activeSlideLangTab === 'pt') {
          setSlidesUrlPt(res.url)
        } else if (activeSlideLangTab === 'en') {
          setSlidesUrlEn(res.url)
        } else if (activeSlideLangTab === 'es') {
          setSlidesUrlEs(res.url)
        }
      }
    } catch (err) {
      console.error('Erro no upload de slides:', err)
      setErrorMessage('Falha ao enviar arquivo de apresentação para o Supabase Storage.')
    } finally {
      setIsUploadingSlides(false)
    }
  }

  // Validação e Submissão com UPDATE real no Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!title.trim()) {
      setErrorMessage('O título da aula é obrigatório.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        course_id: courseId || (courses[0]?.id ?? ''),
        discipline_id: disciplineId || (disciplines[0]?.id ?? 'disc-03'),
        sequence_order: Number(sequenceOrder) || 1,
        duration_minutes: Number(durationMinutes) || 20,
        content_text: contentText,
        video_url: videoUrl.trim(),
        materials: lesson?.materials || [],
        pdf_url: pdfUrl || undefined,
        pdf_name: pdfName || undefined,
        useful_links: usefulLinks.filter((l) => l.title.trim() && l.url.trim()),
        slides_url: slidesUrlPt || slidesUrlEn || slidesUrlEs || undefined,
        slides_url_pt: slidesUrlPt || undefined,
        slides_url_en: slidesUrlEn || undefined,
        slides_url_es: slidesUrlEs || undefined,
        exam_drive_url: examDriveUrl.trim() || undefined,
      }

      let saved: SupabaseLesson
      if (isEditing && lesson?.id) {
        // Se existir id: executa UPDATE no registro existente
        saved = await lessonService.updateLesson(lesson.id, payload)
        setSuccessMessage('Aula atualizada com sucesso no Supabase!')
      } else {
        // Somente se NÃO existir id: executa INSERT para nova aula
        saved = await lessonService.createLesson(payload)
        setSuccessMessage('Nova aula criada com sucesso no Supabase!')
      }
      setTimeout(() => {
        onSaved(saved)
        onClose()
      }, 700)
    } catch (err: unknown) {
      console.error('Erro ao salvar alterações da aula:', err)
      const msg = err instanceof Error ? err.message : 'Falha ao salvar aula no Supabase'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border-2 border-[#0F1B2F] overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Topo do Modal */}
        <div className="px-6 py-4 bg-[#0F1B2F] text-white flex items-center justify-between border-b border-[#C59E5D]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#C59E5D] text-[#0F1B2F] font-bold shadow-xs">
              <Pencil className="w-5 h-5 text-[#0F1B2F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#FAF8F2]">
                  {isEditing ? 'Editar Aula' : 'Nova Aula'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#C59E5D] text-[#0F1B2F]">
                  Supabase Live
                </span>
              </div>
              <p className="text-xs text-[#EADBBE]/80">
                Altere o título, vídeo, material em PDF e o texto-base da aula
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Botão no topo do modal: Pré-visualizar Aula como Aluno */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1C2E4A] hover:bg-[#253e63] text-[#C59E5D] border border-[#C59E5D]/40 transition shadow-xs cursor-pointer"
              title="Pré-visualizar Aula como Aluno"
            >
              <Search className="w-3.5 h-3.5 text-[#C59E5D]" />
              <span className="hidden sm:inline">Pré-visualizar Aula como Aluno</span>
              <span className="sm:hidden">Ver como Aluno</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-[#1C2E4A] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensagens de Alerta */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}

        {/* Formulário com Scroll Confortável */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* 1. Título e Ordem */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-[#0F1B2F] uppercase tracking-wide mb-1">
                Título da Aula <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Compreendendo o Formulário W-2 e Direitos no Trabalho"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/30 focus:border-[#C59E5D] transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F1B2F] uppercase tracking-wide mb-1 flex items-center gap-1">
                Ordem / Posição
              </label>
              <input
                type="number"
                min={1}
                value={sequenceOrder}
                onChange={(e) => setSequenceOrder(Number(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/30 focus:border-[#C59E5D] transition-all text-center font-bold"
              />
            </div>
          </div>

          {/* 2. Curso e Disciplina */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-[#C59E5D]" />
                Curso Vinculado
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/30 cursor-pointer"
              >
                <option value="">Selecione o Curso...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#C59E5D]" />
                Disciplina Vinculada
              </label>
              <select
                value={disciplineId}
                onChange={(e) => setDisciplineId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/30 cursor-pointer"
              >
                <option value="">Selecione a Disciplina...</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code ? `[${d.code}] ` : ''}
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Link do Vídeo (YouTube) e Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Play className="w-3.5 h-3.5 text-red-600" />
                Link do Vídeo / YouTube
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/30"
              />
              {detectedYouTubeId && (
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                  ✓ Vídeo válido detectado (ID: {detectedYouTubeId})
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Duração Estimada (min)
              </label>
              <input
                type="number"
                min={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value) || 20)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/30 text-center font-medium"
              />
            </div>
          </div>

          {/* 4. Arquivo PDF da Aula (Upload / Substituição / Remoção no Supabase Storage) */}
          <div className="p-4 rounded-2xl bg-[#FAF8F2] border-2 border-[#C59E5D]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C59E5D]" />
                <h4 className="text-xs font-extrabold text-[#0F1B2F] uppercase tracking-wide">
                  Arquivo PDF da Aula (Supabase Storage: lesson-materials)
                </h4>
              </div>
              {pdfUrl && (
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  PDF Ativo
                </span>
              )}
            </div>

            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handlePdfFile(e.target.files[0])
                }
              }}
            />

            {pdfUrl ? (
              <div className="p-3 bg-white rounded-xl border border-[#C59E5D]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-red-600 text-white font-extrabold text-[10px] shrink-0">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0F1B2F] truncate">
                      {pdfName || 'Material-Aula.pdf'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                      {pdfUrl}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 px-2.5 rounded-lg text-xs font-bold bg-[#0F1B2F] text-white hover:bg-[#1C2E4A] flex items-center gap-1 transition"
                    title="Visualizar em nova aba"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#C59E5D]" />
                    <span>Ver</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={isUploadingPdf}
                    className="p-1.5 px-2.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center gap-1 transition cursor-pointer"
                    title="Substituir por outro PDF"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#C59E5D]" />
                    <span>Substituir</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Remover PDF"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsPdfDragging(true)
                }}
                onDragLeave={() => setIsPdfDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsPdfDragging(false)
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handlePdfFile(e.dataTransfer.files[0])
                  }
                }}
                onClick={() => {
                  if (!isUploadingPdf) pdfInputRef.current?.click()
                }}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isPdfDragging
                    ? 'border-[#C59E5D] bg-white ring-2 ring-[#C59E5D]/30'
                    : 'border-slate-300 hover:border-[#C59E5D] bg-white hover:bg-slate-50/50'
                }`}
              >
                {isUploadingPdf || isExtractingPdf ? (
                  <div className="py-2 space-y-2">
                    <Loader2 className="w-7 h-7 text-[#C59E5D] animate-spin mx-auto" />
                    <p className="text-xs font-bold text-[#0F1B2F]">
                      {isUploadingPdf
                        ? 'Enviando PDF para o Supabase Storage...'
                        : 'Indexando texto do documento...'}
                    </p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-7 h-7 text-[#C59E5D] mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-[#0F1B2F]">
                      Arraste um PDF ou{' '}
                      <span className="text-[#C59E5D] hover:underline">clique para selecionar</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      O arquivo será enviado para o bucket <code>lesson-materials</code>
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 4.5. Apresentação de Slides (Link do Gamma.app ou Upload de PDF) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F2] border-2 border-[#C59E5D]/40 space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C59E5D]/20 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0F1B2F] text-[#C59E5D] shrink-0">
                  <Presentation className="w-5 h-5 text-[#C59E5D]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#0F1B2F] uppercase tracking-wide flex items-center gap-2">
                    <span>Apresentação de Slides (Link do Gamma.app ou Upload de PDF)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C59E5D] text-[#0F1B2F]">
                      PT / EN / ES
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Insira link do Gamma.app (link comum ou código de embed) ou envie PDF exportado do Gamma
                  </p>
                </div>
              </div>

              {/* Seletor de Idioma da Apresentação */}
              <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveSlideLangTab('pt')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeSlideLangTab === 'pt'
                      ? 'bg-[#0F1B2F] text-[#C59E5D] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PT {slidesUrlPt ? '✓' : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlideLangTab('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeSlideLangTab === 'en'
                      ? 'bg-[#0F1B2F] text-[#C59E5D] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EN {slidesUrlEn ? '✓' : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlideLangTab('es')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeSlideLangTab === 'es'
                      ? 'bg-[#0F1B2F] text-[#C59E5D] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ES {slidesUrlEs ? '✓' : ''}
                </button>
              </div>
            </div>

            {/* Input para Colar Link Externo ou URL Gerada */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Link da Apresentação em {activeSlideLangTab.toUpperCase()} (Gamma.app / PDF):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={
                      activeSlideLangTab === 'pt'
                        ? slidesUrlPt
                        : activeSlideLangTab === 'en'
                          ? slidesUrlEn
                          : slidesUrlEs
                    }
                    onChange={(e) => {
                      const val = e.target.value
                      const formatted = (val.includes('gamma.app') || val.includes('<iframe') || val.includes('src='))
                        ? formatGammaEmbedUrl(val)
                        : val
                      if (activeSlideLangTab === 'pt') setSlidesUrlPt(formatted)
                      else if (activeSlideLangTab === 'en') setSlidesUrlEn(formatted)
                      else if (activeSlideLangTab === 'es') setSlidesUrlEs(formatted)
                    }}
                    placeholder="Cole o link do Gamma.app (ex: https://gamma.app/docs/... ou <iframe src=...>) ou URL de PDF"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/30 focus:border-[#C59E5D]"
                  />
                  {(activeSlideLangTab === 'pt' ? slidesUrlPt : activeSlideLangTab === 'en' ? slidesUrlEn : slidesUrlEs) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeSlideLangTab === 'pt') setSlidesUrlPt('')
                        else if (activeSlideLangTab === 'en') setSlidesUrlEn('')
                        else if (activeSlideLangTab === 'es') setSlidesUrlEs('')
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1"
                      title="Limpar link"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Botão de Upload (.pdf ou .pptx) */}
                <input
                  ref={slidesFileInputRef}
                  type="file"
                  accept=".pptx,.ppsx,.ppt,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleSlidesFileUpload(e.target.files[0])
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => slidesFileInputRef.current?.click()}
                  disabled={isUploadingSlides}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] text-xs font-bold rounded-xl border border-[#C59E5D]/40 transition shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                  title="Enviar arquivo de slides/PDF para o Supabase Storage"
                >
                  {isUploadingSlides ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C59E5D]" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 text-[#C59E5D]" />
                      <span>Upload de PDF / Slides</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                <span className="font-semibold text-slate-700">Dica Gamma:</span>
                <span>Aceita link direto do Gamma.app (docs/...), código &lt;iframe&gt; do Share &gt; Embed, ou PDF exportado do Gamma.</span>
              </p>
            </div>
          </div>

          {/* 5. Conteúdo / Texto da Aula (Totalmente editável e confortável) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#0F1B2F] uppercase tracking-wide">
                Conteúdo / Texto da Aula (Apostila Editável)
              </label>
              <span className="text-[11px] text-slate-400">
                Totalmente editável para complementos ou correções
              </span>
            </div>
            <textarea
              rows={11}
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="Digite ou edite o conteúdo integral da aula, tópicos explicativos, orientações práticas..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/30 focus:border-[#C59E5D] transition-all font-sans leading-relaxed min-h-[220px]"
            />
          </div>

          {/* 4. Avaliação / Quiz da Aula (Centralizado) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F2] border-2 border-[#C59E5D]/40 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C59E5D]/20 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0F1B2F] text-[#C59E5D] shrink-0">
                  <Award className="w-5 h-5 text-[#C59E5D]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#0F1B2F] uppercase tracking-wide flex items-center gap-2">
                    <span>4. Avaliação / Quiz da Aula</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F1B2F] text-[#C59E5D]">
                      Etapa 4 do AVA
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Centralize o Quiz Interativo Nativo e o link de prova do Google Drive/Forms da aula
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Modalidade 1: Quiz Interativo Nativo (AVA) */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0F1B2F] flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-[#C59E5D]" />
                      <span>Quiz Interativo Nativo (AVA)</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        lessonQuestionCount > 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {lessonQuestionCount > 0
                        ? `${lessonQuestionCount} ${lessonQuestionCount === 1 ? 'questão' : 'questões'} cadastradas`
                        : '0 questões'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Questões de múltipla escolha com 5 opções (A a E), auto-correção e gabarito comentado oficial.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsImporterOpenInModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] border border-[#C59E5D]/40 transition shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C59E5D]" />
                  <span>Gerenciar / Importar Questões (.docx, .pdf ou Texto)</span>
                </button>
              </div>

              {/* Modalidade 2: Prova / Atividade via Google Drive ou Google Forms */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0F1B2F] flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <span>Google Drive ou Google Forms</span>
                    </span>
                    {examDriveUrl.trim() && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        Link Ativo
                      </span>
                    )}
                  </div>
                  <label className="block text-[11px] font-medium text-slate-600">
                    Link da Prova / Formulário (Google Drive ou Google Forms):
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={examDriveUrl}
                      onChange={(e) => setExamDriveUrl(e.target.value)}
                      placeholder="https://docs.google.com/forms/d/... ou https://drive.google.com/..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C59E5D]"
                    />
                    {examDriveUrl && (
                      <button
                        type="button"
                        onClick={() => setExamDriveUrl('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1"
                        title="Limpar link"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 truncate">
                    Suporta formulários e documentos para preenchimento
                  </span>
                  {examDriveUrl.trim() && (
                    <a
                      href={examDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline shrink-0"
                    >
                      <span>Testar Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 6. Links Úteis da Aula (Secção Dinâmica) */}
          <div className="p-4 rounded-2xl bg-[#FAF8F2] border-2 border-[#C59E5D]/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#C59E5D]/20 text-[#0F1B2F]">
                  <Link2 className="w-4 h-4 text-[#C59E5D]" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#0F1B2F] uppercase tracking-wide">
                    Links Úteis da Aula
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Artigos oficiais, fontes regulatórias, calculadoras ou materiais complementares
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddUsefulLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] border border-[#C59E5D]/50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-[#C59E5D]" />
                <span>+ Adicionar Link Útil</span>
              </button>
            </div>

            {usefulLinks.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[#C59E5D]/40 text-center bg-white/70">
                <Link2 className="w-6 h-6 text-[#C59E5D]/60 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-700">Nenhum link complementar adicionado ainda</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Clique em "+ Adicionar Link Útil" acima para anexar referências a esta aula
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {usefulLinks.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-[#0F1B2F] bg-[#FAF8F2] px-2 py-0.5 rounded border border-[#C59E5D]/40 uppercase tracking-wide">
                        Link #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUsefulLink(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover este link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Título do Link <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateUsefulLink(idx, 'title', e.target.value)}
                          placeholder="Ex: Portal Oficial do IRS - W-2 Instructions"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C59E5D]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          URL / Link <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={item.url}
                          onChange={(e) => handleUpdateUsefulLink(idx, 'url', e.target.value)}
                          placeholder="https://www.irs.gov/pub/irs-pdf/iw2w3.pdf"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C59E5D]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Descrição Curta
                      </label>
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleUpdateUsefulLink(idx, 'description', e.target.value)}
                        placeholder="Ex: Guia passo a passo para conferência das retenções fiscais..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C59E5D]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé com Botões de Ação */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
            <div>
              {lesson?.id && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Deseja realmente excluir a aula "${lesson.title}" do Supabase?`)) {
                      onDelete(lesson.id)
                      onClose()
                    }
                  }}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition cursor-pointer flex items-center gap-1.5"
                  title="Excluir aula do banco de dados (remover duplicada)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Excluir Aula</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] border border-[#C59E5D]/50 shadow-md flex items-center gap-2 transition cursor-pointer"
                title="Visualizar aula na visão do aluno com as alterações atuais"
              >
                <Eye className="w-4 h-4 text-[#C59E5D]" />
                <span className="hidden sm:inline">Visualizar como Aluno</span>
                <span className="sm:hidden">Ver Aluno</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] shadow-md shadow-[#C59E5D]/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0F1B2F]" />
                    <span>Salvando no Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#0F1B2F]" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de Simulação da Sala de Aula do Aluno */}
      <StudentLessonPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        lesson={{
          id: lesson?.id,
          title: title.trim() || 'Aula sem Título',
          course_id: courseId,
          discipline_id: disciplineId,
          sequence_order: Number(sequenceOrder) || 1,
          duration_minutes: Number(durationMinutes) || 20,
          content_text: contentText,
          video_url: videoUrl,
          pdf_url: pdfUrl,
          pdf_name: pdfName,
          slides_url: slidesUrlPt || slidesUrlEn || slidesUrlEs,
          slides_url_pt: slidesUrlPt,
          slides_url_en: slidesUrlEn,
          slides_url_es: slidesUrlEs,
          useful_links: usefulLinks,
          exam_drive_url: examDriveUrl,
          materials: lesson?.materials || [],
        }}
        courseTitle={courses.find((c) => c.id === courseId)?.title}
        disciplineName={disciplines.find((d) => d.id === disciplineId)?.name}
      />

      {/* Modal Importador Inteligente de Provas Vinculado à Aula */}
      <SmartExamImporterModal
        isOpen={isImporterOpenInModal}
        onClose={() => {
          setIsImporterOpenInModal(false)
          if (lesson?.id) {
            assessmentService.countQuestionsByLessonId(lesson.id).then(setLessonQuestionCount).catch(() => {})
          }
        }}
        courses={courses}
        disciplines={disciplines}
        defaultCourseId={courseId}
        defaultDisciplineId={disciplineId}
        defaultLessonId={lesson?.id}
        onSaveToDatabaseSuccess={(saved) => {
          if (saved?.questions?.length) {
            setLessonQuestionCount(saved.questions.length)
          } else if (lesson?.id) {
            assessmentService.countQuestionsByLessonId(lesson.id).then(setLessonQuestionCount).catch(() => {})
          }
        }}
      />
    </div>
  )
}
