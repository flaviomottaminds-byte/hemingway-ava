import React from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import type { SupabaseCourse } from '../../../types'

interface CourseDeleteDialogProps {
  course: SupabaseCourse | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isDeleting?: boolean
}

export const CourseDeleteDialog: React.FC<CourseDeleteDialogProps> = ({
  course,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !course) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir Curso</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Você tem certeza de que deseja excluir o curso{' '}
            <strong className="text-slate-900">"{course.title}"</strong>?
          </p>
          <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 text-[11px] text-red-800">
            Esta ação simula a remoção permanente do registro na tabela <strong>courses</strong> do Supabase e removerá todo o conteúdo associado.
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmar Exclusão</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
