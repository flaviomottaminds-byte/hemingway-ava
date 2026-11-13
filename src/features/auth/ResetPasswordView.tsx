import React, { useState } from 'react'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  KeyRound,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ResetPasswordViewProps {
  onSuccess: () => void
  onBackToLogin: () => void
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  onSuccess,
  onBackToLogin,
}) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('A confirmação de senha não confere com a nova senha digitada.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        setErrorMessage(`Não foi possível atualizar a senha: ${error.message}`)
        setIsSubmitting(false)
        return
      }

      setIsCompleted(true)
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha na conexão ao atualizar a senha.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F2] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Topo com Logo */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[#EADBBE]/80">
        <div className="flex items-center gap-3">
          <div className="h-12 rounded-xl overflow-hidden bg-white border border-[#C59E5D]/40 shadow-xs flex items-center px-3 shrink-0">
            <img
              src="/logo-hemingway.png"
              alt="Hemingway School Logo"
              className="h-9 w-auto object-contain"
            />
          </div>
          <span className="px-2 py-0.5 text-xs font-bold bg-[#0F1B2F] text-[#FAF8F2] border border-[#C59E5D] rounded-full">
            AVA
          </span>
        </div>
      </header>

      {/* Card Central */}
      <main className="flex-1 flex items-center justify-center my-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-[#0F1B2F]/5 border border-[#EADBBE] p-8 sm:p-10 transition-all">
          <div className="text-center mb-6">
            <div className="inline-flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF8F2] border border-[#C59E5D]/40 shadow-sm flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-[#C59E5D]" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B2F] tracking-tight">
              Redefinir Senha
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#1C2E4A]/80 leading-relaxed">
              Crie uma nova senha segura para a sua conta na Hemingway School
            </p>
          </div>

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isCompleted ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Senha atualizada com sucesso!</p>
                  <p className="leading-relaxed">
                    Sua nova senha foi salva com segurança. Você já pode acessar o AVA com as novas credenciais.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onSuccess}
                className="w-full py-3 px-4 bg-[#0F1B2F] hover:bg-[#C59E5D] text-white hover:text-[#0F1B2F] font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#0F1B2F]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Acessar Sala de Aula</span>
                <ArrowRight className="w-4 h-4 text-[#C59E5D]" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F1B2F] mb-1 uppercase tracking-wider">
                  Nova Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-[#C59E5D]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F1B2F] mb-1 uppercase tracking-wider">
                  Confirmar Nova Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-[#C59E5D]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite novamente a nova senha"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#0F1B2F] hover:bg-[#C59E5D] text-white hover:text-[#0F1B2F] font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#0F1B2F]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C59E5D]" />
                    <span>Salvando nova senha...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Nova Senha</span>
                    <CheckCircle2 className="w-4 h-4 text-[#C59E5D]" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onBackToLogin}
                disabled={isSubmitting}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-center block"
              >
                Cancelar e voltar ao login
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Rodapé */}
      <footer className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-[#1C2E4A]/70">
          <ShieldCheck className="w-4 h-4 text-[#C59E5D] shrink-0" />
          <span>Hemingway School • Autenticação Segura via Supabase Auth</span>
        </div>
      </footer>
    </div>
  )
}
