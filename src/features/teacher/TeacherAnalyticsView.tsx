import React, { useState, useEffect } from 'react'
import {
  Users,
  TrendingUp,
  Award,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  BarChart3,
  GraduationCap,
  Download,
} from 'lucide-react'
import type {
  SupabaseCourse,
  SupabaseDiscipline,
  StudentPerformanceRecord,
} from '../../types'
import { courseService } from '../../services/courseService'
import { curriculumService } from '../../services/curriculumService'
import { studentAnalyticsService } from '../../services/studentAnalyticsService'
import type { AnalyticsKPIs } from '../../services/studentAnalyticsService'
import { StudentDetailModal } from './components/StudentDetailModal'

export const TeacherAnalyticsView: React.FC = () => {
  const [courses, setCourses] = useState<SupabaseCourse[]>([])
  const [disciplines, setDisciplines] = useState<SupabaseDiscipline[]>([])

  // 1. Filtros Globais
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all')
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Dados de Alunos e KPIs
  const [students, setStudents] = useState<StudentPerformanceRecord[]>([])
  const [kpis, setKpis] = useState<AnalyticsKPIs>({
    totalStudents: 0,
    averageProgress: 0,
    averageGrade: 0,
    completionRate: 0,
    trends: {
      students: '+8% este mês',
      progress: '+5.4% este mês',
      grade: '+0.3 este mês',
      completion: '+4.2% este mês',
    },
  })
  const [loading, setLoading] = useState<boolean>(true)

  // Modal de Detalhes do Aluno
  const [selectedStudent, setSelectedStudent] =
    useState<StudentPerformanceRecord | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Toast de Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Carrega lista de cursos e disciplinas para os selects de filtro
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [loadedCourses, loadedDisciplines] = await Promise.all([
          courseService.getCourses(),
          curriculumService.getDisciplines(),
        ])
        setCourses(loadedCourses)
        setDisciplines(loadedDisciplines)
      } catch (err) {
        console.error('Erro ao carregar filtros de cursos/disciplinas:', err)
      }
    }
    loadFiltersData()
  }, [])

  // Carrega alunos e KPIs com base nos filtros selecionados
  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const data = await studentAnalyticsService.getStudents(
        selectedCourseId,
        selectedDisciplineId,
      )
      setStudents(data.students)
      setKpis(data.kpis)
    } catch (err) {
      console.error('Erro ao buscar analytics de alunos:', err)
      showToast('Erro ao sincronizar métricas da turma.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedCourseId, selectedDisciplineId])

  // Filtra alunos em tempo real por busca de texto (nome ou email)
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.current_state.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Abertura do Modal de Detalhes
  const handleOpenStudentDetails = (student: StudentPerformanceRecord) => {
    setSelectedStudent(student)
    setIsDetailModalOpen(true)
  }

  // Exportar dados simulado
  const handleExportReport = () => {
    showToast('Relatório de desempenho exportado em formato CSV/PDF.')
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Toast de Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-top-4 duration-200">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ================= 1. CABEÇALHO & FILTROS GLOBAIS ================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-0.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Painel Analítico do Professor</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Desempenho da Turma
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportReport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exportar Dados</span>
            </button>

            <button
              type="button"
              onClick={fetchAnalyticsData}
              title="Atualizar dados analíticos"
              className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linha dos Filtros Globais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          {/* Filtrar por Curso */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Filtrar por Curso
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
            >
              <option value="all">Todos os Cursos da Plataforma</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filtrar por Disciplina */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              Filtrar por Disciplina
            </label>
            <select
              value={selectedDisciplineId}
              onChange={(e) => setSelectedDisciplineId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
            >
              <option value="all">Todas as Disciplinas / Módulos</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Busca por Nome ou Email */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              Buscar Aluno
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nome, e-mail ou estado nos EUA..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. CARDS DE INDICADORES (KPIS / SCORECARDS) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total de Alunos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total de Alunos
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpis.totalStudents}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{kpis.trends.students}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Progresso Médio */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Progresso Médio
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpis.averageProgress}%
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{kpis.trends.progress}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Média de Notas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Média de Notas
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpis.averageGrade.toFixed(1)}
              <span className="text-xs font-medium text-slate-400 ml-1">/ 10</span>
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{kpis.trends.grade}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Taxa de Conclusão */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taxa de Conclusão
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpis.completionRate}%
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{kpis.trends.completion}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. TABELA DE DESEMPENHO DOS ALUNOS ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Cabeçalho da Tabela */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Alunos Matriculados</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Listagem individual de progresso nas aulas e rendimento em avaliações.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {filteredStudents.length} {filteredStudents.length === 1 ? 'aluno' : 'alunos'}
          </span>
        </div>

        {/* Corpo da Tabela */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Calculando indicadores da turma...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Nenhum aluno encontrado</h3>
            <p className="text-xs text-slate-500 mt-1">
              Ajuste os filtros de curso ou os termos de pesquisa acima.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Aluno</th>
                  <th className="px-6 py-4 w-60">Progresso nas Aulas</th>
                  <th className="px-6 py-4 text-center">Nota Média</th>
                  <th className="px-6 py-4">Último Acesso</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const isPassing = student.average_grade >= 7.0
                  const isCompleted = student.progress_percentage === 100

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Coluna Aluno */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar_url}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                                {student.name}
                              </span>
                              <span className="text-xs">{student.origin_country}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              {student.email} • {student.current_state}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Coluna Progresso (Barra Visual) */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span
                              className={
                                isCompleted ? 'text-emerald-700' : 'text-slate-800'
                              }
                            >
                              {student.progress_percentage}% concluído
                            </span>
                            <span className="text-slate-400 text-[11px] font-normal">
                              {student.completed_lessons}/{student.total_lessons} aulas
                            </span>
                          </div>

                          {/* Barra de Progresso com Contraste Adequado */}
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60 p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isCompleted
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                  : student.progress_percentage < 40
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                              }`}
                              style={{ width: `${student.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Coluna Nota Média (Cores Dinâmicas) */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold border shadow-2xs ${
                            isPassing
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 ring-1 ring-emerald-500/10'
                              : 'bg-red-50 text-red-800 border-red-200/80 ring-1 ring-red-500/10'
                          }`}
                        >
                          {student.average_grade.toFixed(1)}
                          <span className="text-[10px] font-normal text-slate-500">
                            / 10
                          </span>
                        </span>
                      </td>

                      {/* Coluna Último Acesso */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px]">
                          {student.last_access}
                        </span>
                      </td>

                      {/* Coluna Ações: "Ver Detalhes" */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenStudentDetails(student)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-600 hover:text-white rounded-xl transition-all cursor-pointer shadow-2xs"
                          title="Visualizar histórico completo do aluno"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalhes</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé da Tabela */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>
              Dados sincronizados em tempo real com as atividades e provas dos alunos no AVA.
            </span>
          </div>
          <span className="font-semibold text-slate-700">
            Média Geral da Turma: {kpis.averageGrade.toFixed(1)} / 10
          </span>
        </div>
      </div>

      {/* Modal de Detalhes Individuais do Aluno */}
      <StudentDetailModal
        student={selectedStudent}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedStudent(null)
        }}
      />
    </div>
  )
}
