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
} from 'lucide-react'
import type { Course, UserProfile, ActiveView } from '../../types'
import { studentEnrollmentService } from '../../services/studentEnrollmentService'
import type { EnrolledCourseView } from '../../services/studentEnrollmentService'
import { CompletionStatementModal } from '../../components/certificate/CompletionStatementModal'

interface StudentDashboardViewProps {
  user: UserProfile
  courses?: Course[]
  onOpenClassroom: () => void
  onSelectView?: (view: ActiveView) => void
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  user,
  onOpenClassroom,
}) => {
  const { t } = useTranslation()
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseView[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(true)
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false)
  const [selectedCourseTitle, setSelectedCourseTitle] = useState('')

  useEffect(() => {
    const loadEnrollments = async () => {
      setLoadingEnrollments(true)
      try {
        const studentId = user.id || 'usr-student-01'
        const list = await studentEnrollmentService.getStudentEnrollments(studentId)
        setEnrolledCourses(list)
      } catch (err) {
        console.warn('Erro ao buscar matrículas do aluno:', err)
      } finally {
        setLoadingEnrollments(false)
      }
    }
    loadEnrollments()
  }, [user.id])

  const totalEnrolled = enrolledCourses.length
  const totalCompletedHours = enrolledCourses.reduce(
    (acc, curr) => acc + (curr.course.workload_hours || 0),
    0,
  )

  const metrics = [
    {
      label: t('dashboard.metrics.enrolledCourses', 'Cursos Matriculados'),
      value: totalEnrolled,
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: t('dashboard.metrics.completedHours', 'Horas de Estudo'),
      value: `${totalCompletedHours || user.completedHours}h`,
      icon: Clock,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: t('dashboard.metrics.certificates', 'Certificados'),
      value: user.certificatesEarned,
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: t('dashboard.metrics.communityRank', 'Comunidade'),
      value: `${user.engagementPoints ?? 0} pts`,
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
          {user.currentCity && user.currentCity.trim().length > 0 && user.currentCity !== 'Orlando, FL' && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A1220]/70 backdrop-blur-md text-xs font-semibold text-[#C59E5D] mb-4 border border-[#C59E5D]/40">
              <Sparkles className="w-3.5 h-3.5 text-[#C59E5D]" />
              <span>{user.currentCity}</span>
            </div>
          )}

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

        {/* Grade de Cursos Matriculados do Aluno */}
        {loadingEnrollments ? (
          <div className="py-12 text-center">
            <div className="w-9 h-9 border-3 border-[#C59E5D]/30 border-t-[#C59E5D] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Consultando matrículas ativas no Supabase...</p>
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF8F2] text-[#C59E5D] border border-[#C59E5D]/40 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#0F1B2F]">Você ainda não está matriculado em nenhum curso</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              O painel administrativo da Hemingway School fará a vinculação da sua turma. Assim que sua matrícula for ativada, as aulas e conteúdos aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolledCourses.map(({ enrollment, course }) => {
              const isCompleted = enrollment.status === 'completed'
              const progressPct = isCompleted ? 100 : 35

              return (
                <div
                  key={enrollment.id}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-900">
                    <img
                      src={
                        course.cover_image_url ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80'
                      }
                      alt={course.title}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80'
                      }}
                    />
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg backdrop-blur-md shadow-xs ${
                          isCompleted
                            ? 'bg-emerald-600/90 text-white'
                            : 'bg-[#0F1B2F]/85 text-[#FAF8F2] border border-[#C59E5D]/40'
                        }`}
                      >
                        {isCompleted ? 'Concluído' : 'Matriculado'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-black/60 text-white backdrop-blur-sm">
                        {course.workload_hours || 40}h de carga horária
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                        <span>Progresso: {progressPct}%</span>
                        <span>{isCompleted ? 'Concluído' : 'Em andamento'}</span>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                        <div
                          className={`${
                            isCompleted ? 'bg-[#C59E5D]' : 'bg-blue-600'
                          } h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseTitle(course.title)
                            setIsStatementModalOpen(true)
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs font-bold shadow-md shadow-[#C59E5D]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Award className="w-4 h-4 text-[#0F1B2F]" />
                          <span>{t('dashboard.issueStatement', 'Emitir Declaração de Conclusão')}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onOpenClassroom}
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-[#FAF8F2] text-[#0F1B2F] hover:text-[#C59E5D] text-xs font-semibold border border-slate-200 hover:border-[#C59E5D]/40 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <PlayCircle className="w-4 h-4 text-[#C59E5D]" />
                          <span>{t('dashboard.welcomeBanner.cta', 'Acessar Sala de Aula')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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

      {/* Modal de Declaração de Conclusão */}
      <CompletionStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        studentName={user.name}
        studentDocumentType={user.document_type || 'Passaporte Internacional'}
        studentDocumentNumber={user.document_number || 'USA-8839201'}
        courseTitle={selectedCourseTitle || 'Inglês Prático para o Mercado de Trabalho nos EUA'}
      />
    </div>
  )
}
