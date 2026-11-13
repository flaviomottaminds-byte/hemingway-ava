import React, { useState } from 'react'
import {
  X,
  User,
  Mail,
  Lock,
  Globe,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { UserProfile } from '../../types'
import { useTranslation } from 'react-i18next'

interface AccountSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile
  onUpdateUser: (updatedUser: UserProfile) => void
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const { i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')

  // Campos do Perfil
  const [name, setName] = useState(user.name)
  const [email] = useState(user.email)
  const [currentCity, setCurrentCity] = useState(user.currentCity || '')
  const [originCountry, setOriginCountry] = useState(user.originCountry || 'Brasil')
  const [preferredLanguage, setPreferredLanguage] = useState(user.preferredLanguage || 'pt')

  // Campos de Segurança (Alterar Senha)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!name.trim()) {
      setErrorMessage('O nome não pode estar em branco.')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Atualiza na tabela profiles do Supabase
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
        })
        .eq('id', user.id)

      if (dbError) {
        console.warn('Aviso ao atualizar profiles no Supabase:', dbError)
      }

      // 2. Atualiza estado local
      const updated: UserProfile = {
        ...user,
        name: name.trim(),
        currentCity: currentCity.trim(),
        originCountry: originCountry.trim(),
        preferredLanguage: preferredLanguage as 'pt' | 'en' | 'es',
      }

      // Altera o idioma i18n caso alterado
      if (preferredLanguage && preferredLanguage !== i18n.language) {
        i18n.changeLanguage(preferredLanguage)
      }

      onUpdateUser(updated)
      setSuccessMessage('Informações do perfil salvas com sucesso!')
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha ao salvar alterações de perfil.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('A confirmação da nova senha não confere.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        setErrorMessage(`Erro ao atualizar senha: ${error.message}`)
        setIsSubmitting(false)
        return
      }

      setNewPassword('')
      setConfirmPassword('')
      setSuccessMessage('Sua nova senha de acesso foi salva com sucesso!')
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha na conexão ao alterar senha.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EADBBE] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="p-6 bg-[#0F1B2F] text-[#FAF8F2] flex items-center justify-between border-b border-[#C59E5D]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C2E4A] border border-[#C59E5D]/40 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-[#C59E5D]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#FAF8F2]">Configurações da Conta</h2>
              <p className="text-xs text-[#EADBBE]/80">Hemingway School • Gerencie seu perfil</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#FAF8F2]/70 hover:text-white hover:bg-[#1C2E4A] rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-200 bg-[#FAF8F2] px-6 pt-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile')
              setErrorMessage(null)
              setSuccessMessage(null)
            }}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#C59E5D] text-[#0F1B2F]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Dados do Perfil
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('security')
              setErrorMessage(null)
              setSuccessMessage(null)
            }}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#C59E5D] text-[#0F1B2F]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Segurança & Senha
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F1B2F] mb-1 uppercase tracking-wider">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-[#C59E5D]" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F1B2F] mb-1 uppercase tracking-wider">
                  E-mail de Acesso (Registrado)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-xs sm:text-sm cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">O e-mail principal é vinculado à sua credencial de acesso.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F1B2F] mb-1 uppercase tracking-wider">
                    Cidade / Localização
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-[#C59E5D]" />
                    </div>
                    <input
                      type="text"
                      value={currentCity}
                      onChange={(e) => setCurrentCity(e.target.value)}
                      placeholder="Ex: Miami, FL ou São Paulo"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F1B2F] mb-1 uppercase tracking-wider">
                    País de Origem
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-[#C59E5D]" />
                    </div>
                    <input
                      type="text"
                      value={originCountry}
                      onChange={(e) => setOriginCountry(e.target.value)}
                      placeholder="Ex: Brasil, Colômbia"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F1B2F] mb-1 uppercase tracking-wider">
                  Idioma Preferencial do AVA
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value as 'pt' | 'en' | 'es')}
                  className="w-full px-4 py-2.5 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition cursor-pointer"
                >
                  <option value="pt">Português (Brasil)</option>
                  <option value="en">English (United States)</option>
                  <option value="es">Español (Latinoamérica)</option>
                </select>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#0F1B2F] hover:bg-[#C59E5D] text-white hover:text-[#0F1B2F] font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C59E5D]" />
                      <span>Salvando dados...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-[#C59E5D]" />
                      <span>Salvar Alterações do Perfil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Para reforçar a segurança do seu acesso, você pode cadastrar uma nova senha a qualquer momento.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#0F1B2F] mb-1 uppercase tracking-wider">
                  Nova Senha de Acesso
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
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition"
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
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-[#C59E5D]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a mesma senha novamente"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F2] border border-[#EADBBE] rounded-xl text-[#0F1B2F] text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 focus:border-[#C59E5D] transition"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#0F1B2F] hover:bg-[#C59E5D] text-white hover:text-[#0F1B2F] font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C59E5D]" />
                      <span>Atualizando senha...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-[#C59E5D]" />
                      <span>Alterar Senha de Acesso</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
