import React, { useState } from 'react'
import {
  X,
  Headphones,
  Mail,
  Send,
  CheckCircle2,
  Loader2,
  MessageSquare,
  FileQuestion,
  HelpCircle,
} from 'lucide-react'
import type { UserProfile } from '../../types'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, user }) => {
  const [subject, setSubject] = useState('Dúvida sobre aula ou conteúdo')
  const [language, setLanguage] = useState<'pt' | 'en' | 'es'>('pt')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EADBBE] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Topo */}
        <div className="p-6 bg-[#0F1B2F] text-[#FAF8F2] flex items-center justify-between border-b border-[#C59E5D]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C2E4A] border border-[#C59E5D]/40 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-[#C59E5D]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#FAF8F2]">Suporte Multilíngue</h2>
              <p className="text-xs text-[#EADBBE]/80">Atendimento em Português, English & Español</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-[#FAF8F2]/70 hover:text-white hover:bg-[#1C2E4A] rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Canais Rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://wa.me/14079876543?text=Ol%C3%A1%2C%20gostaria%20de%20suporte%20na%20Hemingway%20School"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 transition flex items-start gap-3 group shadow-xs cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-emerald-950 group-hover:text-emerald-800">
                  WhatsApp Oficial
                </span>
                <span className="text-[11px] text-emerald-700 block leading-tight mt-0.5">
                  Atendimento em tempo real (PT / EN / ES)
                </span>
              </div>
            </a>

            <a
              href="mailto:suporte@hemingwayschool.com?subject=Suporte%20AVA%20Hemingway%20School"
              className="p-4 rounded-2xl border border-[#EADBBE] bg-[#FAF8F2] hover:bg-[#F2EDE2] transition flex items-start gap-3 group shadow-xs cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0F1B2F] text-[#C59E5D] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[#0F1B2F]">E-mail da Escola</span>
                <span className="text-[11px] text-slate-600 block leading-tight mt-0.5">
                  suporte@hemingwayschool.com
                </span>
              </div>
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
