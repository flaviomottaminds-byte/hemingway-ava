import React, { useState, useEffect } from 'react'
import {
  FileQuestion,
  Plus,
  Save,
  X,
  Award,
  Clock,
  RotateCcw,
  Sparkles,
  Database,
  CheckCircle2,
  ListOrdered,
  Sliders,
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

interface TeacherAssessmentBuilderViewProps {
  assessmentId?: string | null
  initialCourseId?: string
  initialDisciplineId?: string
  onCancel: () => void
  onSaveSuccess: (saved: SupabaseAssessment) => void
}

export const TeacherAssessmentBuilderView: React.FC<TeacherAssessmentBuilderViewProps> = ({
  assessmentId,
  initialCourseId,
  initialDisciplineId,
  onCancel,
  onSaveSuccess,
}) => {
  const isEditing = Boolean(assessmentId)

  // Dados de Contexto
  const [courses, setCourses] = useState<SupabaseCourse[]>([])
  const [disciplines, setDisciplines] = useState<SupabaseDiscipline[]>([])
  const [lessons, setLessons] = useState<SupabaseLesson[]>([])

  // 1. Configurações da Avaliação
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || '')
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>(
    initialDisciplineId || '',
  )
  const [scopeType, setScopeType] = useState<AssessmentScopeType>('discipline_final')
  const [selectedLessonId, setSelectedLessonId] = useState<string>('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [maxScore, setMaxScore] = useState<number | string>(10)
  const [passingScore, setPassingScore] = useState<number | string>(7)
  const [maxAttempts, setMaxAttempts] = useState<number | string>(3)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | string>(30)

  // 2. Construtor de Questões (Array de questões)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([
    {
      id: 'q-initial-1',
      sequence_order: 1,
      statement:
        'Qual a principal responsabilidade do empregador no modelo W-2 em relação aos impostos?',
      points: 5,
      feedback:
        'No modelo W-2, o empregador retém os impostos federais, estaduais e a taxa FICA diretamente no contracheque do funcionário.',
      is_expanded: true,
      options: [
        {
          id: 'opt-init-1',
          option_letter: 'A',
          text: 'Reter impostos federais e taxa FICA diretamente no contracheque do trabalhador.',
          is_correct: true,
        },
        {
          id: 'opt-init-2',
          option_letter: 'B',
          text: 'Pagar o salário sem qualquer desconto de tributos.',
          is_correct: false,
        },
        {
          id: 'opt-init-3',
          option_letter: 'C',
          text: 'Exigir que o empregado faça o recolhimento via formulário 1099.',
          is_correct: false,
        },
        {
          id: 'opt-init-4',
          option_letter: 'D',
          text: 'Não emitir comprovante de rendimentos no fim do ano fiscal.',
          is_correct: false,
        },
      ],
    },
    {
      id: 'q-initial-2',
      sequence_order: 2,
      statement:
        'Qual o adicional mínimo obrigatório para horas extras (overtime) além de 40 horas semanais segundo a FLSA?',
      points: 5,
      feedback:
        'A regra federal Time and a Half prevê pagamento de no mínimo 1.5 vezes a hora normal trabalhada.',
      is_expanded: false,
      options: [
        {
          id: 'opt-init-5',
          option_letter: 'A',
          text: 'Acréscimo de 50% (1.5x a hora normal - Time and a Half).',
          is_correct: true,
        },
        {
          id: 'opt-init-6',
          option_letter: 'B',
          text: 'Acréscimo de 10% apenas se o empregador concordar.',
          is_correct: false,
        },
        {
          id: 'opt-init-7',
          option_letter: 'C',
          text: 'O mesmo valor da hora normal sem adicional.',
          is_correct: false,
        },
        {
          id: 'opt-init-8',
          option_letter: 'D',
          text: 'Compensação apenas em dias de folga no mês seguinte.',
          is_correct: false,
        },
      ],
    },
  ])

  // Estados de Validação e Submissão
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Carrega cursos, disciplinas e aulas
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedCourses, loadedDisciplines, loadedLessons] = await Promise.all([
          courseService.getCourses(),
          curriculumService.getDisciplines(),
          lessonService.getLessons(),
        ])
        setCourses(loadedCourses)
        setDisciplines(loadedDisciplines)
        setLessons(loadedLessons)

        if (!selectedCourseId && loadedCourses.length > 0) {
          setSelectedCourseId(loadedCourses[0].id)
        }
        if (!selectedDisciplineId && loadedDisciplines.length > 0) {
          setSelectedDisciplineId(loadedDisciplines[0].id)
        }
        if (loadedLessons.length > 0) {
          setSelectedLessonId(loadedLessons[0].id)
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      }
    }
    loadData()
  }, [])

  // Carrega avaliação existente caso esteja em modo de edição
  useEffect(() => {
    if (!assessmentId) return
    const fetchAssessment = async () => {
      try {
        const data = await assessmentService.getAssessmentById(assessmentId)
        if (data) {
          setTitle(data.title)
          setDescription(data.description || '')
          setSelectedCourseId(data.course_id)
          setSelectedDisciplineId(data.discipline_id)
          setScopeType(data.scope_type)
          if (data.lesson_id) setSelectedLessonId(data.lesson_id)
          setMaxScore(data.max_score)
          setPassingScore(data.passing_score)
          setMaxAttempts(data.max_attempts)
          if (data.time_limit_minutes) setTimeLimitMinutes(data.time_limit_minutes)
          setQuestions(data.questions)
        }
      } catch (err) {
        console.error('Erro ao carregar avaliação:', err)
        showToast('Erro ao carregar avaliação do banco.')
      }
    }
    fetchAssessment()
  }, [assessmentId])

  // Filtra as aulas da disciplina/curso selecionado
  const availableLessons = lessons.filter(
    (l) =>
      (!selectedCourseId || l.course_id === selectedCourseId) &&
      (!selectedDisciplineId || l.discipline_id === selectedDisciplineId),
  )

  // Estatísticas de Pontos
  const totalQuestionsPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0)
  const maxScoreNumber = Number(maxScore) || 10
  const pointsDiscrepancy = totalQuestionsPoints !== maxScoreNumber

  // Ação: Adicionar Nova Questão
  const handleAddNewQuestion = () => {
    const newQuestion: AssessmentQuestion = {
      id: `q-${Date.now()}-${questions.length + 1}`,
      sequence_order: questions.length + 1,
      statement: '',
      points: 2.5,
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

  // Ação: Excluir Questão
  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      showToast('A avaliação deve conter no mínimo 1 questão.')
      return
    }
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

  // Validação
  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!title.trim()) {
      errs.title = 'O título da avaliação é obrigatório.'
    }
    if (!selectedCourseId) errs.course = 'Selecione o curso.'
    if (!selectedDisciplineId) errs.discipline = 'Selecione a disciplina.'

    if (scopeType === 'lesson_specific' && !selectedLessonId) {
      errs.lesson = 'Selecione a aula específica à qual o quiz pertence.'
    }

    if (questions.length === 0) {
      errs.questions = 'Adicione ao menos uma questão à avaliação.'
    }

    // Validação das questões e gabarito
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
    return Object.keys(errs).length === 0
  }

  // Salvar Avaliação no Supabase
  const handleSaveAssessment = async () => {
    if (!validate()) {
      const firstError = Object.values(errors)[0] || 'Corrija os campos pendentes.'
      showToast(firstError)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        course_id: selectedCourseId,
        discipline_id: selectedDisciplineId,
        scope_type: scopeType,
        lesson_id: scopeType === 'lesson_specific' ? selectedLessonId : undefined,
        title: title.trim(),
        description: description.trim(),
        max_score: Number(maxScore),
        passing_score: Number(passingScore),
        max_attempts: Number(maxAttempts),
        time_limit_minutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
        questions,
      }

      let saved: SupabaseAssessment
      if (assessmentId) {
        saved = await assessmentService.updateAssessment(assessmentId, payload)
        showToast(`Avaliação "${saved.title}" atualizada com sucesso no Supabase!`)
      } else {
        saved = await assessmentService.createAssessment(payload)
        showToast(`Nova avaliação "${saved.title}" cadastrada no Supabase!`)
      }

      onSaveSuccess(saved)
    } catch (err) {
      console.error('Erro ao salvar avaliação:', err)
      showToast('Falha ao gravar avaliação no banco de dados.')
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

      {/* ================= 1. CABEÇALHO & CONFIGURAÇÕES DA AVALIAÇÃO ================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <FileQuestion className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Painel do Professor • Avaliações & Quizzes
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {isEditing ? 'Editar Avaliação' : 'Criar Nova Avaliação / Quiz'}
              </h1>
            </div>
          </div>

          {/* Botões de Ação no Topo Direito */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
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

        {/* Linha 1: Curso, Disciplina e Vínculo (Final da Disciplina ou Aula Específica) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Curso */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Curso Vinculado <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Disciplina */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Disciplina Vinculada <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDisciplineId}
              onChange={(e) => setSelectedDisciplineId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vínculo (Final da Disciplina ou Após Aula Específica) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Aplicação da Prova <span className="text-red-500">*</span>
            </label>
            <select
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value as AssessmentScopeType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-blue-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="discipline_final">🎓 Final da Disciplina (Exame)</option>
              <option value="lesson_specific">📌 Após uma Aula Específica (Quiz)</option>
            </select>
          </div>

          {/* Segundo Select Condicional se for "Após uma Aula Específica" */}
          {scopeType === 'lesson_specific' && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Escolha a Aula Específica <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {availableLessons.length === 0 ? (
                  <option value="">Nenhuma aula cadastrada nesta disciplina</option>
                ) : (
                  availableLessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      Aula {l.sequence_order}: {l.title}
                    </option>
                  ))
                )}
              </select>
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
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Prova Final de Legislação Trabalhista ou Quiz Aula 1: W-2 vs 1099"
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
            {/* Botão de Produtividade: Distribuir Pontos */}
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

            {/* Botão Destaque: "+ Adicionar Nova Questão" */}
            <button
              type="button"
              onClick={handleAddNewQuestion}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#C59E5D]/25 transition-all transform active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Adicionar Nova Questão</span>
            </button>
          </div>
        </div>

        {/* Lista de Questões em Accordion Cards */}
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

        {/* Botão Inferior para Adicionar Nova Questão */}
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
      </div>

      {/* Barra de Ação Inferior */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Ao salvar, a avaliação e suas {questions.length} questões com gabarito serão gravadas no Supabase (tabelas <strong>assessments</strong>, <strong>questions</strong> e <strong>options</strong>).
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveAssessment}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Gravando no Banco...</span>
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
    </div>
  )
}
