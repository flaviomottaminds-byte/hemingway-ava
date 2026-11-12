import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldAlert,
  Award,
  BookOpen,
  LifeBuoy,
  Edit2,
  KeyRound,
  Ban,
  CheckCircle,
  Trash2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Shield,
  Layers,
} from 'lucide-react'
import type {
  SupabaseTeamProfile,
  TeamRole,
  TeamMemberStatus,
  SupabaseDiscipline,
} from '../../types'
import { teamService } from '../../services/teamService'
import type { CreateTeamMemberDTO } from '../../services/teamService'
import { curriculumService } from '../../services/curriculumService'
import { TeamMemberFormModal } from './components/TeamMemberFormModal'
import { PasswordResetModal } from './components/PasswordResetModal'

export const TeacherTeamManagementView: React.FC = () => {
  const [team, setTeam] = useState<SupabaseTeamProfile[]>([])
  const [disciplines, setDisciplines] = useState<SupabaseDiscipline[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<TeamRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<TeamMemberStatus | 'all'>('all')

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [memberToEdit, setMemberToEdit] = useState<SupabaseTeamProfile | null>(null)

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [memberForPassword, setMemberForPassword] = useState<SupabaseTeamProfile | null>(null)

  const [deleteConfirmMember, setDeleteConfirmMember] = useState<SupabaseTeamProfile | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const showToast = (message: string) => {
    setSuccessToast(message)
    setTimeout(() => {
      setSuccessToast(null)
    }, 3500)
  }

  // Load Team & Disciplines
  const loadData = async () => {
    try {
      setLoading(true)
      const [membersData, disciplinesData] = await Promise.all([
        teamService.getTeamMembers(),
        curriculumService.getDisciplines(),
      ])
      setTeam(membersData)
      setDisciplines(disciplinesData)
    } catch (err) {
      console.error('Erro ao carregar dados da equipe:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Lookup map for discipline names
  const disciplineMap = useMemo(() => {
    const map = new Map<string, string>()
    disciplines.forEach((d) => map.set(d.id, d.name))
    return map
  }, [disciplines])

  // Filtered list
  const filteredMembers = useMemo(() => {
    return team.filter((m) => {
      const matchRole = roleFilter === 'all' || m.role === roleFilter
      const matchStatus = statusFilter === 'all' || m.status === statusFilter

      const q = searchQuery.toLowerCase().trim()
      const matchQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q)

      return matchRole && matchStatus && matchQuery
    })
  }, [team, roleFilter, statusFilter, searchQuery])

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = team.length
    const activeCount = team.filter((m) => m.status === 'active').length
    const admins = team.filter((m) => m.role === 'admin').length
    const teachers = team.filter((m) => m.role === 'teacher').length
    const coordsAndSupport = team.filter(
      (m) => m.role === 'coordinator' || m.role === 'support',
    ).length

    return { total, activeCount, admins, teachers, coordsAndSupport }
  }, [team])

  // Handlers
  const handleOpenCreateModal = () => {
    setMemberToEdit(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (member: SupabaseTeamProfile) => {
    setMemberToEdit(member)
    setIsFormModalOpen(true)
  }

  const handleOpenPasswordModal = (member: SupabaseTeamProfile) => {
    setMemberForPassword(member)
    setIsPasswordModalOpen(true)
  }

  const handleSaveMember = async (dto: CreateTeamMemberDTO) => {
    if (memberToEdit) {
      const res = await teamService.updateMember(memberToEdit.id, dto)
      setTeam((prev) => prev.map((m) => (m.id === res.member.id ? res.member : m)))
      if (res.isLive) {
        showToast(`Perfil de ${res.member.name} atualizado no Supabase!`)
      } else if (res.error) {
        showToast(`Salvo localmente. (${res.error})`)
      } else {
        showToast(`Perfil de ${res.member.name} atualizado com sucesso!`)
      }
    } else {
      const res = await teamService.createMember(dto)
      setTeam((prev) => [res.member, ...prev])
      if (res.isLive) {
        showToast(`Membro ${res.member.name} gravado no Supabase!`)
      } else if (res.error) {
        showToast(`Salvo localmente. (${res.error})`)
      } else {
        showToast(`Membro ${res.member.name} adicionado com sucesso!`)
      }
    }
  }

  const handleUpdatePassword = async (memberId: string, newPass: string) => {
    const success = await teamService.updatePassword(memberId, newPass)
    if (success) {
      setTeam((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, temporary_password: newPass } : m,
        ),
      )
      showToast('Senha de acesso redefinida com sucesso!')
    }
  }

  const handleToggleStatus = async (member: SupabaseTeamProfile) => {
    try {
      const updated = await teamService.toggleMemberStatus(member.id)
      setTeam((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
      showToast(
        `Usuário ${updated.name} foi marcado como ${
          updated.status === 'active' ? 'Ativo' : 'Inativo / Bloqueado'
        }.`,
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteMember = async () => {
    if (!deleteConfirmMember) return
    try {
      await teamService.deleteMember(deleteConfirmMember.id)
      setTeam((prev) => prev.filter((m) => m.id !== deleteConfirmMember.id))
      showToast(`Membro ${deleteConfirmMember.name} removido com sucesso.`)
      setDeleteConfirmMember(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Deseja restaurar a lista inicial da equipe do sistema? Alterações locais serão reiniciadas.',
      )
    ) {
      teamService.resetDefaults()
      loadData()
      showToast('Lista de equipe restaurada para o padrão!')
    }
  }

  // Render role badges
  const renderRoleBadge = (role: TeamRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            Administrador
          </span>
        )
      case 'coordinator':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Award className="w-3.5 h-3.5 text-purple-600" />
            Coordenador
          </span>
        )
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            Professor
          </span>
        )
      case 'support':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <LifeBuoy className="w-3.5 h-3.5 text-emerald-600" />
            Suporte / Admin
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Administração</span>
            <span>&gt;</span>
            <span className="text-indigo-600">Usuários & Equipe</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-indigo-600" />
            Gestão de Usuários e Equipe
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Controle de acesso baseado em papéis (RBAC), atribuição pedagógica de professores e credenciais do AVA.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleResetDefaults}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            title="Restaurar dados padrão"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Novo Membro</span>
          </button>
        </div>
      </div>

      {/* Scorecards / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Colaboradores */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total da Equipe
            </p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{metrics.total}</h3>
            <span className="inline-block mt-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              {metrics.activeCount} ativos
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Administradores */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Administradores
            </p>
            <h3 className="text-2xl font-extrabold text-red-600 mt-1">{metrics.admins}</h3>
            <span className="inline-block mt-1 text-xs font-medium text-slate-500">
              Acesso total ao sistema
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Professores */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Corpo Docente
            </p>
            <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{metrics.teachers}</h3>
            <span className="inline-block mt-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              Com disciplinas vinculadas
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Coordenação & Suporte */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Coordenação & Suporte
            </p>
            <h3 className="text-2xl font-extrabold text-purple-600 mt-1">
              {metrics.coordsAndSupport}
            </h3>
            <span className="inline-block mt-1 text-xs font-medium text-slate-500">
              Operação acadêmica
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, e-mail institucional ou telefone..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Perfil:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as TeamRole | 'all')}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer py-1"
            >
              <option value="all">Todos os Perfis</option>
              <option value="admin">Administrador</option>
              <option value="coordinator">Coordenador</option>
              <option value="teacher">Professor</option>
              <option value="support">Suporte / Administrativo</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TeamMemberStatus | 'all')}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer py-1"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos / Bloqueados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Carregando membros da equipe...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">Nenhum membro encontrado</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nenhum colaborador corresponde aos filtros selecionados. Tente alterar a busca ou cadastre um novo membro.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
            >
              + Novo Membro
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Membro / Contato</th>
                  <th className="py-3.5 px-4">Perfil de Acesso</th>
                  <th className="py-3.5 px-4">Atribuições Pedagógicas</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredMembers.map((member) => {
                  const assignedCount = member.assigned_discipline_ids?.length || 0

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/60 transition duration-150 group"
                    >
                      {/* Avatar, Nome e Contato */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">
                                {member.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-sm leading-snug truncate">
                              {member.name}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-xs text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                {member.email}
                              </span>
                              <span className="hidden sm:inline text-slate-300">•</span>
                              <span className="flex items-center gap-1 truncate">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                {member.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Perfil de Acesso */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {renderRoleBadge(member.role)}
                      </td>

                      {/* Atribuições Pedagógicas (Disciplinas) */}
                      <td className="py-4 px-4">
                        {member.role === 'teacher' ? (
                          assignedCount > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800">
                                <Layers className="w-3.5 h-3.5 text-blue-600" />
                                <span>{assignedCount} disciplina(s)</span>
                              </div>
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {member.assigned_discipline_ids?.slice(0, 2).map((discId) => (
                                  <span
                                    key={discId}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[130px]"
                                    title={disciplineMap.get(discId) || discId}
                                  >
                                    {disciplineMap.get(discId) || discId}
                                  </span>
                                ))}
                                {assignedCount > 2 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                                    +{assignedCount - 2} mais
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200/60 inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Nenhuma disciplina
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {member.role === 'admin'
                              ? 'Acesso global a todo o AVA'
                              : member.role === 'coordinator'
                              ? 'Coordenação de todos os cursos'
                              : 'Acesso a suporte geral'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {member.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inativo / Bloqueado
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Editar Perfil */}
                          <button
                            onClick={() => handleOpenEditModal(member)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Editar Perfil"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Alterar Senha */}
                          <button
                            onClick={() => handleOpenPasswordModal(member)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Alterar Senha"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Bloquear / Desbloquear */}
                          <button
                            onClick={() => handleToggleStatus(member)}
                            className={`p-1.5 rounded-lg transition ${
                              member.status === 'active'
                                ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={
                              member.status === 'active'
                                ? 'Bloquear/Desativar Usuário'
                                : 'Reativar Usuário'
                            }
                          >
                            {member.status === 'active' ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>

                          {/* Excluir */}
                          <button
                            onClick={() => setDeleteConfirmMember(member)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Excluir Usuário"
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
      </div>

      {/* Confirmation Dialog for Deletion */}
      {deleteConfirmMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center">Excluir Membro?</h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Tem certeza de que deseja remover o acesso de{' '}
              <strong className="text-slate-700">{deleteConfirmMember.name}</strong>? Esta ação
              simulada removerá o registro da tabela profiles do Supabase.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMember(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                className="flex-1 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TeamMemberFormModal
        isOpen={isFormModalOpen}
        memberToEdit={memberToEdit}
        onClose={() => {
          setIsFormModalOpen(false)
          setMemberToEdit(null)
        }}
        onSave={handleSaveMember}
      />

      <PasswordResetModal
        isOpen={isPasswordModalOpen}
        member={memberForPassword}
        onClose={() => {
          setIsPasswordModalOpen(false)
          setMemberForPassword(null)
        }}
        onConfirm={handleUpdatePassword}
      />
    </div>
  )
}
