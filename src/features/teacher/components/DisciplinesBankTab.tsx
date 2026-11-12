import React, { useState } from 'react'
import {
  Plus,
  Search,
  BookOpen,
  Clock,
  Hash,
  Pencil,
  Trash2,
  Layers,
  FileText,
} from 'lucide-react'
import type { SupabaseDiscipline } from '../../../types'

interface DisciplinesBankTabProps {
  disciplines: SupabaseDiscipline[]
  loading: boolean
  onOpenCreate: () => void
  onOpenEdit: (discipline: SupabaseDiscipline) => void
  onOpenDelete: (discipline: SupabaseDiscipline) => void
  onNavigateToCurriculum: () => void
}

export const DisciplinesBankTab: React.FC<DisciplinesBankTabProps> = ({
  disciplines,
  loading,
  onOpenCreate,
  onOpenEdit,
  onOpenDelete,
  onNavigateToCurriculum,
}) => {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const filtered = disciplines.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      (d.code && d.code.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      {/* Barra Superior da Aba com Pesquisa e Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Pesquisa */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, código ou ementa da matéria..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-xs"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex bg-white border border-slate-200 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tabela
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-blue-500/25 transition-all transform active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova Disciplina</span>
          </button>
        </div>
      </div>

      {/* Listagem */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Consultando tabela disciplines no Supabase...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nenhuma matéria encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não encontramos matérias para o termo pesquisado. Crie uma nova disciplina ou limpe a busca.
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Primeira Disciplina
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5">
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
                    <Hash className="w-3 h-3 text-slate-400" />
                    {item.code || 'DISC'}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    <Clock className="w-3 h-3 text-blue-600" />
                    {item.estimated_hours ?? 12}h estimadas
                  </span>
                </div>

                {/* Título da Disciplina */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {item.name}
                </h3>

                {/* Ementa / Descrição */}
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    <FileText className="w-3 h-3" />
                    Ementa / Conteúdo
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Rodapé com Ações: Editar e Excluir */}
              <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Criada em {new Date(item.created_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenEdit(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenDelete(item)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir disciplina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Modo Tabela */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Código</th>
                  <th className="px-5 py-3.5">Nome da Disciplina</th>
                  <th className="px-5 py-3.5">Ementa / Resumo</th>
                  <th className="px-5 py-3.5">Carga Horária</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-700 uppercase">
                      {item.code || 'DISC'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 max-w-xs">{item.name}</td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-md truncate">
                      {item.description}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {item.estimated_hours ?? 12} horas
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEdit(item)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Banner Informativo de Atalho para Montagem da Grade */}
      <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-white rounded-2xl border border-blue-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Pronto para estruturar o fluxo de aprendizado?
            </h4>
            <p className="text-[11px] text-slate-500">
              Vincule essas matérias a qualquer curso cadastrado e defina a ordem sequencial das aulas.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNavigateToCurriculum}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
        >
          Ir para Montagem da Grade →
        </button>
      </div>
    </div>
  )
}
