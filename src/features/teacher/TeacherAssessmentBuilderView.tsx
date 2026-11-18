import React, { useState, useEffect, useRef } from 'react'
import {
  FileQuestion,
  Plus,
  Save,
  Award,
  Clock,
  RotateCcw,
  Sparkles,
  Database,
  CheckCircle2,
  XCircle,
  ListOrdered,
  Sliders,
  UploadCloud,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Layers,
  X,
} from 'lucide-react'
import type {
  SupabaseCourse,
  SupabaseDiscipline,
  SupabaseLesson,
  SupabaseAssessment,
  AssessmentQuestion,
  AssessmentScopeType,
} from '../../types'
import { courseService } from '../../services/courseService'
import { curriculumService } from '../../services/curriculumService'
import { lessonService } from '../../services/lessonService'
import { assessmentService } from '../../services/assessmentService'
import { QuestionCard } from './components/QuestionCard'
import { SmartExamImporterModal } from './components/SmartExamImporterModal'

interface TeacherAssessmentBuilderViewProps {
  assessmentId?: string | null
  initialCourseId?: string
  initialDisciplineId?: string
  onCancel: () => void
  onSaveSuccess: (saved: SupabaseAssessment) => void
}

export const TeacherAssessmentBuilderView: React.FC<TeacherAssessmentBuilderViewProps> = ({
  assessmentId,
  onSaveSuccess,
}) => {
  // ID da avaliação em edição no formulário (null = Nova Avaliação em Branco)
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(
    assessmentId || null,
  )
  const isEditing = Boolean(currentAssessmentId)
  const formSectionRef = useRef<HTMLDivElement>(null)

  // Dados de Contexto do Supabase
  const [courses, setCourses] = useState<SupabaseCourse[]>([])
  const [disciplines, setDisciplines] = useState<SupabaseDiscipline[]>([])
  const [courseDisciplines, setCourseDisciplines] = useState<SupabaseDiscipline[]>([])
  const [loadingCourseDisciplines, setLoadingCourseDisciplines] = useState(false)
  const [lessons, setLessons] = useState<SupabaseLesson[]>([])

  // Lista de Avaliações Cadastradas no Sistema (carregadas em tempo real do Supabase)
  const [savedAssessments, setSavedAssessments] = useState<SupabaseAssessment[]>([])
  const [loadingAssessments, setLoadingAssessments] = useState(true)

  // Modal de Pré-visualização da Prova (Olhinho)
  const [previewAssessment, setPreviewAssessment] = useState<SupabaseAssessment | null>(null)
  const [previewSelectedAnswers, setPreviewSelectedAnswers] = useState<Record<string, string>>({})

  // 1. Seletores da Avaliação — INICIAM SEMPRE EM BRANCO ('')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('')
  const [scopeType, setScopeType] = useState<AssessmentScopeType | ''>('')
  const [selectedLessonId, setSelectedLessonId] = useState<string>('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [maxScore, setMaxScore] = useState<number | string>(10)
  const [passingScore, setPassingScore] = useState<number | string>(7)
  const [maxAttempts, setMaxAttempts] = useState<number | string>(3)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | string>(30)

  // Modal do Importador Inteligente de Provas
  const [isImporterOpen, setIsImporterOpen] = useState(false)

  // 2. Construtor de Questões — INICIA TOTALMENTE ZERADO (0 questões)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])

  // Estados de Validação e Submissão
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Carrega a lista de avaliações salvas no Supabase
  const loadSavedAssessments = async () => {
    setLoadingAssessments(true)
    try {
      const res = await assessmentService.getAssessmentsWithStatus()
      setSavedAssessments(res.data)
      if (res.error) {
        setSaveErrorMessage(res.error)
      }
    } catch (err) {
      console.error('Erro ao listar avaliações do Supabase:', err)
    } finally {
      setLoadingAssessments(false)
    }
  }

  // Carrega cursos, disciplinas, aulas e avaliações cadastradas (SEM auto-selecionar o primeiro registro)
  useEffect(() => {
    const loadContextData = async () => {
      try {
        const [loadedCourses, loadedDisciplines, loadedLessons] = await Promise.all([
          courseService.getCourses(),
          curriculumService.getDisciplines(),
          lessonService.getLessons(),
        ])
        setCourses(loadedCourses)
        setDisciplines(loadedDisciplines)
        setLessons(loadedLessons)
      } catch (err) {
        console.error('Erro ao carregar dados de contexto:', err)
      }
    }
    loadContextData()
    loadSavedAssessments()
  }, [])

  // Filtra dinamicamente as disciplinas pertencentes ao curso escolhido
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseDisciplines([])
      return
    }
    let active = true
    setLoadingCourseDisciplines(true)
    curriculumService
      .getCourseDisciplines(selectedCourseId)
      .then((linked) => {
        if (!active) return
        if (linked && linked.length > 0) {
          setCourseDisciplines(linked)
        } else {
          // Fallback adicional: verifica disciplinas associadas via aulas daquele curso
          const discIdsFromLessons = new Set(
            lessons.filter((l) => l.course_id === selectedCourseId).map((l) => l.discipline_id),
          )
          const matchedFromLessons = disciplines.filter((d) => discIdsFromLessons.has(d.id))
          setCourseDisciplines(matchedFromLessons.length > 0 ? matchedFromLessons : disciplines)
        }
      })
      .catch(() => {
        if (active) setCourseDisciplines(disciplines)
      })
      .finally(() => {
        if (active) setLoadingCourseDisciplines(false)
      })

    return () => {
      active = false
    }
  }, [selectedCourseId, disciplines, lessons])

  // Carrega avaliação existente caso assessmentId venha via props
  useEffect(() => {
    if (!assessmentId) return
    const fetchAssessment = async () => {
      try {
        const data = await assessmentService.getAssessmentById(assessmentId)
        if (data) {
          handleLoadAssessmentIntoForm(data)
        }
      } catch (err) {
        console.error('Erro ao carregar avaliação:', err)
        showToast('Erro ao carregar avaliação do banco.')
      }
    }
    fetchAssessment()
  }, [assessmentId])

  // Limpa todos os campos e questões para cadastrar uma nova avaliação do zero
  const handleStartBlankAssessment = () => {
    setCurrentAssessmentId(null)
    setSelectedCourseId('')
    setSelectedDisciplineId('')
    setScopeType('')
    setSelectedLessonId('')
    setTitle('')
    setDescription('')
    setMaxScore(10)
    setPassingScore(7)
    setMaxAttempts(3)
    setTimeLimitMinutes(30)
    setQuestions([])
    setErrors({})
    setSaveErrorMessage(null)
    setSaveSuccessMessage(null)
    showToast('Formulário limpo para nova avaliação em branco.')
  }

  // Carrega uma avaliação salva da lista para edição no formulário
  const handleLoadAssessmentIntoForm = (item: SupabaseAssessment) => {
    setCurrentAssessmentId(item.id)
    setSelectedCourseId(item.course_id || '')
    setSelectedDisciplineId(item.discipline_id || '')
    setScopeType(item.scope_type || 'discipline_final')
    setSelectedLessonId(item.lesson_id || '')
    setTitle(item.title || '')
    setDescription(item.description || '')
    setMaxScore(item.max_score ?? 10)
    setPassingScore(item.passing_score ?? 7)
    setMaxAttempts(item.max_attempts ?? 3)
    setTimeLimitMinutes(item.time_limit_minutes ?? 30)
    setQuestions(
      Array.isArray(item.questions) ? JSON.parse(JSON.stringify(item.questions)) : [],
    )
    setErrors({})
    setSaveErrorMessage(null)
    setSaveSuccessMessage(null)
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Exclui uma avaliação cadastrada no Supabase
  const handleDeleteSavedAssessment = async (item: SupabaseAssessment) => {
    if (
      !window.confirm(
        `Deseja realmente excluir a avaliação "${item.title}" (${item.questions?.length || 0} questões)?`,
      )
    ) {
      return
    }
    try {
      await assessmentService.deleteAssessment(item.id)
      setSavedAssessments((prev) => prev.filter((a) => a.id !== item.id))
      if (currentAssessmentId === item.id) {
        handleStartBlankAssessment()
      }
      showToast(`Avaliação "${item.title}" excluída com sucesso.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao excluir avaliação'
      setSaveErrorMessage(msg)
      showToast(msg)
    }
  }

  // Abre modal de pré-visualização da avaliação (Olhinho)
  const handlePreviewAssessment = (item: SupabaseAssessment) => {
    setPreviewSelectedAnswers({})
    setPreviewAssessment(item)
  }

  // Pré-visualizar a avaliação atual do formulário
  const handlePreviewCurrentForm = () => {
    if (questions.length === 0) {
      showToast('Adicione ou importe questões antes de pré-visualizar a prova.')
      return
    }
    setPreviewSelectedAnswers({})
    setPreviewAssessment({
      id: currentAssessmentId || 'preview-draft',
      course_id: selectedCourseId,
      discipline_id: selectedDisciplineId,
      lesson_id: scopeType === 'lesson_specific' ? selectedLessonId : undefined,
      scope_type: (scopeType as AssessmentScopeType) || 'discipline_final',
      title: title.trim() || 'Pré-visualização da Avaliação',
      description: description.trim(),
      max_score: Number(maxScore) || 10,
      passing_score: Number(passingScore) || 7,
      max_attempts: Number(maxAttempts) || 3,
      time_limit_minutes: Number(timeLimitMinutes) || 30,
      questions,
      created_at: new Date().toISOString(),
    })
  }

  // Disciplinas filtradas pelo curso selecionado
  const availableDisciplines = selectedCourseId ? courseDisciplines : []

  // Aulas filtradas pela disciplina (e curso) selecionada
  const availableLessons = lessons.filter((l) => {
    if (selectedDisciplineId && l.discipline_id !== selectedDisciplineId) return false
    if (selectedCourseId && l.course_id && l.course_id !== selectedCourseId) return false
    return Boolean(selectedDisciplineId || selectedCourseId)
  })

  // Estatísticas de Pontos
  const totalQuestionsPoints = questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0)
  const maxScoreNumber = Number(maxScore) || 10
  const pointsDiscrepancy =
    questions.length > 0 && Math.abs(totalQuestionsPoints - maxScoreNumber) > 0.05

  // Ação: Adicionar Nova Questão (padrão 5 alternativas A a E)
  const handleAddNewQuestion = () => {
    const defaultPoints =
      questions.length > 0
        ? Number((maxScoreNumber / (questions.length + 1)).toFixed(2))
        : Number(maxScoreNumber.toFixed(2))

    const newQuestion: AssessmentQuestion = {
      id: `q-${Date.now()}-${questions.length + 1}`,
      sequence_order: questions.length + 1,
      statement: '',
      points: defaultPoints || 2,
      feedback: '',
      is_expanded: true,
      options: [
        {
          id: `opt-${Date.now()}-0`,
          option_letter: 'A',
          text: '',
          is_correct: true,
        },
        {
          id: `opt-${Date.now()}-1`,
          option_letter: 'B',
          text: '',
          is_correct: false,
        },
        {
          id: `opt-${Date.now()}-2`,
          option_letter: 'C',
          text: '',
          is_correct: false,
        },
        {
          id: `opt-${Date.now()}-3`,
          option_letter: 'D',
          text: '',
          is_correct: false,
        },
        {
          id: `opt-${Date.now()}-4`,
          option_letter: 'E',
          text: '',
          is_correct: false,
        },
      ],
    }
    setQuestions((prev) => [...prev, newQuestion])
  }

  // Ação: Atualizar Questão
  const handleUpdateQuestion = (index: number, updated: AssessmentQuestion) => {
    setQuestions((prev) => {
      const copy = [...prev]
      copy[index] = updated
      return copy
    })
  }

  // Ação: Excluir Questão (permite zerar a lista)
  const handleDeleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  // Ação: Duplicar Questão
  const handleDuplicateQuestion = (index: number) => {
    const target = questions[index]
    const duplicated: AssessmentQuestion = {
      ...target,
      id: `q-dup-${Date.now()}`,
      statement: `${target.statement} (Cópia)`,
      options: target.options.map((opt) => ({
        ...opt,
        id: `opt-dup-${Date.now()}-${Math.random()}`,
      })),
      is_expanded: true,
    }
    const updated = [...questions]
    updated.splice(index + 1, 0, duplicated)
    setQuestions(updated)
  }

  // Ação: Expandir / Recolher Todas
  const handleToggleExpandAll = (expand: boolean) => {
    setQuestions((prev) => prev.map((q) => ({ ...q, is_expanded: expand })))
  }

  // Ação de Produtividade: Distribuir pontos igualmente para bater com a Nota Máxima
  const handleDistributePointsEqually = () => {
    if (questions.length === 0) return
    const pointsPerQuestion = Number((maxScoreNumber / questions.length).toFixed(2))
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        points: pointsPerQuestion,
      })),
    )
    showToast(`Pontos distribuídos: ${pointsPerQuestion} pts por questão!`)
  }

  // Ação do Importador de Provas: Aplicar questões importadas no construtor
  const handleQuestionsImported = (
    importedQuestions: AssessmentQuestion[],
    suggestedTitle?: string,
  ) => {
    if (suggestedTitle && !title.trim()) {
      setTitle(suggestedTitle)
    }
    setQuestions(importedQuestions)
    setErrors((prev) => {
      const next = { ...prev }
      delete next.questions
      return next
    })
    showToast(`${importedQuestions.length} questões carregadas no construtor com sucesso!`)
  }

  // Validação completa do formulário
  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!selectedCourseId) {
      errs.course = 'Selecione o Curso Vinculado.'
    }
    if (!selectedDisciplineId) {
      errs.discipline = 'Selecione a Disciplina Vinculada.'
    }
    if (!scopeType) {
      errs.scopeType = 'Selecione a Aplicação da Prova (Final da Disciplina ou Quiz de Aula).'
    }
    if (scopeType === 'lesson_specific' && !selectedLessonId) {
      errs.lesson = 'Selecione a Aula Vinculada para este Quiz.'
    }
    if (!title.trim()) {
      errs.title = 'O título da avaliação é obrigatório.'
    }
    if (questions.length === 0) {
      errs.questions =
        'A avaliação está com 0 questões. Importe questões (Word/PDF/Texto) ou clique em "+ Adicionar Nova Questão".'
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.statement.trim()) {
        errs[`q_${i}`] = `A questão ${i + 1} está com o enunciado vazio.`
      }
      const hasCorrect = q.options.some((opt) => opt.is_correct)
      if (!hasCorrect) {
        errs[`q_gabarito_${i}`] = `A questão ${i + 1} não possui gabarito correto marcado.`
      }
      const hasEmptyOption = q.options.some((opt) => !opt.text.trim())
      if (hasEmptyOption) {
        errs[`q_opt_${i}`] = `A questão ${i + 1} possui alternativas com texto vazio.`
      }
    }

    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      const firstError = Object.values(errs)[0]
      setSaveErrorMessage(firstError)
      showToast(firstError)
      return false
    }
    return true
  }

  // Salvar Avaliação no Supabase e Atualizar Listagem em Tempo Real
  const handleSaveAssessment = async () => {
    setSaveErrorMessage(null)
    setSaveSuccessMessage(null)

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payload = {
        course_id: selectedCourseId,
        discipline_id: selectedDisciplineId,
        scope_type: scopeType as AssessmentScopeType,
        lesson_id: scopeType === 'lesson_specific' ? selectedLessonId : undefined,
        title: title.trim(),
        description: description.trim(),
        max_score: Number(maxScore) || 10,
        passing_score: Number(passingScore) || 7,
        max_attempts: Number(maxAttempts) || 3,
        time_limit_minutes: timeLimitMinutes ? Number(timeLimitMinutes) : 30,
        questions,
      }

      let saved: SupabaseAssessment
      if (currentAssessmentId) {
        saved = await assessmentService.updateAssessment(currentAssessmentId, payload)
      } else {
        saved = await assessmentService.createAssessment(payload)
        setCurrentAssessmentId(saved.id)
      }

      await loadSavedAssessments()
      setSaveSuccessMessage(
        `Avaliação "${saved.title}" (${saved.questions.length} questões) salva com sucesso no Supabase!`,
      )
      showToast(`Avaliação "${saved.title}" salva com sucesso!`)
      onSaveSuccess(saved)
    } catch (err: unknown) {
      console.error('Erro ao salvar avaliação:', err)
      const msg =
        err instanceof Error
          ? err.message
          : 'Falha ao gravar avaliação no Supabase. Verifique permissões RLS ou conexão.'
      setSaveErrorMessage(msg)
      showToast(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F1B2F] text-[#FAF8F2] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-[#C59E5D] animate-in slide-in-from-top-4 duration-200">
          <Database className="w-4 h-4 text-[#C59E5D]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ================= 0. LISTAGEM GERENCIÁVEL: AVALIAÇÕES CADASTRADAS NO SISTEMA ================= */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#0F1B2F] text-[#C59E5D] shadow-xs">
              <Award className="w-6 h-6 text-[#C59E5D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0F1B2F] tracking-tight">
                  Avaliações Cadastradas no Sistema
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#C59E5D] text-[#0F1B2F]">
                  {savedAssessments.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gerencie todas as provas e quizzes salvos no Supabase e sincronizados com a Sala de Aula do Aluno
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={loadSavedAssessments}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
              title="Recarregar avaliações do Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAssessments ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleStartBlankAssessment}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] border border-[#C59E5D]/50 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#C59E5D] stroke-[2.5]" />
              <span>+ Nova Avaliação (Em Branco)</span>
            </button>
          </div>
        </div>

        {loadingAssessments ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Consultando avaliações salvas no Supabase...
          </div>
        ) : savedAssessments.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#FAF8F2]/60 border border-dashed border-[#C59E5D]/40 text-center space-y-1.5">
            <FileQuestion className="w-9 h-9 text-[#C59E5D] mx-auto" />
            <p className="text-sm font-bold text-[#0F1B2F]">
              Nenhuma avaliação cadastrada no momento
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Utilize o formulário abaixo para selecionar o Curso, a Disciplina e a Aula, importar ou criar questões e clicar em &quot;Salvar Avaliação&quot;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Título da Prova</th>
                  <th className="px-4 py-3">Curso / Disciplina / Aula Vinculada</th>
                  <th className="px-4 py-3 text-center">Qtd. de Questões</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedAssessments.map((item) => {
                  const crs = courses.find((c) => c.id === item.course_id)
                  const disc = disciplines.find((d) => d.id === item.discipline_id)
                  const les = item.lesson_id
                    ? lessons.find((l) => l.id === item.lesson_id)
                    : null
                  const isCurrentlyEditing = currentAssessmentId === item.id

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isCurrentlyEditing ? 'bg-[#FAF8F2]' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {item.title}
                            </span>
                            {isCurrentlyEditing && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#C59E5D] text-[#0F1B2F]">
                                Em Edição
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                item.scope_type === 'lesson_specific'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}
                            >
                              {item.scope_type === 'lesson_specific'
                                ? '📌 Quiz de Aula Específica'
                                : '🎓 Final da Disciplina'}
                            </span>
                            <span>•</span>
                            <span>
                              Nota Máx: <strong>{item.max_score} pts</strong> (Média:{' '}
                              {item.passing_score} pts)
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F1B2F]">
                            <GraduationCap className="w-3.5 h-3.5 text-[#C59E5D] shrink-0" />
                            <span>{crs?.title || 'Curso não identificado'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>
                              {disc
                                ? `${disc.code ? `[${disc.code}] ` : ''}${disc.name}`
                                : 'Disciplina não identificada'}
                            </span>
                          </div>
                          {item.scope_type === 'lesson_specific' && (
                            <div className="text-[11px] text-blue-700 font-semibold">
                              ↳{' '}
                              {les
                                ? `Aula #${les.sequence_order}: ${les.title}`
                                : 'Aula específica vinculada'}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.questions?.length || 0}{' '}
                          {(item.questions?.length || 0) === 1 ? 'questão' : 'questões'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Botão Visualizar (Olhinho) */}
                          <button
                            type="button"
                            onClick={() => handlePreviewAssessment(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#C59E5D] border border-[#C59E5D]/50 transition cursor-pointer"
                            title="Visualizar Prova / Gabarito Comentado"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#C59E5D]" />
                            <span className="hidden md:inline">Visualizar</span>
                          </button>

                          {/* Botão Editar */}
                          <button
                            type="button"
                            onClick={() => handleLoadAssessmentIntoForm(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] transition cursor-pointer"
                            title="Editar esta avaliação no formulário abaixo"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#0F1B2F]" />
                            <span>Editar</span>
                          </button>

                          {/* Botão Excluir */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSavedAssessment(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                            title="Excluir avaliação do Supabase"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= 1. CABEÇALHO & CONFIGURAÇÕES DA AVALIAÇÃO ================= */}
      <div
        ref={formSectionRef}
        className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <FileQuestion className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                {isEditing
                  ? 'Modo Edição • Atualizando Avaliação Selecionada'
                  : 'Novo Cadastro • Formulário de Avaliação'}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {isEditing ? `Editar: ${title || 'Avaliação'}` : 'Criar Nova Avaliação / Quiz'}
              </h1>
            </div>
          </div>

          {/* Botões de Ação no Topo Direito */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleStartBlankAssessment}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Limpar todos os campos e questões para começar do zero"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar / Em Branco</span>
            </button>

            <button
              type="button"
              onClick={handlePreviewCurrentForm}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#C59E5D] border border-[#C59E5D]/50 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Visualizar questões da avaliação atual"
            >
              <Eye className="w-4 h-4 text-[#C59E5D]" />
              <span>Visualizar Prova</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAssessment}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#C59E5D]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#0F1B2F]/30 border-t-[#0F1B2F] rounded-full animate-spin" />
                  <span>Salvando no Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Avaliação</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mensagens de Sucesso ou Erro de Salvamento */}
        {saveErrorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold">{saveErrorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveErrorMessage(null)}
              className="p-1 text-red-500 hover:text-red-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {saveSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{saveSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessMessage(null)}
              className="p-1 text-emerald-600 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Linha 1: Curso, Disciplina, Aplicação da Prova e Aula Vinculada (Todos iniciando em branco) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Curso Vinculado */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Curso Vinculado <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value)
                setSelectedDisciplineId('')
                setSelectedLessonId('')
                setErrors((prev) => ({ ...prev, course: '', discipline: '', lesson: '' }))
              }}
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 cursor-pointer ${
                errors.course
                  ? 'border-red-300 focus:ring-red-500/20'
                  : 'border-slate-200 focus:ring-blue-500/20'
              }`}
            >
              <option value="">Selecione o Curso...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {errors.course && <p className="text-[11px] text-red-600 mt-1">{errors.course}</p>}
          </div>

          {/* 2. Disciplina Vinculada (Filtrada dinamicamente pelo curso escolhido) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Disciplina Vinculada <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDisciplineId}
              disabled={!selectedCourseId || loadingCourseDisciplines}
              onChange={(e) => {
                setSelectedDisciplineId(e.target.value)
                setSelectedLessonId('')
                setErrors((prev) => ({ ...prev, discipline: '', lesson: '' }))
              }}
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 cursor-pointer disabled:opacity-60 ${
                errors.discipline
                  ? 'border-red-300 focus:ring-red-500/20'
                  : 'border-slate-200 focus:ring-blue-500/20'
              }`}
            >
              <option value="">
                {!selectedCourseId
                  ? 'Selecione a Disciplina...'
                  : loadingCourseDisciplines
                    ? 'Carregando disciplinas do curso...'
                    : 'Selecione a Disciplina...'}
              </option>
              {availableDisciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code ? `[${d.code}] ` : ''}
                  {d.name}
                </option>
              ))}
            </select>
            {errors.discipline && (
              <p className="text-[11px] text-red-600 mt-1">{errors.discipline}</p>
            )}
          </div>

          {/* 3. Aplicação da Prova */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Aplicação da Prova <span className="text-red-500">*</span>
            </label>
            <select
              value={scopeType}
              onChange={(e) => {
                const val = e.target.value as AssessmentScopeType | ''
                setScopeType(val)
                if (val !== 'lesson_specific') {
                  setSelectedLessonId('')
                }
                setErrors((prev) => ({ ...prev, scopeType: '', lesson: '' }))
              }}
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 cursor-pointer ${
                errors.scopeType
                  ? 'border-red-300 focus:ring-red-500/20'
                  : 'border-slate-200 focus:ring-blue-500/20'
              }`}
            >
              <option value="">Selecione o Tipo / Aula...</option>
              <option value="discipline_final">🎓 Final da Disciplina (Exame)</option>
              <option value="lesson_specific">📌 Quiz de Aula Específica</option>
            </select>
            {errors.scopeType && (
              <p className="text-[11px] text-red-600 mt-1">{errors.scopeType}</p>
            )}
          </div>

          {/* 4. Aula Vinculada (Condicional se scopeType === 'lesson_specific') */}
          {scopeType === 'lesson_specific' && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Aula Vinculada <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedLessonId}
                disabled={!selectedDisciplineId}
                onChange={(e) => {
                  setSelectedLessonId(e.target.value)
                  setErrors((prev) => ({ ...prev, lesson: '' }))
                }}
                className={`w-full px-3 py-2.5 bg-blue-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 cursor-pointer disabled:opacity-60 ${
                  errors.lesson
                    ? 'border-red-300 focus:ring-red-500/20'
                    : 'border-blue-200 focus:ring-blue-500/20'
                }`}
              >
                <option value="">Selecione a Aula...</option>
                {availableLessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    Aula #{l.sequence_order}: {l.title}
                  </option>
                ))}
              </select>
              {errors.lesson && <p className="text-[11px] text-red-600 mt-1">{errors.lesson}</p>}
            </div>
          )}
        </div>

        {/* Linha 2: Título da Avaliação e Descrição Breve */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
              Título da Avaliação <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
              }}
              placeholder="Ex: Avaliação Aula 1.1: FOH vs. BOH ou Exame Final do Módulo"
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.title
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
              }`}
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
              Orientações Rápidas (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Leia cada questão com atenção antes de responder."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Linha 3: Critérios Avaliativos (Nota Máxima, Média, Tentativas, Tempo) */}
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Critérios de Avaliação e Regras de Aprovação</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Nota Máxima */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Award className="w-3 h-3 text-blue-600" />
                Nota Máxima
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-xs text-slate-400">pts</span>
              </div>
            </div>

            {/* Nota de Corte / Média */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Nota de Corte (Média)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="text-xs text-slate-400">pts</span>
              </div>
            </div>

            {/* Limite de Tentativas */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <RotateCcw className="w-3 h-3 text-purple-600" />
                Limite de Tentativas
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-xs text-slate-400">vezes</span>
              </div>
            </div>

            {/* Tempo Limite */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                Tempo Limite
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(e.target.value)}
                  placeholder="30"
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-xs text-slate-400">min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. CONSTRUTOR DE QUESTÕES (QUESTION BUILDER) ================= */}
      <div className="space-y-4">
        {/* Barra de Status do Construtor */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Questões da Prova ({questions.length})
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>Total de Pontos das Questões:</span>
                <span
                  className={`font-bold ${
                    pointsDiscrepancy ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {totalQuestionsPoints} / {maxScoreNumber} pts
                </span>
                {pointsDiscrepancy && (
                  <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    A soma difere da nota máxima ({maxScoreNumber})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {pointsDiscrepancy && questions.length > 0 && (
              <button
                type="button"
                onClick={handleDistributePointsEqually}
                className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
                title="Ajusta a pontuação de todas as questões para somar exatamente a Nota Máxima"
              >
                Distribuir Pontos Igualmente
              </button>
            )}

            {questions.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => handleToggleExpandAll(true)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Expandir Todas
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleExpandAll(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Recolher Todas
                </button>
              </>
            )}

            {/* Botão de Importação Inteligente (Word / PDF / Texto) */}
            <button
              type="button"
              onClick={() => setIsImporterOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs sm:text-sm font-bold rounded-xl transition-all transform active:scale-[0.98] cursor-pointer"
              title="Importar questões de arquivos Word (.docx), PDF ou colando texto"
            >
              <UploadCloud className="w-4 h-4 stroke-[2.5] text-blue-600" />
              <span>Importar Questões (Word / PDF / Texto)</span>
            </button>

            {/* Botão Destaque: "+ Adicionar Nova Questão" */}
            <button
              type="button"
              onClick={handleAddNewQuestion}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#C59E5D]/25 transition-all transform active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Adicionar Nova Questão</span>
            </button>
          </div>
        </div>

        {/* Estado Vazio (0 questões) ou Lista de Questões */}
        {questions.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF8F2] border border-[#C59E5D]/40 text-[#0F1B2F] flex items-center justify-center mx-auto">
              <FileQuestion className="w-7 h-7 text-[#C59E5D]" />
            </div>
            <div className="space-y-1 max-w-lg mx-auto">
              <h3 className="text-base font-extrabold text-[#0F1B2F]">
                Nenhuma questão adicionada ainda (0 questões)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                A lista de questões inicia totalmente zerada. Importe automaticamente suas questões com gabarito comentado de um arquivo Word (.docx), PDF ou texto, ou adicione manualmente cada questão.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsImporterOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#FAF8F2] border border-[#C59E5D]/50 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-[#C59E5D]" />
                <span>Importar Questões (Word / PDF / Texto)</span>
              </button>

              <button
                type="button"
                onClick={handleAddNewQuestion}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#C59E5D]/25 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Adicionar Nova Questão</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {questions.map((q, index) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={index}
                  totalQuestions={questions.length}
                  onUpdate={(updated) => handleUpdateQuestion(index, updated)}
                  onDelete={() => handleDeleteQuestion(index)}
                  onDuplicate={() => handleDuplicateQuestion(index)}
                  onToggleExpand={() =>
                    handleUpdateQuestion(index, { ...q, is_expanded: !q.is_expanded })
                  }
                />
              ))}
            </div>

            <div className="py-2 text-center">
              <button
                type="button"
                onClick={handleAddNewQuestion}
                className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-3xl text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Adicionar Nova Questão ({questions.length + 1})</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Barra de Ação Inferior */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Ao salvar, a avaliação e suas <strong>{questions.length} questões</strong> com gabarito comentado serão gravadas no Supabase e disponibilizadas imediatamente na Sala de Aula do Aluno.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleStartBlankAssessment}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            + Nova Avaliação (Em Branco)
          </button>

          <button
            type="button"
            onClick={handlePreviewCurrentForm}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#0F1B2F] hover:bg-[#1C2E4A] text-[#C59E5D] border border-[#C59E5D]/50 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#C59E5D]" />
            <span>Visualizar</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAssessment}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#C59E5D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#0F1B2F]/30 border-t-[#0F1B2F] rounded-full animate-spin" />
                <span>Gravando no Supabase...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Avaliação</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal do Importador Inteligente de Provas (Word / PDF / Texto) */}
      <SmartExamImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        courses={courses}
        disciplines={disciplines}
        defaultCourseId={selectedCourseId}
        defaultDisciplineId={selectedDisciplineId}
        defaultLessonId={scopeType === 'lesson_specific' ? selectedLessonId : undefined}
        onQuestionsImported={handleQuestionsImported}
        onSaveToDatabaseSuccess={(saved) => {
          setCurrentAssessmentId(saved.id)
          loadSavedAssessments()
          setSaveSuccessMessage(
            `Avaliação "${saved.title}" salva diretamente no Supabase com ${saved.questions.length} questões!`,
          )
        }}
      />

      {/* Modal de Pré-visualização da Avaliação (Olhinho) */}
      {previewAssessment && (
        <div className="fixed inset-0 z-[70] bg-[#0F1B2F]/95 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-200">
          <header className="bg-[#0A1220] border-b border-[#C59E5D]/40 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-[#C59E5D] text-[#0F1B2F]">
                <Eye className="w-5 h-5 text-[#0F1B2F]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#C59E5D] text-[#0F1B2F]">
                    Pré-visualização do Aluno
                  </span>
                  <span className="text-xs text-[#EADBBE] font-semibold">
                    {previewAssessment.questions.length} questões • Nota Máx:{' '}
                    {previewAssessment.max_score} pts
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-white truncate mt-0.5">
                  {previewAssessment.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewSelectedAnswers({})}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#162338] hover:bg-[#1C2E4A] text-slate-200 border border-[#C59E5D]/30 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C59E5D]" />
                <span>Reiniciar Respostas</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewAssessment(null)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-[#0F1B2F]" />
                <span>Voltar para Avaliações</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FAF8F2]">
            <div className="max-w-4xl mx-auto space-y-5">
              {previewAssessment.questions.map((q, qIdx) => {
                const qId = String(q.id || `pq-${qIdx}`)
                const selectedOptId = previewSelectedAnswers[qId]
                const isAnswered = Boolean(selectedOptId)
                const selectedOpt = (q.options || []).find((o) => o.id === selectedOptId)
                const isCorrect = selectedOpt?.is_correct ?? false

                return (
                  <div
                    key={qId}
                    className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-[#0F1B2F] text-[#C59E5D] text-xs font-extrabold flex items-center justify-center shrink-0">
                          {qIdx + 1}
                        </span>
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Questão {qIdx + 1} • {q.points || 1} Pontos
                          </span>
                          <p className="text-sm sm:text-base font-bold text-[#0F1B2F] mt-1 whitespace-pre-line leading-snug">
                            {q.statement}
                          </p>
                        </div>
                      </div>

                      {isAnswered && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Acertou</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Incorreta</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {(q.options || []).map((opt, oIdx) => {
                        const optId = String(opt.id || `opt-${qIdx}-${oIdx}`)
                        const isSelected = selectedOptId === optId
                        let style =
                          'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'

                        if (isAnswered) {
                          if (opt.is_correct) {
                            style =
                              'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold ring-1 ring-emerald-300'
                          } else if (isSelected && !opt.is_correct) {
                            style = 'bg-red-50 border-red-400 text-red-900 line-through'
                          }
                        }

                        return (
                          <button
                            key={optId}
                            type="button"
                            onClick={() =>
                              setPreviewSelectedAnswers((prev) => ({ ...prev, [qId]: optId }))
                            }
                            className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm flex items-center gap-3 transition-all cursor-pointer ${style}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#0F1B2F] text-[#C59E5D]'
                                  : 'bg-white border border-slate-300 text-slate-700'
                              }`}
                            >
                              {opt.option_letter || String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {isAnswered && opt.is_correct && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {isAnswered && (
                      <div className="p-4 rounded-2xl bg-[#FAF8F2] border-2 border-[#C59E5D]/40 space-y-1.5 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F1B2F] uppercase tracking-wide">
                          <BookOpen className="w-4 h-4 text-[#C59E5D]" />
                          <span>Gabarito Comentado & Feedback Pedagógico</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {q.feedback || 'Gabarito oficial conferido.'}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      )}
    </div>
  )
}
