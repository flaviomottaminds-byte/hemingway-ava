import type { SupabaseLesson, LessonAttachment, UsefulLink } from '../types'
import { supabase } from '../lib/supabase'

const STORAGE_KEY_LESSONS = 'ava_supabase_lessons'
const USEFUL_LINKS_MARKER_START = '<!-- USEFUL_LINKS_JSON:'
const USEFUL_LINKS_MARKER_END = '-->'

export function extractUsefulLinksFromContent(content: string): { links: UsefulLink[]; cleanContent: string } {
  if (!content) return { links: [], cleanContent: '' }
  const startIdx = content.indexOf(USEFUL_LINKS_MARKER_START)
  if (startIdx === -1) return { links: [], cleanContent: content }
  const endIdx = content.indexOf(USEFUL_LINKS_MARKER_END, startIdx)
  if (endIdx === -1) return { links: [], cleanContent: content }

  const jsonStr = content.substring(startIdx + USEFUL_LINKS_MARKER_START.length, endIdx).trim()
  const cleanContent = (content.substring(0, startIdx) + content.substring(endIdx + USEFUL_LINKS_MARKER_END.length)).trim()
  try {
    const parsed = JSON.parse(jsonStr)
    if (Array.isArray(parsed)) {
      return { links: parsed, cleanContent }
    }
  } catch (e) {
    console.warn('Erro ao decodificar useful_links do content:', e)
  }
  return { links: [], cleanContent }
}

export function embedUsefulLinksInContent(content: string, links?: UsefulLink[]): string {
  const { cleanContent } = extractUsefulLinksFromContent(content || '')
  if (!links || links.length === 0) return cleanContent
  const validLinks = links.filter((l) => l.title?.trim() || l.url?.trim())
  if (validLinks.length === 0) return cleanContent
  const jsonStr = JSON.stringify(validLinks)
  return `${cleanContent}\n\n${USEFUL_LINKS_MARKER_START}${jsonStr}${USEFUL_LINKS_MARKER_END}`
}

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
  useful_links?: UsefulLink[]
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

        const cached = this.loadLessons()
        const mapped: SupabaseLesson[] = data.map((item: Record<string, unknown>, idx: number) => {
          const videoUrl =
            String(item.youtube_url || item.video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
          const youtubeId = extractYouTubeId(videoUrl) || undefined
          const rawContent = String(item.content || item.content_text || '')
          const { links: extractedLinks, cleanContent } = extractUsefulLinksFromContent(rawContent)
          const cachedMatch = cached.find((c) => c.id === item.id)
          const usefulLinks: UsefulLink[] = Array.isArray(item.useful_links)
            ? (item.useful_links as UsefulLink[])
            : extractedLinks.length > 0
              ? extractedLinks
              : (cachedMatch?.useful_links || [])

          return {
            id: String(item.id || `les-supa-${idx}`),
            course_id: String(item.course_id || ''),
            discipline_id: String(item.discipline_id || ''),
            title: String(item.title || 'Aula sem título'),
            sequence_order: Number(item.sequence_order || idx + 1),
            duration_minutes: Number(item.duration_minutes || 24),
            content_text: cleanContent,
            video_url: videoUrl,
            video_youtube_id: youtubeId,
            materials: (item.materials as LessonAttachment[]) || [],
            pdf_url: item.pdf_url ? String(item.pdf_url) : undefined,
            pdf_name: item.pdf_name ? String(item.pdf_name) : undefined,
            useful_links: usefulLinks,
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
    const contentWithLinks = embedUsefulLinksInContent(dto.content_text, dto.useful_links)
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
      useful_links: dto.useful_links || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      // Tenta gravar com a coluna useful_links; se não existir, grava dentro do content estruturado
      const insertPayload: Record<string, unknown> = {
        title: dto.title.trim(),
        content: contentWithLinks,
        youtube_url: dto.video_url.trim(),
        sequence_order: dto.sequence_order,
        discipline_id: dto.discipline_id || 'disc-03',
        pdf_url: dto.pdf_url || null,
        pdf_name: dto.pdf_name || null,
      }
      if (dto.useful_links && dto.useful_links.length > 0) {
        insertPayload.useful_links = dto.useful_links
      }

      let { data, error } = await supabase
        .from('lessons')
        .insert([insertPayload])
        .select()
        .single()

      if (error && (error.code === '42703' || error.message?.includes('useful_links'))) {
        delete insertPayload.useful_links
        const retry = await supabase
          .from('lessons')
          .insert([insertPayload])
          .select()
          .single()
        data = retry.data
        error = retry.error
      }

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
    const list = this.loadLessons()
    const index = list.findIndex((l) => l.id === id)
    const existing = index !== -1 ? list[index] : null

    const effectiveContent =
      dto.content_text !== undefined ? dto.content_text : existing?.content_text || ''
    const effectiveLinks =
      dto.useful_links !== undefined ? dto.useful_links : existing?.useful_links || []
    const contentWithLinks = embedUsefulLinksInContent(effectiveContent, effectiveLinks)

    const updatePayload: Record<string, unknown> = {}
    if (dto.title !== undefined) updatePayload.title = dto.title.trim()
    if (dto.content_text !== undefined || dto.useful_links !== undefined) {
      updatePayload.content = contentWithLinks
    }
    if (dto.video_url !== undefined) updatePayload.youtube_url = dto.video_url.trim()
    if (dto.sequence_order !== undefined) updatePayload.sequence_order = dto.sequence_order
    if (dto.discipline_id !== undefined) updatePayload.discipline_id = dto.discipline_id
    if (dto.duration_minutes !== undefined) updatePayload.duration_minutes = dto.duration_minutes
    if (dto.pdf_url !== undefined) updatePayload.pdf_url = dto.pdf_url || null
    if (dto.pdf_name !== undefined) updatePayload.pdf_name = dto.pdf_name || null
    if (dto.useful_links !== undefined) {
      updatePayload.useful_links = dto.useful_links
    }

    try {
      let { error } = await supabase
        .from('lessons')
        .update(updatePayload)
        .eq('id', id)

      if (error && (error.code === '42703' || error.message?.includes('useful_links')) && updatePayload.useful_links !== undefined) {
        delete updatePayload.useful_links
        const retry = await supabase
          .from('lessons')
          .update(updatePayload)
          .eq('id', id)
        error = retry.error
      }

      if (error) {
        console.warn('Aviso Supabase ao atualizar aula:', error)
      }
    } catch (err) {
      console.warn('Erro ao atualizar aula no Supabase:', err)
    }

    const youtubeId =
      dto.video_url !== undefined
        ? extractYouTubeId(dto.video_url) || undefined
        : existing
          ? existing.video_youtube_id
          : undefined

    let updated: SupabaseLesson

    if (index !== -1) {
      updated = {
        ...list[index],
        ...dto,
        useful_links: effectiveLinks,
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
        content_text: effectiveContent,
        video_url: dto.video_url || '',
        video_youtube_id: youtubeId,
        materials: dto.materials || [],
        pdf_url: dto.pdf_url,
        pdf_name: dto.pdf_name,
        useful_links: effectiveLinks,
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
