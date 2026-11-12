import React, { useState, useEffect } from 'react'
import {
  X,
  UserPlus,
  UserCheck,
  Mail,
  FileText,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Key,
} from 'lucide-react'
import type { SupabaseStudent, StudentStatus } from '../../../types'
import type { CreateStudentDTO } from '../../../services/studentEnrollmentService'

interface StudentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateStudentDTO) => Promise<void>
  initialData?: SupabaseStudent | null
  isSubmitting?: boolean
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSubmitting = false,
}) => {
  const isEditing = Boolean(initialData)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [phone, setPhone] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [status, setStatus] = useState<StudentStatus>('active')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setEmail(initialData.email)
      setDocumentId(initialData.document_id)
      setPhone(initialData.phone)
      setTemporaryPassword(initialData.temporary_password || 'Pass2026@Aluno')
      setStatus(initialData.status)
    } else {
      setName('')
      setEmail('')
      setDocumentId('')
      setPhone('+1 (407) ')
      setTemporaryPassword('Pass2026@' + Math.floor(100 + Math.random() * 900))
      setStatus('active')
    }
    setErrors({})
    setShowPassword(false)
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$'
    let pwd = 'Pass@'
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setTemporaryPassword(pwd)
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) {
      errs.name = 'O nome completo do aluno é obrigatório.'
    } else if (name.trim().length < 4) {
      errs.name = 'Digite nome e sobrenome.'
    }

    if (!email.trim()) {
      errs.email = 'O e-mail é obrigatório.'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'E-mail em formato inválido.'
    }

    if (!documentId.trim()) {
      errs.documentId = 'Informe o CPF, ITIN ou Documento de Identificação.'
    }

    if (!phone.trim()) {
      errs.phone = 'Informe o telefone ou WhatsApp com DDD/código do país.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await onSave({
      name: name.trim(),
      email: email.trim(),
      document_id: documentId.trim(),
      phone: phone.trim(),
      temporary_password: temporaryPassword.trim(),
      status,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              {isEditing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Editar Perfil do Aluno' : 'Cadastrar Novo Aluno'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Atualize os dados de identificação e contato do estudante no AVA.'
                  : 'Preencha os dados cadastrais para liberar o acesso do estudante.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mateo Silva Santos"
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name}
              </p>
            )}
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              E-mail de Acesso <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mateo.silva@exemplo.com"
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.email}
              </p>
            )}
          </div>

          {/* CPF / Documento & Telefone / WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                CPF / ITIN / ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="123.456.789-00"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.documentId
                    ? 'border-red-300 focus:ring-red-500/20'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />
              {errors.documentId && (
                <p className="mt-1 text-xs text-red-600">{errors.documentId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Telefone / WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (407) 555-0192"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.phone
                    ? 'border-red-300 focus:ring-red-500/20'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>
          </div>

          {/* Senha Provisória */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Senha Provisória
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Key className="w-3 h-3" />
                Gerar Senha Aleatória
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              O aluno será orientado a alterar esta senha no primeiro login no AVA.
            </p>
          </div>

          {/* Status do Aluno (Ativo / Inativo) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Status da Conta
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  status === 'active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-500/10'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Ativo (Acesso Liberado)</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('inactive')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  status === 'inactive'
                    ? 'bg-amber-50 text-amber-800 border-amber-400 ring-2 ring-amber-500/10'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Inativo (Bloqueado)</span>
              </button>
            </div>
          </div>

          {/* Rodapé com Ações */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando no Supabase...</span>
                </>
              ) : (
                <span>{isEditing ? 'Atualizar Perfil' : 'Salvar Aluno'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
