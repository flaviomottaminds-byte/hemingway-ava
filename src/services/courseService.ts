import type { SupabaseCourse } from '../types'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'ava_supabase_courses'

// Curso real do banco e dados iniciais caso a tabela retorne vazia ou bloqueada por RLS
const DEFAULT_COURSES: SupabaseCourse[] = [
  {
    id: 'crs-real-01',
    title: 'Formação em Imigração e Direitos Trabalhistas',
    description:
      'Capacitação completa para imigrantes nos EUA abordando legislação trabalhista (FLSA), contratos W-2 vs 1099, segurança do trabalho (OSHA) e direitos fundamentais.',
    workload_hours: 40,
    default_language: 'pt',
    status: 'published',
    cover_image_url:
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=700&q=80',
    instructor_id: 'usr_prof_01',
    instructor_name: 'Prof. Leonardo Dias',
    disciplines_count: 5,
    students_count: 64,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-18T14:30:00Z',
  },
  {
    id: 'crs-101',
    title: 'Inglês Prático para o Mercado de Trabalho',
    description:
      'Curso intensivo com vocabulário corporativo essencial nos EUA, simulação de entrevistas de emprego, redação de e-mails profissionais e comunicação diária.',
    workload_hours: 45,
    default_language: 'en',
    status: 'published',
    cover_image_url:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=80',
    instructor_id: 'usr_prof_02',
    instructor_name: 'Prof. Marcus Vance',
    disciplines_count: 4,
    students_count: 142,
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'crs-103',
    title: 'Sistema Financeiro nos EUA & Credit Score FICO',
    description:
      'Abertura de contas bancárias, obtenção de ITIN vs SSN, construção de histórico de crédito FICO do zero e prevenção contra fraudes financeiras.',
    workload_hours: 20,
    default_language: 'es',
    status: 'published',
    cover_image_url:
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=700&q=80',
    instructor_id: 'usr_prof_03',
    instructor_name: 'Carlos Mendoza, CFP',
    disciplines_count: 3,
    students_count: 215,
    created_at: '2026-02-12T16:20:00Z',
  },
]

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
    this.saveToStorage(DEFAULT_COURSES)
    return DEFAULT_COURSES
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

      if (data && data.length > 0) {
        this.lastError = null
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
            DEFAULT_COURSES[index % DEFAULT_COURSES.length].cover_image_url,
          instructor_id: String(item.instructor_id || 'usr_prof_real'),
          instructor_name: String(item.instructor_name || 'Prof. Leonardo Dias'),
          disciplines_count: Number(item.disciplines_count || 4),
          students_count: Number(item.students_count || 32),
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

      // Se a tabela retornou [] (por RLS ou vazia)
      const cached = this.loadFromStorage()
      return {
        data: cached,
        isLive: false,
        error:
          'Tabela courses retornou 0 registros visíveis via chave pública anon. Verifique as políticas de RLS (Row Level Security) no Supabase.',
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
