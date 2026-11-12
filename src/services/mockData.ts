import type { Course, Lesson, UserProfile } from '../types'

export const mockUser: UserProfile = {
  id: 'usr_immigrant_101',
  name: 'Mateo Silva Santos',
  email: 'mateo.silva@exemplo.com',
  role: 'student',
  originCountry: 'Brasil',
  currentCity: 'Orlando, Florida, USA',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  preferredLanguage: 'pt',
  weeklyGoalHours: 10,
  completedHours: 14.5,
  activeCoursesCount: 4,
  certificatesEarned: 2,
}

export const mockTeacherUser: UserProfile = {
  id: 'usr_teacher_202',
  name: 'Prof. Leonardo Dias',
  email: 'leonardo.dias@aprendeusa.org',
  role: 'teacher',
  originCountry: 'Brasil',
  currentCity: 'Miami, Florida, USA',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  preferredLanguage: 'pt',
  weeklyGoalHours: 20,
  completedHours: 32,
  activeCoursesCount: 3,
  certificatesEarned: 5,
}

export const mockAdminUser: UserProfile = {
  id: 'usr_admin_001',
  name: 'Dra. Elena Vasquez',
  email: 'elena.vasquez@aprendeusa.org',
  role: 'admin',
  originCountry: 'Brasil',
  currentCity: 'Orlando, Florida, USA',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
  preferredLanguage: 'pt',
  weeklyGoalHours: 40,
  completedHours: 40,
  activeCoursesCount: 12,
  certificatesEarned: 24,
}

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    title: {
      pt: 'Inglês Prático para o Mercado de Trabalho nos EUA',
      en: 'Practical English for the US Job Market',
      es: 'Inglés Práctico para el Mercado Laboral en EE. UU.',
    },
    description: {
      pt: 'Vocabulário essencial, entrevistas de emprego, comunicação por e-mail e rotina profissional americana.',
      en: 'Essential vocabulary, job interviews, email communication, and American professional routine.',
      es: 'Vocabulario esencial, entrevistas de trabajo, redacción de correos y rutina laboral en EE. UU.',
    },
    category: 'language',
    progressPercentage: 68,
    totalLessons: 18,
    completedLessons: 12,
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
    badgeText: {
      pt: 'Mais Popular',
      en: 'Most Popular',
      es: 'Más Popular',
    },
  },
  {
    id: 'course-2',
    title: {
      pt: 'Direitos Trabalhistas e Leis Básicas de Imigração',
      en: 'Workplace Rights & Fundamentals of Immigration Law',
      es: 'Derechos Laborales y Leyes Básicas de Inmigración',
    },
    description: {
      pt: 'Aprenda sobre salários mínimos, horas extras, formulários W-2 e 1099, OSHA e seus direitos fundamentais.',
      en: 'Understand minimum wage, overtime regulations, W-2 vs 1099, OSHA, and protected civil rights.',
      es: 'Comprende el salario mínimo, horas extras, formularios W-2 y 1099, OSHA y tus derechos fundamentales.',
    },
    category: 'rights',
    progressPercentage: 45,
    totalLessons: 12,
    completedLessons: 5,
    thumbnail: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
    badgeText: {
      pt: 'Essencial',
      en: 'Essential',
      es: 'Esencial',
    },
  },
  {
    id: 'course-3',
    title: {
      pt: 'Sistema Financeiro nos EUA & Construção de Credit Score',
      en: 'US Financial System & Credit Score Building',
      es: 'Sistema Financiero en EE. UU. y Construcción de Puntaje de Crédito',
    },
    description: {
      pt: 'Como abrir conta bancária com ITIN ou SSN, construir pontuação FICO e evitar fraudes financeiras comuns.',
      en: 'How to open bank accounts using ITIN or SSN, build a solid FICO score, and steer clear of predatory scams.',
      es: 'Cómo abrir cuentas bancarias con ITIN o SSN, generar buen historial FICO y evitar fraudes financieros.',
    },
    category: 'finance',
    progressPercentage: 20,
    totalLessons: 10,
    completedLessons: 2,
    thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
    badgeText: {
      pt: 'Finanças Pessoais',
      en: 'Personal Finance',
      es: 'Finanzas Personales',
    },
  },
  {
    id: 'course-4',
    title: {
      pt: 'Preparatório para o Teste Cívico de Cidadania Americana',
      en: 'Preparation for the US Civics Citizenship Test',
      es: 'Preparación para el Examen de Ciudadanía y Civismo de EE. UU.',
    },
    description: {
      pt: 'Estudo guiado das 100 perguntas oficiais do USCIS, história americana, governo e simulados práticos.',
      en: 'Guided review of official 100 USCIS civic questions, American history, government, and mock oral tests.',
      es: 'Revisión guiada de las 100 preguntas oficiales de USCIS, historia, gobierno estadounidense y simulaciones.',
    },
    category: 'civics',
    progressPercentage: 10,
    totalLessons: 25,
    completedLessons: 2,
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    badgeText: {
      pt: 'Cidadania',
      en: 'Citizenship',
      es: 'Ciudadanía',
    },
  },
]

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
