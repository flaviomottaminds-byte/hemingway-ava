import type { StudentPerformanceRecord } from '../types'

const STORAGE_KEY_STUDENTS = 'ava_supabase_students_analytics'

const INITIAL_STUDENTS: StudentPerformanceRecord[] = [
  {
    id: 'std-01',
    name: 'Mateo Silva Santos',
    email: 'mateo.silva@exemplo.com',
    avatar_url:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    origin_country: 'Brasil 🇧🇷',
    current_state: 'Orlando, FL',
    enrolled_course_id: 'crs-102',
    enrolled_discipline_id: 'disc-03',
    progress_percentage: 85,
    average_grade: 9.2,
    last_access: 'Hoje às 14:15',
    completed_lessons: 10,
    total_lessons: 12,
    quizzes_taken: 4,
    status: 'active',
  },
  {
    id: 'std-02',
    name: 'Gabriela Ortiz Morales',
    email: 'gabriela.ortiz@exemplo.com',
    avatar_url:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
    origin_country: 'Colômbia 🇨🇴',
    current_state: 'Miami, FL',
    enrolled_course_id: 'crs-102',
    enrolled_discipline_id: 'disc-03',
    progress_percentage: 100,
    average_grade: 8.8,
    last_access: 'Hoje às 11:30',
    completed_lessons: 12,
    total_lessons: 12,
    quizzes_taken: 4,
    status: 'completed',
  },
  {
    id: 'std-03',
    name: 'Juan Carlos Ramirez',
    email: 'jc.ramirez@exemplo.com',
    avatar_url:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    origin_country: 'México 🇲🇽',
    current_state: 'Houston, TX',
    enrolled_course_id: 'crs-102',
    enrolled_discipline_id: 'disc-04',
    progress_percentage: 42,
    average_grade: 6.2,
    last_access: 'Há 4 dias',
    completed_lessons: 5,
    total_lessons: 12,
    quizzes_taken: 2,
    status: 'at_risk',
  },
  {
    id: 'std-04',
    name: 'Beatriz Albuquerque Lima',
    email: 'beatriz.lima@exemplo.com',
    avatar_url:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    origin_country: 'Brasil 🇧🇷',
    current_state: 'Boston, MA',
    enrolled_course_id: 'crs-101',
    enrolled_discipline_id: 'disc-01',
    progress_percentage: 75,
    average_grade: 9.5,
    last_access: 'Ontem às 19:40',
    completed_lessons: 14,
    total_lessons: 18,
    quizzes_taken: 5,
    status: 'active',
  },
  {
    id: 'std-05',
    name: 'Carlos Mendoza Vasquez',
    email: 'carlos.mendoza@exemplo.com',
    avatar_url:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    origin_country: 'Venezuela 🇻🇪',
    current_state: 'Atlanta, GA',
    enrolled_course_id: 'crs-101',
    enrolled_discipline_id: 'disc-02',
    progress_percentage: 92,
    average_grade: 8.4,
    last_access: 'Hoje às 09:10',
    completed_lessons: 16,
    total_lessons: 18,
    quizzes_taken: 6,
    status: 'active',
  },
  {
    id: 'std-06',
    name: 'Sofia Navarro Castillo',
    email: 'sofia.navarro@exemplo.com',
    avatar_url:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    origin_country: 'Peru 🇵🇪',
    current_state: 'Los Angeles, CA',
    enrolled_course_id: 'crs-103',
    enrolled_discipline_id: 'disc-06',
    progress_percentage: 30,
    average_grade: 5.8,
    last_access: 'Há 6 dias',
    completed_lessons: 3,
    total_lessons: 10,
    quizzes_taken: 1,
    status: 'at_risk',
  },
  {
    id: 'std-07',
    name: 'Lucas Ferreira Diniz',
    email: 'lucas.diniz@exemplo.com',
    avatar_url:
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80',
    origin_country: 'Brasil 🇧🇷',
    current_state: 'Newark, NJ',
    enrolled_course_id: 'crs-103',
    enrolled_discipline_id: 'disc-07',
    progress_percentage: 100,
    average_grade: 9.0,
    last_access: 'Há 1 dia',
    completed_lessons: 10,
    total_lessons: 10,
    quizzes_taken: 3,
    status: 'completed',
  },
  {
    id: 'std-08',
    name: 'Maria Elena Hernandez',
    email: 'maria.elena@exemplo.com',
    avatar_url:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    origin_country: 'Guatemala 🇬🇹',
    current_state: 'Chicago, IL',
    enrolled_course_id: 'crs-104',
    enrolled_discipline_id: 'disc-08',
    progress_percentage: 60,
    average_grade: 7.8,
    last_access: 'Hoje às 15:50',
    completed_lessons: 15,
    total_lessons: 25,
    quizzes_taken: 4,
    status: 'active',
  },
  {
    id: 'std-09',
    name: 'Rodrigo Gomez Alva',
    email: 'rodrigo.gomez@exemplo.com',
    avatar_url:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
    origin_country: 'Equador 🇪🇨',
    current_state: 'Queens, NY',
    enrolled_course_id: 'crs-104',
    enrolled_discipline_id: 'disc-09',
    progress_percentage: 100,
    average_grade: 9.8,
    last_access: 'Hoje às 16:05',
    completed_lessons: 25,
    total_lessons: 25,
    quizzes_taken: 6,
    status: 'completed',
  },
]

