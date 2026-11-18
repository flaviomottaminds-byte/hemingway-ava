import type {
  SupabaseAssessment,
  AssessmentQuestion,
  AssessmentScopeType,
} from '../types'
import { supabase } from '../lib/supabase'

const STORAGE_KEY_ASSESSMENTS = 'ava_supabase_assessments'
const STORAGE_BUCKET = 'lesson-materials'
const STORAGE_FILE_PATH = 'assessments/assessments_db.json'
const LEGACY_FAKE_IDS = new Set(['asm-101', 'asm-102'])

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

function normalizeQuestions(questions: AssessmentQuestion[]): AssessmentQuestion[] {
  if (!Array.isArray(questions)) return []
  return questions.map((q, qIndex) => ({
    ...q,
    id: q.id || `q-${Date.now().toString(36)}-${qIndex}`,
    sequence_order: qIndex + 1,
    statement: String(q.statement || '').trim(),
    points: Number(q.points) || 1,
    feedback: q.feedback ? String(q.feedback).trim() : '',
    options: Array.isArray(q.options)
      ? q.options.map((opt, optIndex) => ({
          ...opt,
          id: opt.id || `opt-${Date.now().toString(36)}-${qIndex}-${optIndex}`,
          option_letter: String.fromCharCode(65 + optIndex),
          text: String(opt.text || '').trim(),
          is_correct: Boolean(opt.is_correct),
        }))
      : [],
  }))
}

function filterOutLegacyFakeAssessments(items: SupabaseAssessment[]): SupabaseAssessment[] {
  if (!Array.isArray(items)) return []
  return items.filter((item) => item && item.id && !LEGACY_FAKE_IDS.has(item.id))
}

