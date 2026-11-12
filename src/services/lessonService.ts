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

const INITIAL_LESSONS: SupabaseLesson[] = [
  {
    id: 'les-01',
    course_id: 'crs-real-01',
    discipline_id: 'disc-03',
    title: 'Compreendendo o Formulário W-2, 1099 e Direitos no Trabalho',
    sequence_order: 1,
    duration_minutes: 24,
    content_text: `## 📘 Introdução ao Mercado de Trabalho Norte-Americano

Nesta aula fundamental, desmistificaremos os dois principais modelos de contratação nos Estados Unidos: o **Formulário W-2** (Employee / Trabalhador Formal) e o **Formulário 1099** (Independent Contractor / Prestador Autônomo).

### 1. O que é o Formulário W-2?
O formulário W-2 é utilizado quando você é contratado como funcionário regular da empresa.
- **Retenção de Impostos:** O empregador desconta impostos federais (Federal Income Tax), estaduais e a taxa FICA (Social Security e Medicare) diretamente do seu contracheque (paystub).
- **Direitos Garantidos:** Você tem direito ao pagamento de horas extras (overtime após 40 horas semanais com valor de 1.5x da sua remuneração base) e cobertura de seguro contra acidentes de trabalho (Workers' Compensation).

### 2. O que é o Formulário 1099?
O formulário 1099 é destinado a autônomos e freelancers.
- Não há retenção na fonte: você é responsável por recolher o imposto de trabalho autônomo (Self-Employment Tax - 15.3%).
- Maior flexibilidade de horário, porém sem os benefícios trabalhistas típicos do W-2.

> **Importante:** A Lei de Padrões Justos de Trabalho (FLSA) protege todo trabalhador nos EUA, independente de status imigratório. Se você trabalhou, o empregador tem a obrigação legal de pagar o seu salário integralmente.`,
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    video_youtube_id: 'dQw4w9WgXcQ',
    materials: [
      {
        id: 'mat-1',
        name: 'Guia_Pratico_W2_vs_1099_Imigrante.pdf',
        size: '2.4 MB',
        type: 'pdf',
        url: '#',
      },
      {
        id: 'mat-2',
        name: 'Glossario_Termos_Trabalhistas_USA.pdf',
        size: '1.2 MB',
        type: 'pdf',
        url: '#',
      },
    ],
    created_at: '2026-02-05T10:00:00Z',
    updated_at: '2026-02-10T15:20:00Z',
  },
  {
    id: 'les-02',
    course_id: 'crs-real-01',
    discipline_id: 'disc-03',
    title: 'Cálculo de Overtime (Horas Extras) e Salário Mínimo Federal',
    sequence_order: 2,
    duration_minutes: 30,
    content_text: `## ⏱️ Regras de Salário Mínimo e Overtime (FLSA)

Neste estudo, você aprenderá como calcular com exatidão o pagamento das suas horas extras e identificar infrações trabalhistas frequentes.

### Horas Extras (Overtime)
A regra geral da Lei FLSA estabelece que todas as horas trabalhadas além de **40 horas por semana** devem ser remuneradas com um acréscimo de no mínimo **50% (Time and a Half)** sobre a sua hora base.`,
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    video_youtube_id: 'dQw4w9WgXcQ',
    materials: [
      {
        id: 'mat-3',
        name: 'Planilha_Controle_Horas_Trabalhadas.pdf',
        size: '850 KB',
        type: 'pdf',
        url: '#',
      },
    ],
    created_at: '2026-02-08T14:00:00Z',
  },
]

export interface CreateLessonDTO {
  course_id: string
  discipline_id: string
  title: string
  sequence_order: number
  duration_minutes: number
  content_text: string
  video_url: string
  materials: LessonAttachment[]
}

class SupabaseLessonService {
  private loadLessons(): SupabaseLesson[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LESSONS)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Erro ao carregar lições do localStorage:', e)
    }
    this.saveLessons(INITIAL_LESSONS)
    return INITIAL_LESSONS
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

      if (data && data.length > 0) {
        const mapped: SupabaseLesson[] = data.map((item: Record<string, unknown>, idx: number) => {
          const videoUrl =
            String(item.youtube_url || item.video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
          const youtubeId = extractYouTubeId(videoUrl) || undefined
          return {
            id: String(item.id || `les-supa-${idx}`),
            course_id: String(item.course_id || 'crs-real-01'),
            discipline_id: String(item.discipline_id || 'disc-03'),
            title: String(
              item.title || 'Compreendendo o Formulário W-2, 1099 e Direitos no Trabalho',
            ),
            sequence_order: Number(item.sequence_order || idx + 1),
            duration_minutes: Number(item.duration_minutes || 24),
            content_text: String(
              item.content || item.content_text || INITIAL_LESSONS[0].content_text,
            ),
            video_url: videoUrl,
            video_youtube_id: youtubeId,
            materials: INITIAL_LESSONS[0].materials,
            created_at: String(item.created_at || new Date().toISOString()),
          }
        })
        this.saveLessons(mapped)
        return { data: mapped, isLive: true, error: null }
      }

      return {
        data: this.loadLessons(),
        isLive: false,
        error:
          'Tabela lessons retornou 0 registros visíveis via chave anon. Verifique as políticas de RLS.',
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      // Colunas reais no banco: id, title, content, youtube_url, sequence_order, discipline_id
      const insertPayload = {
        title: dto.title.trim(),
        content: dto.content_text,
        youtube_url: dto.video_url.trim(),
        sequence_order: dto.sequence_order,
        discipline_id: dto.discipline_id || 'disc-03',
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
    try {
      await supabase
        .from('lessons')
        .update({
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(dto.content_text !== undefined && { content: dto.content_text }),
          ...(dto.video_url !== undefined && { youtube_url: dto.video_url.trim() }),
          ...(dto.sequence_order !== undefined && { sequence_order: dto.sequence_order }),
        })
        .eq('id', id)
    } catch (err) {
      console.warn('Erro ao atualizar aula no Supabase:', err)
    }

    const list = this.loadLessons()
    const index = list.findIndex((l) => l.id === id)
    if (index === -1) throw new Error('Aula não encontrada.')

    const youtubeId = dto.video_url
      ? extractYouTubeId(dto.video_url) || undefined
      : list[index].video_youtube_id

    const updated = {
      ...list[index],
      ...dto,
      video_youtube_id: youtubeId,
      updated_at: new Date().toISOString(),
    }
    list[index] = updated
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
