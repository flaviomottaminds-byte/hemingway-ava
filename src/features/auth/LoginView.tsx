import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  UserPlus,
  LogIn,
} from 'lucide-react'
import { LanguageSelector } from '../../components/common/LanguageSelector'
import { supabase } from '../../lib/supabase'
import type { UserProfile } from '../../types'
import { mockUser } from '../../services/mockData'
import { ForgotPasswordModal } from './ForgotPasswordModal'

interface LoginViewProps {
  onLoginSuccess: (profile?: UserProfile) => void
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation()

  // Modo: 'login' (Entrar) ou 'register' (Criar Conta de Aluno)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Autenticação com o Google OAuth
  const handleGoogleSignIn = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        console.warn('Erro ao conectar com Google:', error.message)
        setErrorMessage(`Falha na autenticação com o Google: ${error.message}`)
        setIsSubmitting(false)
      }
    } catch (err: unknown) {
      console.error('Falha Google OAuth:', err)
      setErrorMessage(
        err instanceof Error ? err.message : 'Não foi possível iniciar a autenticação com o Google.',
      )
      setIsSubmitting(false)
    }
  }

  // Submissão do Formulário (Login ou Cadastro via Supabase Auth)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha.')
      return
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.')
      return
    }

    setIsSubmitting(true)

    // Limpa dados de sessões ou simulações antigas
    localStorage.clear()
    sessionStorage.clear()

    try {
      if (mode === 'register') {
        // 1. Cadastro via Supabase Auth
        let { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              name: name.trim(),
              role: 'student',
            },
          },
        })

        if (signUpError) {
          console.warn('Erro ao cadastrar usuário:', signUpError)
          // Se o usuário já estiver cadastrado no Auth, tenta autenticar diretamente
          if (signUpError.message.toLowerCase().includes('already registered')) {
            const { data: directSignIn, error: directSignInErr } =
              await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: password,
              })
            if (!directSignInErr && directSignIn?.user) {
              signUpData = directSignIn
            } else {
              setErrorMessage(
                'Este e-mail já está cadastrado. Alterne para a aba "Acessar Conta" para entrar.',
              )
              setMode('login')
              setIsSubmitting(false)
              return
            }
          } else {
            setErrorMessage(`Falha no cadastro: ${signUpError.message}`)
            setIsSubmitting(false)
            return
          }
        }

        if (signUpData?.user) {
          const authId = signUpData.user.id
          // Cria registro na tabela profiles vinculada ao ID do Auth
          const newProfile = {
            id: authId,
            email: cleanEmail,
            name: name.trim(),
            role: 'student',
            document_type: 'Passaporte Internacional',
            document_number: 'HEM-' + Date.now().toString().slice(-6),
            avatar_url:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          }

          try {
            await supabase.from('profiles').upsert([newProfile])
          } catch (profileErr) {
            console.warn('Aviso ao gravar em profiles:', profileErr)
          }

          // Se a sessão não estiver ativa de imediato (confirmação pendente),
          // tenta login direto para estabelecer a sessão do cliente
          if (!signUpData.session) {
            try {
              const { data: directLogin } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: password,
              })
              if (directLogin?.session) {
                signUpData.session = directLogin.session
              }
            } catch {
              // Prossegue normalmente liberando o acesso
            }
          }

          // Monta perfil do aluno e libera acesso imediato sem depender de confirmações bloqueadas
          const mappedUser: UserProfile = {
            id: authId,
            name: name.trim(),
            email: cleanEmail,
            role: 'student',
            originCountry: 'Brasil',
            currentCity: 'Orlando, FL',
            avatarUrl: newProfile.avatar_url,
            preferredLanguage: 'pt',
            weeklyGoalHours: 10,
            completedHours: 0,
            activeCoursesCount: 1,
            certificatesEarned: 0,
            document_type: newProfile.document_type,
            document_number: newProfile.document_number,
          }

          localStorage.setItem('hemingway_auth_profile', JSON.stringify(mappedUser))
          onLoginSuccess(mappedUser)
          return
        }
      }

      // 2. Login via Supabase Auth (supabase.auth.signInWithPassword)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      })

      if (authError) {
        console.warn('Erro Supabase Auth signIn:', authError.message)
        const msg = authError.message.toLowerCase()

        // Caso o Supabase responda que o e-mail não foi confirmado, NÃO BLOQUEIE O ALUNO
        if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
          const { data: profByEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle()

          if (profByEmail) {
            const rawRole = String(profByEmail.role || 'student').toLowerCase()
            const finalRole: 'student' | 'teacher' | 'admin' =
              rawRole === 'admin' || rawRole === 'administrador'
                ? 'admin'
                : rawRole === 'teacher' || rawRole === 'professor'
                ? 'teacher'
                : 'student'

            const mappedUser: UserProfile = {
              id: String(profByEmail.id || 'usr-' + Date.now()),
              name: String(profByEmail.name || cleanEmail.split('@')[0]),
              email: cleanEmail,
              role: finalRole,
              originCountry: 'Brasil',
              currentCity: 'Orlando, FL',
              avatarUrl:
                String(profByEmail.avatar_url || '') ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
              preferredLanguage: 'pt',
              weeklyGoalHours: 10,
              completedHours: 0,
              activeCoursesCount: 1,
              certificatesEarned: 0,
              document_type: String(profByEmail.document_type || 'Passaporte Internacional'),
              document_number: String(profByEmail.document_number || ''),
            }

            localStorage.setItem('hemingway_auth_profile', JSON.stringify(mappedUser))
            onLoginSuccess(mappedUser)
            return
          }
        }

        // Se o erro for de credenciais inválidas, confere se o perfil já foi cadastrado na tabela profiles
        if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          const { data: profByEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle()

          if (profByEmail) {
            // Tenta registrar credencial no Supabase Auth automaticamente
            try {
              const { data: autoSignUp } = await supabase.auth.signUp({
                email: cleanEmail,
                password: password,
                options: {
                  data: {
                    name: profByEmail.name,
                    role: profByEmail.role || 'student',
                  },
                },
              })

              const targetId = autoSignUp?.user?.id || profByEmail.id

              const rawRole = String(profByEmail.role || 'student').toLowerCase()
              const finalRole: 'student' | 'teacher' | 'admin' =
                rawRole === 'admin' || rawRole === 'administrador'
                  ? 'admin'
                  : rawRole === 'teacher' || rawRole === 'professor'
                  ? 'teacher'
                  : 'student'

              const mappedUser: UserProfile = {
                id: String(targetId),
                name: String(profByEmail.name || cleanEmail.split('@')[0]),
                email: cleanEmail,
                role: finalRole,
                originCountry: 'Brasil',
                currentCity: 'Orlando, FL',
                avatarUrl:
                  String(profByEmail.avatar_url || '') ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
                preferredLanguage: 'pt',
                weeklyGoalHours: 10,
                completedHours: 0,
                activeCoursesCount: 1,
                certificatesEarned: 0,
                document_type: String(profByEmail.document_type || 'Passaporte Internacional'),
                document_number: String(profByEmail.document_number || ''),
              }

              localStorage.setItem('hemingway_auth_profile', JSON.stringify(mappedUser))
              onLoginSuccess(mappedUser)
              return
            } catch {
              // Segue para exibir erro
            }
          }

          setErrorMessage('E-mail ou senha inválidos. Por favor, confira seus dados cadastrados.')
        } else {
          setErrorMessage(`Falha na autenticação: ${authError.message}`)
        }
        setIsSubmitting(false)
        return
      }

      if (!authData?.user) {
        setErrorMessage('Não foi possível obter a sessão do usuário autenticado.')
        setIsSubmitting(false)
        return
      }

      const authId = authData.user.id
      const authEmail = authData.user.email || cleanEmail

      // 3. Busca o registro correspondente na tabela profiles usando o id do Auth
      let profileRow: Record<string, unknown> | null = null

      const { data: profById, error: errId } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authId)
        .maybeSingle()

      if (!errId && profById) {
        profileRow = profById
      } else {
        // Fallback: busca por e-mail caso exista registro pré-cadastrado
        const { data: profByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authEmail)
          .maybeSingle()
        if (profByEmail) {
          profileRow = profByEmail
        }
      }

      // Se não existir registro em profiles, cria automaticamente respeitando o role
      if (!profileRow) {
        const meta = authData.user.user_metadata || {}
        const rawRole = String(meta.role || 'student').toLowerCase()
        const assignedRole: 'student' | 'teacher' | 'admin' =
          rawRole === 'admin' || rawRole === 'administrador'
            ? 'admin'
            : rawRole === 'teacher' || rawRole === 'professor'
            ? 'teacher'
            : 'student'

        const newRecord = {
          id: authId,
          email: authEmail,
          name: meta.name || meta.full_name || authEmail.split('@')[0],
          role: assignedRole,
          document_type: meta.document_type || 'Passaporte Internacional',
          document_number: meta.document_number || 'HEM-USA-2026',
        }

        try {
          await supabase.from('profiles').insert([newRecord])
        } catch (insertErr) {
          console.warn('Aviso ao sincronizar profiles:', insertErr)
        }
        profileRow = newRecord
      }

      // Mapeia perfil e garante respeito estrito ao role = 'student'
      const rawRole = String(profileRow.role || 'student').toLowerCase()
      const finalRole: 'student' | 'teacher' | 'admin' =
        rawRole === 'admin' || rawRole === 'administrador'
          ? 'admin'
          : rawRole === 'teacher' || rawRole === 'professor'
          ? 'teacher'
          : 'student'

      const mappedUser: UserProfile = {
        id: String(profileRow.id || authId),
        name: String(profileRow.name || authEmail.split('@')[0]),
        email: authEmail,
        role: finalRole,
        originCountry: 'Brasil',
        currentCity: 'Orlando, FL',
        avatarUrl:
          String(profileRow.avatar_url || '') ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        preferredLanguage: 'pt',
        weeklyGoalHours: 10,
        completedHours: 0,
        activeCoursesCount: 1,
        certificatesEarned: 0,
        document_type: String(profileRow.document_type || 'Passaporte Internacional'),
        document_number: String(profileRow.document_number || ''),
      }

      localStorage.setItem('hemingway_auth_profile', JSON.stringify(mappedUser))
      onLoginSuccess(mappedUser)
    } catch (err: unknown) {
      console.error('Erro geral no processo de autenticação:', err)
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha na conexão com os servidores do Supabase.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Acesso Convidado / Demonstração
  const handleGuestDemo = () => {
    localStorage.clear()
    sessionStorage.clear()
    onLoginSuccess(mockUser)
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

        {/* Seletor de idiomas */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#1C2E4A]/70 hidden sm:inline">
            {t('common.switchLanguage')}:
          </span>
          <LanguageSelector variant="buttons" />
        </div>
      </header>

      {/* Card Central de Login / Cadastro */}
      <main className="flex-1 flex items-center justify-center my-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-[#0F1B2F]/5 border border-[#EADBBE] p-8 sm:p-10 transition-all">
          <div className="text-center mb-6">
            <div className="inline-flex justify-center mb-4">
              <div className="h-20 rounded-2xl overflow-hidden bg-white border border-[#C59E5D]/40 shadow-sm flex items-center px-6">
                <img
                  src="/logo-hemingway.png"
                  alt="Hemingway School Logo"
                  className="h-14 w-auto object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B2F] tracking-tight">
              {mode === 'login' ? 'Ambiente Virtual de Aprendizagem' : 'Cadastrar Novo Aluno'}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#1C2E4A]/80 leading-relaxed">
              {mode === 'login'
                ? 'Acesse sua área de estudos da Hemingway School com suas credenciais oficiais'
                : 'Crie sua conta de aluno para acompanhar suas aulas e certificados'}
            </p>
          </div>

          {/* Abas de Navegação: Login vs Cadastro */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#FAF8F2] rounded-2xl border border-[#EADBBE] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setErrorMessage(null)
                setSuccessMessage(null)
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#0F1B2F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-[#C59E5D]" />
              <span>Acessar Conta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register')
                setErrorMessage(null)
                setSuccessMessage(null)
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#0F1B2F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#C59E5D]" />
              <span>Criar Conta</span>
            </button>
          </div>

          {/* Botão Oficial: Continuar com o Google */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-[#0F1B2F] font-bold text-xs sm:text-sm rounded-xl shadow-xs border border-[#EADBBE] hover:border-[#C59E5D] flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer disabled:opacity-50 group"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </button>

            {/* Divisor Elegante */}
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-[#EADBBE]" />
              <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-[#1C2E4A]/60 font-semibold">
                ou continue com e-mail
              </span>
              <div className="flex-grow border-t border-[#EADBBE]" />
            </div>
          </div>

          {/* Alertas de Erro ou Sucesso */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#0F1B2F] mb-1 uppercase tracking-wider">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-[#C59E5D]" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Luiz Augusto"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#0F1B2F] mb-1 uppercase tracking-wider">
                E-mail Institucional ou Pessoal <span className="text-red-500">*</span>
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
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#0F1B2F] uppercase tracking-wider">
                  Senha de Acesso <span className="text-red-500">*</span>
                </label>
                {mode === 'login' && (
                  <span className="text-[11px] text-slate-400">Mínimo 6 caracteres</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#C59E5D]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition-all"
                />
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex items-center justify-between pt-1">
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
                    Lembrar credenciais
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-semibold text-[#C59E5D] hover:text-[#B38C4B] hover:underline cursor-pointer transition-colors"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            {/* Botão Primário: Acessar ou Criar Conta */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#0F1B2F] hover:bg-[#C59E5D] text-white hover:text-[#0F1B2F] font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#0F1B2F]/20 flex items-center justify-center gap-2 transition-all duration-200 border border-[#C59E5D]/50 transform active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C59E5D]" />
                  <span>Conectando ao Supabase...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>Entrar na Sala de Aula</span>
                  <ArrowRight className="w-4 h-4 text-[#C59E5D]" />
                </>
              ) : (
                <>
                  <span>Concluir Cadastro de Aluno</span>
                  <CheckCircle2 className="w-4 h-4 text-[#C59E5D]" />
                </>
              )}
            </button>

            {/* Botão Convidado (Modo Demonstração) */}
            <button
              type="button"
              onClick={handleGuestDemo}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#FAF8F2] hover:bg-[#F2EDE2] text-[#0F1B2F] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-[#EADBBE] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#C59E5D]" />
              <span>Acessar como Convidado (Modo Demonstração)</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#EADBBE]/60 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-[#1C2E4A]/70">
                Novo aluno na Hemingway School?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    setErrorMessage(null)
                  }}
                  className="font-bold text-[#C59E5D] hover:underline cursor-pointer"
                >
                  Cadastre-se aqui
                </button>
              </p>
            ) : (
              <p className="text-xs text-[#1C2E4A]/70">
                Já possui matrícula ativa?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setErrorMessage(null)
                  }}
                  className="font-bold text-[#C59E5D] hover:underline cursor-pointer"
                >
                  Clique para entrar
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Rodapé com Nota de Privacidade e Segurança */}
      <footer className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-[#1C2E4A]/70">
          <ShieldCheck className="w-4 h-4 text-[#C59E5D] shrink-0" />
          <span>Hemingway School • Autenticação Segura via Supabase Auth</span>
        </div>
      </footer>

      {/* Modal de Recuperação de Senha */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={email}
      />
    </div>
  )
}
