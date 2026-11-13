import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  Search,
  Menu,
  GraduationCap,
  LayoutDashboard,
  Video,
  LogOut,
  Sparkles,
  ShieldAlert,
} from 'lucide-react'
import { LanguageSelector } from '../common/LanguageSelector'
import type { UserProfile, ActiveView } from '../../types'

interface TopbarProps {
  user: UserProfile
  activeView?: ActiveView
  onSelectView?: (view: ActiveView) => void
  onToggleSidebar: () => void
  onNavigateHome: () => void
  onLogout: () => void
  currentRole?: 'student' | 'teacher' | 'admin'
  onToggleRole?: () => void
}

export const Topbar: React.FC<TopbarProps> = ({
  user,
  activeView,
  onSelectView,
  onToggleSidebar,
  onNavigateHome,
  onLogout,
  currentRole = 'student',
  onToggleRole,
}) => {
  const { t } = useTranslation()

  let ringColor = 'ring-blue-500/30'
  let roleBadgeClass = 'bg-blue-100 text-blue-700'
  let roleText = 'Aluno'

  if (currentRole === 'admin') {
    ringColor = 'ring-red-500/40'
    roleBadgeClass = 'bg-red-100 text-red-700'
    roleText = 'Administrador'
  } else if (currentRole === 'teacher') {
    ringColor = 'ring-indigo-500/40'
    roleBadgeClass = 'bg-indigo-100 text-indigo-700'
    roleText = 'Professor'
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Esquerda: Botão Menu Mobile + Identidade Visual */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="h-10 rounded-xl overflow-hidden bg-[#f7f5ed] border border-slate-200/80 shadow-xs flex items-center px-1 group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/logo-hemingway.png"
                alt="Hemingway School Logo"
                className="h-9 w-auto object-contain"
              />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Hemingway <span className="text-[#0d1b2a]">School</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                  AVA
                </span>
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block leading-none">
                {t('common.tagline', 'Ambiente Virtual de Aprendizagem')}
              </p>
            </div>
          </button>
        </div>

        {/* Centro-Esquerda: Barra de Navegação Rápida Global */}
        {onSelectView && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shadow-xs">
            <button
              type="button"
              onClick={() => onSelectView('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
              <span>Painel de Cursos</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('classroom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'classroom'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sala de Aula Virtual</span>
            </button>

            {currentRole === 'teacher' && (
              <button
                type="button"
                onClick={() => onSelectView('teacher-courses')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  activeView?.startsWith('teacher')
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Meus Cursos</span>
              </button>
            )}

            {currentRole === 'admin' && (
              <button
                type="button"
                onClick={() => onSelectView('teacher-courses')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  activeView?.startsWith('teacher')
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-red-700 hover:bg-red-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Gestão Global</span>
              </button>
            )}
          </nav>
        )}

        {/* Centro: Barra de Pesquisa */}
        <div className="hidden xl:flex flex-1 max-w-xs mx-2">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={t('common.search', 'Buscar cursos, aulas, materiais...')}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Direita: Seletor de Idioma, Notificações, Perfil e Alternador */}
        <div className="flex items-center gap-2.5">
          {/* Seletor de Idioma i18n instantâneo */}
          <LanguageSelector variant="dropdown" />

          {/* Botão de Notificações */}
          <button
            type="button"
            aria-label={t('common.notifications', 'Notificações')}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Avatar e Perfil Resumido */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className={`w-9 h-9 rounded-full object-cover ring-2 ${ringColor}`}
            />
            <div className="hidden lg:block text-left leading-tight">
              <span className="block text-xs font-semibold text-slate-800">
                {user.name.split(' ')[0]} {user.name.split(' ')[1]?.[0]}.
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${roleBadgeClass}`}>
                  {roleText}
                </span>
              </div>
            </div>

            {/* Botão sutil para ciclar perfil na topbar também */}
            {onToggleRole && (
              <button
                type="button"
                onClick={onToggleRole}
                className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
                title="Ciclar Perfil: Aluno → Professor → Admin"
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Ciclar</span>
              </button>
            )}

            {/* Logout rápido */}
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              title="Sair da Plataforma"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
