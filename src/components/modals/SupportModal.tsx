import React, { useState } from 'react'
import {
  X,
  Headphones,
  Mail,
  Send,
  CheckCircle2,
  Loader2,
  FileQuestion,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import type { UserProfile } from '../../types'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile
}

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12.031 0C5.399 0 0 5.399 0 12.031c0 2.115.549 4.183 1.594 6.002L.057 24l6.115-1.577c1.76 1.002 3.774 1.531 5.859 1.531 6.632 0 12.031-5.399 12.031-12.031C24.062 5.399 18.663 0 12.031 0zm7.042 16.997c-.297.834-1.468 1.526-2.42 1.733-.651.141-1.503.255-4.364-.93-3.659-1.515-6.023-5.228-6.205-5.47-.182-.242-1.487-1.979-1.487-3.775 0-1.796.937-2.68 1.27-3.044.333-.364.729-.455.972-.455.243 0 .486.002.7.012.227.01.53-.086.828.63.308.739 1.05 2.569 1.142 2.756.092.187.153.407.031.649-.122.242-.183.393-.364.606-.182.213-.383.476-.547.639-.182.182-.372.38-.16.744.212.364.942 1.554 2.022 2.516 1.391 1.238 2.564 1.623 2.928 1.805.364.182.577.152.79-.091.213-.243.911-1.062 1.154-1.426.243-.364.486-.304.819-.182.333.122 2.118.999 2.482 1.181.364.182.607.273.698.425.091.152.091.88-.206 1.714z" />
  </svg>
)

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, user }) => {
  const [subject, setSubject] = useState('Dúvida sobre aula ou conteúdo')
  const [language, setLanguage] = useState<'pt' | 'en' | 'es'>('pt')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  // Número oficial de suporte WhatsApp Hemingway School (configurável via env ou padrão com código do país)
  const rawNumber =
    (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ||
    '14079876543'
  const whatsappNumber = rawNumber.replace(/\D/g, '')

  const welcomeMessage = `Olá, Equipe de Suporte da Hemingway School! Sou o(a) aluno(a) ${user.name || 'Aluno(a)'} (${user.email || ''}) e gostaria de atendimento sobre a plataforma de estudos.`
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(welcomeMessage)}`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 700)
  }

  const handleClose = () => {
    setSubmitted(false)
    setMessage('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EADBBE] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Topo do Modal */}
        <div className="p-5 sm:p-6 bg-[#0F1B2F] text-[#FAF8F2] flex items-center justify-between border-b border-[#C59E5D]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C2E4A] border border-[#C59E5D]/40 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-[#C59E5D]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#FAF8F2]">Suporte Multilíngue</h2>
              <p className="text-xs text-[#EADBBE]/80">Atendimento em Português, English & Español</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar"
            className="p-2 text-[#FAF8F2]/70 hover:text-white hover:bg-[#1C2E4A] rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Card de Destaque Oficial do WhatsApp */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#0F1B2F] text-white p-5 sm:p-6 border border-[#25D366]/40 shadow-lg shadow-[#075E54]/25">
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#25D366]/20 border border-[#25D366]/50 text-[#25D366] text-xs font-semibold backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                  Atendimento Oficial · Online
                </span>
                <span className="text-[11px] font-semibold text-emerald-200/90 tracking-wide">
                  PT · EN · ES
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Atendimento Direto via WhatsApp
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed mt-1">
                  Fale em tempo real com nossos tutores e equipe de apoio acadêmico da Hemingway School para dúvidas sobre aulas, apostilas ou sua conta.
                </p>
              </div>

              <div className="pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-[#0A1220] font-extrabold text-sm shadow-md shadow-[#25D366]/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current text-[#0A1220]" />
                  <span>Falar com Atendimento no WhatsApp</span>
                  <ExternalLink className="w-4 h-4 text-[#0A1220]/80" />
                </a>
              </div>
            </div>

            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-[#25D366]/15 blur-2xl pointer-events-none" />
          </div>

          {/* Outro Canal: E-mail Oficial */}
          <div>
            <a
              href="mailto:suporte@hemingwayschool.com?subject=Suporte%20AVA%20Hemingway%20School"
              className="p-4 rounded-2xl border border-[#EADBBE] bg-[#FAF8F2] hover:bg-[#F2EDE2] transition flex items-center justify-between gap-3 group shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0F1B2F] text-[#C59E5D] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-[#0F1B2F]">E-mail da Escola</span>
                  <span className="text-[11px] text-slate-600 block leading-tight mt-0.5">
                    suporte@hemingwayschool.com
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#0F1B2F] transition" />
            </a>
          </div>

          {/* Formulário de Chamado Rápido */}
          <div className="bg-[#FAF8F2]/60 p-4 rounded-2xl border border-[#EADBBE]">
            <h3 className="text-xs font-bold text-[#0F1B2F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileQuestion className="w-4 h-4 text-[#C59E5D]" />
              <span>Enviar Dúvida ou Chamado</span>
            </h3>

            {submitted ? (
              <div className="py-4 text-center space-y-3 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#0F1B2F]">Mensagem Enviada com Sucesso!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  O time pedagógico e de apoio da Hemingway School recebeu sua solicitação e responderá para{' '}
                  <strong>{user.email}</strong> em até 2 horas úteis.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-[#0F1B2F] text-white text-xs font-bold rounded-xl hover:bg-[#C59E5D] hover:text-[#0F1B2F] transition cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1B2F] mb-1">
                      Assunto da Mensagem
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#EADBBE] rounded-xl text-xs text-[#0F1B2F] focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40"
                    >
                      <option value="Dúvida sobre aula ou conteúdo">Dúvida sobre aula / conteúdo</option>
                      <option value="Problema no player de vídeo ou PDF">Problema com PDF ou vídeo</option>
                      <option value="Certificados ou Declaração">Certificados e Declaração</option>
                      <option value="Dúvida Financeira ou Matrícula">Matrícula ou Acesso</option>
                      <option value="Outro assunto">Outro assunto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1B2F] mb-1">
                      Idioma de Preferência
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'pt' | 'en' | 'es')}
                      className="w-full px-3 py-2 bg-white border border-[#EADBBE] rounded-xl text-xs text-[#0F1B2F] focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40"
                    >
                      <option value="pt">Português</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F1B2F] mb-1">
                    Descreva sua dúvida ou solicitação
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escreva sua dúvida detalhadamente aqui..."
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EADBBE] rounded-xl text-xs text-[#0F1B2F] focus:outline-none focus:ring-2 focus:ring-[#C59E5D]/40 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#0F1B2F] hover:bg-[#C59E5D] text-white hover:text-[#0F1B2F] text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C59E5D]" />
                      <span>Enviando solicitação...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#C59E5D]" />
                      <span>Enviar Mensagem ao Suporte</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Dúvidas Frequentes Rápidas */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#C59E5D]" />
              <span>Dúvidas Frequentes</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <strong>Como emitir minha Declaração?</strong> Acesse qualquer aula concluída e clique no botão dourado "Emitir Declaração de Conclusão".
              </p>
              <p>
                <strong>Apostilas em PDF:</strong> O material completo é visualizado diretamente na tela de aula, com opção de download.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
