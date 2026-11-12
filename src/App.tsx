import { useState } from 'react'
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
import type { ActiveView } from './types'

export function App() {
  // Requisito: O aplicativo deve iniciar exibindo a Tela de Login
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  // Estado global simulado com suporte a 3 perfis: 'student' | 'teacher' | 'admin'
  const [currentRole, setCurrentRole] = useState<'student' | 'teacher' | 'admin'>('student')

  // Roteamento e visualização ativa
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)

  // Estados de contexto para navegação entre telas de gestão
  const [selectedCurriculumCourseId, setSelectedCurriculumCourseId] = useState<string>('')
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null)

  // Usuário ativo no topo conforme o papel simulado (3 perfis)
  const currentUser =
    currentRole === 'admin'
      ? mockAdminUser
      : currentRole === 'teacher'
      ? mockTeacherUser
      : mockUser

  // Ação de Login: Redireciona para o Dashboard Inicial do Aluno
  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setCurrentRole('student')
    setActiveView('dashboard')
  }

  // Ação de Logout
  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  // Ferramenta de Teste: Alternar Perfil (Simulação)
  // Cicla sequencialmente entre os 3 perfis: aluno -> professor -> admin -> aluno...
  const handleToggleRole = () => {
    if (!isAuthenticated) {
      setIsAuthenticated(true)
    }

    if (currentRole === 'student') {
      setCurrentRole('teacher')
      setActiveView('teacher-courses')
    } else if (currentRole === 'teacher') {
      setCurrentRole('admin')
      setActiveView('teacher-courses')
    } else {
      setCurrentRole('student')
      setActiveView('dashboard')
    }
  }

  // Seleção direta de perfil pelo Dev Mode Widget
  const handleSelectRole = (role: 'student' | 'teacher' | 'admin') => {
    if (!isAuthenticated) {
      setIsAuthenticated(true)
    }
    setCurrentRole(role)
    if (role === 'student') {
      setActiveView('dashboard')
    } else {
      setActiveView('teacher-courses')
    }
  }

  // Se o usuário não estiver autenticado, exibe a Tela de Login
  if (!isAuthenticated) {
    return (
      <div className="relative">
        <LoginView onLoginSuccess={handleLoginSuccess} />

        {/* Ferramenta de teste acessível também na tela de login */}
        <DevNavigationWidget
          currentRole={currentRole}
          activeView={activeView}
          onToggleRole={handleToggleRole}
          onSelectRole={handleSelectRole}
          onSelectView={(view) => {
            setIsAuthenticated(true)
            setActiveView(view)
          }}
          onLogout={handleLogout}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
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
              user={mockUser}
              courses={mockCourses}
              onOpenClassroom={() => setActiveView('classroom')}
              onSelectView={setActiveView}
            />
          )}

          {activeView === 'classroom' && (
            <LessonView
              lesson={mockLesson}
              onBackToDashboard={() => setActiveView('dashboard')}
            />
          )}

          {activeView === 'courses' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Certificados & Meus Cursos em Andamento</h2>
              <StudentDashboardView
                user={mockUser}
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

      {/* Ferramenta de Teste (Dev Mode): Cicla entre Aluno, Professor e Admin */}
      <DevNavigationWidget
        currentRole={currentRole}
        activeView={activeView}
        onToggleRole={handleToggleRole}
        onSelectRole={handleSelectRole}
        onSelectView={(view) => setActiveView(view)}
        onLogout={handleLogout}
      />
    </div>
  )
}

export default App
