export type ActiveView =
  | 'dashboard'
  | 'classroom'
  | 'login'
  | 'courses'
  | 'teacher-courses'
  | 'teacher-curriculum'
  | 'teacher-lesson-editor'
  | 'teacher-assessments'
  | 'teacher-analytics'
  | 'teacher-students'
  | 'teacher-team'

export type CourseStatus = 'draft' | 'published'
export type CourseLanguage = 'pt' | 'en' | 'es'

export type TeamRole = 'admin' | 'coordinator' | 'teacher' | 'support'
export type TeamMemberStatus = 'active' | 'inactive'

export interface SupabaseTeamProfile {
  id: string
  name: string
  email: string
  phone: string
  role: TeamRole
  status: TeamMemberStatus
  document_type?: string
  document_number?: string
  avatar_url?: string
  assigned_discipline_ids?: string[]
  temporary_password?: string
  created_at: string
  updated_at?: string
}

export type StudentStatus = 'active' | 'inactive'
export type EnrollmentStatus = 'active' | 'completed' | 'blocked'

export interface SupabaseStudent {
  id: string
  name: string
  email: string
  document_id: string
  document_type?: string
  document_number?: string
  phone: string
  avatar_url: string
  status: StudentStatus
  temporary_password?: string
  created_at: string
  updated_at?: string
}

export interface SupabaseEnrollment {
  id: string
  student_id: string
  course_id: string
  status: EnrollmentStatus
  enrolled_at: string
  updated_at?: string
}

export interface StudentPerformanceRecord {
  id: string
  name: string
  email: string
  avatar_url: string
  origin_country: string
  current_state: string
  enrolled_course_id: string
  enrolled_discipline_id?: string
  progress_percentage: number
  average_grade: number
  last_access: string
  completed_lessons: number
  total_lessons: number
  quizzes_taken: number
  status: 'active' | 'at_risk' | 'completed'
}

export type AssessmentScopeType = 'discipline_final' | 'lesson_specific'

export interface AssessmentOption {
  id: string
  option_letter: string
  text: string
  is_correct: boolean
}

export interface AssessmentQuestion {
  id: string
  sequence_order: number
  statement: string
  points: number
  feedback?: string
  options: AssessmentOption[]
  is_expanded?: boolean
}

export interface SupabaseAssessment {
  id: string
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
  created_at: string
  updated_at?: string
}

export interface LessonAttachment {
  id: string
  name: string
  size: string
  type: 'pdf' | 'doc' | 'slides' | 'link'
  url?: string
}

export interface UsefulLink {
  id?: string
  title: string
  url: string
  description?: string
}

export interface SupabaseLesson {
  id: string
  course_id: string
  discipline_id: string
  title: string
  sequence_order: number
  duration_minutes: number
  content_text: string
  video_url: string
  video_youtube_id?: string
  materials: LessonAttachment[]
  pdf_url?: string
  pdf_name?: string
  useful_links?: UsefulLink[]
  created_at: string
  updated_at?: string
}

export interface SupabaseDiscipline {
  id: string
  name: string
  description: string
  code?: string
  estimated_hours?: number
  created_at: string
  updated_at?: string
}

export interface SupabaseCourseDiscipline {
  id: string
  course_id: string
  discipline_id: string
  sequence_order: number
  created_at: string
}

export interface SupabaseCourse {
  id: string
  title: string
  description: string
  workload_hours: number
  default_language: CourseLanguage
  status: CourseStatus
  cover_image_url: string
  instructor_id: string
  instructor_name: string
  created_at: string
  updated_at?: string
  disciplines_count?: number
  students_count?: number
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  originCountry: string
  currentCity: string
  avatarUrl: string
  preferredLanguage: 'pt' | 'en' | 'es'
  weeklyGoalHours: number
  completedHours: number
  activeCoursesCount: number
  certificatesEarned: number
  engagementPoints?: number
  document_type?: string
  document_number?: string
}

export interface LessonMaterial {
  id: string
  title: string
  size: string
  type: 'pdf' | 'doc' | 'link'
  url: string
}

export interface Lesson {
  id: string
  title: Record<'pt' | 'en' | 'es', string>
  moduleTitle: Record<'pt' | 'en' | 'es', string>
  duration: string
  videoUrl: string
  isCompleted: boolean
  instructor: {
    name: string
    role: Record<'pt' | 'en' | 'es', string>
    avatar: string
  }
  transcription: Record<'pt' | 'en' | 'es', string>
  materials: LessonMaterial[]
  pdf_url?: string
  pdf_name?: string
  useful_links?: UsefulLink[]
}

export interface Course {
  id: string
  title: Record<'pt' | 'en' | 'es', string>
  description: Record<'pt' | 'en' | 'es', string>
  category: 'language' | 'rights' | 'finance' | 'civics'
  progressPercentage: number
  totalLessons: number
  completedLessons: number
  thumbnail: string
  badgeText: Record<'pt' | 'en' | 'es', string>
}
