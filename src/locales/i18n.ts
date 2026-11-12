import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ptTranslation from './pt.json'
import enTranslation from './en.json'
import esTranslation from './es.json'

export const STORAGE_LANG_KEY = 'ava_preferred_language'

export const SUPPORTED_LANGUAGES = [
  { code: 'pt', name: 'Português', flag: '🇧🇷', region: 'Brasil / Comunidade Lusófona' },
  { code: 'en', name: 'English', flag: '🇺🇸', region: 'United States' },
  { code: 'es', name: 'Español', flag: '🇪🇸', region: 'Hispanoamérica' },
] as const

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

/**
 * Obtém o idioma inicial salvo no localStorage ou detectado do navegador.
 * Garante fallback seguro para 'pt'.
 */
const getInitialLanguage = (): SupportedLanguageCode => {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY)
    if (saved && ['pt', 'en', 'es'].includes(saved)) {
      return saved as SupportedLanguageCode
    }

    const browserLang = navigator.language?.slice(0, 2).toLowerCase()
    if (browserLang === 'es') return 'es'
    if (browserLang === 'en') return 'en'
    return 'pt'
  } catch (error) {
    console.warn('Não foi possível acessar o localStorage, fallback para pt:', error)
    return 'pt'
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: ptTranslation },
      en: { translation: enTranslation },
      es: { translation: esTranslation },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false, // React já protege contra XSS
    },
    react: {
      useSuspense: false,
    },
  })

/**
 * Função utilitária centralizada para troca instantânea de idioma
 * atualizando o i18next e persistindo no localStorage sem recarregar a página.
 */
export const changeLanguage = async (lang: SupportedLanguageCode): Promise<void> => {
  await i18n.changeLanguage(lang)
  try {
    localStorage.setItem(STORAGE_LANG_KEY, lang)
    document.documentElement.lang = lang
  } catch (error) {
    console.error('Erro ao salvar idioma no localStorage:', error)
  }
}

// Configura o atributo lang do HTML inicial
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language || 'pt'
}

export default i18n
