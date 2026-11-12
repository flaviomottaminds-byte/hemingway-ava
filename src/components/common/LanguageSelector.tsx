import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { SUPPORTED_LANGUAGES, changeLanguage } from '../../locales/i18n'
import type { SupportedLanguageCode } from '../../locales/i18n'

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons'
  className?: string
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Encontra idioma atual, tratando casos como 'pt-BR' ou 'en-US'
  const currentLangCode = (i18n.language?.slice(0, 2) as SupportedLanguageCode) || 'pt'
  const activeLanguage =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === currentLangCode) || SUPPORTED_LANGUAGES[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectLanguage = (code: SupportedLanguageCode) => {
    changeLanguage(code)
    setIsOpen(false)
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 ${className}`}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = activeLanguage.code === lang.code
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelectLanguage(lang.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                isSelected
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title={lang.region}
            >
              <span className="text-sm">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.switchLanguage')}
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
      >
        <Globe className="w-4 h-4 text-blue-600" />
        <span className="text-base leading-none">{activeLanguage.flag}</span>
        <span className="font-medium text-slate-800">{activeLanguage.name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {t('common.switchLanguage')}
          </div>
          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = activeLanguage.code === lang.code
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="leading-tight">{lang.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {lang.region}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              )
            })}
          </div>
          <div className="px-3 py-2 bg-slate-50/70 border-t border-slate-100 text-[10px] text-slate-500 text-center">
            Preferência salva no navegador
          </div>
        </div>
      )}
    </div>
  )
}
