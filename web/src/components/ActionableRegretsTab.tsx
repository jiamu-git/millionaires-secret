import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Compass, ExternalLink, Search } from 'lucide-react'
import { Lang, pickTerm, pickText, UI_DICT } from '../i18n'
import { AdviceRankItem, DashboardData } from '../types'
import { formatViews, wealthBadgeCls } from '../utils'

interface Props {
  data: DashboardData
  lang: Lang
  onSelectAdvice: (item: AdviceRankItem) => void
}

const PAGE_SIZE = 24

export function ActionableRegretsTab({ data, lang, onSelectAdvice }: Props) {
  const [zeroSearch, setZeroSearch] = useState('')
  const [zeroIndustry, setZeroIndustry] = useState('ALL')
  const [page, setPage] = useState(1)
  const t = UI_DICT[lang]

  const actionableList = useMemo(
    () =>
      data.advice_rankings
        .filter((x) => x.actionability === 'high_actionable' && x.type === 'advice_do')
        .sort((a, b) => b.unique_guest_count - a.unique_guest_count),
    [data.advice_rankings],
  )

  const regretsList = useMemo(
    () =>
      data.advice_rankings
        .filter((x) => x.type === 'warning_dont' || x.type === 'regret')
        .sort((a, b) => b.unique_guest_count - a.unique_guest_count),
    [data.advice_rankings],
  )

  const maxActionable = Math.max(1, ...actionableList.map((x) => x.unique_guest_count))
  const maxRegret = Math.max(1, ...regretsList.map((x) => x.unique_guest_count))

  const zeroPlaybook = useMemo(() => {
    return data.zero_start_playbook.filter((item) => {
      if (zeroIndustry !== 'ALL' && item.industry !== zeroIndustry) return false
      if (!zeroSearch.trim()) return true
      const term = zeroSearch.toLowerCase()
      return (
        item.guest_name.toLowerCase().includes(term) ||
        item.zero_start_advice.toLowerCase().includes(term) ||
        (item.zero_start_advice_en || '').toLowerCase().includes(term) ||
        item.role_or_title.toLowerCase().includes(term)
      )
    })
  }, [data.zero_start_playbook, zeroSearch, zeroIndustry])

  const totalPages = Math.max(1, Math.ceil(zeroPlaybook.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = zeroPlaybook.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-10">
      {/* Side-by-side Actionable vs Regrets Ledgers */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: High Actionable */}
        <section aria-labelledby="heading-actionable" className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-rule-strong pb-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 text-sage-ink" aria-hidden="true" />
              <div>
                <h2 id="heading-actionable" className="text-base font-bold text-ink">
                  {t.actionableTitle}
                </h2>
                <p className="text-xs text-ink-muted">{t.actionableDesc}</p>
              </div>
            </div>
            <span className="font-mono-num text-xs text-ink-muted">
              {t.totalItemsCount(actionableList.length)}
            </span>
          </div>

          <div className="panel-elevated divide-y divide-rule overflow-hidden rounded-lg border border-rule">
            {actionableList.map((item, idx) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => onSelectAdvice(item)}
                className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-border [@media(hover:hover)]:hover:bg-surface-elevated"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="font-mono-num w-6 shrink-0 text-xs font-semibold text-sage-ink">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate text-sm font-semibold text-ink">
                      {pickTerm(lang, item.tag, item.tag_zh)}
                    </span>
                  </div>
                  <div className="font-mono-num shrink-0 text-right text-xs">
                    <span className="font-semibold text-ink">{item.unique_guest_count}</span>
                    <span className="ml-1.5 text-ink-muted">{item.unique_guest_pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full bg-sage"
                    style={{
                      width: `${Math.max(4, (item.unique_guest_count / maxActionable) * 100)}%`,
                    }}
                  />
                </div>
                {item.quotes[0] && (
                  <p className="truncate text-xs text-ink-muted">
                    {item.quotes[0].guest_name}:{' '}
                    {pickText(lang, item.quotes[0].summary_zh, item.quotes[0].summary_en)}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Right: Warnings & Regrets */}
        <section aria-labelledby="heading-regrets" className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-rule-strong pb-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="size-4 text-rose-ink" aria-hidden="true" />
              <div>
                <h2 id="heading-regrets" className="text-base font-bold text-ink">
                  {t.regretsTitle}
                </h2>
                <p className="text-xs text-ink-muted">{t.regretsDesc}</p>
              </div>
            </div>
            <span className="font-mono-num text-xs text-ink-muted">
              {t.totalItemsCount(regretsList.length)}
            </span>
          </div>

          <div className="panel-elevated divide-y divide-rule overflow-hidden rounded-lg border border-rule">
            {regretsList.map((item, idx) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => onSelectAdvice(item)}
                className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-border [@media(hover:hover)]:hover:bg-surface-elevated"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="font-mono-num w-6 shrink-0 text-xs font-semibold text-rose-ink">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate text-sm font-semibold text-ink">
                      {pickTerm(lang, item.tag, item.tag_zh)}
                    </span>
                  </div>
                  <div className="font-mono-num shrink-0 text-right text-xs">
                    <span className="font-semibold text-ink">{item.unique_guest_count}</span>
                    <span className="ml-1.5 text-ink-muted">{item.unique_guest_pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full bg-rose"
                    style={{
                      width: `${Math.max(4, (item.unique_guest_count / maxRegret) * 100)}%`,
                    }}
                  />
                </div>
                {item.quotes[0] && (
                  <p className="truncate text-xs text-ink-muted">
                    {item.quotes[0].guest_name}:{' '}
                    {pickText(lang, item.quotes[0].summary_zh, item.quotes[0].summary_en)}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Zero-Start Playbook Section */}
      <section aria-labelledby="heading-zero-start" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 border-b border-rule-strong pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Compass className="mt-1 size-4 shrink-0 text-gold-ink" aria-hidden="true" />
            <div>
              <h2 id="heading-zero-start" className="text-base font-bold text-ink">
                {t.zeroTitle}
              </h2>
              <p className="text-xs text-ink-muted">
                {t.zeroDesc(data.zero_start_playbook.length)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <select
              value={zeroIndustry}
              onChange={(e) => {
                setZeroIndustry(e.target.value)
                setPage(1)
              }}
              aria-label={t.filterIndustryAll}
              className="min-h-[38px] w-full rounded-md border border-rule-strong bg-control px-2.5 py-1.5 text-xs text-ink focus:border-gold-border focus:outline-none sm:w-auto"
            >
              <option value="ALL">{t.filterIndustryAll}</option>
              {data.industries.map((ind) => (
                <option key={ind.industry} value={ind.industry}>
                  {pickTerm(lang, ind.industry, ind.industry_zh)}
                </option>
              ))}
            </select>
            <div className="relative min-w-0">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <input
                type="text"
                value={zeroSearch}
                onChange={(e) => {
                  setZeroSearch(e.target.value)
                  setPage(1)
                }}
                aria-label={t.searchZeroPlaceholder}
                placeholder={t.searchZeroPlaceholder}
                className="min-h-[38px] w-full min-w-0 rounded-md border border-rule-strong bg-control py-1.5 pr-3 pl-8 text-xs text-ink placeholder-ink-muted focus:border-gold-border focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((entry, idx) => (
            <article
              key={`${entry.video_id}-${entry.guest_name}-${idx}`}
              className="panel-elevated flex flex-col justify-between rounded-lg border border-rule p-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ink">
                      {entry.guest_name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {entry.role_or_title ||
                        pickTerm(lang, entry.industry, data.taxonomy.industries_zh[entry.industry])}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${wealthBadgeCls(entry.wealth_tier)}`}
                  >
                    {entry.wealth_detail ||
                      pickTerm(lang, entry.wealth_tier, data.taxonomy.wealth_tiers_zh[entry.wealth_tier])}
                  </span>
                </div>
                <p className={`${lang === 'en' ? 'leading-relaxed' : 'cjk-prose'} mt-3 text-xs text-ink-secondary`}>
                  {pickText(lang, entry.zero_start_advice, entry.zero_start_advice_en)}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-rule pt-2.5 text-[11px] text-ink-muted">
                <span>
                  {pickTerm(lang, entry.industry, data.taxonomy.industries_zh[entry.industry])}
                </span>
                <a
                  href={`https://www.youtube.com/watch?v=${entry.video_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border [@media(hover:hover)]:hover:underline"
                >
                  <span className="font-mono-num">{formatViews(entry.view_count)}</span> {t.viewsSuffix}
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-rule pt-3 text-xs text-ink-muted">
            <span className="font-mono-num">
              {t.paginationInfo(safePage, totalPages, zeroPlaybook.length, t.unitPlans)}
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
      </section>
    </div>
  )
}
