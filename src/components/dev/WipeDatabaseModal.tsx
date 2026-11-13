import React, { useState } from 'react'
import { AlertTriangle, Trash2, X, Loader2, CheckCircle2 } from 'lucide-react'
import { dbCleanerService, type WipeResult } from '../../services/dbCleanerService'

interface WipeDatabaseModalProps {
  isOpen: boolean
  onClose: () => void
  onWiped?: () => void
}

export const WipeDatabaseModal: React.FC<WipeDatabaseModalProps> = ({
  isOpen,
  onClose,
  onWiped,
}) => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<WipeResult | null>(null)

  if (!isOpen) return null

  const handleConfirmWipe = async () => {
    setLoading(true)
    try {
      const res = await dbCleanerService.wipeAllData()
      setResult(res)
      setTimeout(() => {
        onWiped?.()
        onClose()
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      console.error('Erro na limpeza:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-red-200 overflow-hidden my-auto flex flex-col">
        {/* Topo do Modal */}
        <div className="px-6 py-5 bg-red-950 text-white flex items-center justify-between border-b border-red-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-red-50">Zerar Dados de Teste</h2>
              <p className="text-xs text-red-300">Limpeza total do banco e cache</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-red-300 hover:text-white rounded-xl hover:bg-red-900/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-4">
          {result ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Banco de Dados Zerado com Sucesso!</h3>
              <p className="text-xs text-slate-600">
                Todas as tabelas (enrollments, lessons, course_disciplines, disciplines, courses, profiles) foram limpas.
              </p>
              <div className="text-[11px] text-slate-400">Atualizando aplicação...</div>
            </div>
          ) : (
            <>
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Atenção: Ação Irreversível</p>
                  <p className="text-[11px] leading-relaxed text-red-700">
                    Esta ação removerá todos os registros das seguintes tabelas no Supabase:
                  </p>
                  <ul className="list-disc list-inside text-[10px] text-red-600 space-y-0.5 pl-1">
                    <li>enrollments (matrículas)</li>
                    <li>lessons (aulas)</li>
                    <li>course_disciplines (vínculos da grade)</li>
                    <li>disciplines (disciplinas)</li>
                    <li>courses (cursos)</li>
                    <li>profiles (usuários e alunos)</li>
                  </ul>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Ao confirmar, o sistema retornará ao estado 100% limpo ("em branco") para que você possa iniciar seus testes reais do zero, sem nenhum registro fictício.
              </p>
            </>
          )}
        </div>

        {/* Rodapé */}
        {!result && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmWipe}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-red-600/25 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Limpando banco...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sim, Zerar Tudo Agora</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
