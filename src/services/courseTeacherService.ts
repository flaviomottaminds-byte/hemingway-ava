import { supabase } from '../lib/supabase'
import { teamService } from './teamService'
import type { SupabaseTeamProfile } from '../types'

const STORAGE_KEY = 'ava_course_teachers'

export interface CourseTeacherLink {
  course_id: string
  teacher_id: string
}

class CourseTeacherService {
  private loadLinks(): CourseTeacherLink[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Erro ao carregar vínculos de professores:', e)
    }
    return []
  }

  private saveLinks(links: CourseTeacherLink[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
    } catch (e) {
      console.error('Erro ao salvar vínculos de professores:', e)
    }
  }

  /**
   * Retorna os IDs dos professores vinculados a um curso
   */
  async getTeacherIdsForCourse(courseId: string): Promise<string[]> {
    const local = this.loadLinks()
      .filter((link) => link.course_id === courseId)
      .map((link) => link.teacher_id)

    try {
      // Tenta consultar na tabela enrollments com role = teacher ou similar se existir
      const { data, error } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('course_id', courseId)
        .eq('status', 'teacher')

      if (!error && data && data.length > 0) {
        const remoteIds = data.map((d: any) => String(d.student_id))
        const merged = Array.from(new Set([...local, ...remoteIds]))
        return merged
      }
    } catch {
      // Fallback transparente
    }

    return local
  }

  /**
   * Retorna os perfis completos dos professores vinculados a um determinado curso
   */
  async getTeachersForCourse(courseId: string): Promise<SupabaseTeamProfile[]> {
    const teacherIds = await this.getTeacherIdsForCourse(courseId)
    if (teacherIds.length === 0) return []

    const allMembers = await teamService.getTeamMembers()
    const idSet = new Set(teacherIds)
    return allMembers.filter((m) => idSet.has(m.id))
  }

  /**
   * Retorna todos os IDs de cursos aos quais um professor está vinculado
   */
  async getCoursesForTeacher(teacherId: string): Promise<string[]> {
    const local = this.loadLinks()
      .filter((link) => link.teacher_id === teacherId)
      .map((link) => link.course_id)

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', teacherId)
        .eq('status', 'teacher')

      if (!error && data && data.length > 0) {
        const remoteCourseIds = data.map((d: any) => String(d.course_id))
        return Array.from(new Set([...local, ...remoteCourseIds]))
      }
    } catch {
      // Fallback
    }

    return local
  }

  /**
   * Define e substitui os professores vinculados a um curso
   */
  async setTeachersForCourse(courseId: string, teacherIds: string[]): Promise<void> {
    const current = this.loadLinks().filter((l) => l.course_id !== courseId)
    const newLinks = teacherIds.map((tid) => ({
      course_id: courseId,
      teacher_id: tid,
    }))

    const updated = [...current, ...newLinks]
    this.saveLinks(updated)

    // Tenta persistir no Supabase (em enrollments com status = 'teacher')
    try {
      // Remove vínculos anteriores do curso com status teacher
      await supabase
        .from('enrollments')
        .delete()
        .eq('course_id', courseId)
        .eq('status', 'teacher')

      if (teacherIds.length > 0) {
        const payloads = teacherIds.map((tid) => ({
          course_id: courseId,
          student_id: tid,
          status: 'teacher',
        }))
        await supabase.from('enrollments').insert(payloads)
      }
    } catch {
      // Se RLS ou tabela não aceitar, a persistência local garante o funcionamento
    }
  }

  /**
   * Verifica se o professor tem acesso/está vinculado ao curso
   */
  async isTeacherAssigned(teacherId: string, courseId: string): Promise<boolean> {
    const courses = await this.getCoursesForTeacher(teacherId)
    return courses.includes(courseId)
  }
}

export const courseTeacherService = new CourseTeacherService()
