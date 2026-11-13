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
} from 'lucide-react'
import type { SupabaseLesson, SupabaseCourse, SupabaseDiscipline } from '../../../types'
import { lessonService, extractYouTubeId } from '../../../services/lessonService'
import { courseService } from '../../../services/courseService'
import { curriculumService } from '../../../services/curriculumService'
import { extractTextFromPdf } from '../../../utils/pdfExtractor'

interface LessonEditModalProps {
  isOpen: boolean
  onClose: () => void
  lesson: SupabaseLesson | null
  onSaved: (savedLesson: SupabaseLesson) => void
}

export const LessonEditModal: React.FC<LessonEditModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onSaved,
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

  // Gestão de PDF
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [pdfName, setPdfName] = useState<string>('')
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [isExtractingPdf, setIsExtractingPdf] = useState(false)
  const [isPdfDragging, setIsPdfDragging] = useState(false)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Estado de submissão e feedback
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
      setErrorMessage(null)
      setSuccessMessage(null)
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
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [isOpen, lesson])

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
      }

      let saved: SupabaseLesson
      if (isEditing && lesson?.id) {
        saved = await lessonService.updateLesson(lesson.id, payload)
      } else {
        saved = await lessonService.createLesson(payload)
      }

      setSuccessMessage('Aula atualizada com sucesso!')
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
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-[#1C2E4A] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
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

          {/* Rodapé com Botões de Ação */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
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
        </form>
      </div>
    </div>
  )
}
