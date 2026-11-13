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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Barra Superior do Login com Seletor de Idioma */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="h-11 rounded-xl overflow-hidden bg-[#f7f5ed] border border-slate-200/80 shadow-xs flex items-center px-1.5 shrink-0">
            <img
              src="/logo-hemingway.png"
              alt="Hemingway School Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Hemingway <span className="text-[#0d1b2a]">School</span>
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
              AVA
            </span>
          </div>
        </div>

        {/* Seletor com botões ou dropdown no topo */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">
            {t('common.switchLanguage')}:
          </span>
          <LanguageSelector variant="buttons" />
        </div>
      </header>

      {/* Card Central de Login */}
      <main className="flex-1 flex items-center justify-center my-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 sm:p-10 transition-all">
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-4">
              <div className="h-16 rounded-2xl overflow-hidden bg-[#f7f5ed] border border-slate-200/80 shadow-xs flex items-center px-3">
                <img
                  src="/logo-hemingway.png"
                  alt="Hemingway School Logo"
                  className="h-14 w-auto object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('login.title')}
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {t('login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                {t('login.emailLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {t('login.passwordLabel')}
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {t('login.forgotPassword')}
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-xs text-slate-600 cursor-pointer select-none"
              >
                {t('login.rememberMe')}
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] cursor-pointer"
            >
              <span>{t('login.submitButton')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onLoginSuccess}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t('login.guestDemo')}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              {t('login.noAccount')}{' '}
              <a
                href="#register"
                onClick={(e) => e.preventDefault()}
                className="font-semibold text-blue-600 hover:underline"
              >
                {t('login.register')}
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Rodapé com Nota de Privacidade e Segurança */}
      <footer className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t('login.securityNote')}</span>
        </div>
      </footer>
    </div>
  )
}
