import type { SupabaseTeamProfile, TeamRole, TeamMemberStatus } from '../types'
import { supabase } from '../lib/supabase'

const STORAGE_KEY_TEAM = 'ava_supabase_team_profiles'

const INITIAL_TEAM: SupabaseTeamProfile[] = [
  {
    id: 'team-01',
    name: 'Dra. Elena Vasquez',
    email: 'elena.vasquez@aprendeusa.org',
    phone: '+1 (407) 555-0101',
    role: 'admin',
    status: 'active',
    document_type: 'Passaporte',
    document_number: 'USA-7749201',
    avatar_url:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    temporary_password: 'Admin2026@Elena',
    created_at: '2025-10-01T08:00:00Z',
  },
  {
    id: 'team-02',
    name: 'Prof. Marcus Vance',
    email: 'marcus.vance@aprendeusa.org',
    phone: '+1 (305) 555-0102',
    role: 'coordinator',
    status: 'active',
    document_type: 'Driver License',
    document_number: 'FL-DL-883921',
    avatar_url:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    temporary_password: 'Coord2026@Marcus',
    created_at: '2025-11-15T09:30:00Z',
  },
  {
    id: 'team-03',
    name: 'Prof. Leonardo Dias',
    email: 'leonardo.dias@aprendeusa.org',
    phone: '+1 (617) 555-0103',
    role: 'teacher',
    status: 'active',
    document_type: 'ITIN / Passaporte',
    document_number: '987-65-4321',
    avatar_url:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    assigned_discipline_ids: ['disc-01', 'disc-02'],
    temporary_password: 'Prof2026@Leo',
    created_at: '2025-12-01T10:00:00Z',
  },
  {
    id: 'team-04',
    name: 'Mariana Gomez',
    email: 'mariana.gomez@aprendeusa.org',
    phone: '+1 (713) 555-0104',
    role: 'teacher',
    status: 'active',
    document_type: 'Passaporte',
    document_number: 'BRA-3392019',
    avatar_url:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
    assigned_discipline_ids: ['disc-03', 'disc-04', 'disc-08'],
    temporary_password: 'Prof2026@Mari',
    created_at: '2026-01-10T14:20:00Z',
  },
  {
    id: 'team-05',
    name: 'Camila Prado',
    email: 'camila.prado@aprendeusa.org',
    phone: '+1 (404) 555-0105',
    role: 'support',
    status: 'active',
    document_type: 'ID Estadual',
    document_number: 'GA-9920139',
    avatar_url:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    temporary_password: 'Sup2026@Camila',
    created_at: '2026-01-18T11:45:00Z',
  },
]

export interface CreateTeamMemberDTO {
  name: string
  email: string
  phone: string
  role: TeamRole
  status?: TeamMemberStatus
  document_type?: string
  document_number?: string
  temporary_password?: string
  assigned_discipline_ids?: string[]
  avatar_url?: string
}

