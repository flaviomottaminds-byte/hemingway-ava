import { useState, useEffect } from 'react'
import './locales/i18n'
import { Topbar } from './components/layout/Topbar'
import { Sidebar } from './components/layout/Sidebar'
import { LoginView } from './features/auth/LoginView'
import { StudentDashboardView } from './features/dashboard/StudentDashboardView'
import { LessonView } from './features/classroom/LessonView'
import { TeacherCourseManagementView } from './features/teacher/TeacherCourseManagementView'
import { TeacherCurriculumManagementView } from './features/teacher/TeacherCurriculumManagementView'
import { TeacherLessonEditorView } from './features/teacher/TeacherLessonEditorView'
import { TeacherAssessmentBuilderView } from './features/teacher/TeacherAssessmentBuilderView'
import { TeacherAnalyticsView } from './features/teacher/TeacherAnalyticsView'
import { TeacherStudentsManagementView } from './features/teacher/TeacherStudentsManagementView'
import { TeacherTeamManagementView } from './features/teacher/TeacherTeamManagementView'
import { DevNavigationWidget } from './components/dev/DevNavigationWidget'
import { mockUser, mockTeacherUser, mockAdminUser, mockCourses, mockLesson } from './services/mockData'
import type { ActiveView, UserProfile } from './types'
import { supabase } from './lib/supabase'

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [currentRole, setCurrentRole] = useState<'student' | 'teacher' | 'admin'>('student')
  const [currentUser, setCurrentUser] = useState<UserProfile>(mockUser)

  // Roteamento e visualização ativa
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)

  // Estados de contexto para navegação entre telas de gestão
  const [selectedCurriculumCourseId, setSelectedCurriculumCourseId] = useState<string>('')
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null)

  // Restauração de Sessão Real do Supabase Auth no carregamento
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const authId = session.user.id
          const authEmail = session.user.email || ''

          // Consulta o registro correspondente na tabela profiles
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authId)
            .maybeSingle()

          const rawRole = String(
            prof?.role || session.user.user_metadata?.role || 'student',
          ).toLowerCase()

          const role: 'student' | 'teacher' | 'admin' =
            rawRole === 'admin' || rawRole === 'administrador'
              ? 'admin'
              : rawRole === 'teacher' || rawRole === 'professor'
              ? 'teacher'
              : 'student'

          const userObj: UserProfile = {
            id: String(prof?.id || authId),
            name: String(prof?.name || session.user.user_metadata?.name || authEmail.split('@')[0] || 'Aluno'),
            email: authEmail,
            role,
            originCountry: 'Brasil',
            currentCity: 'Orlando, FL',
            avatarUrl:
              String(prof?.avatar_url || '') ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
            preferredLanguage: 'pt',
            weeklyGoalHours: 10,
            completedHours: 0,
            activeCoursesCount: 1,
            certificatesEarned: 0,
            document_type: String(prof?.document_type || 'Passaporte Internacional'),
            document_number: String(prof?.document_number || ''),
          }

          setCurrentUser(userObj)
          setCurrentRole(role)
          setIsAuthenticated(true)
          setActiveView(role === 'student' ? 'dashboard' : 'teacher-courses')
          return
        }
      } catch (err) {
        console.warn('Erro ao restaurar sessão do Supabase:', err)
      }

      // Restaura dados cacheados locais
      const cached = localStorage.getItem('hemingway_auth_profile')
      if (cached) {
        try {
          const parsed: UserProfile = JSON.parse(cached)
          if (parsed && parsed.email) {
            setCurrentUser(parsed)
            setCurrentRole(parsed.role || 'student')
            setIsAuthenticated(true)
            setActiveView(parsed.role === 'student' ? 'dashboard' : 'teacher-courses')
          }
        } catch (e) {
          console.warn('Erro ao restaurar perfil local:', e)
        }
      }
    }

    checkSession()

    // Listener para eventos de login/logout no Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false)
        setCurrentUser(mockUser)
        setCurrentRole('student')
        localStorage.removeItem('hemingway_auth_profile')
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Ação de Login: Recebe o perfil real ou mock e direciona para o painel correto
  const handleLoginSuccess = (userProfile?: UserProfile) => {
    const profile = userProfile || mockUser
    setCurrentUser(profile)
    const role = profile.role || 'student'
    setCurrentRole(role)
    setIsAuthenticated(true)
    setActiveView(role === 'student' ? 'dashboard' : 'teacher-courses')
    localStorage.setItem('hemingway_auth_profile', JSON.stringify(profile))
  }

  // Ação de Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Erro ao deslogar no Supabase:', e)
    }
    localStorage.clear()
    sessionStorage.clear()
    setIsAuthenticated(false)
    setCurrentUser(mockUser)
    setCurrentRole('student')
    setActiveView('dashboard')
  }

  // Ferramenta de Teste: Alternar Perfil (Simulação)
  // DISPONÍVEL EXCLUSIVAMENTE EM DESENVOLVIMENTO
  const handleToggleRole = () => {
    if (!import.meta.env.DEV) return

    if (!isAuthenticated) {
      setIsAuthenticated(true)
    }

    if (currentRole === 'student') {
      setCurrentRole('teacher')
      setCurrentUser(mockTeacherUser)
      setActiveView('teacher-courses')
    } else if (currentRole === 'teacher') {
      setCurrentRole('admin')
      setCurrentUser(mockAdminUser)
      setActiveView('teacher-courses')
    } else {
      setCurrentRole('student')
      setCurrentUser(mockUser)
      setActiveView('dashboard')
    }
  }

  // Seleção direta de perfil pelo Dev Mode Widget (Apenas em Dev)
  const handleSelectRole = (role: 'student' | 'teacher' | 'admin') => {
    if (!import.meta.env.DEV) return

    if (!isAuthenticated) {
      setIsAuthenticated(true)
    }
    setCurrentRole(role)
    setCurrentUser(
      role === 'admin' ? mockAdminUser : role === 'teacher' ? mockTeacherUser : mockUser,
    )
    if (role === 'student') {
      setActiveView('dashboard')
    } else {
      setActiveView('teacher-courses')
    }
  }

  // Se o usuário não estiver autenticado, exibe a Tela de Login LIMPA (SEM barra de simulação)
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="min-h-screen bg-[#FAF8F2] flex flex-col font-sans antialiased text-[#1C2E4A]">
      {/* Barra Superior com seletor de idiomas i18n e navegação rápida */}
      <Topbar
        user={currentUser}
        activeView={activeView}
        onSelectView={(view) => setActiveView(view)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNavigateHome={() =>
          setActiveView(currentRole === 'student' ? 'dashboard' : 'teacher-courses')
        }
        onLogout={handleLogout}
        currentRole={currentRole}
        onToggleRole={handleToggleRole}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Menu Lateral Global Responsivo com renderização condicional dos 3 perfis */}
        <Sidebar
          activeView={activeView}
          onSelectView={(view) => setActiveView(view)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
          currentRole={currentRole}
        />

        {/* Área de Conteúdo Principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl overflow-hidden">
          {/* Telas do Aluno */}
          {activeView === 'dashboard' && (
            <StudentDashboardView
              user={currentUser}
              courses={mockCourses}
              onOpenClassroom={() => setActiveView('classroom')}
              onSelectView={setActiveView}
            />
          )}

          {activeView === 'classroom' && (
            <LessonView
              lesson={mockLesson}
              user={currentUser}
              onBackToDashboard={() => setActiveView('dashboard')}
            />
          )}

          {activeView === 'courses' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Certificados & Meus Cursos em Andamento</h2>
              <StudentDashboardView
                user={currentUser}
                courses={mockCourses}
                onOpenClassroom={() => setActiveView('classroom')}
                onSelectView={setActiveView}
              />
            </div>
          )}

          {/* Telas de Gestão (Professor ou Admin) */}
          {activeView === 'teacher-courses' && (
            <TeacherCourseManagementView
              currentRole={currentRole}
              currentUser={currentUser}
              onNavigateToCurriculum={(courseId) => {
                setSelectedCurriculumCourseId(courseId)
                setActiveView('teacher-curriculum')
              }}
            />
          )}

          {activeView === 'teacher-curriculum' && (
            <TeacherCurriculumManagementView
              initialCourseId={selectedCurriculumCourseId}
            />
          )}

          {activeView === 'teacher-lesson-editor' && (
            <TeacherLessonEditorView
              lessonId={editingLessonId}
              initialCourseId={selectedCurriculumCourseId}
              onCancel={() => {
                setEditingLessonId(null)
                setActiveView('teacher-curriculum')
              }}
              onSaveSuccess={() => {
                setEditingLessonId(null)
                setActiveView('teacher-curriculum')
              }}
            />
          )}

          {activeView === 'teacher-assessments' && (
            <TeacherAssessmentBuilderView
              assessmentId={editingAssessmentId}
              initialCourseId={selectedCurriculumCourseId}
              onCancel={() => {
                setEditingAssessmentId(null)
                setActiveView('teacher-courses')
              }}
              onSaveSuccess={() => {
                setEditingAssessmentId(null)
                setActiveView('teacher-courses')
              }}
            />
          )}

          {activeView === 'teacher-analytics' && <TeacherAnalyticsView />}

          {activeView === 'teacher-students' && <TeacherStudentsManagementView />}

          {activeView === 'teacher-team' && <TeacherTeamManagementView />}
        </main>
      </div>

      {/* Barra de Simulação (Dev Mode): VISÍVEL EXCLUSIVAMENTE PARA ADMIN EM DESENVOLVIMENTO */}
      {import.meta.env.DEV && currentRole === 'admin' && (
        <DevNavigationWidget
          currentRole={currentRole}
          activeView={activeView}
          onToggleRole={handleToggleRole}
          onSelectRole={handleSelectRole}
          onSelectView={(view) => setActiveView(view)}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

export default App
