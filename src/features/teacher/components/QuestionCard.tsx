import React from 'react'
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  MessageSquare,
  Copy,
  GripVertical,
} from 'lucide-react'
import type { AssessmentQuestion, AssessmentOption } from '../../../types'

interface QuestionCardProps {
  question: AssessmentQuestion
  index: number
  totalQuestions: number
  onUpdate: (updatedQuestion: AssessmentQuestion) => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleExpand: () => void
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  totalQuestions,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleExpand,
}) => {
  const isExpanded = question.is_expanded !== false // Aberto por padrão

  // Atualiza campo raiz da questão
  const handleFieldChange = (field: keyof AssessmentQuestion, value: any) => {
    onUpdate({
      ...question,
      [field]: value,
    })
  }

  // Define alternativa como correta (Gabarito único de múltipla escolha)
  const handleSelectCorrectOption = (optionId: string) => {
    const updatedOptions = question.options.map((opt) => ({
      ...opt,
      is_correct: opt.id === optionId,
    }))
    onUpdate({
      ...question,
      options: updatedOptions,
    })
  }

  // Atualiza o texto de uma alternativa
  const handleOptionTextChange = (optionId: string, text: string) => {
    const updatedOptions = question.options.map((opt) =>
      opt.id === optionId ? { ...opt, text } : opt,
    )
    onUpdate({
      ...question,
      options: updatedOptions,
    })
  }

  // Adiciona nova alternativa (A, B, C, D, E...)
  const handleAddOption = () => {
    const nextLetter = String.fromCharCode(65 + question.options.length)
    const newOption: AssessmentOption = {
      id: `opt-${Date.now()}-${question.options.length}`,
      option_letter: nextLetter,
      text: '',
      is_correct: false,
    }
    onUpdate({
      ...question,
      options: [...question.options, newOption],
    })
  }

  // Remove alternativa
  const handleRemoveOption = (optionId: string) => {
    if (question.options.length <= 2) return // Mínimo 2 opções
    const filtered = question.options.filter((opt) => opt.id !== optionId)
    // Reindexa as letras (A, B, C, D...)
    const reindexed = filtered.map((opt, idx) => ({
      ...opt,
      option_letter: String.fromCharCode(65 + idx),
    }))
    // Se a removida era a correta, define a primeira como correta
    const hasCorrect = reindexed.some((opt) => opt.is_correct)
    if (!hasCorrect && reindexed.length > 0) {
      reindexed[0].is_correct = true
    }
    onUpdate({
      ...question,
      options: reindexed,
    })
  }

  const correctOption = question.options.find((opt) => opt.is_correct)

  return (
    <div
      className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs ${
        isExpanded
          ? 'border-blue-300 ring-2 ring-blue-500/10 shadow-md'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* ================= CABEÇALHO DO CARD (ACCORDION TRIGGER) ================= */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-100">
        <div
          onClick={onToggleExpand}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
        >
          <div className="text-slate-300 hover:text-slate-500 p-0.5">
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            Q{index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Questão {index + 1} de {totalQuestions}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                {question.points} {question.points === 1 ? 'ponto' : 'pontos'}
              </span>
              {correctOption && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Gabarito: {correctOption.option_letter}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 truncate mt-0.5">
              {question.statement || 'Clique para redigir o enunciado desta questão...'}
            </p>
          </div>
        </div>

        {/* Ações da Questão no Cabeçalho */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onDuplicate}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
            title="Duplicar esta questão"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Excluir questão"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-colors cursor-pointer"
            aria-label={isExpanded ? 'Recolher questão' : 'Expandir questão'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ================= CORPO EXPANSÍVEL DA QUESTÃO ================= */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
          {/* Enunciado e Pontuação */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enunciado da Questão <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Pontuação:</span>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  max={100}
                  value={question.points}
                  onChange={(e) =>
                    handleFieldChange('points', Math.max(0.5, Number(e.target.value) || 1))
                  }
                  className="w-20 px-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-xs text-slate-400">pts</span>
              </div>
            </div>

            <textarea
              rows={3}
              value={question.statement}
              onChange={(e) => handleFieldChange('statement', e.target.value)}
              placeholder="Digite a pergunta ou situação-problema que o aluno deverá responder..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all leading-relaxed"
            />
          </div>

          {/* LISTA DE ALTERNATIVAS (MÚLTIPLA ESCOLHA) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Alternativas de Resposta
                </h4>
                <p className="text-[11px] text-slate-400">
                  Clique no rádio para marcar a resposta correta (gabarito).
                </p>
              </div>

              <span className="text-[11px] font-semibold text-slate-500">
                {question.options.length} alternativas
              </span>
            </div>

            {/* Alternativas */}
            <div className="space-y-2.5">
              {question.options.map((opt) => (
                <div
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    opt.is_correct
                      ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Botão de Rádio para Marcar Gabarito */}
                  <button
                    type="button"
                    onClick={() => handleSelectCorrectOption(opt.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                      opt.is_correct
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={opt.is_correct ? 'Alternativa correta' : 'Marcar como gabarito correto'}
                  >
                    {opt.is_correct ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{opt.option_letter}</span>
                  </button>

                  {/* Input do Texto da Alternativa */}
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                    placeholder={`Escreva o texto da alternativa ${opt.option_letter}...`}
                    className={`flex-1 px-3 py-1.5 text-xs sm:text-sm bg-transparent border-0 focus:outline-none text-slate-900 ${
                      opt.is_correct ? 'font-semibold text-emerald-950' : ''
                    }`}
                  />

                  {/* Badge Gabarito */}
                  {opt.is_correct && (
                    <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-800">
                      Gabarito
                    </span>
                  )}

                  {/* Botão Remover Alternativa */}
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(opt.id)}
                      className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Excluir alternativa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Botão para Adicionar Nova Alternativa */}
            {question.options.length < 8 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Adicionar Alternativa ({String.fromCharCode(65 + question.options.length)})</span>
              </button>
            )}
          </div>

          {/* FEEDBACK AUTOMÁTICO (OPCIONAL) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Feedback Pedagógico e Justificativa (Opcional)</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Explicação detalhada que o aluno lerá após submeter a resposta para aprender com os erros e acertos.
            </p>
            <textarea
              rows={2}
              value={question.feedback || ''}
              onChange={(e) => handleFieldChange('feedback', e.target.value)}
              placeholder="Ex: A resposta correta é a letra B porque a lei FLSA determina que todo trabalho prestado deve ser remunerado integralmente..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      )}
    </div>
  )
}
