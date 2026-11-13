import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Mail,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ShieldAlert,
  Award,
  BookOpen,
  LifeBuoy,
  CheckCircle2,
  AlertCircle,
  BookCheck,
  FileText,
} from 'lucide-react'
import type {
  SupabaseTeamProfile,
  TeamRole,
  TeamMemberStatus,
  SupabaseDiscipline,
} from '../../../types'
import { curriculumService } from '../../../services/curriculumService'
import type { CreateTeamMemberDTO } from '../../../services/teamService'

interface TeamMemberFormModalProps {
  isOpen: boolean
  memberToEdit?: SupabaseTeamProfile | null
  onClose: () => void
  onSave: (data: CreateTeamMemberDTO) => Promise<void>
}

const ROLE_OPTIONS: {
  role: TeamRole
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  badgeBg: string
  badgeText: string
  borderColor: string
  activeRing: string
}[] = [
  {
    role: 'admin',
    title: 'Administrador',
    subtitle: 'Acesso irrestrito a todas as áreas, equipe, configurações e logs.',
    icon: ShieldAlert,
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    badgeText: 'Acesso Total',
    borderColor: 'border-red-200 hover:border-red-400',
    activeRing: 'ring-2 ring-red-500 border-red-500 bg-red-50/40',
  },
  {
    role: 'coordinator',
    title: 'Coordenador',
    subtitle: 'Gestão de cursos, ementas, grade curricular e relatórios gerais.',
    icon: Award,
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeText: 'Gestão Acadêmica',
    borderColor: 'border-purple-200 hover:border-purple-400',
    activeRing: 'ring-2 ring-purple-500 border-purple-500 bg-purple-50/40',
  },
  {
    role: 'teacher',
    title: 'Professor',
    subtitle: 'Criação de aulas, vídeos, materiais complementares e avaliações.',
    icon: BookOpen,
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeText: 'Pedagógico',
    borderColor: 'border-blue-200 hover:border-blue-400',
    activeRing: 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/40',
  },
  {
    role: 'support',
    title: 'Suporte / Administrativo',
    subtitle: 'Atendimento a alunos, matrículas, tickets de dúvida e moderação.',
    icon: LifeBuoy,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'Operacional',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
    activeRing: 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/40',
  },
]

