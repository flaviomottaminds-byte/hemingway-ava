import React, { useState, useEffect } from 'react'
import {
  X,
  BookOpen,
  Clock,
  Globe,
  CheckCircle,
  FileEdit,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import type { SupabaseCourse, CourseStatus, CourseLanguage } from '../../../types'
import type { CreateCourseDTO } from '../../../services/courseService'

interface CourseFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateCourseDTO) => Promise<void>
  initialData?: SupabaseCourse | null
  isSubmitting?: boolean
}

const COVER_PRESETS = [
  {
    label: 'Negócios / Mercado',
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=80',
  },
  {
    label: 'Direito & Leis',
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=700&q=80',
  },
  {
    label: 'Finanças & Crédito',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=700&q=80',
  },
  {
    label: 'Cidadania & Civismo',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=80',
  },
]

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSubmitting = false,
}) => {
  const isEditing = !!initialData

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [workloadHours, setWorkloadHours] = useState<number | string>(20)
  const [defaultLanguage, setDefaultLanguage] = useState<CourseLanguage>('pt')
  const [status, setStatus] = useState<CourseStatus>('draft')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setDescription(initialData.description)
      setWorkloadHours(initialData.workload_hours)
      setDefaultLanguage(initialData.default_language)
      setStatus(initialData.status)
      setCoverImageUrl(initialData.cover_image_url || '')
    } else {
      // Padrões ao criar novo curso
      setTitle('')
      setDescription('')
      setWorkloadHours(24)
      setDefaultLanguage('pt')
      setStatus('draft')
      setCoverImageUrl(COVER_PRESETS[0].url)
    }
    setErrors({})
  }, [initialData, isOpen])

  if (!isOpen) return null

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!title.trim()) {
      errs.title = 'O título do curso é obrigatório.'
    } else if (title.trim().length < 4) {
      errs.title = 'O título deve ter pelo menos 4 caracteres.'
    }

    if (!description.trim()) {
      errs.description = 'A descrição do curso é obrigatória.'
    } else if (description.trim().length < 10) {
      errs.description = 'A descrição deve ter pelo menos 10 caracteres explicativos.'
    }

    const hours = Number(workloadHours)
    if (!hours || isNaN(hours) || hours <= 0) {
      errs.workloadHours = 'Informe uma carga horária válida (mínimo 1 hora).'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await onSave({
      title: title.trim(),
      description: description.trim(),
      workload_hours: Number(workloadHours),
      default_language: defaultLanguage,
      status,
      cover_image_url: coverImageUrl.trim() || COVER_PRESETS[0].url,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-blue-50/30 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              {isEditing ? <FileEdit className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {isEditing ? 'Editar Curso' : 'Criar Novo Curso'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Atualize os dados e configurações do curso no Supabase.'
                  : 'Preencha os campos para cadastrar o novo curso no catálogo do AVA.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Fechar formulário"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Título do Curso */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Título do Curso <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Inglês Prático para Comunicação no Trabalho"
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.title
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Descrição do Curso <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a ementa, os principais tópicos abordados e os objetivos para o aluno imigrante..."
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.description
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Carga Horária, Idioma Padrão e Status (Grid Responsivo) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Carga Horária Total */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Carga Horária (h) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={workloadHours}
                onChange={(e) => setWorkloadHours(e.target.value)}
                placeholder="Ex: 30"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.workloadHours
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20'
                }`}
              />
              {errors.workloadHours && (
                <p className="mt-1 text-xs text-red-600">{errors.workloadHours}</p>
              )}
            </div>

            {/* Idioma Padrão */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                Idioma Padrão
              </label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value as CourseLanguage)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="pt">🇧🇷 Português</option>
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
              </select>
            </div>

            {/* Status (Rascunho / Publicado) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
                Status do Curso
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CourseStatus)}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  status === 'published'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-500/20'
                    : 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-500/20'
                }`}
              >
                <option value="draft">🟡 Rascunho</option>
                <option value="published">🟢 Publicado</option>
              </select>
            </div>
          </div>

          {/* Imagem de Capa (Placeholder / URL) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                Imagem de Capa (URL)
              </label>
              <span className="text-[11px] text-slate-400">Sugestões rápidas</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {COVER_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCoverImageUrl(preset.url)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    coverImageUrl === preset.url
                      ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              {coverImageUrl && (
                <div className="w-14 h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                  <img
                    src={coverImageUrl}
                    alt="Preview de capa"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src = COVER_PRESETS[0].url
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Badge Informativo Supabase */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2.5 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Os dados deste curso serão salvos na tabela <strong>courses</strong> do Supabase e persistidos localmente.
            </span>
          </div>

          {/* Ações do Rodapé do Modal */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando no Banco...</span>
                </>
              ) : (
                <span>{isEditing ? 'Atualizar Curso' : 'Salvar Curso'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