class SupabaseTeamService {
  private loadTeam(): SupabaseTeamProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TEAM)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Erro ao carregar equipe do localStorage:', e)
    }
    this.saveTeam(INITIAL_TEAM)
    return INITIAL_TEAM
  }

  private saveTeam(items: SupabaseTeamProfile[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(items))
    } catch (e) {
      console.error('Erro ao salvar equipe no localStorage:', e)
    }
  }

  /**
   * Executa SELECT * FROM profiles no Supabase real
   */
  async getTeamMembers(filter?: {
    role?: TeamRole | 'all'
    status?: TeamMemberStatus | 'all'
    query?: string
  }): Promise<SupabaseTeamProfile[]> {
    try {
      const { data, error } = await supabase.from('profiles').select('*')

      if (!error && data && data.length > 0) {
        // Mapeia perfis do Supabase: id, name, email, role, document_type, document_number, created_at
        const mapped: SupabaseTeamProfile[] = data.map((item: Record<string, unknown>, idx: number) => {
          const rawRole = String(item.role || '').toLowerCase()
          let role: TeamRole = 'teacher'
          if (rawRole === 'admin') role = 'admin'
          else if (rawRole === 'aluno' || rawRole === 'student') role = 'support'
          else if (rawRole === 'professor' || rawRole === 'teacher') role = 'teacher'
          else if (rawRole === 'coordinator') role = 'coordinator'

          return {
            id: String(item.id || `profile-${idx}`),
            name: String(item.name || 'Usuário Sem Nome'),
            email: String(item.email || ''),
            phone: String(item.phone || '+1 (407) 555-0100'),
            role,
            status: 'active',
            document_type: String(item.document_type || 'Passaporte'),
            document_number: String(item.document_number || 'DOC-2026'),
            avatar_url:
              String(item.avatar_url || '') ||
              `https://images.unsplash.com/photo-${1534528741775 + (idx * 50)}?auto=format&fit=crop&w=250&q=80`,
            created_at: String(item.created_at || new Date().toISOString()),
          }
        })

        this.saveTeam(mapped)
        let list = mapped
        if (filter?.role && filter.role !== 'all') {
          list = list.filter((m) => m.role === filter.role)
        }
        if (filter?.query?.trim()) {
          const q = filter.query.trim().toLowerCase()
          list = list.filter(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              m.email.toLowerCase().includes(q) ||
              (m.document_number && m.document_number.toLowerCase().includes(q)),
          )
        }
        return list
      }
    } catch (err) {
      console.warn('Erro ao consultar profiles do Supabase:', err)
    }

    // Fallback local
    let list = this.loadTeam()
    if (filter?.role && filter.role !== 'all') {
      list = list.filter((m) => m.role === filter.role)
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter((m) => m.status === filter.status)
    }
    if (filter?.query?.trim()) {
      const q = filter.query.trim().toLowerCase()
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q),
      )
    }
    return list
  }

  /**
   * Executa INSERT real na tabela profiles do Supabase
   */
  async createMember(dto: CreateTeamMemberDTO): Promise<{
    member: SupabaseTeamProfile
    isLive: boolean
    error: string | null
  }> {
    const newMember: SupabaseTeamProfile = {
      id: `team-${Date.now().toString(36)}`,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      role: dto.role,
      status: dto.status || 'active',
      document_type: dto.document_type?.trim() || 'Passaporte',
      document_number: dto.document_number?.trim() || 'DOC-2026',
      temporary_password: dto.temporary_password || 'Acesso2026@AVA',
      assigned_discipline_ids:
        dto.role === 'teacher' ? dto.assigned_discipline_ids || [] : undefined,
      avatar_url:
        dto.avatar_url ||
        `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 5000)}?auto=format&fit=crop&w=250&q=80`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let isLive = false
    let errorMsg: string | null = null

    try {
      const roleInDb =
        dto.role === 'admin'
          ? 'admin'
          : dto.role === 'support'
          ? 'aluno'
          : 'professor'

      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            name: dto.name.trim(),
            email: dto.email.trim().toLowerCase(),
            role: roleInDb,
            document_type: dto.document_type?.trim() || 'Passaporte',
            document_number: dto.document_number?.trim() || 'DOC-2026',
          },
        ])
        .select()
        .single()

      if (error) {
        console.warn('Erro ao inserir profile no Supabase:', error)
        errorMsg = `Erro Supabase (${error.code || 'INSERT'}): ${error.message}`
      } else {
        isLive = true
        if (data?.id) newMember.id = String(data.id)
      }
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : 'Falha na conexão com Supabase'
    }

    const list = this.loadTeam()
    this.saveTeam([newMember, ...list])
    return { member: newMember, isLive, error: errorMsg }
  }

  /**
   * Executa UPDATE real na tabela profiles do Supabase
   * Atualiza role (admin, professor, aluno), document_type e document_number
   */
  async updateMember(
    id: string,
    dto: Partial<CreateTeamMemberDTO>,
  ): Promise<{ member: SupabaseTeamProfile; isLive: boolean; error: string | null }> {
    let isLive = false
    let errorMsg: string | null = null

    try {
      const roleInDb =
        dto.role === 'admin'
          ? 'admin'
          : dto.role === 'support'
          ? 'aluno'
          : dto.role === 'teacher' || dto.role === 'coordinator'
          ? 'professor'
          : undefined

      const updatePayload: Record<string, unknown> = {}
      if (dto.name !== undefined) updatePayload.name = dto.name.trim()
      if (roleInDb !== undefined) updatePayload.role = roleInDb
      if (dto.document_type !== undefined) updatePayload.document_type = dto.document_type.trim()
      if (dto.document_number !== undefined) updatePayload.document_number = dto.document_number.trim()

      const { error } = await supabase.from('profiles').update(updatePayload).eq('id', id)
      if (error) {
        errorMsg = `Erro Supabase (${error.code || 'UPDATE'}): ${error.message}`
      } else {
        isLive = true
      }
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : 'Falha ao atualizar no Supabase'
    }

    const list = this.loadTeam()
    const index = list.findIndex((m) => m.id === id)
    if (index === -1) {
      throw new Error(`Membro de equipe com id ${id} não encontrado.`)
    }

    const current = list[index]
    const updatedMember: SupabaseTeamProfile = {
      ...current,
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
      ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.document_type !== undefined && { document_type: dto.document_type.trim() }),
      ...(dto.document_number !== undefined && { document_number: dto.document_number.trim() }),
      ...(dto.status !== undefined && { status: dto.status }),
      updated_at: new Date().toISOString(),
    }

    list[index] = updatedMember
    this.saveTeam(list)
    return { member: updatedMember, isLive, error: errorMsg }
  }

  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const list = this.loadTeam()
    const index = list.findIndex((m) => m.id === id)
    if (index === -1) return false

    list[index] = {
      ...list[index],
      temporary_password: newPassword,
      updated_at: new Date().toISOString(),
    }
    this.saveTeam(list)
    return true
  }

  async toggleMemberStatus(id: string): Promise<SupabaseTeamProfile> {
    const list = this.loadTeam()
    const index = list.findIndex((m) => m.id === id)
    if (index === -1) throw new Error('Membro não encontrado.')

    const newStatus: TeamMemberStatus =
      list[index].status === 'active' ? 'inactive' : 'active'
    list[index] = {
      ...list[index],
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    this.saveTeam(list)
    return list[index]
  }

  async deleteMember(id: string): Promise<boolean> {
    try {
      await supabase.from('profiles').delete().eq('id', id)
    } catch (err) {
      console.warn('Erro ao excluir profile no Supabase:', err)
    }
    const list = this.loadTeam()
    this.saveTeam(list.filter((m) => m.id !== id))
    return true
  }

  resetDefaults(): void {
    this.saveTeam(INITIAL_TEAM)
  }
}

export const teamService = new SupabaseTeamService()