export interface AnalyticsKPIs {
  totalStudents: number
  averageProgress: number
  averageGrade: number
  completionRate: number
  trends: {
    students: string
    progress: string
    grade: string
    completion: string
  }
}

class StudentAnalyticsService {
  private loadStudents(): StudentPerformanceRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STUDENTS)
      if (data) return JSON.parse(data)
    } catch (e) {
      console.warn('Erro ao carregar dados analíticos:', e)
    }
    this.saveStudents(INITIAL_STUDENTS)
    return INITIAL_STUDENTS
  }

  private saveStudents(items: StudentPerformanceRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(items))
    } catch (e) {
      console.error('Erro ao salvar dados analíticos:', e)
    }
  }

  async getStudents(
    courseId?: string,
    disciplineId?: string,
  ): Promise<{
    students: StudentPerformanceRecord[]
    kpis: AnalyticsKPIs
  }> {
    await new Promise((r) => setTimeout(r, 120))
    let list = this.loadStudents()

    if (courseId && courseId !== 'all') {
      list = list.filter((s) => s.enrolled_course_id === courseId)
    }
    if (disciplineId && disciplineId !== 'all') {
      list = list.filter((s) => s.enrolled_discipline_id === disciplineId)
    }

    const totalStudents = list.length
    const averageProgress =
      totalStudents > 0
        ? Math.round(
            list.reduce((acc, s) => acc + s.progress_percentage, 0) / totalStudents,
          )
        : 0
    const averageGrade =
      totalStudents > 0
        ? Number(
            (
              list.reduce((acc, s) => acc + s.average_grade, 0) / totalStudents
            ).toFixed(1),
          )
        : 0
    const completedStudents = list.filter((s) => s.progress_percentage === 100).length
    const completionRate =
      totalStudents > 0
        ? Math.round((completedStudents / totalStudents) * 100)
        : 0

    const kpis: AnalyticsKPIs = {
      totalStudents,
      averageProgress,
      averageGrade,
      completionRate,
      trends: {
        students: '+8% este mês',
        progress: '+5.4% este mês',
        grade: '+0.3 este mês',
        completion: '+4.2% este mês',
      },
    }

    return { students: list, kpis }
  }

  resetAnalyticsDefaults(): void {
    this.saveStudents(INITIAL_STUDENTS)
  }
}

export const studentAnalyticsService = new StudentAnalyticsService()
