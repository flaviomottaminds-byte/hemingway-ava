import { supabase } from '../lib/supabase'

export interface WipeResult {
  success: boolean
  supabaseDetails: Record<string, string>
  timestamp: string
}

export const dbCleanerService = {
  /**
   * Limpeza de todas as tabelas na ordem estrita para respeitar chaves estrangeiras:
   * 1. enrollments
   * 2. lessons
   * 3. course_disciplines (por course_id not null)
   * 4. disciplines
   * 5. courses
   * 6. profiles
   * E limpa todos os caches de localStorage da aplicação.
   */
  async wipeAllData(): Promise<WipeResult> {
    const details: Record<string, string> = {}

    // 1. enrollments
    try {
      const { error } = await supabase.from('enrollments').delete().not('id', 'is', null)
      details['enrollments'] = error ? error.message : 'OK (Limpo)'
    } catch (e: any) {
      details['enrollments'] = e?.message || 'Erro na requisição'
    }

    // 2. lessons
    try {
      const { error } = await supabase.from('lessons').delete().not('id', 'is', null)
      details['lessons'] = error ? error.message : 'OK (Limpo)'
    } catch (e: any) {
      details['lessons'] = e?.message || 'Erro na requisição'
    }

    // 3. course_disciplines (chave composta: course_id + discipline_id)
    try {
      const { error } = await supabase.from('course_disciplines').delete().not('course_id', 'is', null)
      details['course_disciplines'] = error ? error.message : 'OK (Limpo)'
    } catch (e: any) {
      details['course_disciplines'] = e?.message || 'Erro na requisição'
    }

    // 4. disciplines
    try {
      const { error } = await supabase.from('disciplines').delete().not('id', 'is', null)
      details['disciplines'] = error ? error.message : 'OK (Limpo)'
    } catch (e: any) {
      details['disciplines'] = e?.message || 'Erro na requisição'
    }

    // 5. courses
    try {
      const { error } = await supabase.from('courses').delete().not('id', 'is', null)
      details['courses'] = error ? error.message : 'OK (Limpo)'
    } catch (e: any) {
      details['courses'] = e?.message || 'Erro na requisição'
    }

    // 6. profiles
    try {
      const { error } = await supabase.from('profiles').delete().not('id', 'is', null)
      details['profiles'] = error ? error.message : 'OK (Limpo)'
    } catch (e: any) {
      details['profiles'] = e?.message || 'Erro na requisição'
    }

    // 7. Limpeza dos armazenamentos locais da aplicação
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (err) {
      console.warn('Erro ao limpar storages no dbCleanerService:', err)
    }

    return {
      success: true,
      supabaseDetails: details,
      timestamp: new Date().toISOString(),
    }
  },
}
