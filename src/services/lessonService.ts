import type { SupabaseLesson, LessonAttachment, UsefulLink } from '../types'
import { supabase } from '../lib/supabase'

const STORAGE_KEY_LESSONS = 'ava_supabase_lessons'
const USEFUL_LINKS_MARKER_START = '<!-- USEFUL_LINKS_JSON:'
const USEFUL_LINKS_MARKER_END = '-->'
const SLIDES_MARKER_START = '<!-- SLIDES_JSON:'
const SLIDES_MARKER_END = '-->'
const EXAM_DRIVE_MARKER_START = '<!-- EXAM_DRIVE_JSON:'
const EXAM_DRIVE_MARKER_END = '-->'

export interface LessonSlidesConfig {
  slides_url?: string
  slides_url_pt?: string
  slides_url_en?: string
  slides_url_es?: string
}

/**
 * Utilitário para formatar links do Google Drive e Google Forms para visualização e embed interativo
 */
export function formatGoogleDriveEmbedUrl(url: string): {
  embedUrl: string | null
  isForm: boolean
  isDrive: boolean
} {
  if (!url) return { embedUrl: null, isForm: false, isDrive: false }
  const trimmed = url.trim()

  // Google Forms: /edit ou /viewform -> /viewform?embedded=true
  if (trimmed.includes('docs.google.com/forms')) {
    let clean = trimmed
    if (clean.includes('/edit')) {
      clean = clean.replace(/\/edit.*$/, '/viewform?embedded=true')
    } else if (!clean.includes('embedded=true')) {
      clean = clean.includes('?') ? `${clean}&embedded=true` : `${clean}?embedded=true`
    }
    return { embedUrl: clean, isForm: true, isDrive: false }
  }

  // Google Drive File (PDF, Docs, etc.): /view -> /preview
  if (trimmed.includes('drive.google.com/file/d/')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return { embedUrl: `https://drive.google.com/file/d/${match[1]}/preview`, isForm: false, isDrive: true }
    }
  }

  // Google Docs
  if (trimmed.includes('docs.google.com/document/d/')) {
    const match = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return { embedUrl: `https://docs.google.com/document/d/${match[1]}/preview`, isForm: false, isDrive: true }
    }
  }

  // Google Sheets
  if (trimmed.includes('docs.google.com/spreadsheets/d/')) {
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return { embedUrl: `https://docs.google.com/spreadsheets/d/${match[1]}/preview`, isForm: false, isDrive: true }
    }
  }

  return {
    embedUrl: trimmed,
    isForm: trimmed.includes('forms'),
    isDrive: trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com'),
  }
}

export function extractExamDriveFromContent(content: string): { exam_drive_url?: string; cleanContent: string } {
  if (!content) return { cleanContent: '' }
  const startIdx = content.indexOf(EXAM_DRIVE_MARKER_START)
  if (startIdx === -1) return { cleanContent: content }
  const endIdx = content.indexOf(EXAM_DRIVE_MARKER_END, startIdx)
  if (endIdx === -1) return { cleanContent: content }

  const jsonStr = content.substring(startIdx + EXAM_DRIVE_MARKER_START.length, endIdx).trim()
  const cleanContent = (content.substring(0, startIdx) + content.substring(endIdx + EXAM_DRIVE_MARKER_END.length)).trim()
  try {
    const parsed = JSON.parse(jsonStr)
    if (parsed && typeof parsed === 'object') {
      return { exam_drive_url: parsed.exam_drive_url, cleanContent }
    }
  } catch (e) {
    console.warn('Erro ao decodificar exam_drive do content:', e)
  }
  return { cleanContent }
}

export function embedExamDriveInContent(content: string, examDriveUrl?: string): string {
  const { cleanContent } = extractExamDriveFromContent(content || '')
  if (!examDriveUrl || !examDriveUrl.trim()) {
    return cleanContent
  }
  const jsonStr = JSON.stringify({ exam_drive_url: examDriveUrl.trim() })
  return `${cleanContent}\n\n${EXAM_DRIVE_MARKER_START}${jsonStr}${EXAM_DRIVE_MARKER_END}`
}

/**
 * Utilitário para formatar links do Gamma.app no padrão embed: https://gamma.app/embed/[ID]
 * Aceita:
 * - Links de visualização: https://gamma.app/docs/Titulo-da-Aula-xyz123
 * - Links públicos: https://gamma.app/public/Titulo-da-Aula-xyz123
 * - Código <iframe> completo: <iframe src="https://gamma.app/embed/xyz123" ...>
 * - Links já em /embed/: https://gamma.app/embed/xyz123
 */
