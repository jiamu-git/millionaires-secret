import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Lang, pickTerm, UI_DICT } from '../i18n'
import { AdviceRankItem } from '../types'
import { EvidenceContent } from './EvidenceContent'

interface Props {
  item: AdviceRankItem | null
  lang: Lang
  industriesZh: Record<string, string>
  wealthTiersZh: Record<string, string>
  onClose: () => void
}

export function EvidenceDrawer({ item, lang, industriesZh, wealthTiersZh, onClose }: Props) {
  const t = UI_DICT[lang]

  useEffect(() => {
    if (!item) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [item, onClose])

  if (!item) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={pickTerm(lang, item.tag, item.tag_zh)}
    >
      <div className="fixed inset-0" onClick={onClose} />
      <aside className="panel-elevated relative z-10 flex h-full w-full max-w-xl flex-col overscroll-contain border-l border-rule-strong shadow-2xl">
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <span className="text-xs font-medium text-ink-muted">{t.drawerLabel}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeEvidence}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-rule-strong text-ink-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border [@media(hover:hover)]:hover:bg-surface-elevated"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <EvidenceContent
            item={item}
            lang={lang}
            industriesZh={industriesZh}
            wealthTiersZh={wealthTiersZh}
          />
        </div>
      </aside>
    </div>
  )
}
