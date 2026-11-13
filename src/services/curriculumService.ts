import type { SupabaseDiscipline, SupabaseCourseDiscipline } from '../types'
import { courseService } from './courseService'
import { supabase } from '../lib/supabase'

const STORAGE_KEY_DISCIPLINES = 'ava_supabase_disciplines'
const STORAGE_KEY_COURSE_DISCIPLINES = 'ava_supabase_course_disciplines'

// Inicialização limpa (sem dados fictícios fixos)
const INITIAL_DISCIPLINES: SupabaseDiscipline[] = []
const INITIAL_COURSE_DISCIPLINES: SupabaseCourseDiscipline[] = []

export interface CreateDisciplineDTO {
  name: string
  description: string
  code?: string
  estimated_hours?: number
}

class SupabaseCurriculumService {
  private loadDisciplines(): SupabaseDiscipline[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DISCIPLINES)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Erro ao carregar disciplinas do localStorage:', e)
    }
    return []
  }

  private saveDisciplines(items: SupabaseDiscipline[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_DISCIPLINES, JSON.stringify(items))
    } catch (e) {
      console.error('Erro ao salvar disciplinas no localStorage:', e)
    }
  }

  private loadCourseDisciplines(): SupabaseCourseDiscipline[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_COURSE_DISCIPLINES)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Erro ao carregar course_disciplines do localStorage:', e)
    }
    return []
  }

  private saveCourseDisciplines(items: SupabaseCourseDiscipline[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_COURSE_DISCIPLINES, JSON.stringify(items))
    } catch (e) {
      console.error('Erro ao salvar course_disciplines no localStorage:', e)
    }
  }

  /**
   * Executa SELECT * FROM disciplines no Supabase real
   */
  async getDisciplinesWithStatus(): Promise<{
    data: SupabaseDiscipline[]
    isLive: boolean
    error: string | null
  }> {
    try {
      const { data, error } = await supabase
        .from('disciplines')
        .select('*')

      if (error) {
        console.warn('Erro ao buscar disciplines do Supabase:', error)
        return {
          data: this.loadDisciplines(),
          isLive: false,
          error: `Erro Supabase (${error.code || 'SELECT'}): ${error.message}`,
        }
      }

      if (data !== null) {
        if (data.length === 0) {
          const cached = this.loadDisciplines()
          return { data: cached, isLive: true, error: null }
        }

        // No banco real, as colunas são: id, title, description, created_at
        const mapped: SupabaseDiscipline[] = data.map((item: Record<string, unknown>, idx: number) => ({
          id: String(item.id || `disc-supa-${idx}`),
          name: String(item.title || item.name || 'Disciplina sem título'),
          description: String(item.description || ''),
          code: String(item.code || `MOD-${100 + idx}`),
          estimated_hours: Number(item.estimated_hours || item.hours || 12),
          created_at: String(item.created_at || new Date().toISOString()),
        }))

        this.saveDisciplines(mapped)
        return { data: mapped, isLive: true, error: null }
      }

      return {
        data: this.loadDisciplines(),
        isLive: true,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão com Supabase'
      return { data: this.loadDisciplines(), isLive: false, error: msg }
    }
  }

  async getDisciplines(): Promise<SupabaseDiscipline[]> {
    const res = await this.getDisciplinesWithStatus()
    return res.data
  }

  /**
   * Executa INSERT real na tabela disciplines do Supabase
   */
  async createDiscipline(dto: CreateDisciplineDTO): Promise<{
    discipline: SupabaseDiscipline
    isLive: boolean
    error: string | null
  }> {
    const list = this.loadDisciplines()
    const newDisc: SupabaseDiscipline = {
      id: `disc-${Date.now().toString(36)}`,
      name: dto.name.trim(),
      description: dto.description.trim(),
      code: dto.code?.trim() || `MOD-${Math.floor(100 + Math.random() * 900)}`,
      estimated_hours: Number(dto.estimated_hours) || 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      // Colunas no banco Supabase: title, description
      const { data, error } = await supabase
        .from('disciplines')
        .insert([
          {
            title: dto.name.trim(),
            description: dto.description.trim(),
          },
        ])
        .select()
        .single()

      if (error) {
        console.warn('Erro ao inserir disciplina no Supabase:', error)
        const updated = [newDisc, ...list]
        this.saveDisciplines(updated)
        return {
          discipline: newDisc,
          isLive: false,
          error: `Erro Supabase (${error.code || 'INSERT'}): ${error.message}`,
        }
      }

      if (data) {
        newDisc.id = String(data.id || newDisc.id)
      }

      const updated = [newDisc, ...list]
      this.saveDisciplines(updated)
      return { discipline: newDisc, isLive: true, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao conectar ao Supabase'
      const updated = [newDisc, ...list]
      this.saveDisciplines(updated)
      return { discipline: newDisc, isLive: false, error: msg }
    }
  }

  /**
   * Atualização na tabela disciplines
   */
  async updateDiscipline(
    id: string,
    dto: Partial<CreateDisciplineDTO>,
  ): Promise<SupabaseDiscipline> {
    try {
      await supabase
        .from('disciplines')
        .update({
          ...(dto.name !== undefined && { title: dto.name.trim() }),
          ...(dto.description !== undefined && { description: dto.description.trim() }),
        })
        .eq('id', id)
    } catch (err) {
      console.warn('Erro ao atualizar disciplina no Supabase:', err)
    }

    const list = this.loadDisciplines()
    const index = list.findIndex((d) => d.id === id)
    if (index === -1) {
      throw new Error(`Disciplina com id ${id} não encontrada.`)
    }

    const current = list[index]
    const updatedDisc: SupabaseDiscipline = {
      ...current,
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.description !== undefined && { description: dto.description.trim() }),
      ...(dto.code !== undefined && { code: dto.code.trim() }),
      ...(dto.estimated_hours !== undefined && {
        estimated_hours: Number(dto.estimated_hours) || current.estimated_hours,
      }),
      updated_at: new Date().toISOString(),
    }

    list[index] = updatedDisc
    this.saveDisciplines(list)
    return updatedDisc
  }

  /**
   * Exclusão na tabela disciplines e course_disciplines
   */
  async deleteDiscipline(id: string): Promise<boolean> {
    try {
      await supabase.from('disciplines').delete().eq('id', id)
      await supabase.from('course_disciplines').delete().eq('discipline_id', id)
    } catch (err) {
      console.warn('Erro ao excluir no Supabase:', err)
    }

    const list = this.loadDisciplines()
    this.saveDisciplines(list.filter((d) => d.id !== id))

    const links = this.loadCourseDisciplines()
    this.saveCourseDisciplines(links.filter((l) => l.discipline_id !== id))
    return true
  }

  /**
   * Consulta disciplinas vinculadas a um curso via course_disciplines no Supabase
   */
  async getCourseDisciplines(courseId: string): Promise<SupabaseDiscipline[]> {
    const disciplines = await this.getDisciplines()
    const map = new Map(disciplines.map((d) => [d.id, d]))

    try {
      const { data, error } = await supabase
        .from('course_disciplines')
        .select('course_id, discipline_id, sequence_order')
        .eq('course_id', courseId)
        .order('sequence_order', { ascending: true })

      if (!error && data && data.length > 0) {
        const result: SupabaseDiscipline[] = []
        for (const link of data) {
          const disc = map.get(String(link.discipline_id))
          if (disc) result.push(disc)
        }
        if (result.length > 0) return result
      }
    } catch (err) {
      console.warn('Erro ao consultar course_disciplines do Supabase:', err)
    }

    // Fallback local
    const links = this.loadCourseDisciplines().filter((l) => l.course_id === courseId)
    links.sort((a, b) => a.sequence_order - b.sequence_order)

    const result: SupabaseDiscipline[] = []
    for (const link of links) {
      const disc = map.get(link.discipline_id)
      if (disc) result.push(disc)
    }
    return result
  }

  /**
   * Salva os vínculos da grade curricular no Supabase (tabela course_disciplines)
   * Faz INSERT real de course_id, discipline_id e sequence_order
   */
  async saveCourseCurriculum(
    courseId: string,
    orderedDisciplineIds: string[],
  ): Promise<{ isLive: boolean; error: string | null }> {
    let isLive = false
    let errorMsg: string | null = null

    try {
      // 1. Remove vínculos anteriores deste curso no Supabase
      await supabase.from('course_disciplines').delete().eq('course_id', courseId)

      // 2. Insere os novos vínculos ordenados
      if (orderedDisciplineIds.length > 0) {
        const payload = orderedDisciplineIds.map((discId, idx) => ({
          course_id: courseId,
          discipline_id: discId,
          sequence_order: idx + 1,
        }))

        const { error } = await supabase.from('course_disciplines').insert(payload)
        if (error) {
          console.warn('Erro ao inserir vínculos em course_disciplines:', error)
          errorMsg = `Erro Supabase (${error.code || 'INSERT'}): ${error.message}`
        } else {
          isLive = true
        }
      } else {
        isLive = true
      }
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : 'Falha na conexão com Supabase'
    }

    // Persistência local complementar
    const links = this.loadCourseDisciplines()
    const remaining = links.filter((l) => l.course_id !== courseId)
    const newLinks: SupabaseCourseDiscipline[] = orderedDisciplineIds.map((discId, idx) => ({
      id: `cd-${Date.now().toString(36)}-${idx}`,
      course_id: courseId,
      discipline_id: discId,
      sequence_order: idx + 1,
      created_at: new Date().toISOString(),
    }))

    this.saveCourseDisciplines([...remaining, ...newLinks])
    await courseService.updateCourse(courseId, { disciplines_count: orderedDisciplineIds.length })

    return { isLive, error: errorMsg }
  }

  resetCurriculumDefaults(): void {
    this.saveDisciplines(INITIAL_DISCIPLINES)
    this.saveCourseDisciplines(INITIAL_COURSE_DISCIPLINES)
  }
}

export const curriculumService = new SupabaseCurriculumService()
