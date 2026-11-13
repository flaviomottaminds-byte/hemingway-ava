import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  GripVertical,
  CheckCircle2,
  BookOpen,
  Search,
  Clock,
  Sparkles,
  Layers,
  Save,
  RotateCcw,
} from 'lucide-react'
import type { SupabaseCourse, SupabaseDiscipline } from '../../../types'
import { curriculumService } from '../../../services/curriculumService'

interface CurriculumBuilderTabProps {
  courses: SupabaseCourse[]
  disciplines: SupabaseDiscipline[]
  selectedCourseId: string
  onSelectCourseId: (id: string) => void
  onCurriculumSaved: () => void
}

export const CurriculumBuilderTab: React.FC<CurriculumBuilderTabProps> = ({
  courses,
  disciplines,
  selectedCourseId,
  onSelectCourseId,
  onCurriculumSaved,
}) => {
  // Lista de disciplinas atualmente vinculadas ao curso selecionado (ordenadas)
  const [courseDisciplines, setCourseDisciplines] = useState<SupabaseDiscipline[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Filtros de busca nas colunas
  const [searchAvailable, setSearchAvailable] = useState('')
  const [searchCourse, setSearchCourse] = useState('')

  // Notificação local
  const [feedback, setFeedback] = useState<string | null>(null)

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3500)
  }

  // Carrega as disciplinas vinculadas ao curso selecionado
  const loadCourseCurriculum = async (courseId: string) => {
    if (!courseId) {
      setCourseDisciplines([])
      return
    }
    setLoadingLinks(true)
    try {
      const linked = await curriculumService.getCourseDisciplines(courseId)
      setCourseDisciplines(linked)
      setHasChanges(false)
    } catch (err) {
      console.error('Erro ao carregar grade do curso:', err)
      showFeedback('Erro ao consultar grade do curso.')
    } finally {
      setLoadingLinks(false)
    }
  }

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseCurriculum(selectedCourseId)
    }
  }, [selectedCourseId])

  const currentCourse = courses.find((c) => c.id === selectedCourseId)

  // IDs já vinculados
  const linkedIds = new Set(courseDisciplines.map((d) => d.id))

  // Disciplinas disponíveis = banco geral - já vinculadas ao curso
  const availableDisciplines = disciplines.filter(
    (d) =>
      !linkedIds.has(d.id) &&
      (d.name.toLowerCase().includes(searchAvailable.toLowerCase()) ||
        d.description.toLowerCase().includes(searchAvailable.toLowerCase()) ||
        (d.code && d.code.toLowerCase().includes(searchAvailable.toLowerCase()))),
  )

  // Disciplinas do curso filtradas por busca
  const displayCourseDisciplines = courseDisciplines.filter(
    (d) =>
      d.name.toLowerCase().includes(searchCourse.toLowerCase()) ||
      d.description.toLowerCase().includes(searchCourse.toLowerCase()) ||
      (d.code && d.code.toLowerCase().includes(searchCourse.toLowerCase())),
  )

  // Ação: Mover disciplina para a direita (Adicionar ao curso)
  const handleAddDiscipline = (disc: SupabaseDiscipline) => {
    setCourseDisciplines((prev) => [...prev, disc])
    setHasChanges(true)
  }

  // Ação: Mover todas as disponíveis filtradas
  const handleAddAll = () => {
    if (availableDisciplines.length === 0) return
    setCourseDisciplines((prev) => [...prev, ...availableDisciplines])
    setHasChanges(true)
  }

  // Ação: Remover disciplina do curso (Mover para a esquerda)
  const handleRemoveDiscipline = (discId: string) => {
    setCourseDisciplines((prev) => prev.filter((d) => d.id !== discId))
    setHasChanges(true)
  }

  // Ação: Remover todas as disciplinas do curso
  const handleRemoveAll = () => {
    if (courseDisciplines.length === 0) return
    setCourseDisciplines([])
    setHasChanges(true)
  }

  // Reordenação: Mover para cima
  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setCourseDisciplines((prev) => {
      const copy = [...prev]
      const temp = copy[index - 1]
      copy[index - 1] = copy[index]
      copy[index] = temp
      return copy
    })
    setHasChanges(true)
  }

  // Reordenação: Mover para baixo
  const handleMoveDown = (index: number) => {
    if (index >= courseDisciplines.length - 1) return
    setCourseDisciplines((prev) => {
      const copy = [...prev]
      const temp = copy[index + 1]
      copy[index + 1] = copy[index]
      copy[index] = temp
      return copy
    })
    setHasChanges(true)
  }

  // Salvar Grade Curricular no Supabase
  const handleSaveCurriculum = async () => {
    if (!selectedCourseId) return
    setSaving(true)
    try {
      const orderedIds = courseDisciplines.map((d) => d.id)
      const res = await curriculumService.saveCourseCurriculum(selectedCourseId, orderedIds)
      setHasChanges(false)
      if (res.isLive) {
        showFeedback('🎉 Grade curricular salva com sucesso no Supabase (tabela course_disciplines)!')
      } else if (res.error) {
        showFeedback(`⚠️ Supabase: ${res.error}`)
      } else {
        showFeedback('Grade curricular e sequência salvas com sucesso!')
      }
      onCurriculumSaved()
    } catch (err) {
      console.error('Erro ao salvar grade curricular:', err)
      showFeedback('Falha ao sincronizar com o banco.')
    } finally {
      setSaving(false)
    }
  }

  // Carga horária somada das disciplinas vinculadas
  const totalCurriculumHours = courseDisciplines.reduce(
    (acc, d) => acc + (d.estimated_hours || 12),
    0,
  )

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{feedback}</span>
        </div>
      )}

      {/* Seletor do Curso no Topo */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <label
              htmlFor="course-select"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5"
            >
              Selecione o Curso para Montar a Grade Curricular
            </label>
            <div className="text-xs text-slate-400">
              Escolha um curso cadastrado no AVA para gerenciar os módulos e a sequência de estudos.
            </div>
          </div>
        </div>

        <div className="w-full md:w-80">
          <select
            id="course-select"
            value={selectedCourseId}
            onChange={(e) => onSelectCourseId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer shadow-2xs"
          >
            {courses.length === 0 ? (
              <option value="">Nenhum curso cadastrado</option>
            ) : (
              courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.workload_hours}h)
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Resumo do Curso Selecionado */}
      {currentCourse && (
        <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-200 border border-blue-400/20">
                  {currentCourse.status === 'published' ? '🟢 Publicado' : '🟡 Rascunho'}
                </span>
                <span className="text-xs text-slate-300">
                  Carga do Curso: {currentCourse.workload_hours}h
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                {currentCourse.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-200 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4">
            <div>
              <span className="block text-[11px] text-slate-400">Disciplinas Vinculadas</span>
              <span className="text-base font-bold text-white">
                {courseDisciplines.length} matérias
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-400">Carga Cumulativa</span>
              <span className="text-base font-bold text-emerald-400">
                {totalCurriculumHours}h de aula
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interface de Transferência (Transfer List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ================= COLUNA ESQUERDA: DISCIPLINAS DISPONÍVEIS ================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-[540px]">
          {/* Header da Coluna */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Disciplinas Disponíveis
                </h4>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                {availableDisciplines.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Banco geral de matérias prontas para vincular.
            </p>

            {/* Campo de Busca */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
                placeholder="Filtrar matérias disponíveis..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Lista de Itens */}
          <div className="p-3 overflow-y-auto flex-1 space-y-2">
            {loadingLinks ? (
              <div className="p-10 text-center text-xs text-slate-400">Carregando dados...</div>
            ) : availableDisciplines.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {disciplines.length === 0
                  ? 'Nenhuma matéria cadastrada no banco geral.'
                  : 'Todas as matérias do banco já estão vinculadas a este curso!'}
              </div>
            ) : (
              availableDisciplines.map((disc) => (
                <div
                  key={disc.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between gap-2 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {disc.code || 'MOD'}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {disc.estimated_hours}h
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 mt-1 truncate">
                      {disc.name}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {disc.description}
                    </p>
                  </div>

                  {/* Botão Individual de Adicionar */}
                  <button
                    type="button"
                    onClick={() => handleAddDiscipline(disc)}
                    className="p-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl transition-all cursor-pointer shrink-0"
                    title="Adicionar à grade curricular"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer da Coluna */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{availableDisciplines.length} matérias disponíveis</span>
            {availableDisciplines.length > 0 && (
              <button
                type="button"
                onClick={handleAddAll}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                Mover Todas →
              </button>
            )}
          </div>
        </div>

        {/* ================= CONTROLES CENTRAIS (TRANSFER BUTTONS) ================= */}
        <div className="lg:col-span-2 flex lg:flex-col items-center justify-center gap-3 py-2">
          <button
            type="button"
            onClick={handleAddAll}
            disabled={availableDisciplines.length === 0}
            className="flex-1 lg:w-full py-2.5 px-3 bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-xs font-semibold rounded-2xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Adicionar todas as disponíveis à grade"
          >
            <span>Vincular Todas</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-600 hidden lg:inline" />
          </button>

          <button
            type="button"
            onClick={handleRemoveAll}
            disabled={courseDisciplines.length === 0}
            className="flex-1 lg:w-full py-2.5 px-3 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-300 text-slate-700 text-xs font-semibold rounded-2xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Remover todas da grade do curso"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-red-500 hidden lg:inline" />
            <span>Remover Todas</span>
          </button>
        </div>

        {/* ================= COLUNA DIREITA: DISCIPLINAS DO CURSO (ORDENADAS) ================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-[540px]">
          {/* Header da Coluna */}
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Disciplinas do Curso (Sequência)
                </h4>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                {courseDisciplines.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Ordem exata em que o aluno verá os módulos na sala de aula.
            </p>

            {/* Campo de Busca */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchCourse}
                onChange={(e) => setSearchCourse(e.target.value)}
                placeholder="Filtrar grade do curso..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Lista de Itens Ordenáveis com Alça e Botões de Cima/Baixo */}
          <div className="p-3 overflow-y-auto flex-1 space-y-2">
            {loadingLinks ? (
              <div className="p-10 text-center text-xs text-slate-400">Carregando dados...</div>
            ) : displayCourseDisciplines.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <Layers className="w-5 h-5" />
                </div>
                Nenhuma disciplina vinculada a este curso ainda. Escolha matérias da coluna esquerda e clique na seta para montar a grade.
              </div>
            ) : (
              displayCourseDisciplines.map((disc) => {
                const realIndex = courseDisciplines.findIndex((d) => d.id === disc.id)
                const isFirst = realIndex === 0
                const isLast = realIndex === courseDisciplines.length - 1

                return (
                  <div
                    key={disc.id}
                    className="p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-400 shadow-2xs transition-all flex items-center gap-2 group"
                  >
                    {/* Alça de Arrasto (Drag Handle) */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 p-1"
                      title="Alça de arrasto da sequência"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Número da Ordem Sequencial */}
                    <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {realIndex + 1}º
                    </div>

                    {/* Dados da Disciplina */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {disc.code || 'MOD'}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {disc.estimated_hours}h
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                        {disc.name}
                      </h5>
                    </div>

                    {/* Ações de Reordenação e Remoção */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Mover para Cima */}
                      <button
                        type="button"
                        onClick={() => handleMoveUp(realIndex)}
                        disabled={isFirst}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Mover para Baixo */}
                      <button
                        type="button"
                        onClick={() => handleMoveDown(realIndex)}
                        disabled={isLast}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Remover da Grade (Volta para Disponíveis) */}
                      <button
                        type="button"
                        onClick={() => handleRemoveDiscipline(disc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-1"
                        title="Remover da grade deste curso"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer da Coluna */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Sequência definida: {courseDisciplines.length} módulos</span>
            {hasChanges && (
              <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 animate-pulse">
                • Alterações não salvas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Ação Inferior: Salvar Grade Curricular */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-500">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Ao salvar, os vínculos e a ordem sequencial são gravados na tabela{' '}
            <strong>course_disciplines</strong> do Supabase.
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {hasChanges && (
            <button
              type="button"
              onClick={() => loadCourseCurriculum(selectedCourseId)}
              disabled={saving}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Descartar Alterações</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveCurriculum}
            disabled={saving || !hasChanges}
            className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#C59E5D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#0F1B2F]/30 border-t-[#0F1B2F] rounded-full animate-spin" />
                <span>Gravando no Supabase...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Grade Curricular</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