export const TeamMemberFormModal: React.FC<TeamMemberFormModalProps> = ({
  isOpen,
  memberToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<TeamRole>('teacher')
  const [status, setStatus] = useState<TeamMemberStatus>('active')
  const [documentType, setDocumentType] = useState('Passaporte')
  const [documentNumber, setDocumentNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [assignedDisciplines, setAssignedDisciplines] = useState<string[]>([])

  const [allDisciplines, setAllDisciplines] = useState<SupabaseDiscipline[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Load disciplines list from curriculumService
  useEffect(() => {
    let isMounted = true
    curriculumService.getDisciplines().then((data) => {
      if (isMounted) setAllDisciplines(data)
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Sync state with memberToEdit or defaults
  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name)
      setEmail(memberToEdit.email)
      setPhone(memberToEdit.phone)
      setRole(memberToEdit.role)
      setStatus(memberToEdit.status)
      setDocumentType(memberToEdit.document_type || 'Passaporte')
      setDocumentNumber(memberToEdit.document_number || '')
      setPassword(memberToEdit.temporary_password || '')
      setAssignedDisciplines(memberToEdit.assigned_discipline_ids || [])
    } else {
      setName('')
      setEmail('')
      setPhone('')
      setRole('teacher')
      setStatus('active')
      setDocumentType('Passaporte')
      setDocumentNumber('')
      setPassword(generateStrongPassword())
      setAssignedDisciplines([])
    }
    setErrorMsg('')
    setShowPassword(false)
  }, [memberToEdit, isOpen])

  function generateStrongPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let pwd = 'AVA@'
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pwd + '26'
  }

  const handleGeneratePassword = () => {
    setPassword(generateStrongPassword())
  }

  const toggleDiscipline = (discId: string) => {
    setAssignedDisciplines((prev) =>
      prev.includes(discId) ? prev.filter((id) => id !== discId) : [...prev, discId],
    )
  }

  const selectAllDisciplines = () => {
    setAssignedDisciplines(allDisciplines.map((d) => d.id))
  }

  const clearDisciplines = () => {
    setAssignedDisciplines([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!name.trim()) {
      setErrorMsg('Por favor, informe o nome completo do membro.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor, insira um endereço de e-mail corporativo válido.')
      return
    }

    if (!phone.trim()) {
      setErrorMsg('Por favor, informe o telefone de contato.')
      return
    }

    if (!memberToEdit && !password.trim()) {
      setErrorMsg('Por favor, defina uma senha provisória de primeiro acesso.')
      return
    }

    if (role === 'teacher' && assignedDisciplines.length === 0) {
      setErrorMsg(
        'Atenção: Selecione ao menos 1 disciplina atribuída a este professor para que ele possa gerenciar o conteúdo.',
      )
      return
    }

    try {
      setIsSubmitting(true)
      await onSave({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role,
        status,
        document_type: documentType,
        document_number: documentNumber.trim() || undefined,
        temporary_password: password.trim() || undefined,
        assigned_discipline_ids: role === 'teacher' ? assignedDisciplines : undefined,
      })
      onClose()
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro inesperado ao salvar o membro da equipe.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {memberToEdit ? 'Editar Perfil do Membro' : 'Novo Membro da Equipe'}
              </h3>
              <p className="text-xs text-slate-500">
                {memberToEdit
                  ? 'Atualize privilégios de acesso, dados cadastrais e disciplinas vinculadas.'
                  : 'Cadastre administradores, coordenadores, professores e suporte com controle RBAC.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>1. Informações Cadastrais</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Dra. Mariana Vasquez"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  E-mail Corporativo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@hemingway.school"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Telefone / WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (407) 555-0199"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status da Conta
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                      status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('inactive')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                      status === 'inactive'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Inativo / Bloqueado
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tipo de Documento (Identificação)
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                >
                  <option value="Passaporte">Passaporte Internacional</option>
                  <option value="Driver License">Driver License (CNH EUA)</option>
                  <option value="ID Estadual">ID Estadual (State ID)</option>
                  <option value="ITIN">ITIN Number</option>
                  <option value="CPF">CPF (Brasil)</option>
                  <option value="Outro">Outro Documento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Número do Documento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Ex: FL-DL-883921 ou 987-65-4321"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Senha Provisória */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Senha Provisória de Acesso {memberToEdit ? '(Opcional)' : <span className="text-red-500">*</span>}
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  Gerar Senha Segura
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={memberToEdit ? 'Manter senha atual (não alterar)' : 'Defina ou gere a senha'}
                  className="w-full pl-9 pr-10 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  title={showPassword ? 'Ocultar' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                O usuário receberá esta chave e será solicitado a redefini-la no primeiro login.
              </p>
            </div>
          </div>

          {/* Perfil de Acesso (RBAC) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Perfil de Acesso (Nível de Permissão) <span className="text-red-500">*</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((opt) => {
                const IconComponent = opt.icon
                const isSelected = role === opt.role

                return (
                  <div
                    key={opt.role}
                    onClick={() => setRole(opt.role)}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                      isSelected ? opt.activeRing : `${opt.borderColor} bg-white hover:bg-slate-50`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{opt.title}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${opt.badgeBg}`}>
                        {opt.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{opt.subtitle}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Vínculo Específico (Condicional para Professor) */}
          {role === 'teacher' && (
            <div className="space-y-3 p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookCheck className="w-4 h-4 text-blue-600" />
                    <span>3. Disciplinas Atribuídas ao Professor</span>
                    <span className="text-red-500">*</span>
                  </h4>
                  <p className="text-xs text-blue-700">
                    Selecione quais disciplinas este professor tem permissão para editar, adicionar aulas e avaliar:
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllDisciplines}
                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline"
                  >
                    Marcar todas
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={clearDisciplines}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 underline"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {allDisciplines.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Carregando disciplinas cadastradas...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {allDisciplines.map((disc) => {
                    const isChecked = assignedDisciplines.includes(disc.id)
                    return (
                      <button
                        type="button"
                        key={disc.id}
                        onClick={() => toggleDiscipline(disc.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition ${
                          isChecked
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                            isChecked ? 'bg-white text-blue-600 border-white' : 'border-slate-300 bg-slate-50'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">{disc.name}</p>
                          <span
                            className={`text-[10px] ${
                              isChecked ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            {disc.code || 'AVA'} • {disc.estimated_hours}h
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="text-[11px] text-blue-800 font-medium">
                {assignedDisciplines.length === 0 ? (
                  <span className="text-amber-700 font-semibold">
                    Nenhuma disciplina selecionada. Selecione ao menos uma para autorizar o professor.
                  </span>
                ) : (
                  <span>
                    ✓ {assignedDisciplines.length} de {allDisciplines.length} disciplinas vinculadas.
                  </span>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Gravando no Supabase...</span>
              </>
            ) : (
              <span>{memberToEdit ? 'Atualizar Perfil' : 'Salvar Membro'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