export function formatGammaEmbedUrl(url: string): string {
  if (!url) return ''
  let cleaned = url.trim()

  // 1. Extração se for código de <iframe> completo copiado do Share > Embed
  if (cleaned.includes('<iframe') || cleaned.includes('src=')) {
    const srcMatch = cleaned.match(/src=["']([^"']+)["']/i)
    if (srcMatch && srcMatch[1]) {
      cleaned = srcMatch[1].trim()
    }
  }

  // 2. Se já for embed direto https://gamma.app/embed/[ID]
  const embedMatch = cleaned.match(/(?:https?:\/\/)?(?:www\.)?gamma\.app\/embed\/([^/?#\s"'>]+)/i)
  if (embedMatch && embedMatch[1]) {
    return `https://gamma.app/embed/${embedMatch[1]}`
  }

  // 3. Links comuns: https://gamma.app/docs/[ID] ou /public/[ID] ou /m/[ID]
  const docMatch = cleaned.match(/(?:https?:\/\/)?(?:www\.)?gamma\.app\/(?:docs|public|m)\/([^/?#\s"'>]+)/i)
  if (docMatch && docMatch[1]) {
    return `https://gamma.app/embed/${docMatch[1]}`
  }

  // 4. Link direto no domínio raiz: https://gamma.app/[ID] (evitando rotas do sistema)
  const shortMatch = cleaned.match(/(?:https?:\/\/)?(?:www\.)?gamma\.app\/([^/?#\s"'>]+)/i)
  if (
    shortMatch &&
    shortMatch[1] &&
    !['docs', 'public', 'embed', 'm', 'signin', 'signup', 'pricing', 'about', 'app'].includes(shortMatch[1].toLowerCase())
  ) {
    return `https://gamma.app/embed/${shortMatch[1]}`
  }

  // 5. Fallback para variações com query strings ou caminhos adicionais
  if (cleaned.includes('gamma.app')) {
    let result = cleaned.replace(/\/docs\//i, '/embed/').replace(/\/public\//i, '/embed/')
    if (!result.includes('/embed/')) {
      result = result.replace(/gamma\.app\/([^/?#]+)/i, 'gamma.app/embed/$1')
    }
    return result.split('?')[0].split('#')[0]
  }

  return cleaned
}

export function extractSlidesFromContent(content: string): { slides: LessonSlidesConfig; cleanContent: string } {
  if (!content) return { slides: {}, cleanContent: '' }
  const startIdx = content.indexOf(SLIDES_MARKER_START)
  if (startIdx === -1) return { slides: {}, cleanContent: content }
  const endIdx = content.indexOf(SLIDES_MARKER_END, startIdx)
  if (endIdx === -1) return { slides: {}, cleanContent: content }

  const jsonStr = content.substring(startIdx + SLIDES_MARKER_START.length, endIdx).trim()
  const cleanContent = (content.substring(0, startIdx) + content.substring(endIdx + SLIDES_MARKER_END.length)).trim()
  try {
    const parsed = JSON.parse(jsonStr)
    if (parsed && typeof parsed === 'object') {
      return { slides: parsed, cleanContent }
    }
  } catch (e) {
    console.warn('Erro ao decodificar slides do content:', e)
  }
  return { slides: {}, cleanContent }
}

export function embedSlidesInContent(content: string, slides?: LessonSlidesConfig): string {
  const { cleanContent } = extractSlidesFromContent(content || '')
  if (!slides || (!slides.slides_url && !slides.slides_url_pt && !slides.slides_url_en && !slides.slides_url_es)) {
    return cleanContent
  }
  const cleanUrl = (u?: string) => (u && u.includes('gamma.app') ? formatGammaEmbedUrl(u) : u || '')
  const jsonStr = JSON.stringify({
    slides_url: cleanUrl(slides.slides_url || slides.slides_url_pt),
    slides_url_pt: cleanUrl(slides.slides_url_pt || slides.slides_url),
    slides_url_en: cleanUrl(slides.slides_url_en),
    slides_url_es: cleanUrl(slides.slides_url_es),
  })
  return `${cleanContent}\n\n${SLIDES_MARKER_START}${jsonStr}${SLIDES_MARKER_END}`
}

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
  slides_url?: string
  slides_url_pt?: string
  slides_url_en?: string
  slides_url_es?: string
  exam_drive_url?: string
  exam_drive_url_pt?: string
  exam_drive_url_en?: string
  exam_drive_url_es?: string
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
          const { links: extractedLinks, cleanContent: contentWithoutLinks } = extractUsefulLinksFromContent(rawContent)
          const { exam_drive_url: extractedExamDriveUrl, cleanContent: contentWithoutExam } = extractExamDriveFromContent(contentWithoutLinks)
          const { slides: extractedSlides, cleanContent } = extractSlidesFromContent(contentWithoutExam)
          const cachedMatch = cached.find((c) => c.id === item.id)
          const usefulLinks: UsefulLink[] = Array.isArray(item.useful_links)
            ? (item.useful_links as UsefulLink[])
            : extractedLinks.length > 0
              ? extractedLinks
              : (cachedMatch?.useful_links || [])

          const slidesUrl =
            (item.slides_url as string) ||
            (item.slides_url_pt as string) ||
            extractedSlides.slides_url ||
            cachedMatch?.slides_url ||
            undefined

          const slidesUrlPt =
            (item.slides_url_pt as string) ||
            extractedSlides.slides_url_pt ||
            slidesUrl ||
            undefined

          const slidesUrlEn =
            (item.slides_url_en as string) ||
            extractedSlides.slides_url_en ||
            cachedMatch?.slides_url_en ||
            undefined

          const slidesUrlEs =
            (item.slides_url_es as string) ||
            extractedSlides.slides_url_es ||
            cachedMatch?.slides_url_es ||
            undefined

          const examDriveUrl =
            (item.exam_drive_url as string) ||
            extractedExamDriveUrl ||
            cachedMatch?.exam_drive_url ||
            undefined

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
            slides_url: slidesUrl,
            slides_url_pt: slidesUrlPt,
            slides_url_en: slidesUrlEn,
            slides_url_es: slidesUrlEs,
            exam_drive_url: examDriveUrl,
            exam_drive_url_pt: (item.exam_drive_url_pt as string) || examDriveUrl || undefined,
            exam_drive_url_en: (item.exam_drive_url_en as string) || cachedMatch?.exam_drive_url_en || undefined,
            exam_drive_url_es: (item.exam_drive_url_es as string) || cachedMatch?.exam_drive_url_es || undefined,
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
   * Faz upload de arquivo de apresentação (.pptx, .ppsx ou .pdf) para o Supabase Storage no bucket 'lesson-materials'
   */
  async uploadLessonSlides(file: File): Promise<{
    url: string
    name: string
    error?: string
  }> {
    const fileExt = file.name.split('.').pop() || 'pptx'
    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40)
    const fileName = `slides_${Date.now()}_${cleanBaseName}.${fileExt}`
    const filePath = `slides/${fileName}`

    try {
      let contentType = 'application/octet-stream'
      const lower = file.name.toLowerCase()
      if (lower.endsWith('.pdf')) {
        contentType = 'application/pdf'
      } else if (lower.endsWith('.pptx')) {
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      } else if (lower.endsWith('.ppt') || lower.endsWith('.ppsx')) {
        contentType = 'application/vnd.ms-powerpoint'
      }

      const { error } = await supabase.storage
        .from('lesson-materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType,
        })

      if (error) {
        console.warn('Aviso Supabase Storage ao enviar slides:', error)
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
      console.error('Falha no upload de slides para o Supabase Storage:', err)
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
    const contentWithExam = embedExamDriveInContent(contentWithLinks, dto.exam_drive_url)
    const contentWithAll = embedSlidesInContent(contentWithExam, {
      slides_url: dto.slides_url || dto.slides_url_pt,
      slides_url_pt: dto.slides_url_pt || dto.slides_url,
      slides_url_en: dto.slides_url_en,
      slides_url_es: dto.slides_url_es,
    })

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
      slides_url: dto.slides_url || dto.slides_url_pt,
      slides_url_pt: dto.slides_url_pt || dto.slides_url,
      slides_url_en: dto.slides_url_en,
      slides_url_es: dto.slides_url_es,
      exam_drive_url: dto.exam_drive_url,
      exam_drive_url_pt: dto.exam_drive_url_pt || dto.exam_drive_url,
      exam_drive_url_en: dto.exam_drive_url_en,
      exam_drive_url_es: dto.exam_drive_url_es,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      // Tenta gravar com todas as colunas; se não existirem, grava dentro do content estruturado
      const insertPayload: Record<string, unknown> = {
        title: dto.title.trim(),
        content: contentWithAll,
        youtube_url: dto.video_url.trim(),
        sequence_order: dto.sequence_order,
        discipline_id: dto.discipline_id || 'disc-03',
        pdf_url: dto.pdf_url || null,
        pdf_name: dto.pdf_name || null,
      }
      if (dto.course_id) {
        insertPayload.course_id = dto.course_id
      }
      if (dto.duration_minutes) {
        insertPayload.duration_minutes = dto.duration_minutes
      }
      if (dto.useful_links && dto.useful_links.length > 0) {
        insertPayload.useful_links = dto.useful_links
      }
      if (dto.slides_url || dto.slides_url_pt) {
        insertPayload.slides_url = dto.slides_url || dto.slides_url_pt
        insertPayload.slides_url_pt = dto.slides_url_pt || dto.slides_url
      }
      if (dto.slides_url_en) {
        insertPayload.slides_url_en = dto.slides_url_en
      }
      if (dto.slides_url_es) {
        insertPayload.slides_url_es = dto.slides_url_es
      }
      if (dto.exam_drive_url) {
        insertPayload.exam_drive_url = dto.exam_drive_url.trim()
      }

      let { data, error } = await supabase
        .from('lessons')
        .insert([insertPayload])
        .select()
        .single()

      if (error && (error.code === '42703' || error.message?.includes('exam_drive_url'))) {
        delete insertPayload.exam_drive_url
        const retry = await supabase
          .from('lessons')
          .insert([insertPayload])
          .select()
          .single()
        data = retry.data
        error = retry.error
      }

      if (error && (error.code === '42703' || error.message?.includes('slides_url'))) {
        delete insertPayload.slides_url
        delete insertPayload.slides_url_pt
        delete insertPayload.slides_url_en
        delete insertPayload.slides_url_es
        const retry = await supabase
          .from('lessons')
          .insert([insertPayload])
          .select()
          .single()
        data = retry.data
        error = retry.error
      }

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

      if (error && (error.code === '42703' || error.message?.includes('youtube_url'))) {
        delete insertPayload.youtube_url
        insertPayload.video_url = dto.video_url.trim()
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
    const updated = [newLesson, ...list]
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
    const effectiveExamDrive =
      dto.exam_drive_url !== undefined ? dto.exam_drive_url : existing?.exam_drive_url
    const contentWithExam = embedExamDriveInContent(contentWithLinks, effectiveExamDrive)
    const contentWithAll = embedSlidesInContent(contentWithExam, {
      slides_url: dto.slides_url !== undefined ? dto.slides_url : existing?.slides_url,
      slides_url_pt: dto.slides_url_pt !== undefined ? dto.slides_url_pt : existing?.slides_url_pt,
      slides_url_en: dto.slides_url_en !== undefined ? dto.slides_url_en : existing?.slides_url_en,
      slides_url_es: dto.slides_url_es !== undefined ? dto.slides_url_es : existing?.slides_url_es,
    })

    const updatePayload: Record<string, unknown> = {}
    if (dto.title !== undefined) updatePayload.title = dto.title.trim()
    if (
      dto.content_text !== undefined ||
      dto.useful_links !== undefined ||
      dto.slides_url !== undefined ||
      dto.slides_url_pt !== undefined ||
      dto.slides_url_en !== undefined ||
      dto.slides_url_es !== undefined ||
      dto.exam_drive_url !== undefined
    ) {
      updatePayload.content = contentWithAll
    }
    if (dto.video_url !== undefined) updatePayload.youtube_url = dto.video_url.trim()
    if (dto.sequence_order !== undefined) updatePayload.sequence_order = dto.sequence_order
    if (dto.discipline_id !== undefined) updatePayload.discipline_id = dto.discipline_id
    if (dto.course_id !== undefined) updatePayload.course_id = dto.course_id
    if (dto.duration_minutes !== undefined) updatePayload.duration_minutes = dto.duration_minutes
    if (dto.pdf_url !== undefined) updatePayload.pdf_url = dto.pdf_url || null
    if (dto.pdf_name !== undefined) updatePayload.pdf_name = dto.pdf_name || null
    if (dto.useful_links !== undefined) {
      updatePayload.useful_links = dto.useful_links
    }
    if (dto.slides_url !== undefined || dto.slides_url_pt !== undefined) {
      updatePayload.slides_url = dto.slides_url || dto.slides_url_pt || null
      updatePayload.slides_url_pt = dto.slides_url_pt || dto.slides_url || null
    }
    if (dto.slides_url_en !== undefined) {
      updatePayload.slides_url_en = dto.slides_url_en || null
    }
    if (dto.slides_url_es !== undefined) {
      updatePayload.slides_url_es = dto.slides_url_es || null
    }
    if (dto.exam_drive_url !== undefined) {
      updatePayload.exam_drive_url = dto.exam_drive_url?.trim() || null
    }

    try {
      let { error } = await supabase
        .from('lessons')
        .update(updatePayload)
        .eq('id', id)

      if (error && (error.code === '42703' || error.message?.includes('exam_drive_url')) && updatePayload.exam_drive_url !== undefined) {
        delete updatePayload.exam_drive_url
        const retry = await supabase
          .from('lessons')
          .update(updatePayload)
          .eq('id', id)
        error = retry.error
      }

      if (error && (error.code === '42703' || error.message?.includes('slides_url'))) {
        delete updatePayload.slides_url
        delete updatePayload.slides_url_pt
        delete updatePayload.slides_url_en
        delete updatePayload.slides_url_es
        const retry = await supabase
          .from('lessons')
          .update(updatePayload)
          .eq('id', id)
        error = retry.error
      }

      if (error && (error.code === '42703' || error.message?.includes('useful_links')) && updatePayload.useful_links !== undefined) {
        delete updatePayload.useful_links
        const retry = await supabase
          .from('lessons')
          .update(updatePayload)
          .eq('id', id)
        error = retry.error
      }

      if (error && (error.code === '42703' || error.message?.includes('youtube_url')) && updatePayload.youtube_url !== undefined) {
        delete updatePayload.youtube_url
        updatePayload.video_url = dto.video_url?.trim()
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
        slides_url: dto.slides_url !== undefined ? dto.slides_url : existing?.slides_url,
        slides_url_pt: dto.slides_url_pt !== undefined ? dto.slides_url_pt : existing?.slides_url_pt,
        slides_url_en: dto.slides_url_en !== undefined ? dto.slides_url_en : existing?.slides_url_en,
        slides_url_es: dto.slides_url_es !== undefined ? dto.slides_url_es : existing?.slides_url_es,
        exam_drive_url: dto.exam_drive_url !== undefined ? dto.exam_drive_url : existing?.exam_drive_url,
        exam_drive_url_pt: dto.exam_drive_url_pt !== undefined ? dto.exam_drive_url_pt : existing?.exam_drive_url_pt,
        exam_drive_url_en: dto.exam_drive_url_en !== undefined ? dto.exam_drive_url_en : existing?.exam_drive_url_en,
        exam_drive_url_es: dto.exam_drive_url_es !== undefined ? dto.exam_drive_url_es : existing?.exam_drive_url_es,
        video_youtube_id: youtubeId,
        updated_at: new Date().toISOString(),
      }
      list[index] = updated
    } else {
      updated = {
        id,
        course_id: dto.course_id || existing?.course_id || '',
        discipline_id: dto.discipline_id || existing?.discipline_id || '',
        title: dto.title || existing?.title || 'Aula Atualizada',
        sequence_order: dto.sequence_order || existing?.sequence_order || 1,
        duration_minutes: dto.duration_minutes || existing?.duration_minutes || 20,
        content_text: effectiveContent,
        video_url: dto.video_url || existing?.video_url || '',
        video_youtube_id: youtubeId,
        materials: dto.materials || existing?.materials || [],
        pdf_url: dto.pdf_url ?? existing?.pdf_url,
        pdf_name: dto.pdf_name ?? existing?.pdf_name,
        useful_links: effectiveLinks,
        slides_url: dto.slides_url || dto.slides_url_pt || existing?.slides_url,
        slides_url_pt: dto.slides_url_pt || dto.slides_url || existing?.slides_url_pt,
        slides_url_en: dto.slides_url_en || existing?.slides_url_en,
        slides_url_es: dto.slides_url_es || existing?.slides_url_es,
        exam_drive_url: dto.exam_drive_url !== undefined ? dto.exam_drive_url : existing?.exam_drive_url,
        exam_drive_url_pt: dto.exam_drive_url_pt || dto.exam_drive_url || existing?.exam_drive_url_pt,
        exam_drive_url_en: dto.exam_drive_url_en || existing?.exam_drive_url_en,
        exam_drive_url_es: dto.exam_drive_url_es || existing?.exam_drive_url_es,
        created_at: existing?.created_at || new Date().toISOString(),
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
