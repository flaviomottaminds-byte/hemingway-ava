import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Plus,
  Pencil,
  GraduationCap,
  Trash2,
  Phone,
  Mail,
  FileText,
  UserCheck,
  UserX,
  RefreshCw,
  Sparkles,
  Database,
  Filter,
} from 'lucide-react'
import type { SupabaseStudent } from '../../types'
import { studentEnrollmentService } from '../../services/studentEnrollmentService'
import type { CreateStudentDTO } from '../../services/studentEnrollmentService'
import { StudentFormModal } from './components/StudentFormModal'
import { EnrollmentsManagementModal } from './components/EnrollmentsManagementModal'

export const TeacherStudentsManagementView: React.FC = () => {
  const [students, setStudents] = useState<SupabaseStudent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(true)

  // Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedStudentForEdit, setSelectedStudentForEdit] =
    useState<SupabaseStudent | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedStudentForEnrollments, setSelectedStudentForEnrollments] =
    useState<SupabaseStudent | null>(null)
  const [isEnrollmentsModalOpen, setIsEnrollmentsModalOpen] = useState(false)

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Carrega alunos
  const fetchStudents = async () => {
    setLoading(true)
    try {
      const data = await studentEnrollmentService.getStudents()
      setStudents(data)
    } catch (err) {
      console.error('Erro ao carregar estudantes:', err)
      showToast('Erro ao sincronizar diretório de alunos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // Abertura do modal para Novo Aluno
  const handleOpenCreateModal = () => {
    setSelectedStudentForEdit(null)
    setIsFormModalOpen(true)
  }

  // Abertura do modal para Editar Perfil
  const handleOpenEditModal = (student: SupabaseStudent) => {
    setSelectedStudentForEdit(student)
    setIsFormModalOpen(true)
  }

  // Salvar Aluno (Criar ou Atualizar)
  const handleSaveStudent = async (dto: CreateStudentDTO) => {
    setIsSubmitting(true)
    try {
      if (selectedStudentForEdit) {
        const updated = await studentEnrollmentService.updateStudent(
          selectedStudentForEdit.id,
          dto,
        )
        setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
        showToast(`Perfil de "${updated.name}" atualizado no Supabase!`)
      } else {
        const created = await studentEnrollmentService.createStudent(dto)
        setStudents((prev) => [created, ...prev])
        showToast(`Novo aluno "${created.name}" cadastrado com sucesso!`)
      }
      setIsFormModalOpen(false)
      setSelectedStudentForEdit(null)
    } catch (err) {
      console.error('Erro ao salvar aluno:', err)
      showToast('Falha ao processar cadastro no banco.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Abertura do modal de Gerenciar Matrículas
  const handleOpenEnrollmentsModal = (student: SupabaseStudent) => {
    setSelectedStudentForEnrollments(student)
    setIsEnrollmentsModalOpen(true)
  }

  // Excluir Aluno
  const handleDeleteStudent = async (student: SupabaseStudent) => {
    if (
      !window.confirm(
        `Deseja realmente remover o aluno "${student.name}" do sistema? Todas as matrículas associadas serão revogadas.`,
      )
    ) {
      return
    }

    try {
      await studentEnrollmentService.deleteStudent(student.id)
      setStudents((prev) => prev.filter((s) => s.id !== student.id))
      showToast(`Aluno "${student.name}" excluído do sistema.`)
    } catch (err) {
      console.error('Erro ao excluir aluno:', err)
      showToast('Falha ao excluir registro do banco.')
    }
  }

  // Reset de Demonstração
  const handleResetDefaults = () => {
    studentEnrollmentService.resetDefaults()
    fetchStudents()
    showToast('Diretório de alunos e matrículas restaurado para o padrão.')
  }

  // Filtro em tempo real por busca (Nome, Email ou Documento/CPF)
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.document_id.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q)

    const matchesStatus =
      statusFilter === 'all' || s.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Métricas
  const totalStudents = students.length
  const activeStudents = students.filter((s) => s.status === 'active').length
  const inactiveStudents = students.filter((s) => s.status === 'inactive').length

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-top-4 duration-200">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ================= CABEÇALHO & BOTÃO PRIMÁRIO "+ NOVO ALUNO" ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-100">
            <Users className="w-3.5 h-3.5" />
            <span>Gestão Acadêmica • Painel Administrativo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            Gestão de Alunos & Matrículas
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {totalStudents} cadastrados
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre estudantes, gerencie credenciais de acesso e controle o vínculo de matrículas nos cursos do AVA.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            title="Restaurar dados padrão"
            className="p-3 text-slate-400 hover:text-slate-700 hover:bg-white border border-slate-200/80 rounded-2xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Botão Primário: "+ Novo Aluno" */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all transform active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Novo Aluno</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{totalStudents}</p>
            <p className="text-xs font-medium text-slate-500">Total de Alunos</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{activeStudents}</p>
            <p className="text-xs font-medium text-slate-500">Alunos Ativos</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{inactiveStudents}</p>
            <p className="text-xs font-medium text-slate-500">Inativos / Bloqueados</p>
          </div>
        </div>
      </div>

      {/* ================= 1. DIRETÓRIO DE ALUNOS (SEARCH BAR & TABELA) ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Barra de Pesquisa e Filtro de Status */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
          {/* Search Bar no Topo */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar aluno por nome, e-mail, CPF ou documento..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-xs"
            />
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">Status: Todos</option>
                <option value="active">🟢 Apenas Ativos</option>
                <option value="inactive">🟡 Apenas Inativos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Dados dos Alunos */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Consultando tabela students no Supabase...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Nenhum aluno encontrado</h3>
            <p className="text-xs text-slate-500 mt-1">
              Verifique os termos da busca ou cadastre um novo aluno.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Cadastrar Aluno
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Aluno</th>
                  <th className="px-6 py-4">Documento (CPF / ITIN)</th>
                  <th className="px-6 py-4">Telefone / WhatsApp</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const isActive = student.status === 'active'

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Coluna Aluno: Foto (Avatar), Nome e E-mail */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={student.avatar_url}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm block">
                              {student.name}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {student.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Coluna Documento */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-mono text-xs">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {student.document_id}
                        </span>
                      </td>

                      {/* Coluna Telefone */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {student.phone}
                        </span>
                      </td>

                      {/* Coluna Status (Ativo / Inativo) */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span>{isActive ? 'Ativo' : 'Inativo'}</span>
                        </span>
                      </td>

                      {/* Coluna Ações: "Editar Perfil" e "Gerenciar Matrículas" */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {/* Editar Perfil */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(student)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                            title="Editar dados cadastrais do aluno"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-500" />
                            <span>Editar Perfil</span>
                          </button>

                          {/* Gerenciar Matrículas */}
                          <button
                            type="button"
                            onClick={() => handleOpenEnrollmentsModal(student)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
                            title="Gerenciar cursos em que o aluno está matriculado"
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                            <span>Gerenciar Matrículas</span>
                          </button>

                          {/* Excluir Aluno */}
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(student)}
                            className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remover aluno"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
              Diretório sincronizado com as tabelas <strong>students</strong> e{' '}
              <strong>enrollments</strong> do Supabase.
            </span>
          </div>
          <span className="font-semibold text-slate-700">
            {filteredStudents.length} de {totalStudents} alunos exibidos
          </span>
        </div>
      </div>

      {/* ================= 2. MODAL DE CADASTRO/EDIÇÃO DE ALUNO ================= */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedStudentForEdit(null)
        }}
        onSave={handleSaveStudent}
        initialData={selectedStudentForEdit}
        isSubmitting={isSubmitting}
      />

      {/* ================= 3. MODAL DE GESTÃO DE MATRÍCULAS ================= */}
      <EnrollmentsManagementModal
        student={selectedStudentForEnrollments}
        isOpen={isEnrollmentsModalOpen}
        onClose={() => {
          setIsEnrollmentsModalOpen(false)
          setSelectedStudentForEnrollments(null)
        }}
      />
    </div>
  )
}
