import React, { useState, useRef, useEffect } from 'react'
import {
  Presentation,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Languages,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react'
import { formatGammaEmbedUrl } from '../../../services/lessonService'

export { formatGammaEmbedUrl }

export interface SlideViewerProps {
  slidesUrl?: string
  slidesUrlPt?: string
  slidesUrlEn?: string
  slidesUrlEs?: string
  preferredLanguage?: 'pt' | 'en' | 'es'
  lessonTitle?: string
}

export type SlideProviderType =
  | 'google_slides'
  | 'canva'
  | 'gamma'
  | 'powerpoint'
  | 'pdf'
  | 'generic'

export function detectSlideProvider(url: string): SlideProviderType {
  if (!url) return 'generic'
  const lower = url.toLowerCase()
  if (lower.includes('docs.google.com/presentation')) return 'google_slides'
  if (lower.includes('canva.com/design')) return 'canva'
  if (lower.includes('gamma.app')) return 'gamma'
  if (lower.endsWith('.pptx') || lower.endsWith('.ppsx') || lower.endsWith('.ppt') || lower.includes('.pptx?') || lower.includes('.ppsx?')) {
    return 'powerpoint'
  }
  if (lower.endsWith('.pdf') || lower.includes('.pdf?')) return 'pdf'
  return 'generic'
}

export function formatSlideEmbedUrl(url: string, provider: SlideProviderType, pdfPage = 1, pdfZoom = 100): string {
  if (!url) return ''
  const trimmed = url.trim()

  switch (provider) {
    case 'gamma': {
      return formatGammaEmbedUrl(trimmed)
    }
    case 'google_slides': {
      let formatted = trimmed
      if (formatted.includes('/edit')) {
        formatted = formatted.replace(/\/edit.*$/, '/embed?start=false&loop=false&delayms=3000')
      } else if (formatted.includes('/pub')) {
        formatted = formatted.replace(/\/pub.*$/, '/embed?start=false&loop=false&delayms=3000')
      } else if (!formatted.includes('/embed')) {
        formatted = formatted.replace(/\/?$/, '/embed?start=false&loop=false&delayms=3000')
      }
      return formatted
    }
    case 'canva': {
      try {
        const u = new URL(trimmed)
        u.searchParams.set('embed', '')
        return u.toString().replace('embed=', 'embed')
      } catch {
        return trimmed.includes('?') ? `${trimmed}&embed` : `${trimmed}?embed`
      }
    }
    case 'powerpoint': {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(trimmed)}`
    }
    case 'pdf': {
      // Para PDFs, suporta hash de página e zoom
      const baseUrl = trimmed.split('#')[0]
      return `${baseUrl}#page=${pdfPage}&zoom=${pdfZoom}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`
    }
    case 'generic':
    default:
      return trimmed
  }
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
  slidesUrl,
  slidesUrlPt,
  slidesUrlEn,
  slidesUrlEs,
  preferredLanguage = 'pt',
  lessonTitle = 'Apresentação de Slides',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false)
  const [isCssFullscreen, setIsCssFullscreen] = useState(false)
  const isFullscreen = isNativeFullscreen || isCssFullscreen
  const [activeLang, setActiveLang] = useState<'pt' | 'en' | 'es'>(preferredLanguage)
  const [pdfPage, setPdfPage] = useState<number>(1)
  const [pdfZoom, setPdfZoom] = useState<number>(100)

  // Sincroniza idioma preferido quando mudar
  useEffect(() => {
    if (preferredLanguage) {
      setActiveLang(preferredLanguage)
    }
  }, [preferredLanguage])

  // Escuta evento fullscreenchange para atualizar estado
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement))
      if (!document.fullscreenElement) {
        setIsCssFullscreen(false)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Seleciona a URL correta de acordo com a aba de idioma ativa (com fallback)
  const currentUrl =
    (activeLang === 'en' && slidesUrlEn) ||
    (activeLang === 'es' && slidesUrlEs) ||
    (activeLang === 'pt' && (slidesUrlPt || slidesUrl)) ||
    slidesUrl ||
    slidesUrlPt ||
    slidesUrlEn ||
    slidesUrlEs ||
    ''

  const provider = detectSlideProvider(currentUrl)
  const embedUrl = formatSlideEmbedUrl(currentUrl, provider, pdfPage, pdfZoom)

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen()
        } catch {
          // ignore
        }
      }
      setIsCssFullscreen(false)
      setIsNativeFullscreen(false)
      return
    }

    if (!containerRef.current) return
    try {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen()
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        await (containerRef.current as any).webkitRequestFullscreen()
      } else {
        setIsCssFullscreen(true)
      }
    } catch {
      setIsCssFullscreen(true)
    }
  }

  // Idiomas disponíveis para exibição
  const availableLangs = [
    { code: 'pt', label: 'PT', url: slidesUrlPt || slidesUrl },
    { code: 'en', label: 'EN', url: slidesUrlEn },
    { code: 'es', label: 'ES', url: slidesUrlEs },
  ].filter((item) => Boolean(item.url))

  const providerNames: Record<SlideProviderType, { name: string; color: string }> = {
    google_slides: { name: 'Slides da Aula', color: 'bg-[#C59E5D] text-[#0F1B2F]' },
    canva: { name: 'Slides da Aula', color: 'bg-[#C59E5D] text-[#0F1B2F]' },
    gamma: { name: 'Slides da Aula', color: 'bg-[#C59E5D] text-[#0F1B2F]' },
    powerpoint: { name: 'Slides da Aula', color: 'bg-[#C59E5D] text-[#0F1B2F]' },
    pdf: { name: 'Apresentação Oficial', color: 'bg-[#C59E5D] text-[#0F1B2F]' },
    generic: { name: 'Slides da Aula', color: 'bg-[#C59E5D] text-[#0F1B2F]' },
  }

  if (!currentUrl) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-3xl overflow-hidden border-2 border-[#0F1B2F] bg-slate-950 shadow-2xl ring-2 ring-[#C59E5D]/40 transition-all flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none ring-0' : 'relative w-full'
      }`}
    >
      {/* Barra de Controle Superior do SlideViewer */}
      <div className="bg-[#0F1B2F] text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#C59E5D]/40 shrink-0 select-none">
        {/* Esquerda: Identificação do Slide */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-[#C59E5D]/20 border border-[#C59E5D]/40 text-[#C59E5D] shrink-0">
            <Presentation className="w-5 h-5 text-[#C59E5D]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                  providerNames[provider]?.color || 'bg-[#C59E5D] text-[#0F1B2F]'
                }`}
              >
                {providerNames[provider]?.name || 'Slides da Aula'}
              </span>
              <span className="text-[11px] font-bold text-[#EADBBE]/90 uppercase tracking-wider">
                16:9 HD
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#FAF8F2] truncate mt-0.5">
              {lessonTitle}
            </p>
          </div>
        </div>

        {/* Direita: Controles de Idioma, Tela Cheia e Ações */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Seletor de Idiomas dos Slides (se houver mais de um) */}
          {availableLangs.length > 1 && (
            <div className="flex items-center p-0.5 bg-[#1C2E4A] rounded-xl border border-[#C59E5D]/30">
              <div className="px-2 text-slate-400">
                <Languages className="w-3.5 h-3.5" />
              </div>
              {availableLangs.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setActiveLang(item.code as 'pt' | 'en' | 'es')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    activeLang === item.code
                      ? 'bg-[#C59E5D] text-[#0F1B2F] shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Botão Abrir em Nova Guia */}
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-[#1C2E4A] hover:bg-[#253e63] text-[#FAF8F2] border border-[#C59E5D]/30 transition-colors cursor-pointer"
            title="Abrir apresentação em nova guia"
          >
            <ExternalLink className="w-4 h-4 text-[#C59E5D]" />
          </a>

          {/* Botão de Tela Cheia (Fullscreen) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#C59E5D] hover:bg-[#B38C4B] text-[#0F1B2F] shadow-md shadow-[#C59E5D]/25 transition-all transform active:scale-95 cursor-pointer"
            title={isFullscreen ? 'Sair da tela cheia' : 'Abrir Apresentação em Tela Cheia'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Sair da Tela Cheia</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Abrir Apresentação em Tela Cheia</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Área Central: Player 16:9 */}
      <div className={`relative w-full bg-slate-950 flex-1 flex items-center justify-center ${isFullscreen ? 'h-full' : 'aspect-video'}`}>
        {!isFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="sm:hidden absolute top-3 right-3 z-20 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0F1B2F]/90 text-[#FAF8F2] text-[11px] font-bold border border-[#C59E5D]/60 shadow-lg backdrop-blur-sm active:scale-95 cursor-pointer"
            title="Abrir Apresentação em Tela Cheia"
          >
            <Maximize2 className="w-3 h-3 text-[#C59E5D]" />
            <span>Tela Cheia</span>
          </button>
        )}
        <iframe
          key={`${embedUrl}-${pdfPage}-${pdfZoom}`}
          src={embedUrl}
          className="w-full h-full border-0"
          title={lessonTitle}
          allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      {/* Controles Especiais para Apresentação em PDF (Passar/Voltar Slide, Zoom) */}
      {provider === 'pdf' && (
        <div className="bg-[#0F1B2F] text-white px-4 py-2.5 flex items-center justify-between border-t border-[#C59E5D]/30 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPdfPage((prev) => Math.max(1, prev - 1))}
              disabled={pdfPage <= 1}
              className="px-2.5 py-1.5 rounded-lg bg-[#1C2E4A] hover:bg-[#253e63] text-white disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <span className="font-bold text-[#EADBBE] px-2">
              Slide {pdfPage}
            </span>
            <button
              type="button"
              onClick={() => setPdfPage((prev) => prev + 1)}
              className="px-2.5 py-1.5 rounded-lg bg-[#1C2E4A] hover:bg-[#253e63] text-white transition flex items-center gap-1 cursor-pointer"
            >
              <span>Próximo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPdfZoom((prev) => Math.max(50, prev - 15))}
              className="p-1.5 rounded-lg bg-[#1C2E4A] hover:bg-[#253e63] text-slate-300 hover:text-white transition cursor-pointer"
              title="Reduzir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-[#EADBBE] w-12 text-center">
              {pdfZoom}%
            </span>
            <button
              type="button"
              onClick={() => setPdfZoom((prev) => Math.min(200, prev + 15))}
              className="p-1.5 rounded-lg bg-[#1C2E4A] hover:bg-[#253e63] text-slate-300 hover:text-white transition cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPdfZoom(100)}
              className="p-1.5 rounded-lg bg-[#1C2E4A] hover:bg-[#253e63] text-slate-300 hover:text-white transition cursor-pointer"
              title="Resetar Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <a
              href={currentUrl}
              download
              className="ml-2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C59E5D] text-[#0F1B2F] font-bold text-[11px] hover:bg-[#B38C4B] transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Slides</span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
