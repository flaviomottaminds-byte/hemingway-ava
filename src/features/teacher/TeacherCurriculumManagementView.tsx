import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Layers,
  Database,
  GraduationCap,
  RefreshCw,
  Plus,
} from 'lucide-react'
import type { SupabaseDiscipline, SupabaseCourse } from '../../types'
import { curriculumService } from '../../services/curriculumService'
import type { CreateDisciplineDTO } from '../../services/curriculumService'
import { courseService } from '../../services/courseService'
import { DisciplinesBankTab } from './components/DisciplinesBankTab'
import { CurriculumBuilderTab } from './components/CurriculumBuilderTab'
import { DisciplineFormModal } from './components/DisciplineFormModal'
import { DisciplineDeleteDialog } from './components/DisciplineDeleteDialog'

interface TeacherCurriculumManagementViewProps {
  initialCourseId?: string
}

export const TeacherCurriculumManagementView: React.FC<
  TeacherCurriculumManagementViewProps
> = ({ initialCourseId }) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'curriculum'>('curriculum')
  const [disciplines, setDisciplines] = useState<SupabaseDiscipline[]>([])
  const [courses, setCourses] = useState<SupabaseCourse[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || '')
  const [loading, setLoading] = useState(true)

  // Modais de Disciplina
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedDisciplineForEdit, setSelectedDisciplineForEdit] =
    useState<SupabaseDiscipline | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedDisciplineForDelete, setSelectedDisciplineForDelete] =
    useState<SupabaseDiscipline | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Carrega cursos e disciplinas do Supabase
  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [fetchedDisciplines, fetchedCourses] = await Promise.all([
        curriculumService.getDisciplines(),
        courseService.getCourses(),
      ])
      setDisciplines(fetchedDisciplines)
      setCourses(fetchedCourses)

      if (!selectedCourseId && fetchedCourses.length > 0) {
        setSelectedCourseId(fetchedCourses[0].id)
      }
    } catch (err) {
      console.error('Erro ao carregar dados curriculares:', err)
      showToast('Falha ao sincronizar com o banco Supabase.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Atualizar quando `initialCourseId` mudar
  useEffect(() => {
    if (initialCourseId) {
      setSelectedCourseId(initialCourseId)
      setActiveTab('curriculum')
    }
  }, [initialCourseId])

  // Salvar Disciplina (Criar ou Atualizar)
  const handleSaveDiscipline = async (dto: CreateDisciplineDTO) => {
    setIsSubmitting(true)
    try {
      if (selectedDisciplineForEdit) {
        const updated = await curriculumService.updateDiscipline(
          selectedDisciplineForEdit.id,
          dto,
        )
        setDisciplines((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
        showToast(`Disciplina "${updated.name}" atualizada com sucesso!`)
      } else {
        const res = await curriculumService.createDiscipline(dto)
        setDisciplines((prev) => [res.discipline, ...prev])
        if (res.isLive) {
          showToast(`🎉 Disciplina "${res.discipline.name}" salva com sucesso no Supabase!`)
        } else if (res.error) {
          showToast(`⚠️ Supabase: ${res.error}`)
        } else {
          showToast(`Nova disciplina "${res.discipline.name}" cadastrada!`)
        }
      }
      setIsFormModalOpen(false)
      setSelectedDisciplineForEdit(null)
    } catch (err) {
      console.error('Erro ao salvar disciplina:', err)
      showToast('Erro ao processar dados no banco.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Excluir Disciplina
  const handleConfirmDelete = async () => {
    if (!selectedDisciplineForDelete) return
    setIsDeleting(true)
    try {
      await curriculumService.deleteDiscipline(selectedDisciplineForDelete.id)
      setDisciplines((prev) => prev.filter((d) => d.id !== selectedDisciplineForDelete.id))
      showToast(`Disciplina "${selectedDisciplineForDelete.name}" excluída.`)
      setIsDeleteDialogOpen(false)
      setSelectedDisciplineForDelete(null)
    } catch (err) {
      console.error('Erro ao excluir disciplina:', err)
      showToast('Falha ao excluir registro do banco.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Restaurar dados padrão de demonstração
  const handleResetDefaults = () => {
    curriculumService.resetCurriculumDefaults()
    loadInitialData()
    showToast('Dados curriculares de demonstração restaurados.')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-top-4 duration-200">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-100">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Painel do Professor • Gestão Curricular</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            Disciplinas & Grade Curricular
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre matérias no banco geral e estruture o fluxo sequencial dos cursos do AVA.
          </p>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            title="Restaurar dados padrão"
            className="p-3 text-slate-400 hover:text-slate-700 hover:bg-white border border-slate-200/80 rounded-2xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedDisciplineForEdit(null)
              setIsFormModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs sm:text-sm font-bold shadow-lg shadow-[#C59E5D]/25 transition-all transform active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova Disciplina</span>
          </button>
        </div>
      </div>

      {/* Abas de Navegação Principais: 1. Banco Geral | 2. Montagem da Grade */}
      <div className="bg-slate-200/70 p-1.5 rounded-2xl flex items-center gap-1.5 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('curriculum')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'curriculum'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Montagem da Grade</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bank')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'bank'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Banco de Disciplinas ({disciplines.length})</span>
        </button>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {activeTab === 'bank' ? (
        <DisciplinesBankTab
          disciplines={disciplines}
          loading={loading}
          onOpenCreate={() => {
            setSelectedDisciplineForEdit(null)
            setIsFormModalOpen(true)
          }}
          onOpenEdit={(disc) => {
            setSelectedDisciplineForEdit(disc)
            setIsFormModalOpen(true)
          }}
          onOpenDelete={(disc) => {
            setSelectedDisciplineForDelete(disc)
            setIsDeleteDialogOpen(true)
          }}
          onNavigateToCurriculum={() => setActiveTab('curriculum')}
        />
      ) : (
        <CurriculumBuilderTab
          courses={courses}
          disciplines={disciplines}
          selectedCourseId={selectedCourseId}
          onSelectCourseId={setSelectedCourseId}
          onCurriculumSaved={loadInitialData}
        />
      )}

      {/* Modais */}
      <DisciplineFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedDisciplineForEdit(null)
        }}
        onSave={handleSaveDiscipline}
        initialData={selectedDisciplineForEdit}
        isSubmitting={isSubmitting}
      />

      <DisciplineDeleteDialog
        discipline={selectedDisciplineForDelete}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedDisciplineForDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
