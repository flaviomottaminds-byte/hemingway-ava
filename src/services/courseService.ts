import type { SupabaseCourse } from '../types'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'ava_supabase_courses'

// Inicialização 100% limpa (sem dados fictícios fixos)
const DEFAULT_COURSES: SupabaseCourse[] = []

export interface CreateCourseDTO {
  title: string
  description: string
  workload_hours: number
  default_language: 'pt' | 'en' | 'es'
  status: 'draft' | 'published'
  cover_image_url?: string
}

export interface UpdateCourseDTO extends Partial<CreateCourseDTO> {
  disciplines_count?: number
}

export interface SupabaseQueryResult<T> {
  data: T
  isLive: boolean
  error: string | null
  errorDetails?: unknown
}

class SupabaseCourseService {
  private lastError: string | null = null

  getLastError(): string | null {
    return this.lastError
  }

  private loadFromStorage(): SupabaseCourse[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        return JSON.parse(data)
      }
    } catch (e) {
      console.warn('Erro ao carregar cursos do localStorage:', e)
    }
    return []
  }

  private saveToStorage(courses: SupabaseCourse[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(courses))
    } catch (e) {
      console.error('Erro ao salvar cursos no localStorage:', e)
    }
  }

  /**
   * Executa SELECT * FROM courses no Supabase real
   */
  async getCoursesWithStatus(): Promise<SupabaseQueryResult<SupabaseCourse[]>> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        this.lastError = `Supabase Error (${error.code || 'SELECT'}): ${error.message}`
        console.warn('Erro ao consultar Supabase courses:', error)
        return {
          data: this.loadFromStorage(),
          isLive: false,
          error: this.lastError,
          errorDetails: error,
        }
      }

      if (data !== null) {
        this.lastError = null
        if (data.length === 0) {
          const cached = this.loadFromStorage()
          return {
            data: cached,
            isLive: true,
            error: null,
          }
        }

        // Mapeia os campos da tabela real courses para o modelo da aplicação
        const mappedCourses: SupabaseCourse[] = data.map((item: Record<string, unknown>, index: number) => ({
          id: String(item.id || `crs-supa-${index}`),
          title: String(item.title || 'Curso sem título'),
          description: String(item.description || ''),
          workload_hours: Number(item.total_hours || item.workload_hours || 40),
          default_language: (item.language as 'pt' | 'en' | 'es') || 'pt',
          status: (item.status as 'draft' | 'published') || 'published',
          cover_image_url:
            String(item.cover_image_url || '') ||
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=80',
          instructor_id: String(item.instructor_id || ''),
          instructor_name: String(item.instructor_name || 'Prof. Responsável'),
          disciplines_count: Number(item.disciplines_count || 0),
          students_count: Number(item.students_count || 0),
          created_at: String(item.created_at || new Date().toISOString()),
          updated_at: item.updated_at ? String(item.updated_at) : undefined,
        }))

        this.saveToStorage(mappedCourses)
        return {
          data: mappedCourses,
          isLive: true,
          error: null,
        }
      }

      const cached = this.loadFromStorage()
      return {
        data: cached,
        isLive: true,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão com Supabase'
      this.lastError = msg
      return {
        data: this.loadFromStorage(),
        isLive: false,
        error: msg,
        errorDetails: err,
      }
    }
  }

  async getCourses(): Promise<SupabaseCourse[]> {
    const res = await this.getCoursesWithStatus()
    return res.data
  }

  /**
   * Executa INSERT real na tabela courses do Supabase
   */
  async createCourse(dto: CreateCourseDTO): Promise<{
    course: SupabaseCourse
    isLive: boolean
    error: string | null
  }> {
    const newLocalCourse: SupabaseCourse = {
      id: `crs-${Date.now().toString(36)}`,
      title: dto.title.trim(),
      description: dto.description.trim(),
      workload_hours: Number(dto.workload_hours) || 1,
      default_language: dto.default_language,
      status: dto.status,
      cover_image_url:
        dto.cover_image_url?.trim() ||
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80',
      instructor_id: 'usr_current_teacher',
      instructor_name: 'Prof. Leonardo Dias',
      disciplines_count: 0,
      students_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      // Payload correspondente às colunas reais no banco Supabase:
      // title, description, total_hours, language, status
      const insertPayload = {
        title: dto.title.trim(),
        description: dto.description.trim(),
        total_hours: Number(dto.workload_hours) || 40,
        language: dto.default_language,
        status: dto.status,
      }

      const { data, error } = await supabase
        .from('courses')
        .insert([insertPayload])
        .select()
        .single()

      if (error) {
        console.warn('Erro ao inserir curso no Supabase:', error)
        // Salva localmente para não travar a experiência do usuário
        const localList = [newLocalCourse, ...this.loadFromStorage()]
        this.saveToStorage(localList)

        return {
          course: newLocalCourse,
          isLive: false,
          error: `Erro Supabase (${error.code || 'INSERT'}): ${error.message}. Verifique a política de INSERT no painel do Supabase.`,
        }
      }

      const created: SupabaseCourse = {
        ...newLocalCourse,
        id: String(data.id || newLocalCourse.id),
        created_at: String(data.created_at || newLocalCourse.created_at),
      }

      const updated = [created, ...this.loadFromStorage()]
      this.saveToStorage(updated)

      return {
        course: created,
        isLive: true,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão ao inserir curso no Supabase'
      const localList = [newLocalCourse, ...this.loadFromStorage()]
      this.saveToStorage(localList)
      return {
        course: newLocalCourse,
        isLive: false,
        error: msg,
      }
    }
  }

  /**
   * Atualização com persistência
   */
  async updateCourse(id: string, dto: UpdateCourseDTO): Promise<SupabaseCourse> {
    try {
      await supabase
        .from('courses')
        .update({
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(dto.description !== undefined && { description: dto.description.trim() }),
          ...(dto.workload_hours !== undefined && { total_hours: Number(dto.workload_hours) }),
          ...(dto.default_language !== undefined && { language: dto.default_language }),
          ...(dto.status !== undefined && { status: dto.status }),
        })
        .eq('id', id)
    } catch (err) {
      console.warn('Erro ao atualizar no Supabase:', err)
    }

    const courses = this.loadFromStorage()
    const index = courses.findIndex((c) => c.id === id)
    if (index === -1) {
      throw new Error(`Curso com id ${id} não encontrado.`)
    }

    const updated = {
      ...courses[index],
      ...dto,
      updated_at: new Date().toISOString(),
    }
    courses[index] = updated
    this.saveToStorage(courses)
    return updated
  }

  /**
   * Exclusão com persistência
   */
  async deleteCourse(id: string): Promise<boolean> {
    try {
      await supabase.from('courses').delete().eq('id', id)
    } catch (err) {
      console.warn('Erro ao excluir no Supabase:', err)
    }
    const courses = this.loadFromStorage()
    this.saveToStorage(courses.filter((c) => c.id !== id))
    return true
  }

  resetToDefaults(): SupabaseCourse[] {
    this.saveToStorage(DEFAULT_COURSES)
    return DEFAULT_COURSES
  }
}

export const courseService = new SupabaseCourseService()
