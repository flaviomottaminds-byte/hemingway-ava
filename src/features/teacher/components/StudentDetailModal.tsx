import React from 'react'
import {
  X,
  Mail,
  MapPin,
  Award,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import type { StudentPerformanceRecord } from '../../../types'

interface StudentDetailModalProps {
  student: StudentPerformanceRecord | null
  isOpen: boolean
  onClose: () => void
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !student) return null

  const isPassing = student.average_grade >= 7.0
  const isCompleted = student.progress_percentage === 100

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho do Perfil */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <img
              src={student.avatar_url}
              alt={student.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/20 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{student.name}</h3>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : student.status === 'at_risk'
                      ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  }`}
                >
                  {isCompleted ? 'Concluído' : student.status === 'at_risk' ? 'Em Risco' : 'Ativo'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  {student.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {student.current_state}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-200 font-semibold">
                  {student.origin_country}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas do Aluno */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Grid de KPIs Individuais */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">Progresso</span>
              <span className="text-xl font-extrabold text-blue-700">
                {student.progress_percentage}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {student.completed_lessons}/{student.total_lessons} aulas
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">Nota Média</span>
              <span
                className={`text-xl font-extrabold ${
                  isPassing ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {student.average_grade.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {isPassing ? 'Aprovado (Média >= 7.0)' : 'Abaixo da Média'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">Quizzes Feitos</span>
              <span className="text-xl font-extrabold text-purple-700">
                {student.quizzes_taken}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">avaliações</span>
            </div>
          </div>

          {/* Barra de Progresso Visual Detalhada */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span>Evolução na Trilha de Estudos</span>
              <span>
                {student.completed_lessons} de {student.total_lessons} aulas finalizadas
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/70 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  student.progress_percentage === 100
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}
                style={{ width: `${student.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Histórico Recente de Avaliações / Quizzes */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Desempenho em Quizzes e Avaliações</span>
            </h4>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">Quiz Aula 1: Formulário W-2 vs 1099</p>
                  <p className="text-[11px] text-slate-400">Realizado há 2 dias • 4 tentativas restantes</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-600 text-sm">9.5 / 10</span>
                  <span className="block text-[10px] font-semibold text-emerald-700">Aprovado</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">Avaliação Módulo 1: Direitos Trabalhistas</p>
                  <p className="text-[11px] text-slate-400">Realizado há 5 dias</p>
                </div>
                <div className="text-right">
                  <span
                    className={`font-extrabold text-sm ${
                      student.average_grade >= 7 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {student.average_grade.toFixed(1)} / 10
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-500">Registrado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações de Acesso */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Último acesso à plataforma:</span>
            </div>
            <span className="font-bold">{student.last_access}</span>
          </div>
        </div>

        {/* Rodapé com Ações do Professor */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Registro acadêmico ativo</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
