import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Printer,
  X,
  Award,
  ShieldCheck,
} from 'lucide-react'
import type { SupportedLanguageCode } from '../../locales/i18n'

interface CompletionStatementModalProps {
  isOpen: boolean
  onClose: () => void
  studentName: string
  studentDocumentType?: string
  studentDocumentNumber?: string
  courseTitle: string
  completionDate?: string
  enrollmentId?: string
}

export const CompletionStatementModal: React.FC<CompletionStatementModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentDocumentType = 'Passaporte',
  studentDocumentNumber = 'USA-8839201',
  courseTitle,
  completionDate,
  enrollmentId = 'HEM-8849-2026',
}) => {
  const { i18n } = useTranslation()
  const currentLang = (i18n.language?.slice(0, 2) as SupportedLanguageCode) || 'pt'

  if (!isOpen) return null

  // Data formatada conforme idioma
  const today = completionDate ? new Date(completionDate) : new Date()

  const formattedDatePT = today.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const formattedDateEN = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const formattedDateES = today.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const formattedDate =
    currentLang === 'en'
      ? formattedDateEN
      : currentLang === 'es'
      ? formattedDateES
      : formattedDatePT

  const docTypeLabel =
    currentLang === 'en'
      ? studentDocumentType === 'Passaporte'
        ? 'Passport'
        : studentDocumentType
      : currentLang === 'es'
      ? studentDocumentType === 'Passaporte'
        ? 'Pasaporte'
        : studentDocumentType
      : studentDocumentType

  // Textos dinâmicos trilíngues
  const content = {
    pt: {
      docTitle: 'DECLARAÇÃO DE CONCLUSÃO DE CURSO',
      subTitle: 'Hemingway School • Diretoria Acadêmica & Registro de Diplomas',
      introP1: 'Declaramos, para os devidos fins acadêmicos e profissionais, que',
      introP2: 'portador(a) do documento',
      introP3: 'concluiu com êxito, em',
      introP4: 'todos os requisitos acadêmicos, disciplinas e avaliações do curso',
      introP5: 'promovido pela Hemingway School.',
      p2: 'Informamos que esta declaração atesta a conclusão integral dos estudos com validade imediata, e que o Certificado Universitário definitivo encontra-se em fase de registro e processamento acadêmico, sendo emitido e entregue ao(à) titular no prazo de até 60 (sessenta) dias a contar desta data.',
      location: 'Orlando, Flórida, Estados Unidos',
      signTitle: 'Hemingway School – Academic Board / Diretoria Acadêmica',
      signOffice: 'Office of Academic Records & University Registrar',
      authCodeLabel: 'Código de Autenticidade Digital:',
      verifiedText: 'Documento Oficial com Validade Imediata',
      sealTitle: 'SELO OFICIAL',
      sealSub: 'EXCELÊNCIA ACADÊMICA',
      printBtn: 'Baixar / Imprimir PDF',
      closeBtn: 'Fechar',
    },
    en: {
      docTitle: 'COURSE COMPLETION STATEMENT',
      subTitle: 'Hemingway School • Academic Board & Degree Registry',
      introP1: 'We hereby declare, for all relevant academic and professional purposes, that',
      introP2: 'holder of identification document',
      introP3: 'has successfully completed on',
      introP4: 'all academic requirements, disciplines, and examinations of the course',
      introP5: 'administered by Hemingway School.',
      p2: 'This statement officially certifies the full and final completion of studies with immediate academic validity. The permanent University Diploma / Certificate is currently undergoing formal registration and academic processing, and will be issued and delivered to the graduate within up to sixty (60) days from this date.',
      location: 'Orlando, Florida, United States',
      signTitle: 'Hemingway School – Academic Board / Academic Directorate',
      signOffice: 'Office of Academic Records & University Registrar',
      authCodeLabel: 'Digital Verification Code:',
      verifiedText: 'Official Document with Immediate Validity',
      sealTitle: 'OFFICIAL SEAL',
      sealSub: 'ACADEMIC EXCELLENCE',
      printBtn: 'Download / Print PDF',
      closeBtn: 'Close',
    },
    es: {
      docTitle: 'DECLARACIÓN DE FINALIZACIÓN DE CURSO',
      subTitle: 'Hemingway School • Dirección Académica y Registro de Títulos',
      introP1: 'Declaramos, para todos los fines académicos y profesionales que correspondan, que',
      introP2: 'titular del documento de identidad',
      introP3: 'ha completado con éxito, en fecha',
      introP4: 'la totalidad de los requisitos académicos, asignaturas y evaluaciones del curso',
      introP5: 'impartido por Hemingway School.',
      p2: 'Hacemos constar que la presente declaración acredita la conclusión integral de los estudios con validez inmediata, encontrándose el Certificado Universitario definitivo en fase de registro y tramitación académica, el cual será expedido y entregado a su titular en un plazo máximo de 60 (sesenta) días a partir de la presente fecha.',
      location: 'Orlando, Florida, Estados Unidos',
      signTitle: 'Hemingway School – Academic Board / Dirección Académica',
      signOffice: 'Office of Academic Records & University Registrar',
      authCodeLabel: 'Código de Autenticidad Digital:',
      verifiedText: 'Documento Oficial con Validez Inmediata',
      sealTitle: 'SELLO OFICIAL',
      sealSub: 'EXCELENCIA ACADÉMICA',
      printBtn: 'Descargar / Imprimir PDF',
      closeBtn: 'Cerrar',
    },
  }[currentLang]

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-[#FAF8F2] rounded-3xl shadow-2xl border border-[#C59E5D]/50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none">
        
        {/* BARRA SUPERIOR DE AÇÕES (Oculta na Impressão) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-[#0F1B2F] border-b border-[#1C2E4A] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C59E5D] text-[#0F1B2F] flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#FAF8F2] block leading-tight">
                {content.docTitle}
              </span>
              <span className="text-[11px] text-[#C59E5D]">
                Hemingway School • Academic Credential
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] font-bold text-xs shadow-md shadow-[#C59E5D]/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{content.printBtn}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#FAF8F2]/70 hover:text-white hover:bg-[#1C2E4A] rounded-xl transition-colors cursor-pointer"
              title={content.closeBtn}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ÁREA DO DOCUMENTO FORMAL (IMPRESSÃO A4 PAISAGEM/RETRATO) */}
        {/* ======================================================== */}
        <div id="hemingway-certificate-print" className="p-6 sm:p-10 md:p-12 print:p-8 bg-[#FAF8F2] text-[#1C2E4A]">
          {/* MOLDURA DUPLA FORMAL (Azul Marinho #0F1B2F externo + Dourado #C59E5D interno) */}
          <div className="relative border-4 sm:border-8 border-[#0F1B2F] p-4 sm:p-8 bg-[#FAF8F2] rounded-2xl shadow-inner">
            
            {/* Filete Interno Dourado com Cantos Decorativos */}
            <div className="border sm:border-2 border-[#C59E5D] p-6 sm:p-10 relative">
              
              {/* Ornamento no Canto Superior Esquerdo */}
              <div className="absolute -top-3 -left-3 w-6 h-6 border-t-4 border-l-4 border-[#C59E5D] bg-[#FAF8F2]" />
              {/* Ornamento no Canto Superior Direito */}
              <div className="absolute -top-3 -right-3 w-6 h-6 border-t-4 border-r-4 border-[#C59E5D] bg-[#FAF8F2]" />
              {/* Ornamento no Canto Inferior Esquerdo */}
              <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-4 border-l-4 border-[#C59E5D] bg-[#FAF8F2]" />
              {/* Ornamento no Canto Inferior Direito */}
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-4 border-r-4 border-[#C59E5D] bg-[#FAF8F2]" />

              {/* CABEÇALHO COM LOGO E TÍTULO SERIFADO */}
              <div className="text-center space-y-3 mb-8">
                <div className="inline-flex justify-center mb-1">
                  <img
                    src="/logo-hemingway.png"
                    alt="Hemingway School"
                    className="h-16 sm:h-20 w-auto object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F1B2F] tracking-wider uppercase">
                    {content.docTitle}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#C59E5D] font-semibold tracking-widest uppercase">
                    {content.subTitle}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-1">
                  <span className="h-px w-16 bg-[#C59E5D]" />
                  <Award className="w-5 h-5 text-[#C59E5D]" />
                  <span className="h-px w-16 bg-[#C59E5D]" />
                </div>
              </div>

              {/* CORPO DO TEXTO FORMAL DINÂMICO */}
              <div className="max-w-2xl mx-auto space-y-6 text-justify text-sm sm:text-base leading-relaxed text-[#1C2E4A]">
                <p>
                  {content.introP1}{' '}
                  <span className="font-bold text-[#0F1B2F] text-base sm:text-lg border-b border-[#0F1B2F]/40 pb-0.5">
                    {studentName}
                  </span>
                  , {content.introP2}{' '}
                  <span className="font-semibold text-[#0F1B2F]">
                    {docTypeLabel} nº {studentDocumentNumber}
                  </span>
                  , {content.introP3}{' '}
                  <span className="font-semibold text-[#0F1B2F]">{formattedDate}</span>
                  , {content.introP4}:
                </p>

                {/* Nome do Curso em Destaque Solene */}
                <div className="text-center py-3 px-4 bg-[#FAF8F2] border-y-2 border-[#C59E5D]/60 my-2">
                  <span className="font-serif text-lg sm:text-2xl font-bold text-[#0F1B2F] tracking-wide block">
                    {courseTitle}
                  </span>
                  <span className="text-xs text-[#C59E5D] font-medium tracking-wider uppercase mt-1 block">
                    {content.introP5}
                  </span>
                </div>

                {/* Parágrafo do Prazo de 60 Dias para Certificado Universitário */}
                <p className="text-xs sm:text-sm text-[#1C2E4A]/90 italic bg-[#FAF8F2] p-3 rounded-xl border border-[#C59E5D]/20 leading-normal">
                  {content.p2}
                </p>
              </div>

              {/* RODAPÉ: LOCAL/DATA, ASSINATURA, CÓDIGO E SELO */}
              <div className="mt-10 sm:mt-12 pt-6 border-t border-[#C59E5D]/40 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                
                {/* Esquerda: Local, Data e Código de Autenticação */}
                <div className="text-left space-y-1 text-xs">
                  <p className="font-semibold text-[#0F1B2F]">{content.location}</p>
                  <p className="text-slate-600">{formattedDate}</p>
                  
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">
                      {content.authCodeLabel}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#0F1B2F] bg-[#FAF8F2] px-2 py-0.5 rounded border border-[#C59E5D]/40 inline-block">
                      {enrollmentId}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C59E5D]" />
                    <span>{content.verifiedText}</span>
                  </div>
                </div>

                {/* Centro: Selo Institucional Dourado */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-2 border-[#C59E5D] p-1 flex items-center justify-center bg-[#FAF8F2] shadow-xs relative">
                    <div className="w-full h-full rounded-full border border-dashed border-[#C59E5D] flex flex-col items-center justify-center text-center p-1">
                      <Award className="w-6 h-6 text-[#C59E5D] mb-0.5" />
                      <span className="text-[7px] font-bold text-[#0F1B2F] leading-tight tracking-wider">
                        {content.sealTitle}
                      </span>
                      <span className="text-[6px] text-[#C59E5D] font-bold leading-none">
                        HEMINGWAY
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direita: Linha de Assinatura Formal */}
                <div className="text-center sm:text-right space-y-1">
                  <div className="w-48 sm:ml-auto border-b border-[#0F1B2F] pb-1">
                    <span className="font-serif italic text-sm text-[#0F1B2F] font-semibold block">
                      Anthony Sterling, Ph.D.
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#0F1B2F] leading-tight">
                    {content.signTitle}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {content.signOffice}
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
