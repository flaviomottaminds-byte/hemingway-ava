import type { SupabaseLesson, LessonAttachment } from '../types'
import { supabase } from '../lib/supabase'

const STORAGE_KEY_LESSONS = 'ava_supabase_lessons'

export const extractYouTubeId = (url: string): string | null => {
  if (!url) return null
  const trimmed = url.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }
  const regex =
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:.*v(?:=|%3D)|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/i
  const match = trimmed.match(regex)
  return match ? match[1] : null
}

// Inicialização limpa (sem dados fictícios fixos)
const INITIAL_LESSONS: SupabaseLesson[] = []

export interface CreateLessonDTO {
  course_id: string
  discipline_id: string
  title: string
  sequence_order: number
  duration_minutes: number
  content_text: string
  video_url: string
  materials: LessonAttachment[]
  pdf_url?: string
  pdf_name?: string
}

class SupabaseLessonService {
  private loadLessons(): SupabaseLesson[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LESSONS)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Erro ao carregar lições do localStorage:', e)
    }
    return []
  }

  private saveLessons(items: SupabaseLesson[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_LESSONS, JSON.stringify(items))
    } catch (e) {
      console.error('Erro ao salvar lições no localStorage:', e)
    }
  }

  /**
   * Executa SELECT * FROM lessons no Supabase real
   */
  async getLessonsWithStatus(filter?: {
    course_id?: string
    discipline_id?: string
  }): Promise<{
    data: SupabaseLesson[]
    isLive: boolean
    error: string | null
  }> {
    try {
      let query = supabase.from('lessons').select('*')
      if (filter?.discipline_id) {
        query = query.eq('discipline_id', filter.discipline_id)
      }
      const { data, error } = await query.order('sequence_order', { ascending: true })

      if (error) {
        console.warn('Erro ao consultar Supabase lessons:', error)
        return {
          data: this.loadLessons(),
          isLive: false,
          error: `Erro Supabase (${error.code || 'SELECT'}): ${error.message}`,
        }
      }

      if (data !== null) {
        if (data.length === 0) {
          const cached = this.loadLessons()
          const filtered = filter?.discipline_id
            ? cached.filter((l) => l.discipline_id === filter.discipline_id)
            : cached
          return { data: filtered, isLive: true, error: null }
        }

        const mapped: SupabaseLesson[] = data.map((item: Record<string, unknown>, idx: number) => {
          const videoUrl =
            String(item.youtube_url || item.video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
          const youtubeId = extractYouTubeId(videoUrl) || undefined
          return {
            id: String(item.id || `les-supa-${idx}`),
            course_id: String(item.course_id || ''),
            discipline_id: String(item.discipline_id || ''),
            title: String(item.title || 'Aula sem título'),
            sequence_order: Number(item.sequence_order || idx + 1),
            duration_minutes: Number(item.duration_minutes || 24),
            content_text: String(item.content || item.content_text || ''),
            video_url: videoUrl,
            video_youtube_id: youtubeId,
            materials: (item.materials as LessonAttachment[]) || [],
            pdf_url: item.pdf_url ? String(item.pdf_url) : undefined,
            pdf_name: item.pdf_name ? String(item.pdf_name) : undefined,
            created_at: String(item.created_at || new Date().toISOString()),
          }
        })
        this.saveLessons(mapped)
        const finalData = filter?.discipline_id
          ? mapped.filter((l) => l.discipline_id === filter.discipline_id)
          : mapped
        return { data: finalData, isLive: true, error: null }
      }

      return {
        data: this.loadLessons(),
        isLive: true,
        error: null,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão com Supabase'
      return {
        data: this.loadLessons(),
        isLive: false,
        error: msg,
      }
    }
  }

  async getLessons(filter?: {
    course_id?: string
    discipline_id?: string
  }): Promise<SupabaseLesson[]> {
    const res = await this.getLessonsWithStatus(filter)
    return res.data
  }

  async getLessonById(id: string): Promise<SupabaseLesson | null> {
    const list = await this.getLessons()
    return list.find((l) => l.id === id) || null
  }

  /**
   * Faz upload direto do arquivo PDF para o Supabase Storage no bucket 'lesson-materials'
   */
  async uploadLessonPdf(file: File): Promise<{
    url: string
    name: string
    error?: string
  }> {
    const fileExt = file.name.split('.').pop() || 'pdf'
    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40)
    const fileName = `${Date.now()}_${cleanBaseName}.${fileExt}`
    const filePath = `materials/${fileName}`

    try {
      const { error } = await supabase.storage
        .from('lesson-materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf',
        })

      if (error) {
        console.warn('Aviso Supabase Storage:', error)
        const fallbackUrl = URL.createObjectURL(file)
        return {
          url: fallbackUrl,
          name: file.name,
          error: error.message,
        }
      }

      const { data: publicUrlData } = supabase.storage
        .from('lesson-materials')
        .getPublicUrl(filePath)

      return {
        url: publicUrlData.publicUrl,
        name: file.name,
      }
    } catch (err) {
      console.error('Falha no upload para o Supabase Storage:', err)
      const fallbackUrl = URL.createObjectURL(file)
      return {
        url: fallbackUrl,
        name: file.name,
        error: err instanceof Error ? err.message : 'Falha no upload',
      }
    }
  }

  /**
   * Executa INSERT real na tabela lessons do Supabase
   */
  async createLesson(dto: CreateLessonDTO): Promise<SupabaseLesson> {
    const youtubeId = extractYouTubeId(dto.video_url) || undefined
    const newLesson: SupabaseLesson = {
      id: `les-${Date.now().toString(36)}`,
      course_id: dto.course_id,
      discipline_id: dto.discipline_id,
      title: dto.title.trim(),
      sequence_order: dto.sequence_order,
      duration_minutes: dto.duration_minutes,
      content_text: dto.content_text,
      video_url: dto.video_url.trim(),
      video_youtube_id: youtubeId,
      materials: dto.materials,
      pdf_url: dto.pdf_url,
      pdf_name: dto.pdf_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      // Colunas reais no banco: id, title, content, youtube_url, sequence_order, discipline_id, pdf_url, pdf_name
      const insertPayload = {
        title: dto.title.trim(),
        content: dto.content_text,
        youtube_url: dto.video_url.trim(),
        sequence_order: dto.sequence_order,
        discipline_id: dto.discipline_id || 'disc-03',
        pdf_url: dto.pdf_url || null,
        pdf_name: dto.pdf_name || null,
      }

      const { data, error } = await supabase
        .from('lessons')
        .insert([insertPayload])
        .select()
        .single()

      if (!error && data) {
        newLesson.id = String(data.id || newLesson.id)
      } else if (error) {
        console.warn('Erro ao inserir aula no Supabase:', error)
      }
    } catch (err) {
      console.warn('Falha na requisição de inserção de aula no Supabase:', err)
    }

    const list = this.loadLessons()
    const updated = [...list, newLesson]
    this.saveLessons(updated)
    return newLesson
  }

  async updateLesson(
    id: string,
    dto: Partial<CreateLessonDTO>,
  ): Promise<SupabaseLesson> {
    const updatePayload: Record<string, unknown> = {}
    if (dto.title !== undefined) updatePayload.title = dto.title.trim()
    if (dto.content_text !== undefined) updatePayload.content = dto.content_text
    if (dto.video_url !== undefined) updatePayload.youtube_url = dto.video_url.trim()
    if (dto.sequence_order !== undefined) updatePayload.sequence_order = dto.sequence_order
    if (dto.discipline_id !== undefined) updatePayload.discipline_id = dto.discipline_id
    if (dto.duration_minutes !== undefined) updatePayload.duration_minutes = dto.duration_minutes
    if (dto.pdf_url !== undefined) updatePayload.pdf_url = dto.pdf_url || null
    if (dto.pdf_name !== undefined) updatePayload.pdf_name = dto.pdf_name || null

    try {
      const { error } = await supabase
        .from('lessons')
        .update(updatePayload)
        .eq('id', id)

      if (error) {
        console.warn('Aviso Supabase ao atualizar aula:', error)
      }
    } catch (err) {
      console.warn('Erro ao atualizar aula no Supabase:', err)
    }

    const list = this.loadLessons()
    const index = list.findIndex((l) => l.id === id)

    const youtubeId =
      dto.video_url !== undefined
        ? extractYouTubeId(dto.video_url) || undefined
        : index !== -1
          ? list[index].video_youtube_id
          : undefined

    let updated: SupabaseLesson

    if (index !== -1) {
      updated = {
        ...list[index],
        ...dto,
        video_youtube_id: youtubeId,
        updated_at: new Date().toISOString(),
      }
      list[index] = updated
    } else {
      updated = {
        id,
        course_id: dto.course_id || '',
        discipline_id: dto.discipline_id || '',
        title: dto.title || 'Aula Atualizada',
        sequence_order: dto.sequence_order || 1,
        duration_minutes: dto.duration_minutes || 20,
        content_text: dto.content_text || '',
        video_url: dto.video_url || '',
        video_youtube_id: youtubeId,
        materials: dto.materials || [],
        pdf_url: dto.pdf_url,
        pdf_name: dto.pdf_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      list.push(updated)
    }

    this.saveLessons(list)
    return updated
  }

  async deleteLesson(id: string): Promise<boolean> {
    try {
      await supabase.from('lessons').delete().eq('id', id)
    } catch (err) {
      console.warn('Erro ao excluir aula no Supabase:', err)
    }
    const list = this.loadLessons()
    this.saveLessons(list.filter((l) => l.id !== id))
    return true
  }

  resetDefaults(): void {
    this.saveLessons(INITIAL_LESSONS)
  }
}

export const lessonService = new SupabaseLessonService()
