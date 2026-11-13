import React, { useState, useEffect } from 'react'
import {
  X,
  GraduationCap,
  Plus,
  Trash2,
  Calendar,
  BookOpen,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import type {
  SupabaseStudent,
  SupabaseCourse,
  EnrollmentStatus,
} from '../../../types'
import { courseService } from '../../../services/courseService'
import { studentEnrollmentService } from '../../../services/studentEnrollmentService'
import type { EnrolledCourseView } from '../../../services/studentEnrollmentService'

interface EnrollmentsManagementModalProps {
  student: SupabaseStudent | null
  isOpen: boolean
  onClose: () => void
  onEnrollmentChanged?: () => void
}

export const EnrollmentsManagementModal: React.FC<
  EnrollmentsManagementModalProps
> = ({ student, isOpen, onClose, onEnrollmentChanged }) => {
  const [courses, setCourses] = useState<SupabaseCourse[]>([])
  const [enrollments, setEnrollments] = useState<EnrolledCourseView[]>([])
  const [selectedCourseToEnroll, setSelectedCourseToEnroll] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const showMsg = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 3000)
  }

  // Carrega lista de cursos e matrículas do aluno
  const loadData = async () => {
    if (!student) return
    setLoading(true)
    try {
      const [allCourses, studentEnrs] = await Promise.all([
        courseService.getCourses(),
        studentEnrollmentService.getStudentEnrollments(student.id),
      ])
      setCourses(allCourses)
      setEnrollments(studentEnrs)

      // Cursos ainda disponíveis para matricular
      const enrolledIds = new Set(studentEnrs.map((e) => e.course.id))
      const available = allCourses.filter((c) => !enrolledIds.has(c.id))
      if (available.length > 0) {
        setSelectedCourseToEnroll(available[0].id)
      } else {
        setSelectedCourseToEnroll('')
      }
    } catch (err) {
      console.error('Erro ao carregar matrículas:', err)
      showMsg('Erro ao sincronizar matrículas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && student) {
      loadData()
    }
  }, [isOpen, student])

  if (!isOpen || !student) return null

  // Cursos nos quais o aluno ainda NÃO está matriculado
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course.id))
  const availableCoursesToEnroll = courses.filter((c) => !enrolledCourseIds.has(c.id))

  // Ação: Matricular em Novo Curso
  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseToEnroll) return

    setIsEnrolling(true)
    try {
      const res = await studentEnrollmentService.enrollStudent(
        student.id,
        selectedCourseToEnroll,
        'active',
      )
      if (res.supabaseError) {
        showMsg(`Aviso do Supabase: ${res.supabaseError}. Salvo na sessão para teste.`)
      } else {
        showMsg('Aluno matriculado com sucesso no Supabase!')
      }
      await loadData()
      onEnrollmentChanged?.()
    } catch (err: any) {
      console.error('Erro ao matricular aluno:', err)
      showMsg(err.message || 'Falha ao realizar matrícula.')
    } finally {
      setIsEnrolling(false)
    }
  }

  // Ação: Alterar Status da Matrícula (Ativo, Concluído, Bloqueado)
  const handleUpdateStatus = async (
    enrollmentId: string,
    newStatus: EnrollmentStatus,
  ) => {
    try {
      await studentEnrollmentService.updateEnrollmentStatus(enrollmentId, newStatus)
      setEnrollments((prev) =>
        prev.map((item) =>
          item.enrollment.id === enrollmentId
            ? {
                ...item,
                enrollment: { ...item.enrollment, status: newStatus },
              }
            : item,
        ),
      )
      showMsg('Status da matrícula atualizado!')
      onEnrollmentChanged?.()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  // Ação: Remover Matrícula (Excluir acesso)
  const handleRemoveEnrollment = async (enrollmentId: string, courseTitle: string) => {
    if (!window.confirm(`Deseja revogar o acesso do aluno ao curso "${courseTitle}"?`)) {
      return
    }

    try {
      await studentEnrollmentService.removeEnrollment(enrollmentId)
      setEnrollments((prev) => prev.filter((item) => item.enrollment.id !== enrollmentId))
      showMsg('Matrícula removida com sucesso.')
      onEnrollmentChanged?.()
    } catch (err) {
      console.error('Erro ao remover matrícula:', err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho do Modal: "Matrículas de [Nome do Aluno]" */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src={student.avatar_url}
              alt={student.name}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/20"
            />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                Gestão de Acessos & Cursos
              </span>
              <h2 className="text-lg font-bold text-white">
                Matrículas de {student.name}
              </h2>
              <span className="text-xs text-slate-300 block">{student.email}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificação Temporária */}
        {message && (
          <div className="bg-emerald-50 px-6 py-2.5 border-b border-emerald-100 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* ================= SEÇÃO: MATRICULAR EM NOVO CURSO ================= */}
          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Matricular em Novo Curso
              </h3>
            </div>

            {availableCoursesToEnroll.length === 0 ? (
              <p className="text-xs text-slate-500">
                Este aluno já está matriculado em todos os cursos disponíveis no AVA.
              </p>
            ) : (
              <form onSubmit={handleEnroll} className="flex flex-col sm:flex-row gap-2.5">
                <select
                  value={selectedCourseToEnroll}
                  onChange={(e) => setSelectedCourseToEnroll(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  {availableCoursesToEnroll.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.workload_hours}h)
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={isEnrolling || !selectedCourseToEnroll}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isEnrolling ? (
                    <span>Matriculando...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>+ Matricular</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ================= SEÇÃO: CURSOS ATUAIS ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Cursos Atuais ({enrollments.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                Altere o status ou exclua a matrícula a qualquer momento.
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Carregando matrículas do aluno...
              </div>
            ) : enrollments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                O aluno ainda não possui nenhuma matrícula ativa. Utilize o formulário acima para vincular um curso.
              </div>
            ) : (
              <div className="space-y-2.5">
                {enrollments.map(({ enrollment, course }) => {
                  return (
                    <div
                      key={enrollment.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Dados do Curso */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {course.title}
                          </h4>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              Matriculado em{' '}
                              {new Date(enrollment.enrolled_at).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{course.workload_hours}h</span>
                          </div>
                        </div>
                      </div>

                      {/* Controle de Status e Exclusão */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        {/* Status da Matrícula (Select Rápido) */}
                        <select
                          value={enrollment.status}
                          onChange={(e) =>
                            handleUpdateStatus(
                              enrollment.id,
                              e.target.value as EnrollmentStatus,
                            )
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            enrollment.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : enrollment.status === 'completed'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          }`}
                        >
                          <option value="active">🟢 Ativo</option>
                          <option value="completed">🎓 Concluído</option>
                          <option value="blocked">🔴 Bloqueado</option>
                        </select>

                        {/* Botão de Exclusão (Lixeira) */}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveEnrollment(enrollment.id, course.title)
                          }
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Remover acesso a este curso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Sincronizado com a tabela enrollments no Supabase</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  )
}
