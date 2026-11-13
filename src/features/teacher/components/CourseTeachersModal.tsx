import React, { useState, useEffect } from 'react'
import { X, Users, Check, Save, UserCheck, AlertCircle } from 'lucide-react'
import type { SupabaseCourse, SupabaseTeamProfile } from '../../../types'
import { teamService } from '../../../services/teamService'
import { courseTeacherService } from '../../../services/courseTeacherService'

interface CourseTeachersModalProps {
  course: SupabaseCourse | null
  isOpen: boolean
  onClose: () => void
  onTeachersChanged?: () => void
}

export const CourseTeachersModal: React.FC<CourseTeachersModalProps> = ({
  course,
  isOpen,
  onClose,
  onTeachersChanged,
}) => {
  const [teachers, setTeachers] = useState<SupabaseTeamProfile[]>([])
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && course) {
      loadData()
    }
  }, [isOpen, course])

  const loadData = async () => {
    if (!course) return
    setLoading(true)
    try {
      const [allTeam, assignedIds] = await Promise.all([
        teamService.getTeamMembers(),
        courseTeacherService.getTeacherIdsForCourse(course.id),
      ])

      // Filtra apenas membros que podem lecionar (professores, coordenadores e admins)
      const teachable = allTeam.filter(
        (m) => m.role === 'teacher' || m.role === 'coordinator' || m.role === 'admin',
      )
      setTeachers(teachable)
      setSelectedTeacherIds(assignedIds)
    } catch (err) {
      console.error('Erro ao carregar professores para o curso:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !course) return null

  const handleToggleTeacher = (teacherId: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId],
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await courseTeacherService.setTeachersForCourse(course.id, selectedTeacherIds)
      setNotice('Professores vinculados com sucesso ao curso!')
      setTimeout(() => {
        setNotice(null)
        onTeachersChanged?.()
        onClose()
      }, 1000)
    } catch (err: any) {
      setNotice(err?.message || 'Erro ao salvar vínculos de professores.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-5 bg-[#0F1B2F] text-white flex items-center justify-between border-b border-[#1C2E4A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C59E5D] text-[#0F1B2F] flex items-center justify-center font-bold shadow-xs">
              <Users className="w-5 h-5 text-[#0F1B2F]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#FAF8F2] leading-snug">
                Vincular Professores ao Curso
              </h2>
              <p className="text-xs text-[#EADBBE] line-clamp-1">
                {course.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#1C2E4A] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback / Aviso */}
        {notice && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 px-6">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Corpo com lista de professores */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed">
            Selecione quais professores têm permissão para atualizar conteúdos, cadastrar aulas e acompanhar os alunos desta formação:
          </p>

          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Carregando professores cadastrados...</p>
            </div>
          ) : teachers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Nenhum professor cadastrado ainda</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Vá até "Gestão de Equipe" para cadastrar os professores da Hemingway School.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {teachers.map((teacher) => {
                const isSelected = selectedTeacherIds.includes(teacher.id)
                return (
                  <label
                    key={teacher.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/60 border-[#C59E5D] shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleTeacher(teacher.id)}
                        className="w-4 h-4 rounded text-[#C59E5D] focus:ring-[#C59E5D] border-slate-300 cursor-pointer"
                      />
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                        {teacher.avatar_url ? (
                          <img
                            src={teacher.avatar_url}
                            alt={teacher.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-600">
                            {teacher.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {teacher.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              teacher.role === 'admin'
                                ? 'bg-red-100 text-red-800'
                                : teacher.role === 'coordinator'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {teacher.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {teacher.email}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F1B2F] bg-[#C59E5D]/20 px-2 py-0.5 rounded-full border border-[#C59E5D]/30">
                        <Check className="w-3 h-3 text-[#0F1B2F]" />
                        <span>Vinculado</span>
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedTeacherIds.length} professor(es) selecionado(s)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C59E5D] hover:bg-[#B38C4B] active:scale-95 text-[#0F1B2F] text-xs font-bold shadow-md shadow-[#C59E5D]/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-[#0F1B2F]" />
              <span>{saving ? 'Salvando...' : 'Salvar Vínculos'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
