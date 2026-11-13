import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Mail, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react'
import { LanguageSelector } from '../../components/common/LanguageSelector'

interface LoginViewProps {
  onLoginSuccess: () => void
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('mateo.silva@exemplo.com')
  const [password, setPassword] = useState('••••••••')
  const [rememberMe, setRememberMe] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLoginSuccess()
  }

  return (
    <div className="min-h-screen bg-[#FAF8F2] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Barra Superior do Login com Seletor de Idioma */}
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

        {/* Seletor com botões ou dropdown no topo */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#1C2E4A]/70 hidden sm:inline">
            {t('common.switchLanguage')}:
          </span>
          <LanguageSelector variant="buttons" />
        </div>
      </header>

      {/* Card Central de Login */}
      <main className="flex-1 flex items-center justify-center my-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-[#0F1B2F]/5 border border-[#EADBBE] p-8 sm:p-10 transition-all">
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-5">
              <div className="h-20 rounded-2xl overflow-hidden bg-white border border-[#C59E5D]/40 shadow-sm flex items-center px-6">
                <img
                  src="/logo-hemingway.png"
                  alt="Hemingway School Logo"
                  className="h-14 w-auto object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B2F] tracking-tight">
              {t('login.title')}
            </h1>
            <p className="mt-2 text-sm text-[#1C2E4A]/80 leading-relaxed">
              {t('login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#0F1B2F] mb-1.5 uppercase tracking-wider">
                {t('login.emailLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#C59E5D]" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#0F1B2F] uppercase tracking-wider">
                  {t('login.passwordLabel')}
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs font-semibold text-[#C59E5D] hover:text-[#B38C4B] hover:underline"
                >
                  {t('login.forgotPassword')}
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#C59E5D]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition-all"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-[#C59E5D] focus:ring-[#C59E5D] border-[#EADBBE] rounded cursor-pointer accent-[#C59E5D]"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-xs text-[#1C2E4A]/80 cursor-pointer select-none font-medium"
              >
                {t('login.rememberMe')}
              </label>
            </div>

            {/* Botão Primário: Azul Marinho com hover em Dourado */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-[#0F1B2F] hover:bg-[#C59E5D] text-white hover:text-[#0F1B2F] font-bold rounded-xl shadow-lg shadow-[#0F1B2F]/20 flex items-center justify-center gap-2 transition-all duration-200 border border-[#C59E5D]/50 transform active:scale-[0.99] cursor-pointer"
            >
              <span>{t('login.submitButton')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Botão Demonstração */}
            <button
              type="button"
              onClick={onLoginSuccess}
              className="w-full py-2.5 px-4 bg-[#FAF8F2] hover:bg-[#F2EDE2] text-[#0F1B2F] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-[#EADBBE] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#C59E5D]" />
              <span>{t('login.guestDemo')}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#EADBBE]/60 text-center">
            <p className="text-xs text-[#1C2E4A]/70">
              {t('login.noAccount')}{' '}
              <a
                href="#register"
                onClick={(e) => e.preventDefault()}
                className="font-bold text-[#C59E5D] hover:underline"
              >
                {t('login.register')}
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Rodapé com Nota de Privacidade e Segurança */}
      <footer className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-[#1C2E4A]/70">
          <ShieldCheck className="w-4 h-4 text-[#C59E5D] shrink-0" />
          <span>{t('login.securityNote')}</span>
        </div>
      </footer>
    </div>
  )
}
