import type {
  SupabaseAssessment,
  AssessmentQuestion,
  AssessmentScopeType,
} from '../types'

const STORAGE_KEY_ASSESSMENTS = 'ava_supabase_assessments'

const INITIAL_ASSESSMENTS: SupabaseAssessment[] = [
  {
    id: 'asm-101',
    course_id: 'crs-102',
    discipline_id: 'disc-03',
    lesson_id: 'les-01',
    scope_type: 'lesson_specific',
    title: 'Quiz Rápido: Formulários Fiscais W-2 vs 1099',
    description:
      'Avaliação formativa para testar a compreensão sobre os modelos de contratação nos Estados Unidos e as retenções tributárias.',
    max_score: 10,
    passing_score: 7,
    max_attempts: 3,
    time_limit_minutes: 20,
    questions: [
      {
        id: 'q-1',
        sequence_order: 1,
        statement:
          'Qual a principal diferença entre um trabalhador classificado como W-2 e um prestador de serviços 1099 nos EUA em relação aos tributos?',
        points: 5,
        feedback:
          'Parabéns! O empregador W-2 é responsável por reter o imposto de renda e as contribuições FICA (Social Security e Medicare) na folha de pagamento, enquanto o autônomo 1099 recolhe integralmente seu imposto via Self-Employment Tax.',
        options: [
          {
            id: 'opt-1-a',
            option_letter: 'A',
            text: 'O trabalhador W-2 não paga nenhum imposto federal, enquanto o 1099 paga tudo.',
            is_correct: false,
          },
          {
            id: 'opt-1-b',
            option_letter: 'B',
            text: 'No W-2, o empregador retém impostos (FICA/IR) diretamente no contracheque; no 1099, o profissional recolhe seus próprios tributos.',
            is_correct: true,
          },
          {
            id: 'opt-1-c',
            option_letter: 'C',
            text: 'Apenas trabalhadores 1099 possuem direito a horas extras remuneradas (overtime).',
            is_correct: false,
          },
          {
            id: 'opt-1-d',
            option_letter: 'D',
            text: 'O formulário 1099 é exclusivo para pessoas nascidas nos Estados Unidos.',
            is_correct: false,
          },
        ],
      },
      {
        id: 'q-2',
        sequence_order: 2,
        statement:
          'Segundo a Lei de Padrões Justos de Trabalho (FLSA), a partir de quantas horas trabalhadas na semana o funcionário passa a ter direito ao pagamento de Overtime (horas extras)?',
        points: 5,
        feedback:
          'A legislação federal estabelece a jornada padrão de 40 horas semanais. Horas excedentes devem ser pagas com adicional de no mínimo 50% (Time and a Half).',
        options: [
          {
            id: 'opt-2-a',
            option_letter: 'A',
            text: 'Após 30 horas semanais.',
            is_correct: false,
          },
          {
            id: 'opt-2-b',
            option_letter: 'B',
            text: 'Após 40 horas semanais no mesmo período de trabalho.',
            is_correct: true,
          },
          {
            id: 'opt-2-c',
            option_letter: 'C',
            text: 'Apenas após 50 horas semanais.',
            is_correct: false,
          },
          {
            id: 'opt-2-d',
            option_letter: 'D',
            text: 'Não existe direito a horas extras segundo a lei federal.',
            is_correct: false,
          },
        ],
      },
    ],
    created_at: '2026-02-12T10:00:00Z',
    updated_at: '2026-02-15T14:30:00Z',
  },
  {
    id: 'asm-102',
    course_id: 'crs-102',
    discipline_id: 'disc-03',
    scope_type: 'discipline_final',
    title: 'Prova Final de Conclusão: Legislação Trabalhista & Direitos',
    description:
      'Exame avaliativo abrangendo direitos trabalhistas sob a FLSA, segurança no trabalho regulamentada pela OSHA e prevenção de abusos salariais.',
    max_score: 10,
    passing_score: 7,
    max_attempts: 2,
    time_limit_minutes: 45,
    questions: [
      {
        id: 'q-3',
        sequence_order: 1,
        statement:
          'Um empregador pode recusar o pagamento de salários devidos alegando que o trabalhador é imigrante recente ou não possui documentação regular?',
        points: 5,
        feedback:
          'Correto! A jurisprudência trabalhista e a lei FLSA garantem o direito irrestrito ao recebimento pelos serviços prestados, independentemente do status imigratório.',
        options: [
          {
            id: 'opt-3-a',
            option_letter: 'A',
            text: 'Sim, empregadores estão autorizados a reter pagamentos de pessoas sem SSN.',
            is_correct: false,
          },
          {
            id: 'opt-3-b',
            option_letter: 'B',
            text: 'Não. A lei federal protege o direito irrevogável de todo trabalhador receber integralmente pelo trabalho realizado.',
            is_correct: true,
          },
          {
            id: 'opt-3-c',
            option_letter: 'C',
            text: 'Apenas com autorização prévia da polícia local.',
            is_correct: false,
          },
          {
            id: 'opt-3-d',
            option_letter: 'D',
            text: 'Somente se o valor for inferior a $500 dólares.',
            is_correct: false,
          },
        ],
      },
      {
        id: 'q-4',
        sequence_order: 2,
        statement:
          'Qual órgão governamental é responsável por fiscalizar as normas de segurança e saúde ocupacional nos ambientes de trabalho dos EUA?',
        points: 5,
        feedback:
          'A OSHA (Occupational Safety and Health Administration) é a agência federal encarregada de garantir condições de trabalho seguras e saudáveis.',
        options: [
          {
            id: 'opt-4-a',
            option_letter: 'A',
            text: 'OSHA (Occupational Safety and Health Administration).',
            is_correct: true,
          },
          {
            id: 'opt-4-b',
            option_letter: 'B',
            text: 'IRS (Internal Revenue Service).',
            is_correct: false,
          },
          {
            id: 'opt-4-c',
            option_letter: 'C',
            text: 'USCIS (U.S. Citizenship and Immigration Services).',
            is_correct: false,
          },
          {
            id: 'opt-4-d',
            option_letter: 'D',
            text: 'DMV (Department of Motor Vehicles).',
            is_correct: false,
          },
        ],
      },
    ],
    created_at: '2026-02-18T16:00:00Z',
  },
]

