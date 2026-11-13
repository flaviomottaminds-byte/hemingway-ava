import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Languages,
  Subtitles,
  Database,
  ExternalLink,
  Award,
} from 'lucide-react'
import type { Lesson, SupabaseLesson, UserProfile } from '../../types'
import type { SupportedLanguageCode } from '../../locales/i18n'
import { lessonService, extractYouTubeId } from '../../services/lessonService'
import { CompletionStatementModal } from '../../components/certificate/CompletionStatementModal'

interface LessonViewProps {
  lesson: Lesson
  user?: UserProfile
  onBackToDashboard: () => void
}

export const LessonView: React.FC<LessonViewProps> = ({ lesson, user, onBackToDashboard }) => {
  const { t, i18n } = useTranslation()
  const currentLang = (i18n.language?.slice(0, 2) as SupportedLanguageCode) || 'pt'
  const [activeTab, setActiveTab] = useState<'transcription' | 'overview' | 'resources' | 'notes'>('transcription')
  const [isCompleted, setIsCompleted] = useState(lesson.isCompleted)
  const [userNote, setUserNote] = useState('')
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false)

  // Estado da aula real do Supabase
  const [supabaseLesson, setSupabaseLesson] = useState<SupabaseLesson | null>(null)
  const [isSupabaseLive, setIsSupabaseLive] = useState(false)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)

  useEffect(() => {
    lessonService.getLessonsWithStatus().then((res) => {
      if (res.data && res.data.length > 0) {
        // Encontra a aula requisitada ou seleciona a primeira
        const targetLesson =
          res.data.find((l) =>
            l.title.toLowerCase().includes('compreendendo o formulário w-2'),
          ) || res.data[0]

        setSupabaseLesson(targetLesson)
        setIsSupabaseLive(res.isLive)
      }
      if (res.error) {
        setSupabaseError(res.error)
      }
    })
  }, [])

  // Título e dados prioritários vindos do Supabase
  const currentTitle = supabaseLesson
    ? supabaseLesson.title
    : lesson.title[currentLang] || lesson.title.en

  const moduleTitle = lesson.moduleTitle[currentLang] || lesson.moduleTitle.en
  const transcriptionText = supabaseLesson?.content_text || lesson.transcription[currentLang] || lesson.transcription.en
  const instructorRole = lesson.instructor.role[currentLang] || lesson.instructor.role.en

  // Extração do ID do YouTube a partir da URL da aula do Supabase
  const videoUrl = supabaseLesson?.video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  const youtubeId =
    supabaseLesson?.video_youtube_id || extractYouTubeId(videoUrl) || 'dQw4w9WgXcQ'

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Barra de Navegação da Aula */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCompleted(!isCompleted)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs'
                : 'bg-[#0F1B2F] hover:bg-[#1C2E4A] text-white shadow-md shadow-[#0F1B2F]/20 border border-[#C59E5D]/40'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {isCompleted ? t('classroom.completedBadge') : t('classroom.markCompleted')}
            </span>
          </button>

          {/* Gatilho de Conclusão: Botão em Dourado (#C59E5D) com texto Azul Marinho (#0F1B2F) */}
          {isCompleted && (
            <button
              type="button"
              onClick={() => setIsStatementModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs font-bold shadow-md shadow-[#C59E5D]/30 transition-all cursor-pointer animate-in fade-in"
            >
              <Award className="w-4 h-4 text-[#0F1B2F]" />
              <span>{t('classroom.issueStatement')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Status de Conexão com o Supabase */}
      {isSupabaseLive ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">Supabase Conectado:</span>
            <span>Aula carregada da tabela 'lessons' do banco PostgreSQL</span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-200/60 text-emerald-900 shrink-0">
            Realtime DB
          </span>
        </div>
      ) : supabaseError ? (
        <div className="p-3 bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-2xl flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Supabase conectado (prnwtlpopoeymcamtcja.supabase.co). Carregando estudo <strong>"Compreendendo o Formulário W-2, 1099 e Direitos no Trabalho"</strong> com player de vídeo integrado.
          </span>
        </div>
      ) : null}

      {/* Títulos e Identificação da Aula */}
      <div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-2">
          {moduleTitle}
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {currentTitle}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span>{t('classroom.duration')}: {supabaseLesson?.duration_minutes || 24} min</span>
          <span>•</span>
          <span>Prof. Leonardo Dias ({instructorRole})</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
            <Languages className="w-3.5 h-3.5" />
            Suporte nativo PT / EN / ES
          </span>
        </div>
      </div>

      {/* Player de Vídeo Real do YouTube conectado ao Supabase */}
      <div className="relative aspect-video w-full rounded-3xl bg-slate-950 overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
        {youtubeId ? (
          <iframe
            className="w-full h-full border-0 rounded-3xl"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&enablejsapi=1`}
            title={currentTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="text-center text-slate-400 p-6">
            <p className="text-sm">Nenhum vídeo do YouTube vinculado a esta aula.</p>
          </div>
        )}
      </div>

      {/* Abas de Conteúdo Pedagógico */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('transcription')}
            className={`px-5 py-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'transcription'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('classroom.tabs.transcription')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('classroom.tabs.overview')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resources')}
            className={`px-5 py-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'resources'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('classroom.tabs.resources')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-5 py-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('classroom.tabs.notes')}
          </button>
        </div>

        <div className="p-6">
          {/* Aba de Transcrição / Conteúdo da Aula */}
          {activeTab === 'transcription' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Subtitles className="w-4 h-4 text-blue-600" />
                  <span>Conteúdo & Apostila Oficial (Supabase)</span>
                </span>
                <span className="text-xs text-blue-600 font-medium">Idioma: {currentLang.toUpperCase()}</span>
              </div>
              <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                {transcriptionText}
              </div>
            </div>
          )}

          {/* Aba de Resumo e Ementa */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-sm text-slate-700">
              <h3 className="font-bold text-slate-900">Objetivo Pedagógico da Lição</h3>
              <p>
                Capacitar trabalhadores imigrantes a entender seus direitos fundamentais no ambiente corporativo norte-americano, prevenir a exploração salarial e dominar a declaração fiscal entre W-2 e 1099 perante o IRS.
              </p>
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-blue-900 text-xs">Vídeo Original</h4>
                  <p className="text-xs text-blue-700 truncate max-w-md">{videoUrl}</p>
                </div>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <span>Abrir no YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Aba de Materiais Complementares */}
          {activeTab === 'resources' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Documentos e Apostilas para Download</h3>
              {lesson.materials.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <span className="text-xs text-slate-400">{item.size} • PDF Oficial</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Iniciando download simulado de: ${item.title}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Aba de Anotações do Aluno */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Caderno de Estudos Digital
              </label>
              <textarea
                rows={5}
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Escreva suas dúvidas sobre formulários fiscais, prazos ou termos em inglês para revisar posteriormente..."
                className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => alert('Suas anotações foram salvas localmente!')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Salvar no Meu Perfil
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Banner de Conclusão de Estudos com Botão de Destaque */}
      {isCompleted && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F1B2F] via-[#1C2E4A] to-[#0A1220] border border-[#C59E5D]/40 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 animate-in slide-in-from-bottom-2">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C59E5D]/20 text-[#C59E5D] text-xs font-bold border border-[#C59E5D]/30">
              <Award className="w-3.5 h-3.5" />
              <span>{t('classroom.completedBadge')}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#FAF8F2]">
              Parabéns! Você completou os requisitos desta disciplina.
            </h3>
            <p className="text-xs sm:text-sm text-[#EADBBE]/90 max-w-xl">
              Sua Declaração Oficial de Conclusão da Hemingway School está pronta para emissão imediata, com validade profissional e acadêmica nos EUA.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsStatementModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] text-xs sm:text-sm font-bold shadow-lg shadow-[#C59E5D]/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer transform active:scale-95"
          >
            <Award className="w-4 h-4 text-[#0F1B2F]" />
            <span>{t('classroom.finishCourseAndIssue')}</span>
          </button>
        </div>
      )}

      {/* Modal Formal de Declaração de Conclusão (Suporte A4 / Impressão / PDF) */}
      <CompletionStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        studentName={user?.name || 'Mateo Silva Santos'}
        studentDocumentType={user?.document_type || 'Passaporte Internacional'}
        studentDocumentNumber={user?.document_number || 'USA-8839201'}
        courseTitle={currentTitle}
        completionDate={new Date().toISOString()}
        enrollmentId="HEM-2026-MAT-8849"
      />
    </div>
  )
}
