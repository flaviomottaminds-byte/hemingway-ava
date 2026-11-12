import React, { useState } from 'react'
import {
  X,
  Layers,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'
import type { SupabaseCourse } from '../../../types'

interface CourseDisciplinesModalProps {
  course: SupabaseCourse | null
  isOpen: boolean
  onClose: () => void
  onUpdateDisciplinesCount: (courseId: string, newCount: number) => Promise<void>
  onNavigateToCurriculum?: (courseId: string) => void
}

interface DisciplineItem {
  id: string
  title: string
  hours: number
  lessonsCount: number
}

export const CourseDisciplinesModal: React.FC<CourseDisciplinesModalProps> = ({
  course,
  isOpen,
  onClose,
  onUpdateDisciplinesCount,
  onNavigateToCurriculum,
}) => {
  if (!isOpen || !course) return null

  // Estado inicial de disciplinas simuladas para este curso
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>([
    {
      id: 'd-1',
      title: 'Módulo 1: Fundamentos & Vocabulário Chave',
      hours: Math.max(4, Math.floor(course.workload_hours * 0.3)),
      lessonsCount: 6,
    },
    {
      id: 'd-2',
      title: 'Módulo 2: Casos Práticos & Aplicação no Dia a Dia',
      hours: Math.max(6, Math.floor(course.workload_hours * 0.4)),
      lessonsCount: 8,
    },
    {
      id: 'd-3',
      title: 'Módulo 3: Legislação & Conformidade',
      hours: Math.max(4, Math.floor(course.workload_hours * 0.3)),
      lessonsCount: 5,
    },
  ])

  const [newTitle, setNewTitle] = useState('')
  const [newHours, setNewHours] = useState('5')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddDiscipline = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newItem: DisciplineItem = {
      id: `d-${Date.now()}`,
      title: newTitle.trim(),
      hours: Number(newHours) || 4,
      lessonsCount: 4,
    }

    const updated = [...disciplines, newItem]
    setDisciplines(updated)
    setNewTitle('')
    setIsAdding(false)
    await onUpdateDisciplinesCount(course.id, updated.length)
  }

  const handleDeleteDiscipline = async (id: string) => {
    const updated = disciplines.filter((d) => d.id !== id)
    setDisciplines(updated)
    await onUpdateDisciplinesCount(course.id, updated.length)
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Gerenciar Disciplinas</h2>
              <p className="text-xs text-slate-500 line-clamp-1">{course.title}</p>
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

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Disciplinas / Módulos Cadastrados ({disciplines.length})
            </span>
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Disciplina</span>
              </button>
            )}
          </div>

          {/* Form para adicionar nova disciplina */}
          {isAdding && (
            <form
              onSubmit={handleAddDiscipline}
              className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3 animate-in fade-in duration-150"
            >
              <div className="font-semibold text-xs text-blue-900">Nova Disciplina / Módulo</div>
              <div>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nome da disciplina (ex: Módulo 4: Avaliação Prática)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32">
                  <input
                    type="number"
                    min={1}
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                    placeholder="Horas"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                  >
                    Salvar Disciplina
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Lista de Disciplinas */}
          <div className="space-y-2.5">
            {disciplines.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
                Nenhuma disciplina cadastrada neste curso ainda. Clique em "Adicionar Disciplina".
              </div>
            ) : (
              disciplines.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between hover:border-slate-300 transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.hours}h de duração
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {item.lessonsCount} aulas
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteDiscipline(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remover disciplina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Estrutura curricular sincronizada com o AVA</span>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToCurriculum && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onNavigateToCurriculum(course.id)
                }}
                className="px-4 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl cursor-pointer"
              >
                Abrir Montador de Grade →
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
