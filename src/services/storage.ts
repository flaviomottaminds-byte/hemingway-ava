import { STORAGE_LANG_KEY } from '../locales/i18n'
import type { SupportedLanguageCode } from '../locales/i18n'

export class StorageService {
  static getLanguage(): SupportedLanguageCode {
    try {
      const val = localStorage.getItem(STORAGE_LANG_KEY)
      if (val === 'pt' || val === 'en' || val === 'es') {
        return val
      }
    } catch (err) {
      console.warn('Falha ao ler idioma do localStorage', err)
    }
    return 'pt'
  }

  static setLanguage(lang: SupportedLanguageCode): void {
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang)
    } catch (err) {
      console.error('Falha ao gravar idioma no localStorage', err)
    }
  }

  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : defaultValue
    } catch {
      return defaultValue
    }
  }

  static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.error(`Erro ao salvar chave ${key} no localStorage`, err)
    }
  }
}