export interface CreateAssessmentDTO {
  course_id: string
  discipline_id: string
  lesson_id?: string
  scope_type: AssessmentScopeType
  title: string
  description?: string
  max_score: number
  passing_score: number
  max_attempts: number
  time_limit_minutes?: number
  questions: AssessmentQuestion[]
}

class SupabaseAssessmentService {
  private loadAssessments(): SupabaseAssessment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ASSESSMENTS)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Erro ao carregar avaliações do localStorage:', e)
    }
    this.saveAssessments(INITIAL_ASSESSMENTS)
    return INITIAL_ASSESSMENTS
  }

  private saveAssessments(items: SupabaseAssessment[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(items))
    } catch (e) {
      console.error('Erro ao salvar avaliações no localStorage:', e)
    }
  }

  /**
   * Simula: supabase.from('assessments').select('*, questions(*, options(*))')
   */
  async getAssessments(filter?: {
    course_id?: string
    discipline_id?: string
  }): Promise<SupabaseAssessment[]> {
    await new Promise((r) => setTimeout(r, 120))
    let list = this.loadAssessments()
    if (filter?.course_id) {
      list = list.filter((a) => a.course_id === filter.course_id)
    }
    if (filter?.discipline_id) {
      list = list.filter((a) => a.discipline_id === filter.discipline_id)
    }
    return list
  }

  /**
   * Simula: supabase.from('assessments').select('*').eq('id', id).single()
   */
  async getAssessmentById(id: string): Promise<SupabaseAssessment | null> {
    await new Promise((r) => setTimeout(r, 100))
    const list = this.loadAssessments()
    return list.find((a) => a.id === id) || null
  }

  /**
   * Simula gravação relacional nas tabelas assessments, questions e options:
   */
  async createAssessment(dto: CreateAssessmentDTO): Promise<SupabaseAssessment> {
    await new Promise((r) => setTimeout(r, 220))
    const list = this.loadAssessments()

    const newAssessment: SupabaseAssessment = {
      id: `asm-${Date.now().toString(36)}`,
      course_id: dto.course_id,
      discipline_id: dto.discipline_id,
      lesson_id: dto.scope_type === 'lesson_specific' ? dto.lesson_id : undefined,
      scope_type: dto.scope_type,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      max_score: Number(dto.max_score) || 10,
      passing_score: Number(dto.passing_score) || 7,
      max_attempts: Number(dto.max_attempts) || 3,
      time_limit_minutes: dto.time_limit_minutes
        ? Number(dto.time_limit_minutes)
        : undefined,
      questions: dto.questions.map((q, qIndex) => ({
        ...q,
        id: q.id || `q-${Date.now().toString(36)}-${qIndex}`,
        sequence_order: qIndex + 1,
        options: q.options.map((opt, optIndex) => ({
          ...opt,
          id: opt.id || `opt-${Date.now().toString(36)}-${qIndex}-${optIndex}`,
          option_letter: String.fromCharCode(65 + optIndex), // A, B, C, D...
        })),
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updated = [newAssessment, ...list]
    this.saveAssessments(updated)
    return newAssessment
  }

  /**
   * Atualização relacional
   */
  async updateAssessment(
    id: string,
    dto: Partial<CreateAssessmentDTO>,
  ): Promise<SupabaseAssessment> {
    await new Promise((r) => setTimeout(r, 220))
    const list = this.loadAssessments()
    const index = list.findIndex((a) => a.id === id)
    if (index === -1) {
      throw new Error(`Avaliação com id ${id} não encontrada.`)
    }

    const current = list[index]
    const updatedAssessment: SupabaseAssessment = {
      ...current,
      ...(dto.course_id !== undefined && { course_id: dto.course_id }),
      ...(dto.discipline_id !== undefined && { discipline_id: dto.discipline_id }),
      ...(dto.scope_type !== undefined && { scope_type: dto.scope_type }),
      lesson_id:
        dto.scope_type === 'lesson_specific' ? dto.lesson_id : undefined,
      ...(dto.title !== undefined && { title: dto.title.trim() }),
      ...(dto.description !== undefined && { description: dto.description?.trim() }),
      ...(dto.max_score !== undefined && { max_score: Number(dto.max_score) }),
      ...(dto.passing_score !== undefined && {
        passing_score: Number(dto.passing_score),
      }),
      ...(dto.max_attempts !== undefined && {
        max_attempts: Number(dto.max_attempts),
      }),
      ...(dto.time_limit_minutes !== undefined && {
        time_limit_minutes: dto.time_limit_minutes
          ? Number(dto.time_limit_minutes)
          : undefined,
      }),
      ...(dto.questions !== undefined && {
        questions: dto.questions.map((q, qIndex) => ({
          ...q,
          sequence_order: qIndex + 1,
          options: q.options.map((opt, optIndex) => ({
            ...opt,
            option_letter: String.fromCharCode(65 + optIndex),
          })),
        })),
      }),
      updated_at: new Date().toISOString(),
    }

    list[index] = updatedAssessment
    this.saveAssessments(list)
    return updatedAssessment
  }

  /**
   * Simula exclusão em cascata
   */
  async deleteAssessment(id: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 150))
    const list = this.loadAssessments()
    const filtered = list.filter((a) => a.id !== id)
    this.saveAssessments(filtered)
    return true
  }

  resetAssessmentDefaults(): void {
    this.saveAssessments(INITIAL_ASSESSMENTS)
  }
}

export const assessmentService = new SupabaseAssessmentService()
