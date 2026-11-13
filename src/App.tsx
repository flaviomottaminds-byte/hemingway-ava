import { useState, useEffect } from 'react'
import './locales/i18n'
import { Topbar } from './components/layout/Topbar'
import { Sidebar } from './components/layout/Sidebar'
import { LoginView } from './features/auth/LoginView'
import { ResetPasswordView } from './features/auth/ResetPasswordView'
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
import { resolveUserRole } from './lib/roleUtils'

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [currentRole, setCurrentRole] = useState<'student' | 'teacher' | 'admin'>('student')
  const [currentUser, setCurrentUser] = useState<UserProfile>(mockUser)

  // Roteamento e visualização ativa
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)
  const [isResetPasswordView, setIsResetPasswordView] = useState<boolean>(() => {
    return (
      window.location.pathname.includes('/reset-password') ||
      window.location.hash.includes('type=recovery')
    )
  })

  // Estados de contexto para navegação entre telas de gestão
  const [selectedCurriculumCourseId, setSelectedCurriculumCourseId] = useState<string>('')
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null)

  // Sincroniza sessão ativa do Supabase Auth e garante perfil existente na tabela profiles
  const syncUserSession = async (session: {
    user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
  }) => {
    if (!session?.user) return false

    const authId = session.user.id
    const authEmail = (session.user.email || '').trim().toLowerCase()

    // 1. Busca registro na tabela profiles pelo ID do Auth
    let profileData: Record<string, unknown> | null = null

    try {
      const { data: profById } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authId)
        .maybeSingle()

      if (profById) {
        profileData = profById
      } else if (authEmail) {
        // 2. Fallback: busca por e-mail case-insensitive
        const { data: profByEmail } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', authEmail)
          .maybeSingle()

        if (profByEmail) {
          profileData = profByEmail
        } else {
          // Busca de segurança em caso de espaços extras no banco
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('*')
            .limit(100)
          if (allProfiles && allProfiles.length > 0) {
            const found = allProfiles.find(
              (p: Record<string, unknown>) =>
                p.id === authId ||
                (p.email && String(p.email).trim().toLowerCase() === authEmail),
            )
            if (found) {
              profileData = found
            }
          }
        }
      }

      // Se encontrou o perfil mas o id no banco está desatualizado, sincroniza o ID SEM alterar o role!
      if (profileData && profileData.id !== authId) {
        try {
          await supabase.from('profiles').update({ id: authId }).eq('id', profileData.id)
        } catch (e) {
          console.warn('Aviso ao sincronizar ID do Auth no profile:', e)
        }
      }

      // 3. APENAS se o perfil NÃO existir de fato na tabela profiles, cria um novo registro
      if (!profileData) {
        const meta = session.user.user_metadata || {}
        const initialRole = resolveUserRole(meta.role)

        const displayName = String(
          meta.full_name ||
            meta.name ||
            meta.user_name ||
            (authEmail ? authEmail.split('@')[0] : 'Usuário'),
        )

        const avatarUrl = String(
          meta.avatar_url ||
            meta.picture ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        )

        const docNumber = 'HEM-' + Date.now().toString().slice(-6)

        const newProfile = {
          id: authId,
          email: authEmail,
          name: displayName,
          role: initialRole,
          avatar_url: avatarUrl,
          document_type: 'Passaporte Internacional',
          document_number: docNumber,
        }

        try {
          // Usa insert simples para NUNCA sobrescrever registros de perfis existentes
          const { data: inserted } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .maybeSingle()

          if (inserted) {
            profileData = inserted
          } else {
            profileData = newProfile
          }
        } catch (insertErr) {
          console.warn('Aviso ao inserir perfil após login/OAuth:', insertErr)
          profileData = newProfile
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar tabela profiles:', e)
    }

    // 4. Determina role real do usuário: PRIORIDADE TOTAL AO BANCO DE DADOS (profiles.role)
    const finalRole: 'student' | 'teacher' | 'admin' = resolveUserRole(
      profileData?.role ?? session.user.user_metadata?.role,
    )

    const meta = session.user.user_metadata || {}
    const userObj: UserProfile = {
      id: String(profileData?.id || authId),
      name: String(
        profileData?.name ||
          meta.full_name ||
          meta.name ||
          (authEmail ? authEmail.split('@')[0] : 'Usuário'),
      ),
      email: authEmail,
      role: finalRole,
      originCountry: 'Brasil',
      currentCity: 'Orlando, FL',
      avatarUrl:
        String(profileData?.avatar_url || meta.avatar_url || meta.picture || '') ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      preferredLanguage: 'pt',
      weeklyGoalHours: 10,
      completedHours: 0,
      activeCoursesCount: 1,
      certificatesEarned: 0,
      document_type: String(profileData?.document_type || 'Passaporte Internacional'),
      document_number: String(profileData?.document_number || ''),
    }

    setCurrentUser(userObj)
    setCurrentRole(finalRole)
    setIsAuthenticated(true)
    setActiveView(finalRole === 'student' ? 'dashboard' : 'teacher-courses')
    localStorage.setItem('hemingway_auth_profile', JSON.stringify(userObj))

    // Limpa tokens da URL após retorno do Google OAuth
    if (window.location.hash.includes('access_token=') || window.location.search.includes('code=')) {
      window.history.replaceState(null, '', window.location.pathname)
    }

    return true
  }

  // Restauração de Sessão Real do Supabase Auth no carregamento
  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user && isMounted) {
          const synced = await syncUserSession(session)
          if (synced) return
        }
      } catch (err) {
        console.warn('Erro ao restaurar sessão do Supabase:', err)
      }

      // Restaura dados cacheados locais se não houver sessão ativa
      const cached = localStorage.getItem('hemingway_auth_profile')
      if (cached && isMounted) {
        try {
          const parsed: UserProfile = JSON.parse(cached)
          if (parsed && parsed.email) {
            const role = resolveUserRole(parsed.role)
            parsed.role = role
            setCurrentUser(parsed)
            setCurrentRole(role)
            setIsAuthenticated(true)
            setActiveView(role === 'student' ? 'dashboard' : 'teacher-courses')
          }
        } catch (e) {
          console.warn('Erro ao restaurar perfil local:', e)
        }
      }
    }

    checkSession()

    // Listener para eventos de login/logout no Supabase (inclui retorno do Google OAuth e Recuperação de Senha)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordView(true)
        return
      }

      if (
        (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') &&
        session
      ) {
        // Se estiver na rota de recuperação de senha, prioriza a tela de redefinição
        if (
          window.location.pathname.includes('/reset-password') ||
          window.location.hash.includes('type=recovery')
        ) {
          setIsResetPasswordView(true)
          return
        }
        await syncUserSession(session)
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        setCurrentUser(mockUser)
        setCurrentRole('student')
        localStorage.removeItem('hemingway_auth_profile')
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Ação de Login: Recebe o perfil real ou mock e direciona para o painel correto
  const handleLoginSuccess = (userProfile?: UserProfile) => {
    const profile = userProfile || mockUser
    const role = resolveUserRole(profile.role)
    profile.role = role
    setCurrentUser(profile)
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

  // Rota de Redefinição de Senha (/reset-password ou evento PASSWORD_RECOVERY do Supabase)
  if (isResetPasswordView) {
    return (
      <ResetPasswordView
        onSuccess={() => {
          setIsResetPasswordView(false)
          window.history.replaceState(null, '', '/')
        }}
        onBackToLogin={() => {
          setIsResetPasswordView(false)
          window.history.replaceState(null, '', '/')
        }}
      />
    )
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
