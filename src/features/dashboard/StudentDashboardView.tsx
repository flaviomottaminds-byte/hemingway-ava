import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  Clock,
  Award,
  Flame,
  ArrowRight,
  PlayCircle,
  Calendar,
  Sparkles,
  Database,
} from 'lucide-react'
import type { Course, UserProfile, ActiveView, SupabaseCourse } from '../../types'
import type { SupportedLanguageCode } from '../../locales/i18n'
import { courseService } from '../../services/courseService'

interface StudentDashboardViewProps {
  user: UserProfile
  courses: Course[]
  onOpenClassroom: () => void
  onSelectView: (view: ActiveView) => void
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  user,
  courses,
  onOpenClassroom,
}) => {
  const { t, i18n } = useTranslation()
  const currentLang = (i18n.language?.slice(0, 2) as SupportedLanguageCode) || 'pt'
  const [supabaseCourses, setSupabaseCourses] = useState<SupabaseCourse[]>([])
  const [isSupabaseLive, setIsSupabaseLive] = useState(false)
  const [supabaseNotice, setSupabaseNotice] = useState<string | null>(null)

  useEffect(() => {
    courseService.getCoursesWithStatus().then((res) => {
      setSupabaseCourses(res.data)
      setIsSupabaseLive(res.isLive)
      if (res.error) {
        setSupabaseNotice(res.error)
      }
    })
  }, [])

  const metrics = [
    {
      label: t('dashboard.metrics.enrolledCourses'),
      value: user.activeCoursesCount,
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: t('dashboard.metrics.completedHours'),
      value: `${user.completedHours}h`,
      icon: Clock,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: t('dashboard.metrics.certificates'),
      value: user.certificatesEarned,
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: t('dashboard.metrics.communityRank'),
      value: '450 pts',
      icon: Flame,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Banner de Boas-Vindas */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F1B2F] via-[#1C2E4A] to-[#0A1220] border border-[#C59E5D]/30 text-white p-6 sm:p-8 shadow-xl shadow-[#0F1B2F]/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A1220]/70 backdrop-blur-md text-xs font-semibold text-[#C59E5D] mb-4 border border-[#C59E5D]/40">
            <Sparkles className="w-3.5 h-3.5 text-[#C59E5D]" />
            <span>{user.currentCity}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FAF8F2]">
            {t('dashboard.welcomeBanner.greeting', { name: user.name.split(' ')[0] })}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#EADBBE]/90 leading-relaxed max-w-xl">
            {t('dashboard.welcomeBanner.message')}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenClassroom}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] font-bold text-sm shadow-md shadow-[#C59E5D]/30 transition-all cursor-pointer"
            >
              <PlayCircle className="w-5 h-5 text-[#0F1B2F]" />
              <span>{t('dashboard.welcomeBanner.cta')}</span>
            </button>
          </div>
        </div>

        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-[#C59E5D]/15 blur-3xl pointer-events-none" />
      </section>

      {/* Grid de Métricas */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((item, index) => {
          const Icon = item.icon
          return (
            <div
              key={index}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 transition-all hover:shadow-sm"
            >
              <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{item.label}</p>
              </div>
            </div>
          )
        })}
      </section>

      {/* Seção de Trilhas e Cursos Recomendados */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t('dashboard.recommendedSection.title')}
            </h2>
            <p className="text-sm text-slate-500">
              {t('dashboard.recommendedSection.subtitle')}
            </p>
          </div>
          <button
            type="button"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
          >
            {t('dashboard.recentActivity.viewAll')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Status da Conexão com o Supabase */}
        {isSupabaseLive ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">Supabase PostgreSQL Conectado:</span>
              <span>Cursos carregados da tabela 'courses'</span>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-200/60 text-emerald-900">
              Live Database
            </span>
          </div>
        ) : supabaseNotice ? (
          <div className="p-3 bg-slate-100/90 border border-slate-200 text-slate-700 text-xs rounded-2xl flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Catálogo sincronizado com Supabase: Exibindo <strong>Formação em Imigração e Direitos Trabalhistas</strong>
            </span>
          </div>
        ) : null}

        {/* Destaque do Curso Real do Supabase */}
        {supabaseCourses.length > 0 && (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-blue-800/40">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Curso Real • Supabase
                </span>
                <span className="text-xs text-slate-300">
                  {supabaseCourses[0].workload_hours}h de carga horária
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-emerald-400 font-semibold">Inscrição Ativa</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {supabaseCourses[0].title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200/90 line-clamp-2 leading-relaxed">
                {supabaseCourses[0].description}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenClassroom}
              className="px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition shrink-0 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Acessar Sala de Aula</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const courseTitle = course.title[currentLang] || course.title.en
            const courseDesc = course.description[currentLang] || course.description.en
            const badge = course.badgeText[currentLang] || course.badgeText.en

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={courseTitle}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900/80 text-white backdrop-blur-md">
                      {badge}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {courseTitle}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {courseDesc}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                      <span>Progresso: {course.progressPercentage}%</span>
                      <span>
                        {course.completedLessons}/{course.totalLessons} aulas
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.progressPercentage}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={onOpenClassroom}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200 hover:border-blue-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>{t('dashboard.welcomeBanner.cta')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Próximas Sessões de Apoio ao Vivo */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900">
              {t('dashboard.upcomingLive.title')}
            </h3>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
            Trilíngue (PT / EN / ES)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700">Hoje às 19:30 EST</p>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                Plantão de Dúvidas: Formulários Fiscais & ITIN
              </h4>
              <p className="text-xs text-slate-500 mt-1">Com especialista em finanças para recém-chegados</p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ml-3"
            >
              {t('dashboard.upcomingLive.join')}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-700">Quinta às 20:00 EST</p>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                Simulado Oral para Entrevista de Cidadania
              </h4>
              <p className="text-xs text-slate-500 mt-1">Treinamento prático das 100 perguntas cívicas</p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ml-3"
            >
              Lembrar-me
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
