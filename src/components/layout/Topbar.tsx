import React, { useState } from 'react'
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
  Trash2,
} from 'lucide-react'
import { LanguageSelector } from '../common/LanguageSelector'
import { WipeDatabaseModal } from '../dev/WipeDatabaseModal'
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
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false)

  let ringColor = 'ring-[#C59E5D]/60'
  let roleBadgeClass = 'bg-[#C59E5D]/20 text-[#C59E5D] border border-[#C59E5D]/40'
  let roleText = 'Aluno'

  if (currentRole === 'admin') {
    ringColor = 'ring-red-400/60'
    roleBadgeClass = 'bg-red-950/80 text-red-300 border border-red-500/40'
    roleText = 'Administrador'
  } else if (currentRole === 'teacher') {
    ringColor = 'ring-[#C59E5D]'
    roleBadgeClass = 'bg-[#C59E5D] text-[#0F1B2F] font-extrabold'
    roleText = 'Professor'
  }

  return (
    <header className="sticky top-0 z-40 bg-[#0F1B2F] border-b border-[#1C2E4A] px-4 sm:px-6 py-2.5 transition-colors shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Esquerda: Botão Menu Mobile + Identidade Visual */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-[#FAF8F2]/80 hover:text-[#C59E5D] hover:bg-[#1C2E4A] focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/30 cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          >
            <div className="h-11 sm:h-12 flex items-center justify-center px-3 py-1 rounded-xl bg-white border border-[#C59E5D]/50 shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/logo-hemingway.png"
                alt="Hemingway School Logo"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#C59E5D] text-[#0F1B2F] border border-[#C59E5D] shadow-xs">
                AVA
              </span>
              <p className="text-[11px] text-[#EADBBE]/80 hidden sm:block leading-none">
                {t('common.tagline', 'Ambiente Virtual de Aprendizagem')}
              </p>
            </div>
          </button>
        </div>

        {/* Centro-Esquerda: Barra de Navegação Rápida Global */}
        {onSelectView && (
          <nav className="hidden md:flex items-center gap-1 bg-[#0A1220]/80 p-1 rounded-xl border border-[#1C2E4A] shadow-xs">
            <button
              type="button"
              onClick={() => onSelectView('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-[#C59E5D] text-[#0F1B2F] shadow-sm'
                  : 'text-[#FAF8F2]/80 hover:text-[#C59E5D] hover:bg-[#1C2E4A]/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Painel de Cursos</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('classroom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'classroom'
                  ? 'bg-[#C59E5D] text-[#0F1B2F] shadow-sm'
                  : 'text-[#FAF8F2]/80 hover:text-[#C59E5D] hover:bg-[#1C2E4A]/60'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Sala de Aula</span>
            </button>

            {currentRole === 'teacher' && (
              <button
                type="button"
                onClick={() => onSelectView('teacher-courses')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeView?.startsWith('teacher')
                    ? 'bg-[#C59E5D] text-[#0F1B2F] shadow-sm'
                    : 'text-[#C59E5D] hover:bg-[#1C2E4A]/80'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeView?.startsWith('teacher')
                    ? 'bg-[#C59E5D] text-[#0F1B2F] shadow-sm'
                    : 'text-[#FAF8F2]/80 hover:text-[#C59E5D] hover:bg-[#1C2E4A]/80'
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
              <Search className="h-4 w-4 text-[#C59E5D]" />
            </div>
            <input
              type="text"
              placeholder={t('common.search', 'Buscar cursos, aulas, materiais...')}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#1C2E4A]/60 border border-[#1C2E4A] rounded-xl text-[#FAF8F2] placeholder-[#EADBBE]/50 focus:bg-[#0A1220] focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/30 focus:border-[#C59E5D] transition-all"
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
            className="relative p-2 text-[#FAF8F2]/80 hover:text-[#C59E5D] hover:bg-[#1C2E4A] rounded-lg transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C59E5D] rounded-full ring-2 ring-[#0F1B2F]"></span>
          </button>

          {/* Avatar e Perfil Resumido */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#1C2E4A]">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className={`w-9 h-9 rounded-full object-cover ring-2 ${ringColor}`}
            />
            <div className="hidden lg:block text-left leading-tight">
              <span className="block text-xs font-bold text-[#FAF8F2]">
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
                className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#C59E5D] hover:text-[#0F1B2F] hover:bg-[#C59E5D] bg-[#1C2E4A]/80 px-2 py-1 rounded-lg border border-[#C59E5D]/40 transition cursor-pointer"
                title="Ciclar Perfil: Aluno → Professor → Admin"
              >
                <Sparkles className="w-3 h-3" />
                <span>Ciclar</span>
              </button>
            )}

            {/* Logout rápido */}
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-[#FAF8F2]/60 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
              title="Sair da Plataforma"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Botão Admin para Zerar Banco de Dados */}
          {currentRole === 'admin' && (
            <button
              type="button"
              onClick={() => setIsWipeModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-950/70 hover:bg-red-900 border border-red-500/50 text-red-200 flex items-center gap-1.5 transition cursor-pointer shadow-xs ml-1"
              title="Zerar todos os dados de teste no Supabase"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Zerar Dados</span>
            </button>
          )}
        </div>
      </div>

      <WipeDatabaseModal
        isOpen={isWipeModalOpen}
        onClose={() => setIsWipeModalOpen(false)}
      />
    </header>
  )
}