class SupabaseAssessmentService {
  private loadLocalAssessments(): SupabaseAssessment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ASSESSMENTS)
      if (data) {
        const parsed = JSON.parse(data)
        const cleaned = filterOutLegacyFakeAssessments(parsed)
        if (cleaned.length !== (Array.isArray(parsed) ? parsed.length : 0)) {
          this.saveLocalAssessments(cleaned)
        }
        return cleaned
      }
    } catch (e) {
      console.warn('Erro ao carregar avaliações do localStorage:', e)
    }
    return []
  }

  private saveLocalAssessments(items: SupabaseAssessment[]): void {
    try {
      const cleaned = filterOutLegacyFakeAssessments(items)
      localStorage.setItem(STORAGE_KEY_ASSESSMENTS, JSON.stringify(cleaned))
    } catch (e) {
      console.error('Erro ao salvar avaliações no localStorage:', e)
    }
  }

  /**
   * Lê a base de avaliações persistida no Supabase Storage (bucket lesson-materials)
   */
  private async loadFromSupabaseStorage(): Promise<SupabaseAssessment[] | null> {
    try {
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(STORAGE_FILE_PATH)

      if (publicUrlData?.publicUrl) {
        const res = await fetch(`${publicUrlData.publicUrl}?t=${Date.now()}`, {
          cache: 'no-store',
        })
        if (res.ok) {
          const json = await res.json()
          if (Array.isArray(json)) {
            return filterOutLegacyFakeAssessments(json)
          }
        }
      }

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(STORAGE_FILE_PATH)

      if (!error && data) {
        const text = await data.text()
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed)) {
          return filterOutLegacyFakeAssessments(parsed)
        }
      }
    } catch (e) {
      console.warn('Aviso ao ler avaliações do Supabase Storage:', e)
    }
    return null
  }

  /**
   * Salva a base completa de avaliações no Supabase Storage (bucket lesson-materials)
   */
  private async saveToSupabaseStorage(items: SupabaseAssessment[]): Promise<{
    ok: boolean
    error: string | null
  }> {
    try {
      const cleaned = filterOutLegacyFakeAssessments(items)
      const blob = new Blob([JSON.stringify(cleaned, null, 2)], {
        type: 'application/json',
      })

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(STORAGE_FILE_PATH, blob, {
          upsert: true,
          contentType: 'application/json',
          cacheControl: '0',
        })

      if (error) {
        return {
          ok: false,
          error: `Erro Supabase Storage (${error.name || 'UPLOAD'}): ${error.message}`,
        }
      }

      return { ok: true, error: null }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao gravar no Supabase Storage'
      return { ok: false, error: msg }
    }
  }

  /**
   * Tenta gravar também nas tabelas relacionais quizzes / quiz_questions ou assessments caso existam no schema public
   */
  private async trySyncRelationalTables(
    assessment: SupabaseAssessment,
    mode: 'insert' | 'update',
  ): Promise<{ syncedRelational: boolean; relationalError: string | null }> {
    // 1. Tenta tabela 'quizzes'
    try {
      const quizPayload: Record<string, unknown> = {
        id: assessment.id,
        course_id: assessment.course_id,
        discipline_id: assessment.discipline_id,
        lesson_id: assessment.lesson_id || null,
        scope_type: assessment.scope_type,
        title: assessment.title,
        description: assessment.description || '',
        max_score: assessment.max_score,
        passing_score: assessment.passing_score,
        max_attempts: assessment.max_attempts,
        time_limit_minutes: assessment.time_limit_minutes || 30,
        questions: assessment.questions,
      }

      const { error: quizErr } =
        mode === 'insert'
          ? await supabase.from('quizzes').upsert([quizPayload])
          : await supabase.from('quizzes').upsert([quizPayload])

      if (!quizErr) {
        // Se existir tabela quiz_questions, sincroniza questões também
        try {
          await supabase.from('quiz_questions').delete().eq('quiz_id', assessment.id)
          if (assessment.questions.length > 0) {
            const qRows = assessment.questions.map((q, idx) => ({
              quiz_id: assessment.id,
              sequence_order: idx + 1,
              statement: q.statement,
              points: q.points,
              feedback: q.feedback || '',
              options: q.options,
            }))
            await supabase.from('quiz_questions').insert(qRows)
          }
        } catch {
          // tabela quiz_questions opcional se questions já estiver em quizzes
        }
        return { syncedRelational: true, relationalError: null }
      }

      const isTableMissing =
        quizErr.code === 'PGRST205' ||
        quizErr.code === '42P01' ||
        quizErr.message?.includes('Could not find the table') ||
        quizErr.message?.includes('does not exist')

      if (!isTableMissing) {
        return {
          syncedRelational: false,
          relationalError: `Erro na tabela 'quizzes' (${quizErr.code}): ${quizErr.message}`,
        }
      }
    } catch {
      // prossegue para fallback
    }

    // 2. Tenta tabela 'assessments'
    try {
      const asmPayload: Record<string, unknown> = {
        id: assessment.id,
        course_id: assessment.course_id,
        discipline_id: assessment.discipline_id,
        lesson_id: assessment.lesson_id || null,
        scope_type: assessment.scope_type,
        title: assessment.title,
        description: assessment.description || '',
        max_score: assessment.max_score,
        passing_score: assessment.passing_score,
        max_attempts: assessment.max_attempts,
        time_limit_minutes: assessment.time_limit_minutes || 30,
        questions: assessment.questions,
      }

      const { error: asmErr } = await supabase.from('assessments').upsert([asmPayload])
      if (!asmErr) {
        return { syncedRelational: true, relationalError: null }
      }

      const isTableMissing =
        asmErr.code === 'PGRST205' ||
        asmErr.code === '42P01' ||
        asmErr.message?.includes('Could not find the table') ||
        asmErr.message?.includes('does not exist')

      if (!isTableMissing) {
        return {
          syncedRelational: false,
          relationalError: `Erro na tabela 'assessments' (${asmErr.code}): ${asmErr.message}`,
        }
      }
    } catch {
      // prossegue
    }

    return { syncedRelational: false, relationalError: null }
  }

  /**
   * Busca todas as avaliações reais salvas no Supabase (Storage + Tabelas se existirem + Cache local)
   */
  async getAssessmentsWithStatus(filter?: {
    course_id?: string
    discipline_id?: string
    lesson_id?: string
  }): Promise<{
    data: SupabaseAssessment[]
    isLive: boolean
    error: string | null
  }> {
    let list: SupabaseAssessment[] = []
    let isLive = false
    let errorMsg: string | null = null

    // 1. Tenta carregar do Supabase Storage (fonte persistente em nuvem ativa)
    const remoteStorageList = await this.loadFromSupabaseStorage()
    if (remoteStorageList !== null) {
      list = remoteStorageList
      isLive = true
    }

    // 2. Tenta ler também da tabela 'quizzes' caso tenha sido criada no banco
    try {
      const { data: quizzesData, error: quizzesErr } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false })

      if (!quizzesErr && Array.isArray(quizzesData) && quizzesData.length > 0) {
        isLive = true
        const mappedQuizzes: SupabaseAssessment[] = quizzesData.map((row: any) => ({
          id: String(row.id),
          course_id: String(row.course_id || ''),
          discipline_id: String(row.discipline_id || ''),
          lesson_id: row.lesson_id ? String(row.lesson_id) : undefined,
          scope_type:
            row.scope_type === 'lesson_specific' || row.lesson_id
              ? 'lesson_specific'
              : 'discipline_final',
          title: String(row.title || 'Avaliação'),
          description: row.description ? String(row.description) : '',
          max_score: Number(row.max_score) || 10,
          passing_score: Number(row.passing_score) || 7,
          max_attempts: Number(row.max_attempts) || 3,
          time_limit_minutes: row.time_limit_minutes ? Number(row.time_limit_minutes) : 30,
          questions: normalizeQuestions(Array.isArray(row.questions) ? row.questions : []),
          created_at: String(row.created_at || new Date().toISOString()),
          updated_at: row.updated_at ? String(row.updated_at) : undefined,
        }))

        const byId = new Map<string, SupabaseAssessment>()
        for (const item of [...mappedQuizzes, ...list]) {
          if (item && item.id && !LEGACY_FAKE_IDS.has(item.id) && !byId.has(item.id)) {
            byId.set(item.id, item)
          }
        }
        list = Array.from(byId.values())
      } else if (
        quizzesErr &&
        quizzesErr.code !== 'PGRST205' &&
        quizzesErr.code !== '42P01' &&
        !quizzesErr.message?.includes('Could not find the table')
      ) {
        errorMsg = `Erro Supabase quizzes (${quizzesErr.code}): ${quizzesErr.message}`
      }
    } catch {
      // ignora se tabela quizzes não existir
    }

    // 3. Mescla com localStorage caso o carregamento remoto tenha falhado
    const localList = this.loadLocalAssessments()
    if (!isLive) {
      list = localList
    } else {
      // Sincroniza cache local com a lista real da nuvem
      this.saveLocalAssessments(list)
    }

    let filtered = filterOutLegacyFakeAssessments(list)
    if (filter?.course_id) {
      filtered = filtered.filter((a) => a.course_id === filter.course_id)
    }
    if (filter?.discipline_id) {
      filtered = filtered.filter((a) => a.discipline_id === filter.discipline_id)
    }
    if (filter?.lesson_id) {
      filtered = filtered.filter((a) => a.lesson_id === filter.lesson_id)
    }

    return {
      data: filtered,
      isLive,
      error: errorMsg,
    }
  }

  async getAssessments(filter?: {
    course_id?: string
    discipline_id?: string
    lesson_id?: string
  }): Promise<SupabaseAssessment[]> {
    const res = await this.getAssessmentsWithStatus(filter)
    return res.data
  }

  async getAssessmentById(id: string): Promise<SupabaseAssessment | null> {
    if (!id) return null
    const list = await this.getAssessments()
    return list.find((a) => a.id === id) || null
  }

  /**
   * Busca a avaliação vinculada diretamente a uma aula (lesson_id)
   */
  async getAssessmentByLessonId(lessonId: string): Promise<SupabaseAssessment | null> {
    if (!lessonId) return null
    const list = await this.getAssessments()
    return list.find((a) => a.lesson_id === lessonId) || null
  }

  /**
   * Busca a avaliação correspondente para exibição na Sala de Aula do Aluno ou Pré-visualização:
   * 1º Prioridade: Avaliação vinculada diretamente ao lesson_id da aula
   * 2º Prioridade: Avaliação vinculada ao discipline_id da aula
   * 3º Prioridade: Avaliação vinculada ao course_id da aula (se não houver discipline_id)
   */
  async getAssessmentForLesson(params: {
    lesson_id?: string
    discipline_id?: string
    course_id?: string
  }): Promise<SupabaseAssessment | null> {
    const all = await this.getAssessments()
    if (all.length === 0) return null

    if (params.lesson_id) {
      const byLesson = all.find((a) => a.lesson_id && a.lesson_id === params.lesson_id)
      if (byLesson && byLesson.questions.length > 0) {
        return byLesson
      }
    }

    if (params.discipline_id) {
      const byDiscipline = all.find(
        (a) =>
          a.discipline_id === params.discipline_id &&
          (!a.lesson_id || a.lesson_id === params.lesson_id || a.scope_type === 'discipline_final'),
      )
      if (byDiscipline && byDiscipline.questions.length > 0) {
        return byDiscipline
      }

      const anyInDiscipline = all.find((a) => a.discipline_id === params.discipline_id)
      if (anyInDiscipline && anyInDiscipline.questions.length > 0) {
        return anyInDiscipline
      }
    }

    if (params.course_id) {
      const byCourse = all.find(
        (a) => a.course_id === params.course_id && a.scope_type === 'discipline_final',
      )
      if (byCourse && byCourse.questions.length > 0) {
        return byCourse
      }
    }

    return null
  }

  /**
   * Retorna a contagem de questões cadastradas para uma aula
   */
  async countQuestionsByLessonId(lessonId: string): Promise<number> {
    if (!lessonId) return 0
    const assessment = await this.getAssessmentByLessonId(lessonId)
    return assessment?.questions?.length || 0
  }

  /**
   * Cria ou substitui avaliação no Supabase (evita duplicatas se já existir avaliação para a mesma aula específica)
   */
  async createAssessment(dto: CreateAssessmentDTO): Promise<SupabaseAssessment> {
    const currentList = await this.getAssessments()

    const newAssessment: SupabaseAssessment = {
      id: `asm-${Date.now().toString(36)}`,
      course_id: dto.course_id,
      discipline_id: dto.discipline_id,
      lesson_id: dto.scope_type === 'lesson_specific' ? dto.lesson_id : undefined,
      scope_type: dto.scope_type,
      title: dto.title.trim(),
      description: dto.description?.trim() || '',
      max_score: Number(dto.max_score) || 10,
      passing_score: Number(dto.passing_score) || 7,
      max_attempts: Number(dto.max_attempts) || 3,
      time_limit_minutes: dto.time_limit_minutes ? Number(dto.time_limit_minutes) : 30,
      questions: normalizeQuestions(dto.questions),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Tenta sincronizar em tabelas relacionais caso existam
    const { relationalError } = await this.trySyncRelationalTables(newAssessment, 'insert')
    if (relationalError) {
      throw new Error(relationalError)
    }

    const updatedList = [newAssessment, ...currentList.filter((a) => a.id !== newAssessment.id)]
    this.saveLocalAssessments(updatedList)

    const storageRes = await this.saveToSupabaseStorage(updatedList)
    if (!storageRes.ok && storageRes.error) {
      throw new Error(storageRes.error)
    }

    return newAssessment
  }

  /**
   * Atualiza avaliação existente no Supabase
   */
  async updateAssessment(
    id: string,
    dto: Partial<CreateAssessmentDTO>,
  ): Promise<SupabaseAssessment> {
    const list = await this.getAssessments()
    const index = list.findIndex((a) => a.id === id)
    if (index === -1) {
      throw new Error(`Avaliação com id ${id} não encontrada no banco.`)
    }

    const current = list[index]
    const nextScope = dto.scope_type !== undefined ? dto.scope_type : current.scope_type
    const updatedAssessment: SupabaseAssessment = {
      ...current,
      ...(dto.course_id !== undefined && { course_id: dto.course_id }),
      ...(dto.discipline_id !== undefined && { discipline_id: dto.discipline_id }),
      scope_type: nextScope,
      lesson_id:
        nextScope === 'lesson_specific'
          ? dto.lesson_id !== undefined
            ? dto.lesson_id
            : current.lesson_id
          : undefined,
      ...(dto.title !== undefined && { title: dto.title.trim() }),
      ...(dto.description !== undefined && { description: dto.description?.trim() || '' }),
      ...(dto.max_score !== undefined && { max_score: Number(dto.max_score) || 10 }),
      ...(dto.passing_score !== undefined && {
        passing_score: Number(dto.passing_score) || 7,
      }),
      ...(dto.max_attempts !== undefined && {
        max_attempts: Number(dto.max_attempts) || 3,
      }),
      ...(dto.time_limit_minutes !== undefined && {
        time_limit_minutes: dto.time_limit_minutes
          ? Number(dto.time_limit_minutes)
          : undefined,
      }),
      ...(dto.questions !== undefined && {
        questions: normalizeQuestions(dto.questions),
      }),
      updated_at: new Date().toISOString(),
    }

    const { relationalError } = await this.trySyncRelationalTables(updatedAssessment, 'update')
    if (relationalError) {
      throw new Error(relationalError)
    }

    list[index] = updatedAssessment
    this.saveLocalAssessments(list)

    const storageRes = await this.saveToSupabaseStorage(list)
    if (!storageRes.ok && storageRes.error) {
      throw new Error(storageRes.error)
    }

    return updatedAssessment
  }

  /**
   * Exclui avaliação do Supabase
   */
  async deleteAssessment(id: string): Promise<boolean> {
    try {
      await supabase.from('quiz_questions').delete().eq('quiz_id', id)
      await supabase.from('quizzes').delete().eq('id', id)
    } catch {
      // ignora se tabela não existir
    }
    try {
      await supabase.from('assessments').delete().eq('id', id)
    } catch {
      // ignora se tabela não existir
    }

    const list = await this.getAssessments()
    const filtered = list.filter((a) => a.id !== id)
    this.saveLocalAssessments(filtered)
    await this.saveToSupabaseStorage(filtered)
    return true
  }

  resetAssessmentDefaults(): void {
    this.saveLocalAssessments([])
    this.saveToSupabaseStorage([])
  }
}

export const assessmentService = new SupabaseAssessmentService()
