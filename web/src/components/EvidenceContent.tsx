import { useEffect, useState } from 'react'
import { ExternalLink, Play, Search } from 'lucide-react'
import { Lang, pickTerm, pickText, UI_DICT } from '../i18n'
import { AdviceRankItem } from '../types'
import {
  actionabilityBadge,
  adviceTypeBadge,
  formatDateStr,
  formatTimestamp,
  formatViews,
  wealthBadgeCls,
  ytTimestampUrl,
} from '../utils'

interface Props {
  item: AdviceRankItem
  lang: Lang
  industriesZh: Record<string, string>
  wealthTiersZh: Record<string, string>
}

export function EvidenceContent({ item, lang, industriesZh, wealthTiersZh }: Props) {
  const [quoteSearch, setQuoteSearch] = useState('')
  const [wealthFilter, setWealthFilter] = useState('ALL')
  const t = UI_DICT[lang]

  useEffect(() => {
    setQuoteSearch('')
    setWealthFilter('ALL')
  }, [item.tag])

  const actBadge = actionabilityBadge(item.actionability, lang)
  const typeBadge = adviceTypeBadge(item.type, lang)

  const filteredQuotes = item.quotes.filter((q) => {
    if (wealthFilter !== 'ALL' && q.wealth_tier !== wealthFilter) return false
    if (!quoteSearch.trim()) return true
    const term = quoteSearch.toLowerCase()
    return (
      q.guest_name.toLowerCase().includes(term) ||
      q.quote.toLowerCase().includes(term) ||
      q.summary_zh.toLowerCase().includes(term) ||
      q.summary_en.toLowerCase().includes(term) ||
      q.role_or_title.toLowerCase().includes(term) ||
      q.video_title.toLowerCase().includes(term)
    )
  })

  const wealthEntries = Object.entries(item.by_wealth_tier).sort((a, b) => b[1] - a[1])
  const industryEntries = Object.entries(item.by_industry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="flex h-full flex-col">
      {/* Header Summary */}
      <div className="border-b border-rule px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="font-mono-num rounded border border-gold-border bg-gold-soft px-2 py-0.5 font-semibold text-gold-ink">
            {t.rankPrefix}{item.rank}
          </span>
          <span className={`rounded border px-2 py-0.5 ${typeBadge.pillCls}`}>
            {typeBadge.label}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 ${actBadge.pillCls}`}>
            <span className={`size-1.5 rounded-full ${actBadge.dotCls}`} />
            {actBadge.label}
          </span>
          <span className="text-ink-muted">
            {pickTerm(lang, item.category, item.category_zh)}
          </span>
        </div>

        <h2 className="mt-2.5 text-lg font-bold tracking-tight text-ink">
          {pickTerm(lang, item.tag, item.tag_zh)}
        </h2>
        <p className="mt-0.5 text-xs text-ink-secondary" lang="en">
          {lang === 'en' ? item.desc : `${item.tag}: ${item.desc}`}
        </p>

        {/* Metrics Strip */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-rule border-y border-rule py-2.5">
          <div className="pr-3">
            <div className="text-[11px] text-ink-muted">{t.evidenceUnique}</div>
            <div className="font-mono-num mt-0.5 text-base font-semibold text-gold-ink">
              {item.unique_guest_count}
              <span className="ml-1.5 text-xs font-normal text-ink-muted">
                ({item.unique_guest_pct}%)
              </span>
            </div>
          </div>
          <div className="px-3">
            <div className="text-[11px] text-ink-muted">{t.evidenceNoComp}</div>
            <div className="font-mono-num mt-0.5 text-base font-semibold text-sage-ink">
              {item.non_compilation_guest_count}
            </div>
          </div>
          <div className="pl-3">
            <div className="text-[11px] text-ink-muted">{t.evidenceRaw}</div>
            <div className="font-mono-num mt-0.5 text-base font-semibold text-ink">
              {item.raw_mention_count}
            </div>
          </div>
        </div>

        {/* Wealth Filter Chips & Top Industries */}
        <div className="mt-3 flex flex-col gap-2.5">
          <div>
            <div className="mb-1.5 text-[11px] text-ink-muted">{t.filterWealthQuotes}</div>
            <div className="flex flex-wrap gap-1.5">
              {wealthEntries.map(([tier, cnt]) => {
                const active = wealthFilter === tier
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setWealthFilter(active ? 'ALL' : tier)}
                    className={`min-h-[28px] rounded border px-2 py-0.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border ${
                      active
                        ? 'border-gold-border bg-gold-soft text-gold-ink'
                        : 'border-rule bg-surface text-ink-secondary [@media(hover:hover)]:hover:border-rule-strong'
                    }`}
                  >
                    {pickTerm(lang, tier, wealthTiersZh[tier])}:{' '}
                    <span className="font-mono-num font-semibold">{cnt}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
            <span>{t.topIndustries}</span>
            {industryEntries.map(([ind, cnt]) => (
              <span
                key={ind}
                className="rounded bg-surface-elevated px-1.5 py-0.5 text-ink-secondary"
              >
                {pickTerm(lang, ind, industriesZh[ind])}{' '}
                <span className="font-mono-num text-ink-muted">{cnt}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quote Search */}
      <div className="flex items-center gap-2 border-b border-rule bg-surface px-5 py-2.5">
        <Search className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
        <input
          type="text"
          value={quoteSearch}
          onChange={(e) => setQuoteSearch(e.target.value)}
          aria-label={t.searchQuotesPlaceholder(item.quotes.length)}
          placeholder={t.searchQuotesPlaceholder(item.quotes.length)}
          className="w-full bg-transparent text-xs text-ink placeholder-ink-muted focus:outline-none"
        />
        {wealthFilter !== 'ALL' && (
          <button
            type="button"
            onClick={() => setWealthFilter('ALL')}
            className="shrink-0 rounded bg-gold-soft px-2 py-1 text-[11px] font-medium text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border"
          >
            {t.clearFilter}
          </button>
        )}
      </div>

      {/* Verbatim Quote Ledger */}
      <div className="flex-1 divide-y divide-rule overflow-y-auto px-5">
        {filteredQuotes.map((q, i) => (
          <article key={`${q.video_id}-${q.guest_name}-${i}`} className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink">
                    {q.guest_name}
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] ${wealthBadgeCls(q.wealth_tier)}`}
                  >
                    {q.wealth_detail || pickTerm(lang, q.wealth_tier, wealthTiersZh[q.wealth_tier])}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-ink-muted">
                  {pickTerm(lang, q.industry, industriesZh[q.industry])}
                  {q.role_or_title ? ` · ${q.role_or_title}` : ''}
                </div>
              </div>

              <a
                href={ytTimestampUrl(q.video_id, q.timestamp_sec)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-md border border-gold-border bg-gold-soft px-2.5 py-1 text-xs font-medium text-gold-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border [@media(hover:hover)]:hover:bg-surface-active"
              >
                <Play className="size-3 translate-x-[0.5px] fill-current" aria-hidden="true" />
                <span className="font-mono-num">{formatTimestamp(q.timestamp_sec)}</span>
                <ExternalLink className="size-3 opacity-75" aria-hidden="true" />
              </a>
            </div>

            <p className={`${lang === 'en' ? 'leading-relaxed' : 'cjk-prose'} mt-2 text-sm font-medium text-gold-ink`}>
              {pickText(lang, q.summary_zh, q.summary_en)}
            </p>

            <blockquote
              lang="en"
              className="mt-2 rounded-lg bg-surface-elevated px-3.5 py-2.5 text-xs leading-relaxed text-ink-secondary"
            >
              <span className="font-editorial mr-1 text-sm text-gold" aria-hidden="true">
                “
              </span>
              {q.quote}
              <span className="font-editorial ml-0.5 text-sm text-gold" aria-hidden="true">
                ”
              </span>
            </blockquote>

            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-ink-muted">
              <span className="truncate" title={q.video_title}>
                {q.video_title}
              </span>
              <span className="font-mono-num shrink-0">
                {formatDateStr(q.upload_date)} · {formatViews(q.view_count)} {t.viewsSuffix}
              </span>
            </div>
          </article>
        ))}

        {filteredQuotes.length === 0 && (
          <div className="py-12 text-center text-xs text-ink-muted">{t.emptyQuotes}</div>
        )}
      </div>
    </div>
  )
}
