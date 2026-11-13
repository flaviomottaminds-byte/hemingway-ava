import type { Course, Lesson, UserProfile } from '../types'

export const mockUser: UserProfile = {
  id: 'usr_immigrant_101',
  name: 'Aluno de Teste (Hemingway)',
  email: 'aluno@hemingway.school',
  role: 'student',
  originCountry: 'Brasil',
  currentCity: 'Orlando, Florida, USA',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  preferredLanguage: 'pt',
  weeklyGoalHours: 10,
  completedHours: 0,
  activeCoursesCount: 0,
  certificatesEarned: 0,
  document_type: 'Passaporte Internacional',
  document_number: 'USA-8839201',
}

export const mockTeacherUser: UserProfile = {
  id: 'usr_teacher_202',
  name: 'Prof. Leonardo Dias',
  email: 'leonardo.dias@hemingway.school',
  role: 'teacher',
  originCountry: 'Brasil',
  currentCity: 'Miami, Florida, USA',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  preferredLanguage: 'pt',
  weeklyGoalHours: 20,
  completedHours: 0,
  activeCoursesCount: 0,
  certificatesEarned: 0,
}

export const mockAdminUser: UserProfile = {
  id: 'usr_admin_001',
  name: 'Dra. Elena Vasquez',
  email: 'elena.vasquez@hemingway.school',
  role: 'admin',
  originCountry: 'Brasil',
  currentCity: 'Orlando, Florida, USA',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
  preferredLanguage: 'pt',
  weeklyGoalHours: 40,
  completedHours: 0,
  activeCoursesCount: 0,
  certificatesEarned: 0,
}

// Cursos mockados zerados para início limpo dos testes reais
export const mockCourses: Course[] = []

export const mockLesson: Lesson = {
  id: 'lesson-rights-201',
  title: {
    pt: 'Compreendendo o Formulário W-2, 1099 e Direitos no Trabalho',
    en: 'Understanding W-2, 1099 Tax Forms, and Workplace Rights',
    es: 'Entendiendo los Formularios W-2, 1099 y Derechos en el Trabajo',
  },
  moduleTitle: {
    pt: 'Módulo 2: Direitos Trabalhistas e Leis de Imigração Básicas',
    en: 'Module 2: Workplace Rights and Fundamental Immigration Law',
    es: 'Módulo 2: Derechos Laborales y Leyes Básicas de Inmigración',
  },
  duration: '24 min',
  videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  isCompleted: false,
  instructor: {
    name: 'Dra. Elena Vasquez',
    role: {
      pt: 'Advogada de Imigração & Direitos Civis',
      en: 'Immigration & Civil Rights Attorney',
      es: 'Abogada de Inmigración y Derechos Civiles',
    },
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  },
  transcription: {
    pt: `Bem-vindos a esta aula fundamental sobre a sua relação com o mercado de trabalho norte-americano. Hoje vamos desmistificar dois documentos cruciais: o formulário W-2 (empregado formal/CLT equivalente) e o 1099 (prestador de serviços autônomo / contractor).

Independente do seu status imigratório, a Lei de Padrões Justos de Trabalho (FLSA) garante a você o direito ao salário mínimo federal ou estadual, pagamento de horas extras (overtime após 40 horas semanais) e um ambiente seguro segundo as normas da OSHA.

Não permita que empregadores usem o seu receio em relação à imigração para reter seu pagamento legítimo. Se você trabalhou, você tem direito irrevogável a receber cada centavo do seu serviço.`,
    en: `Welcome to this foundational class on navigating the United States job market. Today we will demystify two critical tax and classification forms: the W-2 (standard payroll employee) and the 1099 (independent contractor).

Regardless of your immigration status, the Fair Labor Standards Act (FLSA) guarantees you the right to the federal or state minimum wage, overtime compensation after 40 hours worked in a single workweek, and safe operating conditions regulated by OSHA.

Never allow any employer to use immigration concerns to withhold your hard-earned wages. If you performed the work, federal law strictly protects your right to receive full payment.`,
    es: `Bienvenidos a esta lección fundamental sobre cómo desenvolverse en el mercado laboral de los Estados Unidos. Hoy vamos a aclarar dos formularios tributarios clave: el W-2 (empleado regular en nómina) y el 1099 (contratista independiente).

Sin importar tu estatus migratorio, la Ley de Normas Justas de Trabajo (FLSA) te garantiza el derecho al salario mínimo estatal o federal, compensación por horas extras tras 40 horas semanales y condiciones seguras bajo las normas de OSHA.

Jamás permitas que ningún empleador utilice el temor migratorio para retener tus salarios devengados. Si realizaste el trabajo, tienes derecho inalienable a recibir cada centavo por tu esfuerzo.`,
  },
  materials: [
    {
      id: 'mat-1',
      title: 'US_Labor_Rights_Immigrant_Handbook_2026.pdf',
      size: '2.4 MB',
      type: 'pdf',
      url: '#',
    },
    {
      id: 'mat-2',
      title: 'Tax_Forms_Comparison_W2_vs_1099.pdf',
      size: '1.1 MB',
      type: 'pdf',
      url: '#',
    },
  ],
}
