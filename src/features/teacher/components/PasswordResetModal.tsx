import React, { useState } from 'react'
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import type { SupabaseTeamProfile } from '../../../types'

interface PasswordResetModalProps {
  isOpen: boolean
  member: SupabaseTeamProfile | null
  onClose: () => void
  onConfirm: (memberId: string, newPassword: string) => Promise<void>
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  member,
  onClose,
  onConfirm,
}) => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(true)
  const [copied, setCopied] = useState(false)
  const [forceChange, setForceChange] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Generate strong random password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let pwd = 'Pass@'
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    pwd += '26'
    setPassword(pwd)
  }

  // Auto initialize password when modal opens
  React.useEffect(() => {
    if (isOpen) {
      generateStrongPassword()
      setErrorMsg('')
      setCopied(false)
    }
  }, [isOpen, member])

  const handleCopy = () => {
    if (!password) return
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!member) return

    if (!password || password.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    try {
      setIsSubmitting(true)
      await onConfirm(member.id, password)
      onClose()
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao redefinir a senha do usuário.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-amber-50/60 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Alterar Senha de Acesso</h3>
              <p className="text-xs text-slate-500">Redefinição de credencial administrativa</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Member Card Summary */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-600">
                  {member.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{member.name}</p>
              <p className="text-xs text-slate-500 truncate">{member.email}</p>
            </div>
          </div>

          {/* Password Input with Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Nova Senha Temporária
              </label>
              <button
                type="button"
                onClick={generateStrongPassword}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                Gerar Outra
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira a nova senha"
                className="w-full pl-9 pr-20 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                  title="Copiar senha"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  title={showPassword ? 'Ocultar' : 'Exibir'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Force password change toggle */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
            <input
              type="checkbox"
              checked={forceChange}
              onChange={(e) => setForceChange(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-700 block">
                Exigir alteração no próximo acesso
              </span>
              <span className="text-slate-500">
                O colaborador deverá escolher uma senha pessoal ao entrar.
              </span>
            </div>
          </label>

          {/* Security note */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2 text-xs text-amber-800">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Certifique-se de enviar a nova credencial ao usuário por um canal seguro (e-mail institucional ou WhatsApp verificado).
            </span>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Atualizar Senha</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
