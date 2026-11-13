import React, { useState, useEffect, useRef } from 'react'
import {
  ChevronRight,
  Save,
  X,
  Play,
  FileText,
  Upload,
  Paperclip,
  Trash2,
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Code,
  Eye,
  PenTool,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Database,
  GraduationCap,
} from 'lucide-react'
import type {
  SupabaseCourse,
  SupabaseDiscipline,
  SupabaseLesson,
  LessonAttachment,
} from '../../types'
import { courseService } from '../../services/courseService'
import { curriculumService } from '../../services/curriculumService'
import { lessonService, extractYouTubeId } from '../../services/lessonService'

interface TeacherLessonEditorViewProps {
  lessonId?: string | null
  initialCourseId?: string
  initialDisciplineId?: string
  onCancel: () => void
  onSaveSuccess: (savedLesson: SupabaseLesson) => void
}

const YOUTUBE_EXAMPLES = [
  {
    label: 'Aula FLSA & W-2 (Demo)',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    label: 'Direitos nos EUA (Civics)',
    url: 'https://www.youtube.com/watch?v=kXYiU_JCYtU',
  },
]

export const TeacherLessonEditorView: React.FC<TeacherLessonEditorViewProps> = ({
  lessonId,
  initialCourseId,
  initialDisciplineId,
  onCancel,
  onSaveSuccess,
}) => {
  const isEditing = Boolean(lessonId)

  // Dados de contexto
  const [courses, setCourses] = useState<SupabaseCourse[]>([])
  const [disciplines, setDisciplines] = useState<SupabaseDiscipline[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || '')
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>(
    initialDisciplineId || '',
  )

  // Campos do Formulário Principal
  const [title, setTitle] = useState('')
  const [sequenceOrder, setSequenceOrder] = useState<number | string>(1)
  const [durationMinutes, setDurationMinutes] = useState<number | string>(25)
  const [contentText, setContentText] = useState('')
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write')

  // Mídia e Vídeo do YouTube
  const [videoUrl, setVideoUrl] = useState('')
  const [detectedYouTubeId, setDetectedYouTubeId] = useState<string | null>(null)

  // Materiais Complementares
  const [materials, setMaterials] = useState<LessonAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados de Validação e Submissão
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Carrega cursos e disciplinas para os selects e breadcrumbs
  useEffect(() => {
    const loadContextData = async () => {
      try {
        const [loadedCourses, loadedDisciplines] = await Promise.all([
          courseService.getCourses(),
          curriculumService.getDisciplines(),
        ])
        setCourses(loadedCourses)
        setDisciplines(loadedDisciplines)

        if (!selectedCourseId && loadedCourses.length > 0) {
          setSelectedCourseId(loadedCourses[0].id)
        }
        if (!selectedDisciplineId && loadedDisciplines.length > 0) {
          setSelectedDisciplineId(loadedDisciplines[0].id)
        }
      } catch (err) {
        console.error('Erro ao carregar cursos e disciplinas:', err)
      }
    }
    loadContextData()
  }, [])

  // Carrega dados da aula se estiver em modo de edição
  useEffect(() => {
    if (!lessonId) {
      // Padrão para nova aula
      setTitle('')
      setSequenceOrder(1)
      setDurationMinutes(20)
      setContentText(`## 📘 Introdução ao Estudo

Escreva aqui o conteúdo da apostila e os tópicos que o aluno estudará nesta aula...

### Principais Objetivos
1. Compreender os fundamentos práticos.
2. Aplicar o conhecimento nas situações do dia a dia nos EUA.`)
      setVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      setMaterials([
        {
          id: 'mat-sample-1',
          name: 'Apostila_Resumo_Aula_PDF.pdf',
          size: '1.4 MB',
          type: 'pdf',
          url: '#',
        },
      ])
      return
    }

    const loadLesson = async () => {
      try {
        const data = await lessonService.getLessonById(lessonId)
        if (data) {
          setTitle(data.title)
          setSequenceOrder(data.sequence_order)
          setDurationMinutes(data.duration_minutes)
          setContentText(data.content_text)
          setVideoUrl(data.video_url)
          setMaterials(data.materials || [])
          if (data.course_id) setSelectedCourseId(data.course_id)
          if (data.discipline_id) setSelectedDisciplineId(data.discipline_id)
        }
      } catch (err) {
        console.error('Erro ao carregar lição para edição:', err)
        showToast('Erro ao carregar dados da aula.')
      }
    }
    loadLesson()
  }, [lessonId])

  // Efeito reativo para extrair o ID do YouTube em tempo real
  useEffect(() => {
    const id = extractYouTubeId(videoUrl)
    setDetectedYouTubeId(id)
  }, [videoUrl])

  // Informações do Curso e Disciplina para Breadcrumbs
  const currentCourse = courses.find((c) => c.id === selectedCourseId)
  const currentDiscipline = disciplines.find((d) => d.id === selectedDisciplineId)

  // Funções da Barra de Ferramentas do Editor Rico (WYSIWYG Markdown)
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = textarea.value.substring(start, end) || defaultText

    const replacement = `${prefix}${selected}${suffix}`
    const newValue =
      textarea.value.substring(0, start) + replacement + textarea.value.substring(end)

    setContentText(newValue)

    // Recoloca o foco e reposiciona o cursor
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    }, 0)
  }

  // Upload e Adição de Materiais
  const handleAddAttachment = (name: string, size: string = '1.8 MB', type: 'pdf' | 'doc' | 'slides' = 'pdf') => {
    const newMat: LessonAttachment = {
      id: `mat-${Date.now()}`,
      name,
      size,
      type,
      url: '#',
    }
    setMaterials((prev) => [...prev, newMat])
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      handleAddAttachment(file.name, `${sizeMb} MB`, file.name.endsWith('.pdf') ? 'pdf' : 'doc')
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      handleAddAttachment(file.name, `${sizeMb} MB`, file.name.endsWith('.pdf') ? 'pdf' : 'doc')
    }
  }

  const handleRemoveMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }

  // Validação do Formulário
  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!title.trim()) {
      errs.title = 'O título da aula é obrigatório.'
    } else if (title.trim().length < 4) {
      errs.title = 'O título deve ter no mínimo 4 caracteres.'
    }

    if (!selectedCourseId) {
      errs.course = 'Selecione o curso vinculado.'
    }

    if (!selectedDisciplineId) {
      errs.discipline = 'Selecione a disciplina vinculada.'
    }

    if (!contentText.trim()) {
      errs.content = 'O texto-base (apostila) da aula não pode ficar vazio.'
    }

    if (videoUrl.trim() && !detectedYouTubeId) {
      errs.video = 'A URL fornecida não é um link válido do YouTube.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Salvar Aula no Supabase
  const handleSave = async () => {
    if (!validate()) return
    setIsSubmitting(true)

    try {
      const payload = {
        course_id: selectedCourseId,
        discipline_id: selectedDisciplineId,
        title: title.trim(),
        sequence_order: Number(sequenceOrder) || 1,
        duration_minutes: Number(durationMinutes) || 20,
        content_text: contentText,
        video_url: videoUrl.trim(),
        materials,
      }

      let saved: SupabaseLesson
      if (lessonId) {
        saved = await lessonService.updateLesson(lessonId, payload)
        showToast(`Aula "${saved.title}" atualizada com sucesso no Supabase!`)
      } else {
        saved = await lessonService.createLesson(payload)
        showToast(`Nova aula "${saved.title}" gravada no Supabase!`)
      }

      onSaveSuccess(saved)
    } catch (err) {
      console.error('Erro ao salvar aula:', err)
      showToast('Falha ao gravar aula no banco de dados.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F1B2F] text-[#FAF8F2] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-[#C59E5D] animate-in slide-in-from-top-4 duration-200">
          <Database className="w-4 h-4 text-[#C59E5D]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. CABEÇALHO E CONTEXTO: BREADCRUMBS & AÇÕES */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        {/* Breadcrumbs de Navegação */}
        <nav
          aria-label="Trilha de navegação"
          className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-medium"
        >
          <button
            type="button"
            onClick={onCancel}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Meus Cursos
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 font-semibold truncate max-w-[200px]">
            {currentCourse?.title || 'Curso Selecionado'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 font-semibold truncate max-w-[200px]">
            {currentDiscipline?.name || 'Disciplina'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
            {isEditing ? 'Editar Aula' : 'Nova Aula'}
          </span>
        </nav>

        {/* Título Principal e Botões de Ação no Topo Direito */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-600/10 text-blue-600">
                <PenTool className="w-5 h-5" />
              </span>
              <span>{isEditing ? 'Editar Aula / Estudo' : 'Adicionar Novo Estudo'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Estruture o conteúdo programático, vídeo demonstrativo do YouTube e materiais de leitura.
            </p>
          </div>

          {/* Botões: Cancelar e Salvar Aula */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#C59E5D]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#0F1B2F]/30 border-t-[#0F1B2F] rounded-full animate-spin" />
                  <span>Gravando no Banco...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Aula</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal: 2 Colunas no Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= COLUNA PRINCIPAL ESQUERDA (FORMULÁRIO & APOSTILA) ================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card de Identificação da Aula */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Informações Básicas da Aula</span>
            </h3>

            {/* Seleção de Curso e Disciplina */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Curso Vinculado <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                {errors.course && <p className="text-xs text-red-600 mt-1">{errors.course}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disciplina Vinculada <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDisciplineId}
                  onChange={(e) => setSelectedDisciplineId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code ? `[${d.code}] ` : ''}
                      {d.name}
                    </option>
                  ))}
                </select>
                {errors.discipline && (
                  <p className="text-xs text-red-600 mt-1">{errors.discipline}</p>
                )}
              </div>
            </div>

            {/* Título da Aula */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                Título da Aula <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Compreendendo o Formulário W-2, 1099 e Direitos no Trabalho"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.title
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />
              {errors.title && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Ordem / Sequência e Duração Estimada */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  Ordem / Sequência na Disciplina <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={sequenceOrder}
                  onChange={(e) => setSequenceOrder(e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Define a posição da aula para o aluno.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Duração Estimada (minutos)
                </label>
                <input
                  type="number"
                  min={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="25"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Tempo médio para assistir e ler.
                </span>
              </div>
            </div>
          </div>

          {/* 2. TEXTO-BASE (APOSTILA) COM SIMULADOR DE EDITOR RICO (WYSIWYG) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Texto-Base (Apostila do Estudo) <span className="text-red-500">*</span>
                </h3>
              </div>

              {/* Alternador Escrever / Pré-visualizar */}
              <div className="bg-white border border-slate-200 rounded-xl p-0.5 flex text-xs">
                <button
                  type="button"
                  onClick={() => setEditorMode('write')}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    editorMode === 'write'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3 h-3" />
                  <span>Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('preview')}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    editorMode === 'preview'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Visualizar Prévia</span>
                </button>
              </div>
            </div>

            {/* Barra de Ferramentas Rica (Toolbar) */}
            {editorMode === 'write' && (
              <div className="px-4 py-2 border-b border-slate-100 bg-white flex flex-wrap items-center gap-1 text-slate-600">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**', 'texto em negrito')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Negrito (Ctrl+B)"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*', 'texto em itálico')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Itálico (Ctrl+I)"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<u>', '</u>', 'texto sublinhado')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Sublinhado"
                >
                  <Underline className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                <button
                  type="button"
                  onClick={() => insertFormatting('\n## ', '\n', 'Título do Tópico')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer font-bold text-xs"
                  title="Cabeçalho H2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n### ', '\n', 'Subtítulo')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Cabeçalho H3"
                >
                  <Heading3 className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                <button
                  type="button"
                  onClick={() => insertFormatting('\n- ', '', 'Item da lista')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Lista com Marcadores"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n1. ', '', 'Primeiro passo')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Lista Numerada"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertFormatting('\n> ', '', 'Citação importante sobre as leis nos EUA')
                  }
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Citação em Bloco"
                >
                  <Quote className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                <button
                  type="button"
                  onClick={() =>
                    insertFormatting('[', '](https://exemplo.com)', 'Link explicativo')
                  }
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Inserir Link"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('`', '`', 'código')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Código / Destaque"
                >
                  <Code className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Área de Redação */}
            {editorMode === 'write' ? (
              <div className="p-4">
                <textarea
                  ref={textareaRef}
                  rows={14}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Redija o texto pedagógico da apostila, tópicos e orientações para os imigrantes..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans leading-relaxed"
                />
                {errors.content && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.content}
                  </p>
                )}
              </div>
            ) : (
              /* Pré-visualização Renderizada */
              <div className="p-6 max-h-[420px] overflow-y-auto bg-slate-50/50">
                <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-line leading-relaxed">
                  {contentText || (
                    <span className="text-slate-400 italic">
                      Nenhum conteúdo digitado ainda no editor.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= COLUNA LATERAL DIREITA (YOUTUBE & MATERIAIS) ================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* 3. MÍDIA E YOUTUBE COM PREVIEW INSTANTÂNEO */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Vídeo da Aula (YouTube)
                  </h3>
                  <span className="text-[11px] text-slate-400">Player embutido em tempo real</span>
                </div>
              </div>

              {detectedYouTubeId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ID: {detectedYouTubeId}</span>
                </span>
              )}
            </div>

            {/* Input da URL do YouTube */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cole a URL do Vídeo
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    detectedYouTubeId
                      ? 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
              </div>

              {/* Exemplos Rápidos */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-slate-400">Testar com exemplo:</span>
                {YOUTUBE_EXAMPLES.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setVideoUrl(ex.url)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PREVIEW DO PLAYER DO YOUTUBE */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 aspect-video flex items-center justify-center relative shadow-inner">
              {detectedYouTubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${detectedYouTubeId}?rel=0&modestbranding=1`}
                  title="Preview do Vídeo da Aula"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="p-6 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    <Play className="w-6 h-6 ml-0.5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">
                    Nenhum vídeo carregado no momento
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Cole uma URL do YouTube acima para visualizar instantaneamente o player que será exibido aos alunos.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4. MATERIAIS COMPLEMENTARES (DRAG AND DROP OU UPLOAD) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Materiais Complementares
                  </h3>
                  <span className="text-[11px] text-slate-400">PDFs, apostilas e slides de apoio</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {materials.length} anexos
              </span>
            </div>

            {/* Área de Drag & Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
                  : 'border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Arraste seus arquivos aqui ou{' '}
                <span className="text-blue-600 hover:underline">clique para selecionar</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Suporta PDFs, planilhas e apresentações (até 25 MB por arquivo)
              </p>
            </div>

            {/* Lista de Materiais Anexados */}
            <div className="space-y-2">
              {materials.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">
                  Nenhum material de apoio anexado nesta aula ainda.
                </p>
              ) : (
                materials.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="p-2 rounded-lg bg-red-100 text-red-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400">{item.size}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover anexo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Ação Inferior Fixa ou Final */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Ao salvar, a aula será sincronizada na tabela <strong>lessons</strong> do Supabase e ficará disponível para os estudantes do AVA.
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Gravando Aula...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Aula</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
