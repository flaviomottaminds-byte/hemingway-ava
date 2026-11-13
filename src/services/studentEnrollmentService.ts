import type {
  SupabaseStudent,
  SupabaseEnrollment,
  SupabaseCourse,
  StudentStatus,
  EnrollmentStatus,
} from '../types'
import { courseService } from './courseService'
import { supabase } from '../lib/supabase'

const STORAGE_KEY_STUDENTS = 'ava_supabase_students_directory'
const STORAGE_KEY_ENROLLMENTS = 'ava_supabase_enrollments'

// Inicialização limpa (sem dados fictícios fixos)
const INITIAL_STUDENTS: SupabaseStudent[] = []
const INITIAL_ENROLLMENTS: SupabaseEnrollment[] = []

export interface CreateStudentDTO {
  name: string
  email: string
  document_id: string
  phone: string
  temporary_password?: string
  status?: StudentStatus
  avatar_url?: string
}

export interface EnrolledCourseView {
  enrollment: SupabaseEnrollment
  course: SupabaseCourse
}

class StudentEnrollmentService {
  private loadStudents(): SupabaseStudent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STUDENTS)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Erro ao carregar diretório de estudantes:', e)
    }
    return []
  }

  private saveStudents(items: SupabaseStudent[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(items))
    } catch (e) {
      console.error('Erro ao salvar estudantes no localStorage:', e)
    }
  }

  private loadEnrollments(): SupabaseEnrollment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ENROLLMENTS)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Erro ao carregar matrículas:', e)
    }
    return []
  }

  private saveEnrollments(items: SupabaseEnrollment[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ENROLLMENTS, JSON.stringify(items))
    } catch (e) {
      console.error('Erro ao salvar matrículas no localStorage:', e)
    }
  }

  /**
   * Consulta alunos reais na tabela profiles com role = 'aluno' no Supabase
   */
  async getStudents(query?: string): Promise<SupabaseStudent[]> {
    let list: SupabaseStudent[] = []

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'aluno')

      if (!error && data) {
        if (data.length === 0) {
          list = this.loadStudents()
        } else {
          list = data.map((item: Record<string, unknown>, idx: number) => {
            return {
              id: String(item.id || `std-${idx}`),
              name: String(item.name || 'Aluno Sem Nome'),
              email: String(item.email || ''),
              document_id: String(item.document_number || item.document_id || 'DOC-USA-2026'),
              document_type: String(item.document_type || 'Passaporte'),
              document_number: String(item.document_number || item.document_id || ''),
              phone: String(item.phone || '+1 (407) 555-0100'),
              avatar_url:
                String(item.avatar_url || '') ||
                `https://images.unsplash.com/photo-${1534528741775 + idx * 50}?auto=format&fit=crop&w=250&q=80`,
              status: (item.status as StudentStatus) || 'active',
              temporary_password: String(item.temporary_password || 'Pass2026@Aluno'),
              created_at: String(item.created_at || new Date().toISOString()),
            }
          })
          this.saveStudents(list)
        }
      } else {
        if (error) {
          console.warn('Supabase profiles (aluno) warning:', error)
        }
        list = this.loadStudents()
      }
    } catch (err) {
      console.warn('Falha na consulta ao Supabase profiles:', err)
      list = this.loadStudents()
    }

    if (query?.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.document_id.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q),
      )
    }
    return list
  }

  /**
   * Grava novo aluno executando INSERT na tabela profiles com role = 'aluno'
   */
  async createStudent(dto: CreateStudentDTO): Promise<SupabaseStudent> {
    const list = this.loadStudents()

    const newStudent: SupabaseStudent = {
      id: `std-${Date.now().toString(36)}`,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      document_id: dto.document_id.trim(),
      document_type: 'Passaporte',
      document_number: dto.document_id.trim(),
      phone: dto.phone.trim(),
      status: dto.status || 'active',
      temporary_password: dto.temporary_password || 'Pass2026@Aluno',
      avatar_url:
        dto.avatar_url?.trim() ||
        `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 5000)}?auto=format&fit=crop&w=250&q=80`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            name: dto.name.trim(),
            email: dto.email.trim().toLowerCase(),
            role: 'aluno',
            document_type: 'Passaporte',
            document_number: dto.document_id.trim(),
          },
        ])
        .select()
        .single()

      if (!error && data) {
        newStudent.id = String(data.id || newStudent.id)
      } else if (error) {
        console.warn('Erro ao inserir aluno no Supabase profiles:', error)
      }
    } catch (err) {
      console.warn('Falha na requisição ao Supabase profiles:', err)
    }

    const updated = [newStudent, ...list]
    this.saveStudents(updated)
    return newStudent
  }

  /**
   * Atualiza aluno em profiles no Supabase
   */
  async updateStudent(
    id: string,
    dto: Partial<CreateStudentDTO>,
  ): Promise<SupabaseStudent> {
    const list = this.loadStudents()
    const index = list.findIndex((s) => s.id === id)
    if (index === -1) {
      throw new Error(`Estudante com id ${id} não encontrado.`)
    }

    try {
      const updatePayload: Record<string, unknown> = {}
      if (dto.name) updatePayload.name = dto.name.trim()
      if (dto.email) updatePayload.email = dto.email.trim().toLowerCase()
      if (dto.document_id) {
        updatePayload.document_number = dto.document_id.trim()
      }

      if (Object.keys(updatePayload).length > 0) {
        await supabase.from('profiles').update(updatePayload).eq('id', id)
      }
    } catch (err) {
      console.warn('Aviso ao atualizar aluno no Supabase profiles:', err)
    }

    const current = list[index]
    const updatedStudent: SupabaseStudent = {
      ...current,
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
      ...(dto.document_id !== undefined && {
        document_id: dto.document_id.trim(),
        document_number: dto.document_id.trim(),
      }),
      ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.temporary_password !== undefined && {
        temporary_password: dto.temporary_password,
      }),
      ...(dto.avatar_url !== undefined && { avatar_url: dto.avatar_url }),
      updated_at: new Date().toISOString(),
    }

    list[index] = updatedStudent
    this.saveStudents(list)
    return updatedStudent
  }

  /**
   * Remove aluno do profiles e desmatricula de enrollments
   */
  async deleteStudent(id: string): Promise<boolean> {
    try {
      await supabase.from('enrollments').delete().eq('student_id', id)
      await supabase.from('profiles').delete().eq('id', id)
    } catch (err) {
      console.warn('Aviso ao excluir aluno do Supabase:', err)
    }

    const list = this.loadStudents()
    this.saveStudents(list.filter((s) => s.id !== id))

    // Remove matrículas vinculadas
    const enrollments = this.loadEnrollments()
    this.saveEnrollments(enrollments.filter((e) => e.student_id !== id))
    return true
  }

  /**
   * Consulta as matrículas do aluno trazendo os dados do curso vinculado:
   * supabase.from('enrollments').select('*').eq('student_id', studentId)
   */
  async getStudentEnrollments(studentId: string): Promise<EnrolledCourseView[]> {
    let enrollments: SupabaseEnrollment[] = []

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', studentId)

      if (!error && data) {
        if (data.length === 0) {
          enrollments = this.loadEnrollments().filter((e) => e.student_id === studentId)
        } else {
          enrollments = data.map((item: Record<string, unknown>, idx: number) => ({
            id: String(item.id || `enr-supa-${idx}`),
            student_id: String(item.student_id || studentId),
            course_id: String(item.course_id || ''),
            status: (item.status as EnrollmentStatus) || 'active',
            enrolled_at: String(item.enrolled_at || new Date().toISOString()),
          }))
        }
      } else {
        enrollments = this.loadEnrollments().filter((e) => e.student_id === studentId)
      }
    } catch (err) {
      console.warn('Aviso ao consultar Supabase enrollments:', err)
      enrollments = this.loadEnrollments().filter((e) => e.student_id === studentId)
    }

    const courses = await courseService.getCourses()
    const courseMap = new Map(courses.map((c) => [c.id, c]))

    const result: EnrolledCourseView[] = []
    for (const enr of enrollments) {
      const course = courseMap.get(enr.course_id)
      if (course) {
        result.push({ enrollment: enr, course })
      }
    }
    return result
  }

  /**
   * Matricular aluno em novo curso:
   * supabase.from('enrollments').insert({ student_id, course_id, status: 'active', enrolled_at })
   */
  async enrollStudent(
    studentId: string,
    courseId: string,
    status: EnrollmentStatus = 'active',
  ): Promise<{ enrollment: SupabaseEnrollment; supabaseError: string | null }> {
    const enrollments = this.loadEnrollments()

    // Verifica se já está matriculado localmente
    const existing = enrollments.find(
      (e) => e.student_id === studentId && e.course_id === courseId,
    )
    if (existing) {
      throw new Error('O aluno já está matriculado neste curso.')
    }

    const newEnrollment: SupabaseEnrollment = {
      id: `enr-${Date.now().toString(36)}`,
      student_id: studentId,
      course_id: courseId,
      status,
      enrolled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let supabaseError: string | null = null

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .insert([
          {
            student_id: studentId,
            course_id: courseId,
            status,
            enrolled_at: newEnrollment.enrolled_at,
          },
        ])
        .select()
        .single()

      if (!error && data) {
        newEnrollment.id = String(data.id || newEnrollment.id)
      } else if (error) {
        supabaseError = `Supabase (${error.code || 'INSERT'}): ${error.message}`
        console.warn('Erro ao inserir matrícula no Supabase:', error)
      }
    } catch (err: any) {
      supabaseError = err?.message || 'Falha na requisição ao Supabase'
      console.warn('Falha na requisição ao Supabase enrollments:', err)
    }

    const updated = [newEnrollment, ...enrollments]
    this.saveEnrollments(updated)
    return { enrollment: newEnrollment, supabaseError }
  }

  /**
   * Atualizar status da matrícula (Ativo, Concluído, Bloqueado)
   */
  async updateEnrollmentStatus(
    enrollmentId: string,
    newStatus: EnrollmentStatus,
  ): Promise<SupabaseEnrollment> {
    try {
      await supabase
        .from('enrollments')
        .update({ status: newStatus })
        .eq('id', enrollmentId)
    } catch (err) {
      console.warn('Aviso ao atualizar status no Supabase enrollments:', err)
    }

    const enrollments = this.loadEnrollments()
    const index = enrollments.findIndex((e) => e.id === enrollmentId)
    if (index === -1) {
      throw new Error(`Matrícula com id ${enrollmentId} não encontrada.`)
    }

    const current = enrollments[index]
    const updated: SupabaseEnrollment = {
      ...current,
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    enrollments[index] = updated
    this.saveEnrollments(enrollments)
    return updated
  }

  /**
   * Remover matrícula (desmatricular do curso):
   * supabase.from('enrollments').delete().eq('id', enrollmentId)
   */
  async removeEnrollment(enrollmentId: string): Promise<boolean> {
    try {
      await supabase.from('enrollments').delete().eq('id', enrollmentId)
    } catch (err) {
      console.warn('Aviso ao excluir matrícula do Supabase enrollments:', err)
    }

    const enrollments = this.loadEnrollments()
    const filtered = enrollments.filter((e) => e.id !== enrollmentId)
    this.saveEnrollments(filtered)
    return true
  }

  resetDefaults(): void {
    this.saveStudents(INITIAL_STUDENTS)
    this.saveEnrollments(INITIAL_ENROLLMENTS)
  }
}

export const studentEnrollmentService = new StudentEnrollmentService()
