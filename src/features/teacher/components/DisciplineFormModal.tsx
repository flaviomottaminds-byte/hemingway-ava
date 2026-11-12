import React, { useState, useEffect } from 'react'
import { X, BookPlus, FileText, Clock, Hash, AlertCircle } from 'lucide-react'
import type { SupabaseDiscipline } from '../../../types'
import type { CreateDisciplineDTO } from '../../../services/curriculumService'

interface DisciplineFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateDisciplineDTO) => Promise<void>
  initialData?: SupabaseDiscipline | null
  isSubmitting?: boolean
}

export const DisciplineFormModal: React.FC<DisciplineFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSubmitting = false,
}) => {
  const isEditing = !!initialData

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [estimatedHours, setEstimatedHours] = useState<number | string>(12)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setDescription(initialData.description)
      setCode(initialData.code || '')
      setEstimatedHours(initialData.estimated_hours || 12)
    } else {
      setName('')
      setDescription('')
      setCode(`DISC-${Math.floor(100 + Math.random() * 900)}`)
      setEstimatedHours(14)
    }
    setErrors({})
  }, [initialData, isOpen])

  if (!isOpen) return null

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) {
      errs.name = 'O nome da disciplina é obrigatório.'
    } else if (name.trim().length < 4) {
      errs.name = 'O nome deve ter pelo menos 4 caracteres.'
    }

    if (!description.trim()) {
      errs.description = 'A descrição/ementa é obrigatória.'
    } else if (description.trim().length < 10) {
      errs.description = 'A descrição deve ter pelo menos 10 caracteres explicativos.'
    }

    const h = Number(estimatedHours)
    if (!h || isNaN(h) || h <= 0) {
      errs.estimatedHours = 'Carga horária inválida.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await onSave({
      name: name.trim(),
      description: description.trim(),
      code: code.trim(),
      estimated_hours: Number(estimatedHours),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Editar Disciplina' : 'Nova Disciplina'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Atualize a ementa e informações da matéria no banco geral.'
                  : 'Cadastre uma nova matéria para ser vinculada aos cursos do AVA.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome da Disciplina */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome da Disciplina <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Direitos Trabalhistas e Legislação FLSA"
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Código e Carga Horária */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                Código
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: LAW-201"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Carga Estimada (h) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="12"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Descrição / Ementa (Textarea) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Descrição / Ementa da Disciplina <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhadamente o conteúdo programático, competências adquiridas e tópicos das aulas..."
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.description
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Rodapé com Ações */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando no Supabase...</span>
                </>
              ) : (
                <span>{isEditing ? 'Atualizar Disciplina' : 'Salvar Disciplina'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
