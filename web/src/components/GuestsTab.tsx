import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Play, Search, UserCheck, X } from 'lucide-react'
import { Lang, pickTerm, pickText, UI_DICT } from '../i18n'
import { DashboardData, GuestItem } from '../types'
import { formatTimestamp, formatViews, wealthBadgeCls, ytTimestampUrl } from '../utils'

interface Props {
  data: DashboardData
  lang: Lang
}

const PAGE_SIZE = 24

export function GuestsTab({ data, lang }: Props) {
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('ALL')
  const [wealth, setWealth] = useState('ALL')
  const [onlyNamed, setOnlyNamed] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedGuest, setSelectedGuest] = useState<GuestItem | null>(null)
  const t = UI_DICT[lang]

  useEffect(() => {
    if (!selectedGuest) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedGuest(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedGuest])

  const tagMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of data.advice_rankings) {
      m.set(r.tag, pickTerm(lang, r.tag, r.tag_zh))
    }
    return m
  }, [data.advice_rankings, lang])

  const filtered = useMemo(() => {
    return data.guests.filter((g) => {
      if (onlyNamed && !g.is_named) return false
      if (industry !== 'ALL' && g.industry !== industry) return false
      if (wealth !== 'ALL' && g.wealth_tier !== wealth) return false
      if (search.trim()) {
        const term = search.toLowerCase()
        if (
          !g.guest_name.toLowerCase().includes(term) &&
          !g.role_or_title.toLowerCase().includes(term) &&
          !g.first_money_or_break.toLowerCase().includes(term) &&
          !(g.first_money_or_break_en || '').toLowerCase().includes(term) &&
          !g.zero_start_advice.toLowerCase().includes(term) &&
          !(g.zero_start_advice_en || '').toLowerCase().includes(term) &&
          !g.advice_tags.some((tag) => tag.toLowerCase().includes(term))
        ) {
          return false
        }
      }
      return true
    })
  }, [data.guests, search, industry, wealth, onlyNamed])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-5">
      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 border-b border-rule pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            aria-label={t.searchGuestsPlaceholder}
            placeholder={t.searchGuestsPlaceholder}
            className="min-h-[38px] w-full rounded-md border border-rule-strong bg-control py-1.5 pr-3 pl-8 text-xs text-ink placeholder-ink-muted focus:border-gold-border focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            value={industry}
            onChange={(e) => {
              setIndustry(e.target.value)
              setPage(1)
            }}
            aria-label={t.filterIndustryAll}
            className="min-h-[38px] w-full rounded-md border border-rule-strong bg-control px-2.5 py-1.5 text-xs text-ink focus:border-gold-border focus:outline-none sm:w-auto"
          >
            <option value="ALL">{t.filterIndustryAll}</option>
            {data.industries.map((ind) => (
              <option key={ind.industry} value={ind.industry}>
                {pickTerm(lang, ind.industry, ind.industry_zh)} ({ind.count})
              </option>
            ))}
          </select>

          <select
            value={wealth}
            onChange={(e) => {
              setWealth(e.target.value)
              setPage(1)
            }}
            aria-label={t.filterWealthAll}
            className="min-h-[38px] w-full rounded-md border border-rule-strong bg-control px-2.5 py-1.5 text-xs text-ink focus:border-gold-border focus:outline-none sm:w-auto"
          >
            <option value="ALL">{t.filterWealthAll}</option>
            {data.wealth_tiers.map((wt) => (
              <option key={wt.wealth_tier} value={wt.wealth_tier}>
                {pickTerm(lang, wt.wealth_tier, wt.wealth_tier_zh)} ({wt.count})
              </option>
            ))}
          </select>

          <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-md border border-rule-strong bg-control px-3 py-1.5 text-xs text-ink-secondary">
            <input
              type="checkbox"
              checked={onlyNamed}
              onChange={(e) => {
                setOnlyNamed(e.target.checked)
                setPage(1)
              }}
              className="accent-gold"
            />
            {t.onlyNamed}
          </label>

          <span className="font-mono-num ml-1 text-xs text-ink-muted">
            {t.guestsTotalCount(filtered.length)}
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pageItems.map((g) => {
          const breakStory = pickText(lang, g.first_money_or_break, g.first_money_or_break_en)
          return (
            <button
              key={g.guest_key}
              type="button"
              onClick={() => setSelectedGuest(g)}
              className="panel-elevated flex flex-col justify-between rounded-lg border border-rule p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border [@media(hover:hover)]:hover:border-gold-border [@media(hover:hover)]:hover:bg-surface-elevated"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-ink">
                      {g.guest_name}
                    </span>
                    {g.is_named && (
                      <UserCheck className="size-3.5 shrink-0 text-gold-ink" aria-label={t.namedGuestLabel} />
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${wealthBadgeCls(g.wealth_tier)}`}
                  >
                    {g.wealth_detail || pickTerm(lang, g.wealth_tier, g.wealth_tier_zh)}
                  </span>
                </div>

                <p className="mt-1 truncate text-xs text-ink-muted">
                  {g.role_or_title ? `${g.role_or_title} · ` : ''}
                  {pickTerm(lang, g.industry, g.industry_zh)} ·{' '}
                  {pickTerm(lang, g.origin_type, g.origin_type_zh)}
                </p>

                {breakStory && (
                  <p className={`${lang === 'en' ? 'leading-relaxed' : 'cjk-prose'} mt-3 line-clamp-3 text-xs text-ink-secondary`}>
                    {breakStory}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-rule pt-2.5 text-[11px] text-ink-muted">
                <span className="font-mono-num">
                  {t.extractedPrefix ? `${t.extractedPrefix} ` : ''}
                  {g.advice_items.length} {t.extractedSuffix}
                  {g.appearance_count > 1 ? ` · ${g.appearance_count} ${t.appearancesSuffix}` : ''}
                </span>
                <span className="font-medium text-gold-ink">{t.viewProfile}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-rule pt-3 text-xs text-ink-muted">
          <span className="font-mono-num">
            {t.paginationInfo(safePage, totalPages, filtered.length, t.unitGuests)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex min-h-[36px] items-center gap-1 rounded border border-rule-strong bg-control px-2.5 py-1 text-ink disabled:opacity-35 [@media(hover:hover)]:hover:bg-surface-elevated"
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
              {t.prevPage}
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex min-h-[36px] items-center gap-1 rounded border border-rule-strong bg-control px-2.5 py-1 text-ink disabled:opacity-35 [@media(hover:hover)]:hover:bg-surface-elevated"
            >
              {t.nextPage}
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Guest Detail Dialog */}
      {selectedGuest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedGuest.guest_name}
        >
          <div className="fixed inset-0" onClick={() => setSelectedGuest(null)} />
          <div className="panel-elevated relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden overscroll-contain rounded-xl border border-rule-strong shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-rule px-6 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-ink">
                    {selectedGuest.guest_name}
                  </h3>
                  <span
                    className={`rounded border px-2 py-0.5 text-xs ${wealthBadgeCls(selectedGuest.wealth_tier)}`}
                  >
                    {selectedGuest.wealth_detail ||
                      pickTerm(lang, selectedGuest.wealth_tier, selectedGuest.wealth_tier_zh)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {selectedGuest.role_or_title} ·{' '}
                  {pickTerm(lang, selectedGuest.industry, selectedGuest.industry_zh)} ·{' '}
                  {pickTerm(lang, selectedGuest.origin_type, selectedGuest.origin_type_zh)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                aria-label={t.closeGuestModal}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-rule-strong text-ink-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border [@media(hover:hover)]:hover:bg-surface-elevated"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {(selectedGuest.first_money_or_break || selectedGuest.first_money_or_break_en) && (
                <div>
                  <div className="text-xs font-semibold text-gold-ink">{t.firstBreakTitle}</div>
                  <p className={`${lang === 'en' ? 'leading-relaxed' : 'cjk-prose'} mt-1.5 text-sm text-ink-secondary`}>
                    {pickText(
                      lang,
                      selectedGuest.first_money_or_break,
                      selectedGuest.first_money_or_break_en,
                    )}
                  </p>
                </div>
              )}

              {(selectedGuest.zero_start_advice || selectedGuest.zero_start_advice_en) && (
                <div className="rounded-lg border border-sage-border bg-sage-soft p-4">
                  <div className="text-xs font-semibold text-sage-ink">
                    {t.zeroStartGuestTitle}
                  </div>
                  <p className={`${lang === 'en' ? 'leading-relaxed' : 'cjk-prose'} mt-1.5 text-sm text-ink`}>
                    {pickText(
                      lang,
                      selectedGuest.zero_start_advice,
                      selectedGuest.zero_start_advice_en,
                    )}
                  </p>
                </div>
              )}

              {(selectedGuest.recommended_skills.length > 0 ||
                selectedGuest.recommended_books_or_mentors.length > 0) && (
                <div className="flex flex-wrap gap-5 border-y border-rule py-3.5 text-xs">
                  {selectedGuest.recommended_skills.length > 0 && (
                    <div>
                      <div className="mb-1.5 text-ink-muted">{t.skillsEmphasized}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedGuest.recommended_skills.map((sk) => (
                          <span
                            key={sk}
                            className="rounded bg-surface-elevated px-2 py-0.5 text-ink-secondary"
                          >
                            {pickTerm(lang, sk, data.taxonomy.skills_zh[sk])}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedGuest.recommended_books_or_mentors.length > 0 && (
                    <div>
                      <div className="mb-1.5 text-ink-muted">{t.booksMentorsMentioned}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedGuest.recommended_books_or_mentors.map((bm) => (
                          <span
                            key={bm}
                            className="rounded border border-gold-border bg-gold-soft px-2 py-0.5 text-gold-ink"
                          >
                            {bm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="mb-2 text-xs font-semibold text-ink-muted">
                  {t.allAdviceQuotesTitle(selectedGuest.advice_items.length)}
                </div>
                <div className="divide-y divide-rule rounded-lg border border-rule bg-surface">
                  {selectedGuest.advice_items.map((item, idx) => (
                    <div key={idx} className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gold-ink">
                          {tagMap.get(item.canonical_tag) || item.canonical_tag}
                        </span>
                        <a
                          href={ytTimestampUrl(item.video_id, item.timestamp_sec)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-[28px] items-center gap-1 rounded border border-gold-border bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-gold-ink [@media(hover:hover)]:hover:bg-surface-active"
                        >
                          <Play className="size-2.5 translate-x-[0.5px] fill-current" aria-hidden="true" />
                          <span className="font-mono-num">{formatTimestamp(item.timestamp_sec)}</span>
                          <ExternalLink className="size-2.5 opacity-75" aria-hidden="true" />
                        </a>
                      </div>
                      <div className={`${lang === 'en' ? 'leading-relaxed' : 'cjk-prose'} mt-1.5 text-sm font-medium text-ink`}>
                        {pickText(lang, item.summary_zh, item.summary_en)}
                      </div>
                      <blockquote
                        lang="en"
                        className="mt-2 rounded bg-surface-elevated px-3 py-2 text-xs leading-relaxed text-ink-secondary"
                      >
                        <span className="font-editorial mr-1 text-sm text-gold" aria-hidden="true">
                          “
                        </span>
                        {item.quote}
                        <span className="font-editorial ml-0.5 text-sm text-gold" aria-hidden="true">
                          ”
                        </span>
                      </blockquote>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-rule bg-surface-elevated px-6 py-3 text-xs text-ink-muted">
              <span className="truncate pr-4">
                {t.primarySource} {selectedGuest.primary_video_title}
              </span>
              <a
                href={`https://www.youtube.com/watch?v=${selectedGuest.primary_video_id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 font-medium text-gold-ink [@media(hover:hover)]:hover:underline"
              >
                {t.watchFullVideo} (<span className="font-mono-num">{formatViews(selectedGuest.max_view_count)}</span>)
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
