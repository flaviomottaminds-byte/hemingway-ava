import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  BookOpen,
  Video,
  Users,
  Scale,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Sparkles,
  GraduationCap,
  Layers,
  PenTool,
  FileQuestion,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  Award,
  Eye,
  Info,
} from 'lucide-react'
import type { ActiveView } from '../../types'

interface SidebarProps {
  activeView: ActiveView
  onSelectView: (view: ActiveView) => void
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
  currentRole: 'student' | 'teacher' | 'admin'
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isOpen,
  onClose,
  onLogout,
  currentRole = 'student',
}) => {
  const { t } = useTranslation()

  // 1. Menu para perfil ADMIN (Administrativo Institucional)
  // Links: "Visão Global de Cursos", "Gestão de Alunos e Matrículas", "Gestão de Equipe (Cadastro de Professores/Staff)" e "Relatórios Gerais"
  const adminNavItems = [
    {
      id: 'teacher-courses' as ActiveView,
      label: 'Visão Global de Cursos',
      icon: GraduationCap,
      badge: 'Todos',
    },
    {
      id: 'teacher-students' as ActiveView,
      label: 'Gestão de Alunos e Matrículas',
      icon: Users,
      badge: 'Matrículas',
    },
    {
      id: 'teacher-team' as ActiveView,
      label: 'Gestão de Equipe (Professores/Staff)',
      icon: ShieldCheck,
      badge: 'RBAC',
    },
    {
      id: 'teacher-analytics' as ActiveView,
      label: 'Relatórios Gerais',
      icon: BarChart3,
      badge: 'Global',
    },
  ]

  // 2. Menu para perfil PROFESSOR (Conteúdo Pedagógico Restrito)
  // Links: "Meus Cursos", "Criar Nova Aula", "Banco de Disciplinas", "Avaliações" e "Desempenho da Minha Turma"
  const teacherNavItems = [
    {
      id: 'teacher-courses' as ActiveView,
      label: 'Meus Cursos',
      icon: GraduationCap,
      badge: 'Atribuídos',
    },
    {
      id: 'teacher-lesson-editor' as ActiveView,
      label: 'Criar Nova Aula',
      icon: PenTool,
      badge: null,
    },
    {
      id: 'teacher-curriculum' as ActiveView,
      label: 'Banco de Disciplinas',
      icon: Layers,
      badge: 'Ementas',
    },
    {
      id: 'teacher-assessments' as ActiveView,
      label: 'Avaliações',
      icon: FileQuestion,
      badge: 'Quizzes',
    },
    {
      id: 'teacher-analytics' as ActiveView,
      label: 'Desempenho da Minha Turma',
      icon: BarChart3,
      badge: 'Notas',
    },
  ]

  // 3. Menu para perfil ALUNO (Focado no Aprendizado)
  // Links: "Painel de Cursos" (Vitrine), "Sala de Aula Virtual" e "Certificados"
  const studentNavItems = [
    {
      id: 'dashboard' as ActiveView,
      label: 'Painel de Cursos (Vitrine)',
      icon: LayoutDashboard,
      badge: 'Início',
    },
    {
      id: 'classroom' as ActiveView,
      label: 'Sala de Aula Virtual',
      icon: Video,
      badge: 'Ao Vivo',
    },
    {
      id: 'courses' as ActiveView,
      label: 'Certificados & Histórico',
      icon: Award,
      badge: '2 Emitidos',
    },
    {
      id: 'community' as const,
      label: t('sidebar.community', 'Comunidade & Networking'),
      icon: Users,
      badge: null,
    },
    {
      id: 'legalSupport' as const,
      label: t('sidebar.legalSupport', 'Guia do Imigrante & Direitos'),
      icon: Scale,
      badge: 'Novo',
    },
  ]

  // Seleciona os links conforme o papel atual
  let activeNavItems = studentNavItems
  let sectionTitle = 'Meu Aprendizado'
  let roleBadgeText = 'Aluno'
  let HeaderIcon = BookOpen
  let headerTitle = 'Espaço do Aluno'
  let headerSubtitle = 'Trilha de Aprendizado nos EUA'

  if (currentRole === 'admin') {
    activeNavItems = adminNavItems
    sectionTitle = 'Gestão Institucional'
    roleBadgeText = 'Administrador'
    HeaderIcon = ShieldAlert
    headerTitle = 'Painel Administrativo'
    headerSubtitle = 'Gestão Geral da Instituição'
  } else if (currentRole === 'teacher') {
    activeNavItems = teacherNavItems
    sectionTitle = 'Conteúdo & Minhas Turmas'
    roleBadgeText = 'Professor'
    HeaderIcon = GraduationCap
    headerTitle = 'Painel do Professor'
    headerSubtitle = 'Cursos & Aulas Atribuídos'
  }

  const secondaryNavItems = [
    {
      id: 'settings',
      label: t('sidebar.settings', 'Configurações da Conta'),
      icon: Settings,
    },
    {
      id: 'helpDesk',
      label: t('sidebar.helpDesk', 'Suporte Multilíngue'),
      icon: HelpCircle,
    },
  ]

  return (
    <>
      {/* Overlay escuro em dispositivos móveis */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0F1B2F] border-r border-[#1C2E4A] text-[#FAF8F2] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header Mobile com botão Fechar */}
          <div className="p-4 flex items-center justify-between border-b border-[#1C2E4A] lg:hidden">
            <span className="font-bold text-[#FAF8F2]">Menu Principal</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#FAF8F2]/70 hover:text-[#C59E5D] hover:bg-[#1C2E4A] rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Indicador Visual do Perfil Atual no Menu */}
          <div className="p-4 pb-0">
            <div className="p-3 rounded-2xl flex items-center justify-between bg-[#0A1220] border border-[#C59E5D]/30 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[#0F1B2F] bg-[#C59E5D] shadow-xs">
                  <HeaderIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider block leading-none text-[#FAF8F2]">
                    {headerTitle}
                  </span>
                  <span className="text-[10px] text-[#EADBBE]/70">{headerSubtitle}</span>
                </div>
              </div>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#C59E5D] text-[#0F1B2F]">
                {roleBadgeText}
              </span>
            </div>

            {/* Aviso informativo de restrição para Professor */}
            {currentRole === 'teacher' && (
              <div className="mt-2 p-2 bg-[#1C2E4A]/60 border border-[#C59E5D]/30 rounded-xl flex items-start gap-1.5 text-[10px] text-[#EADBBE]">
                <Info className="w-3.5 h-3.5 text-[#C59E5D] shrink-0 mt-0.5" />
                <span>
                  Visualização restrita apenas aos cursos e turmas atribuídos a você.
                </span>
              </div>
            )}

            {/* Aviso de poder administrativo para Admin */}
            {currentRole === 'admin' && (
              <div className="mt-2 p-2 bg-red-950/50 border border-red-500/30 rounded-xl flex items-start gap-1.5 text-[10px] text-red-200">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  Acesso total: matrículas de alunos, gestão de professores e relatórios globais.
                </span>
              </div>
            )}
          </div>

          {/* Seção Principal de Navegação */}
          <div className="p-4 space-y-5">
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold text-[#C59E5D] uppercase tracking-wider">
                {sectionTitle}
              </div>
              <nav className="space-y-1">
                {activeNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeView === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectView(item.id as ActiveView)
                        onClose()
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#C59E5D] text-[#0F1B2F] shadow-md shadow-[#C59E5D]/20'
                          : 'text-[#FAF8F2]/80 hover:text-[#C59E5D] hover:bg-[#1C2E4A]/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-[#0F1B2F]' : 'text-[#C59E5D]'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-[#0F1B2F] text-[#FAF8F2]'
                              : 'bg-[#1C2E4A] text-[#C59E5D] border border-[#C59E5D]/40'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Para Admin ou Professor: Seção de Simulação da Visão do Aluno */}
            {(currentRole === 'teacher' || currentRole === 'admin') && (
              <div>
                <div className="px-3 mb-2 text-[11px] font-bold text-[#C59E5D] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#C59E5D]" />
                  <span>Visualizar como Aluno</span>
                </div>
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectView('classroom')
                      onClose()
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      activeView === 'classroom'
                        ? 'bg-[#C59E5D] text-[#0F1B2F] font-bold'
                        : 'text-[#FAF8F2]/75 hover:text-[#C59E5D] hover:bg-[#1C2E4A]/60'
                    }`}
                  >
                    <Video className="w-4 h-4 text-[#C59E5D]" />
                    <span>Sala de Aula Virtual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectView('dashboard')
                      onClose()
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      activeView === 'dashboard'
                        ? 'bg-[#C59E5D] text-[#0F1B2F] font-bold'
                        : 'text-[#FAF8F2]/75 hover:text-[#C59E5D] hover:bg-[#1C2E4A]/60'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#C59E5D]" />
                    <span>Painel de Cursos (Vitrine)</span>
                  </button>
                </nav>
              </div>
            )}

            {/* Suporte & Configuração */}
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold text-[#C59E5D] uppercase tracking-wider">
                Preferências
              </div>
              <nav className="space-y-1">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#FAF8F2]/70 hover:text-[#C59E5D] hover:bg-[#1C2E4A]/60 transition-colors cursor-pointer"
                    >
                      <Icon className="w-5 h-5 text-[#C59E5D]/80" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Card Inferior Contextual */}
          {currentRole === 'admin' ? (
            <div className="mt-auto p-4 m-3 rounded-2xl bg-gradient-to-br from-[#0A1220] via-[#0F1B2F] to-[#1C2E4A] border border-red-500/30 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <ShieldAlert className="w-16 h-16 text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-red-300">Gestão Global AVA</span>
                  <span className="text-[10px] font-bold text-red-400 bg-red-950/70 px-1.5 py-0.5 rounded border border-red-500/30">
                    Acesso Total
                  </span>
                </div>
                <p className="text-xs text-[#EADBBE]/80 mb-2">
                  5 Cursos • 7 Docentes • 142 Alunos
                </p>
                <div className="w-full bg-[#0A1220] rounded-full h-1.5 overflow-hidden border border-red-500/20">
                  <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          ) : currentRole === 'teacher' ? (
            <div className="mt-auto p-4 m-3 rounded-2xl bg-gradient-to-br from-[#0A1220] via-[#0F1B2F] to-[#1C2E4A] border border-[#C59E5D]/30 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <GraduationCap className="w-16 h-16 text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#C59E5D]">
                    Prof. Leonardo Dias
                  </span>
                  <span className="text-[10px] font-bold text-[#0F1B2F] bg-[#C59E5D] px-1.5 py-0.5 rounded">
                    Ativo
                  </span>
                </div>
                <p className="text-xs text-[#EADBBE]/80 mb-2">
                  Minhas Turmas: 2 Cursos • 64 Alunos
                </p>
                <div className="w-full bg-[#0A1220] rounded-full h-1.5 overflow-hidden border border-[#C59E5D]/20">
                  <div className="bg-[#C59E5D] h-1.5 rounded-full" style={{ width: '70%' }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-auto p-4 m-3 rounded-2xl bg-gradient-to-br from-[#0A1220] via-[#0F1B2F] to-[#1C2E4A] border border-[#C59E5D]/30 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Sparkles className="w-16 h-16 text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#C59E5D]">
                    {t('sidebar.quickStats', 'Seu Progresso Semanal')}
                  </span>
                  <span className="text-xs font-bold text-[#C59E5D]">75%</span>
                </div>
                <p className="text-xs text-[#EADBBE]/80 mb-3">
                  {t('sidebar.progressLabel', 'Metas alcançadas')}: 14.5 / 20 hrs
                </p>
                <div className="w-full bg-[#0A1220] rounded-full h-2 overflow-hidden border border-[#C59E5D]/20">
                  <div
                    className="bg-gradient-to-r from-[#C59E5D] to-[#EADBBE] h-2 rounded-full transition-all duration-500"
                    style={{ width: '75%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botão de Logout */}
          <div className="p-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('sidebar.logout', 'Sair da Conta')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
