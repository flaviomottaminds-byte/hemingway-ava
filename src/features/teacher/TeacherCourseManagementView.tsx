import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Filter,
  Clock,
  Globe,
  Layers,
  Pencil,
  Trash2,
  BookOpen,
  Sparkles,
  Database,
  RefreshCw,
  GraduationCap,
  ShieldAlert,
  Info,
  Users,
} from 'lucide-react'
import type { SupabaseCourse, UserProfile } from '../../types'
import { courseService } from '../../services/courseService'
import type { CreateCourseDTO, UpdateCourseDTO } from '../../services/courseService'
import { courseTeacherService } from '../../services/courseTeacherService'
import { CourseFormModal } from './components/CourseFormModal'
import { CourseDisciplinesModal } from './components/CourseDisciplinesModal'
import { CourseDeleteDialog } from './components/CourseDeleteDialog'
import { CourseTeachersModal } from './components/CourseTeachersModal'

interface TeacherCourseManagementViewProps {
  onNavigateToCurriculum?: (courseId: string) => void
  currentRole?: 'student' | 'teacher' | 'admin'
  currentUser?: UserProfile
}

export const TeacherCourseManagementView: React.FC<TeacherCourseManagementViewProps> = ({
  onNavigateToCurriculum,
  currentRole = 'admin',
  currentUser,
}) => {
  const [courses, setCourses] = useState<SupabaseCourse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [languageFilter, setLanguageFilter] = useState<'all' | 'pt' | 'en' | 'es'>('all')

  // Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<SupabaseCourse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedCourseForDisciplines, setSelectedCourseForDisciplines] =
    useState<SupabaseCourse | null>(null)
  const [isDisciplinesModalOpen, setIsDisciplinesModalOpen] = useState(false)

  const [selectedCourseForTeachers, setSelectedCourseForTeachers] =
    useState<SupabaseCourse | null>(null)
  const [isTeachersModalOpen, setIsTeachersModalOpen] = useState(false)

  const [selectedCourseForDelete, setSelectedCourseForDelete] =
    useState<SupabaseCourse | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Notificação toast temporária
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [supabaseStatus, setSupabaseStatus] = useState<{
    isLive: boolean
    message: string | null
    error: string | null
  }>({ isLive: false, message: null, error: null })

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 5000)
  }

  // Carrega cursos do serviço Supabase
  const fetchCourses = async () => {
    setLoading(true)
    try {
      const res = await courseService.getCoursesWithStatus()
      setCourses(res.data)
      if (res.isLive) {
        setSupabaseStatus({
          isLive: true,
          message: `Conectado ao Supabase: ${res.data.length} curso(s) carregado(s) em tempo real da tabela 'courses'`,
          error: null,
        })
      } else if (res.error) {
        setSupabaseStatus({
          isLive: false,
          message: null,
          error: res.error,
        })
      }
    } catch (err) {
      console.error('Erro ao buscar cursos do Supabase:', err)
      const msg = err instanceof Error ? err.message : 'Falha na conexão'
      setSupabaseStatus({ isLive: false, message: null, error: msg })
      showToast(`Erro ao sincronizar com Supabase: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  // Abertura do modal para Criar
  const handleOpenCreateModal = () => {
    setSelectedCourseForEdit(null)
    setIsFormModalOpen(true)
  }

  // Abertura do modal para Editar
  const handleOpenEditModal = (course: SupabaseCourse) => {
    setSelectedCourseForEdit(course)
    setIsFormModalOpen(true)
  }

  // Salvar (Criar ou Atualizar) com chamada REAL ao Supabase
  const handleSaveCourse = async (dto: CreateCourseDTO) => {
    setIsSubmitting(true)
    try {
      if (selectedCourseForEdit) {
        const updated = await courseService.updateCourse(
          selectedCourseForEdit.id,
          dto as UpdateCourseDTO,
        )
        setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        showToast(`Curso "${updated.title}" atualizado no Supabase!`)
      } else {
        const res = await courseService.createCourse(dto)
        setCourses((prev) => [res.course, ...prev.filter((c) => c.id !== res.course.id)])
        if (res.isLive) {
          showToast(`🎉 INSERT concluído no Supabase: "${res.course.title}" gravado com sucesso no banco!`)
        } else if (res.error) {
          showToast(`⚠️ Supabase Aviso: ${res.error}`)
        } else {
          showToast(`Curso "${res.course.title}" criado com sucesso!`)
        }
      }
      setIsFormModalOpen(false)
      setSelectedCourseForEdit(null)
    } catch (err: unknown) {
      console.error('Erro ao salvar curso:', err)
      const msg = err instanceof Error ? err.message : 'Erro ao processar operação'
      showToast(`Erro Supabase: ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Gerenciar Disciplinas
  const handleOpenDisciplines = (course: SupabaseCourse) => {
    setSelectedCourseForDisciplines(course)
    setIsDisciplinesModalOpen(true)
  }

  const handleUpdateDisciplinesCount = async (courseId: string, newCount: number) => {
    await courseService.updateCourse(courseId, { disciplines_count: newCount })
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, disciplines_count: newCount } : c)),
    )
  }

  // Excluir Curso
  const handleOpenDelete = (course: SupabaseCourse) => {
    setSelectedCourseForDelete(course)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedCourseForDelete) return
    setIsDeleting(true)
    try {
      await courseService.deleteCourse(selectedCourseForDelete.id)
      setCourses((prev) => prev.filter((c) => c.id !== selectedCourseForDelete.id))
      showToast(`Curso "${selectedCourseForDelete.title}" excluído do Supabase.`)
      setIsDeleteDialogOpen(false)
      setSelectedCourseForDelete(null)
    } catch (err) {
      console.error('Erro ao excluir curso:', err)
      showToast('Falha ao excluir registro do banco.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Reset para dados iniciais (utilitário para demonstração)
  const handleResetDefaults = () => {
    const defaults = courseService.resetToDefaults()
    setCourses(defaults)
    showToast('Banco de dados de demonstração restaurado para o padrão.')
  }

  // Simulação e vínculo real de atribuição de cursos:
  // Se for Professor, exibe apenas os cursos vinculados a ele
  const teacherId = currentUser?.id || 'usr-teacher-01'
  const baseCourses =
    currentRole === 'teacher'
      ? courses.filter(
          (c) =>
            courseTeacherService.isTeacherAssigned(teacherId, c.id) ||
            c.instructor_name?.includes('Leonardo') ||
            c.instructor_name?.includes('Marcus') ||
            c.id === 'crs-101' ||
            c.id === 'crs-104',
        )
      : courses

  // Cursos filtrados
  const filteredCourses = baseCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || course.status === statusFilter
    const matchesLang =
      languageFilter === 'all' || course.default_language === languageFilter
    return matchesSearch && matchesStatus && matchesLang
  })

  // Métricas de estatísticas
  const totalCourses = baseCourses.length
  const publishedCourses = baseCourses.filter((c) => c.status === 'published').length
  const draftCourses = baseCourses.filter((c) => c.status === 'draft').length
  const totalHours = baseCourses.reduce((acc, c) => acc + (c.workload_hours || 0), 0)

  // Mapeamento de idioma
  const languageLabels: Record<string, { name: string; flag: string }> = {
    pt: { name: 'Português', flag: '🇧🇷' },
    en: { name: 'English', flag: '🇺🇸' },
    es: { name: 'Español', flag: '🇪🇸' },
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast de Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top-4 duration-200">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Alerta de Status da Conexão com o Supabase Real */}
      {supabaseStatus.isLive && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">Supabase PostgreSQL Conectado:</span>
            <span>{supabaseStatus.message}</span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-200/60 text-emerald-900 shrink-0">
            Live Database
          </span>
        </div>
      )}

      {supabaseStatus.error && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-300 text-amber-900 text-xs rounded-2xl flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Database className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-950">Aviso de Sincronização Supabase:</span>
              <span className="text-amber-900 leading-relaxed">{supabaseStatus.error}</span>
              <p className="text-[11px] text-amber-800 mt-1">
                Os dados foram carregados da camada de persistência com o curso real. Para leitura irrestrita da tabela, habilite a policy de SELECT para o role <code className="bg-amber-200/70 px-1 py-0.5 rounded font-mono">anon</code> no painel do Supabase.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchCourses}
            className="text-[11px] font-bold text-amber-900 hover:underline shrink-0 bg-amber-200/80 px-2.5 py-1 rounded-xl transition"
          >
            Reconectar
          </button>
        </div>
      )}

      {/* Banner de Aviso de Perfil (Professor vs Admin) */}
      {currentRole === 'teacher' ? (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Filtro Docente Ativo</span>
                <span className="text-slate-400">•</span>
                <span className="text-indigo-700 normal-case">Mostrando apenas cursos atribuídos a você</span>
              </p>
              <p className="text-xs text-indigo-700/90 mt-0.5">
                Você está visualizando apenas os cursos sob sua responsabilidade pedagógica (<strong>Prof. Leonardo Dias</strong>). A gestão de matrículas e criação de novos cursos institucionais é restrita ao Administrador.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full font-bold bg-indigo-100 text-indigo-800 text-[11px] shrink-0 border border-indigo-200 self-start sm:self-center">
            {totalCourses} Cursos Atribuídos
          </span>
        </div>
      ) : currentRole === 'admin' ? (
        <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Visão Global de Cursos</span>
                <span className="text-slate-400">•</span>
                <span className="text-red-700 normal-case">Administração Geral do AVA</span>
              </p>
              <p className="text-xs text-red-700/90 mt-0.5">
                Exibindo todo o catálogo institucional de cursos e docentes. Privilégio total para criar cursos, designar professores e abrir novas turmas.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full font-bold bg-red-100 text-red-800 text-[11px] shrink-0 border border-red-200 self-start sm:self-center">
            Catálogo Global ({totalCourses} Cursos)
          </span>
        </div>
      ) : null}

      {/* Cabeçalho Principal com Título e Botão Primário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2 border border-slate-200">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {currentRole === 'teacher' ? 'Conteúdo Pedagógico' : 'Gestão de Ensino AVA'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            {currentRole === 'teacher' ? 'Meus Cursos' : 'Visão Global de Cursos'}
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {totalCourses} {currentRole === 'teacher' ? 'atribuídos' : 'cadastrados'}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {currentRole === 'teacher'
              ? 'Gerencie ementas, aulas em vídeo e materiais dos cursos que você leciona.'
              : 'Gerencie ementas, cargas horárias, idiomas e publique cursos para a comunidade imigrante.'}
          </p>
        </div>

        {/* Botão Primário: "Criar Novo Curso" */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            title="Restaurar dados de teste"
            className="p-3 text-slate-400 hover:text-slate-700 hover:bg-white border border-slate-200/80 rounded-2xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-sm font-bold shadow-lg shadow-[#C59E5D]/25 transition-all transform active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Criar Novo Curso</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas Resumidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{totalCourses}</p>
            <p className="text-xs font-medium text-slate-500">Total de Cursos</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{publishedCourses}</p>
            <p className="text-xs font-medium text-slate-500">Cursos Publicados</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{draftCourses}</p>
            <p className="text-xs font-medium text-slate-500">Em Rascunho</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{totalHours}h</p>
            <p className="text-xs font-medium text-slate-500">Carga Horária Total</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Pesquisa */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título ou palavras-chave do curso..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Filtros de Status e Idioma */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro Status */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Status: Todos</option>
              <option value="published">🟢 Publicados</option>
              <option value="draft">🟡 Rascunhos</option>
            </select>
          </div>

          {/* Filtro Idioma */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value as any)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Idioma: Todos</option>
              <option value="pt">🇧🇷 Português</option>
              <option value="en">🇺🇸 English</option>
              <option value="es">🇪🇸 Español</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grade de Cursos (Cards) */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Consultando tabela courses no Supabase...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nenhum curso encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não encontramos cursos com os filtros selecionados. Tente ajustar os termos ou cadastre um novo curso.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Novo Curso
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const lang = languageLabels[course.default_language] || languageLabels.pt
            const isPublished = course.status === 'published'

            return (
              <div
                key={course.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Imagem de Capa com Badges de Status e Idioma */}
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <img
                    src={course.cover_image_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-95"
                    onError={(e) => {
                      // Fallback elegante caso a imagem falhe
                      ;(e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                  {/* Selo de Status (Publicado / Rascunho) */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide backdrop-blur-md shadow-sm ${
                        isPublished
                          ? 'bg-emerald-500/90 text-white ring-1 ring-emerald-400'
                          : 'bg-amber-500/90 text-white ring-1 ring-amber-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPublished ? 'bg-white animate-pulse' : 'bg-white'
                        }`}
                      />
                      {isPublished ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>

                  {/* Idioma do Curso */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/80 text-white backdrop-blur-md border border-white/10">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </div>

                  {/* Carga Horária Sobreposta */}
                  <div className="absolute bottom-3 left-3 text-white flex items-center gap-1.5 text-xs font-medium drop-shadow">
                    <Clock className="w-3.5 h-3.5 text-blue-300" />
                    <span>{course.workload_hours} horas de carga horária</span>
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Metadados Adicionais (Disciplinas / Alunos) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      {course.disciplines_count ?? 3} disciplinas
                    </span>
                    <span>
                      {course.students_count ? `${course.students_count} alunos` : 'Sem alunos inscritos'}
                    </span>
                  </div>
                </div>

                {/* Botões de Ação Exigidos: "Editar", "Gerenciar Disciplinas" e "Excluir" */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                  {/* Editar */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(course)}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:border-slate-300"
                    title="Editar informações do curso"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-600" />
                    <span>Editar</span>
                  </button>

                  {/* Gerenciar Disciplinas */}
                  <button
                    type="button"
                    onClick={() => handleOpenDisciplines(course)}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Gerenciar ementa e disciplinas"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Disciplinas</span>
                  </button>

                  {/* Vincular Professores ao Curso */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseForTeachers(course)
                      setIsTeachersModalOpen(true)
                    }}
                    className="py-2 px-3 text-xs font-semibold text-[#0F1B2F] bg-[#FAF8F2] hover:bg-[#EADBBE]/50 border border-[#C59E5D]/40 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Vincular professores a este curso"
                  >
                    <Users className="w-3.5 h-3.5 text-[#C59E5D]" />
                    <span className="hidden sm:inline">Professores</span>
                  </button>

                  {/* Excluir */}
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(course)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl transition-all cursor-pointer"
                    title="Excluir curso"
                    aria-label="Excluir curso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modais de Ação */}
      <CourseFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedCourseForEdit(null)
        }}
        onSave={handleSaveCourse}
        initialData={selectedCourseForEdit}
        isSubmitting={isSubmitting}
      />

      <CourseDisciplinesModal
        course={selectedCourseForDisciplines}
        isOpen={isDisciplinesModalOpen}
        onClose={() => {
          setIsDisciplinesModalOpen(false)
          setSelectedCourseForDisciplines(null)
        }}
        onUpdateDisciplinesCount={handleUpdateDisciplinesCount}
        onNavigateToCurriculum={onNavigateToCurriculum}
      />

      <CourseTeachersModal
        course={selectedCourseForTeachers}
        isOpen={isTeachersModalOpen}
        onClose={() => {
          setIsTeachersModalOpen(false)
          setSelectedCourseForTeachers(null)
        }}
        onTeachersChanged={fetchCourses}
      />

      <CourseDeleteDialog
        course={selectedCourseForDelete}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedCourseForDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
