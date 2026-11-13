import React, { useState } from 'react'
import { Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2, X, KeyRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  initialEmail?: string
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState(initialEmail)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Atualiza email se initialEmail mudar
  React.useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail)
    }
  }, [initialEmail])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu e-mail cadastrado.')
      return
    }

    setIsSubmitting(true)

    try {
      const redirectUrl = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      })

      if (error) {
        setErrorMessage(`Falha ao solicitar recuperação: ${error.message}`)
        setIsSubmitting(false)
        return
      }

      setSuccessMessage(
        'E-mail de recuperação enviado! Verifique sua caixa de entrada para redefinir sua senha.',
      )
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha na conexão com os servidores do Supabase.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EADBBE] p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF8F2] border border-[#C59E5D]/30 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-[#C59E5D]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0F1B2F]">
              Recuperação de Senha
            </h2>
            <p className="text-xs text-slate-500">Hemingway School • AVA</p>
          </div>
        </div>

        {/* Mensagem de Sucesso */}
        {successMessage ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Solicitação enviada!</p>
                <p className="leading-relaxed">{successMessage}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Caso não encontre na caixa de entrada em instantes, confira também sua pasta de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong>.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 px-4 bg-[#0F1B2F] hover:bg-[#C59E5D] text-white hover:text-[#0F1B2F] font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer mt-2"
            >
              Voltar ao Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Digite seu e-mail cadastrado para enviarmos as instruções e o link seguro de redefinição da sua senha.
            </p>

            {/* Mensagem de Erro */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#0F1B2F] mb-1 uppercase tracking-wider">
                E-mail Cadastrado <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#C59E5D]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aluno@hemingwayschool.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition-all"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#0F1B2F] hover:bg-[#C59E5D] text-white hover:text-[#0F1B2F] font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C59E5D]" />
                    <span>Enviando instruções...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Instruções de Recuperação</span>
                    <ArrowRight className="w-4 h-4 text-[#C59E5D]" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-center"
              >
                Cancelar e voltar ao login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
