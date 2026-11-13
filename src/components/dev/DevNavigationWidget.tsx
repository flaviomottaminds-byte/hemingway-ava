import React, { useState } from 'react'
import {
  Users,
  GraduationCap,
  LayoutDashboard,
  Video,
  Layers,
  PenTool,
  FileQuestion,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
  LogOut,
  Sparkles,
  Award,
} from 'lucide-react'
import type { ActiveView } from '../../types'

interface DevNavigationWidgetProps {
  currentRole: 'student' | 'teacher' | 'admin'
  activeView: ActiveView
  onToggleRole: () => void
  onSelectRole?: (role: 'student' | 'teacher' | 'admin') => void
  onSelectView: (view: ActiveView) => void
  onLogout: () => void
}

export const DevNavigationWidget: React.FC<DevNavigationWidgetProps> = ({
  currentRole,
  activeView,
  onToggleRole,
  onSelectRole,
  onSelectView,
  onLogout,
}) => {
  // A barra de simulação DEVE SER OCULTADA EM 100% em produção
  if (!import.meta.env.DEV) {
    return null
  }

  const [isExpanded, setIsExpanded] = useState(false)

  // Determina rótulos, cores e próximo estado do ciclo
  let roleLabel = 'Aluno'
  let nextRoleLabel = 'Professor'
  let roleBadgeClass = 'bg-[#C59E5D]/20 text-[#C59E5D] border border-[#C59E5D]/40'
  let buttonBg = 'bg-[#0F1B2F] hover:bg-[#1C2E4A] text-white border border-[#C59E5D]/50 shadow-md shadow-[#0F1B2F]/30'

  if (currentRole === 'teacher') {
    roleLabel = 'Professor'
    nextRoleLabel = 'Admin'
    roleBadgeClass = 'bg-[#C59E5D] text-[#0F1B2F] font-bold border border-[#C59E5D]'
    buttonBg = 'bg-[#0F1B2F] hover:bg-[#1C2E4A] text-white border border-[#C59E5D] shadow-md shadow-[#0F1B2F]/30'
  } else if (currentRole === 'admin') {
    roleLabel = 'Admin'
    nextRoleLabel = 'Aluno'
    roleBadgeClass = 'bg-red-950/80 text-red-300 border border-red-500/40'
    buttonBg = 'bg-[#0F1B2F] hover:bg-[#1C2E4A] text-white border border-red-500/60 shadow-md shadow-[#0F1B2F]/30'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end print:hidden select-none">
      {/* Painel Expandido com atalhos para todas as telas divididas por perfil */}
      {isExpanded && (
        <div className="mb-2 w-88 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-4 max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Dev Mode • 3 Perfis AVA
              </span>
            </div>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${roleBadgeClass}`}
            >
              Perfil: {roleLabel}
            </span>
          </div>

          {/* Botão Cíclico: Alternar Perfil */}
          <div className="py-3 border-b border-slate-800">
            <button
              type="button"
              onClick={onToggleRole}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${buttonBg}`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                Ciclar Perfil → Mudar para <strong>{nextRoleLabel}</strong>
              </span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-1.5">
              Cicla automaticamente: <strong>Aluno → Professor → Admin → Aluno</strong>.
            </p>

            {/* Seletores Diretos de Perfil */}
            {onSelectRole && (
              <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                <button
                  type="button"
                  onClick={() => onSelectRole('student')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition cursor-pointer ${
                    currentRole === 'student'
                      ? 'bg-blue-600 text-white ring-1 ring-white/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🎓 Aluno
                </button>
                <button
                  type="button"
                  onClick={() => onSelectRole('teacher')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition cursor-pointer ${
                    currentRole === 'teacher'
                      ? 'bg-indigo-600 text-white ring-1 ring-white/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  👨‍🏫 Professor
                </button>
                <button
                  type="button"
                  onClick={() => onSelectRole('admin')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition cursor-pointer ${
                    currentRole === 'admin'
                      ? 'bg-red-600 text-white ring-1 ring-white/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🛡️ Admin
                </button>
              </div>
            )}
          </div>

          {/* Atalhos: 1. Área do Aluno */}
          <div className="mt-3 space-y-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block px-1">
              1. Menu do Aluno (Foco no Aprendizado)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onSelectView('dashboard')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">Painel de Cursos</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectView('classroom')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition cursor-pointer ${
                  activeView === 'classroom'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Sala de Aula</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectView('courses')}
                className={`col-span-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition cursor-pointer ${
                  activeView === 'courses'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Certificados & Histórico</span>
              </button>
            </div>
          </div>

          {/* Atalhos: 2. Painel do Professor */}
          <div className="mt-3 space-y-1">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block px-1">
              2. Menu do Professor (Conteúdo Restrito)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onSelectView('teacher-courses')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition cursor-pointer ${
                  activeView === 'teacher-courses'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">Meus Cursos</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectView('teacher-lesson-editor')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition cursor-pointer ${
                  activeView === 'teacher-lesson-editor'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Criar Nova Aula</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectView('teacher-curriculum')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition cursor-pointer ${
                  activeView === 'teacher-curriculum'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">Banco Disciplinas</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectView('teacher-assessments')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition cursor-pointer ${
                  activeView === 'teacher-assessments'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileQuestion className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Avaliações</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectView('teacher-analytics')}
                className={`col-span-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition cursor-pointer ${
                  activeView === 'teacher-analytics'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Desempenho da Minha Turma</span>
              </button>
            </div>
          </div>

          {/* Atalhos: 3. Gestão Institucional Admin */}
          <div className="mt-3 space-y-1">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block px-1">
              3. Menu Administrativo (Gestão Institucional)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onSelectView('teacher-courses')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition cursor-pointer ${
                  activeView === 'teacher-courses'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">Visão Global Cursos</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectView('teacher-students')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition cursor-pointer ${
                  activeView === 'teacher-students'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">Gestão de Alunos</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectView('teacher-team')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition cursor-pointer ${
                  activeView === 'teacher-team'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Gestão de Equipe</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectView('teacher-analytics')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition cursor-pointer ${
                  activeView === 'teacher-analytics'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Relatórios Gerais</span>
              </button>
            </div>
          </div>

          {/* Sair / Voltar para Login */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Testar fluxo de autenticação:</span>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Voltar ao Login</span>
            </button>
          </div>
        </div>
      )}

      {/* Botão Principal Flutuante: "Alternar Perfil (Simulação)" */}
      <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-700/80">
        <button
          type="button"
          onClick={onToggleRole}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${buttonBg}`}
          title={`Clique para ciclar perfil: Aluno → Professor → Admin (Próximo: ${nextRoleLabel})`}
        >
          {currentRole === 'admin' ? (
            <ShieldAlert className="w-4 h-4 text-red-200" />
          ) : currentRole === 'teacher' ? (
            <GraduationCap className="w-4 h-4 text-indigo-200" />
          ) : (
            <Users className="w-4 h-4 text-blue-200" />
          )}
          <span>Alternar Perfil (Simulação)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-extrabold uppercase bg-black/30 text-white">
            {roleLabel}
          </span>
        </button>

        {/* Botão de Toggle do Menu de Telas */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          title={isExpanded ? 'Recolher menu' : 'Ver atalhos e seleção direta'}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
