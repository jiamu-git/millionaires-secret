import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Lang, pickTerm, UI_DICT } from '../i18n'
import { AdviceRankItem, DashboardData } from '../types'
import { actionabilityBadge } from '../utils'
import { EvidenceContent } from './EvidenceContent'

type SortMode = 'unique' | 'non_comp' | 'raw' | 'weighted'

interface Props {
  data: DashboardData
  lang: Lang
  selectedItem: AdviceRankItem | null
  onSelectAdvice: (item: AdviceRankItem) => void
  onOpenMobileSheet: (item: AdviceRankItem) => void
}

export function LeaderboardTab({
  data,
  lang,
  selectedItem,
  onSelectAdvice,
  onOpenMobileSheet,
}: Props) {
  const [sortMode, setSortMode] = useState<SortMode>('unique')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [actionabilityFilter, setActionabilityFilter] = useState<string>('ALL')
  const [wealthFilter, setWealthFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const t = UI_DICT[lang]
  const categories = Object.entries(data.taxonomy.categories)
  const wealthTiers = Object.entries(data.taxonomy.wealth_tiers_zh)

  const getScore = (item: AdviceRankItem): number => {
    if (wealthFilter !== 'ALL') {
      return item.by_wealth_tier[wealthFilter] || 0
    }
    switch (sortMode) {
      case 'non_comp':
        return item.non_compilation_guest_count
      case 'raw':
        return item.raw_mention_count
      case 'weighted':
        return item.view_weighted_score
      default:
        return item.unique_guest_count
    }
  }

  const filtered = useMemo(() => {
    return data.advice_rankings
      .filter((item) => {
        if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false
        if (actionabilityFilter !== 'ALL' && item.actionability !== actionabilityFilter) return false
        if (wealthFilter !== 'ALL' && !(item.by_wealth_tier[wealthFilter] > 0)) return false
        if (search.trim()) {
          const term = search.toLowerCase()
          const twTag = pickTerm('zh-TW', item.tag, item.tag_zh).toLowerCase()
          if (
            !item.tag_zh.toLowerCase().includes(term) &&
            !twTag.includes(term) &&
            !item.tag.toLowerCase().includes(term) &&
            !item.desc.toLowerCase().includes(term)
          ) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => getScore(b) - getScore(a))
  }, [data.advice_rankings, sortMode, categoryFilter, actionabilityFilter, wealthFilter, search])

  const maxScore = useMemo(
    () => Math.max(1, ...filtered.map((x) => getScore(x))),
    [filtered, sortMode, wealthFilter],
  )

  const activeInspector = useMemo(() => {
    if (selectedItem && filtered.some((x) => x.tag === selectedItem.tag)) {
      return selectedItem
    }
    return filtered[0] ?? data.advice_rankings[0] ?? null
  }, [selectedItem, filtered, data.advice_rankings])

  const unitShort =
    wealthFilter !== 'ALL'
      ? t.unitPerson
      : sortMode === 'weighted'
        ? t.unitScore
        : sortMode === 'raw'
          ? t.unitTimes
          : t.unitPeople

  return (
    <div className="flex flex-col gap-5">
      {/* Compact Utility Filter Bar */}
      <section
        aria-label={t.sortLabel}
        className="flex flex-col gap-3 border-b border-rule pb-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Metric Segmented Switch */}
          <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap" role="group" aria-label={t.sortLabel}>
            <span className="w-full shrink-0 whitespace-nowrap text-[11px] text-ink-muted sm:mr-1 sm:w-auto sm:text-xs">
              {t.sortLabel}
            </span>
            {(
              [
                ['unique', t.sortUnique],
                ['non_comp', t.sortNonComp],
                ['raw', t.sortRaw],
                ['weighted', t.sortWeighted],
              ] as [SortMode, string][]
            ).map(([mode, label]) => {
              const active = sortMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortMode(mode)}
                  aria-pressed={active}
                  className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border sm:px-3 ${
                    active
                      ? 'border-gold-border bg-gold-soft text-gold-ink'
                      : 'border-rule bg-control text-ink-secondary [@media(hover:hover)]:hover:border-rule-strong [@media(hover:hover)]:hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Search & Dropdowns */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:flex-nowrap">
            <div className="relative w-full sm:w-44">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t.searchAdvicePlaceholder}
                placeholder={t.searchAdvicePlaceholder}
                className="min-h-[38px] w-full rounded-md border border-rule-strong bg-control py-1.5 pr-3 pl-8 text-xs text-ink placeholder-ink-muted focus:border-gold-border focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={actionabilityFilter}
                onChange={(e) => setActionabilityFilter(e.target.value)}
                aria-label={t.filterActionAll}
                className="min-h-[38px] w-full rounded-md border border-rule-strong bg-control px-2.5 py-1.5 text-xs text-ink focus:border-gold-border focus:outline-none sm:w-auto sm:max-w-[120px]"
              >
                <option value="ALL">{t.filterActionAll}</option>
                <option value="high_actionable">{t.filterActionHigh}</option>
                <option value="strategic_principle">{t.filterActionStrategic}</option>
                <option value="mindset_general">{t.filterActionMindset}</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label={t.filterCatAll}
                className="min-h-[38px] w-full rounded-md border border-rule-strong bg-control px-2.5 py-1.5 text-xs text-ink focus:border-gold-border focus:outline-none sm:w-auto sm:max-w-[140px]"
              >
                <option value="ALL">{t.filterCatAll}</option>
                {categories.map(([k, v]) => (
                  <option key={k} value={k}>
                    {pickTerm(lang, k, v)}
                  </option>
                ))}
              </select>

              <select
                value={wealthFilter}
                onChange={(e) => setWealthFilter(e.target.value)}
                aria-label={t.filterWealthAll}
                className="min-h-[38px] w-full rounded-md border border-rule-strong bg-control px-2.5 py-1.5 text-xs text-ink focus:border-gold-border focus:outline-none sm:w-auto sm:max-w-[145px]"
              >
                <option value="ALL">{t.filterWealthAll}</option>
                {wealthTiers.map(([k, v]) => (
                  <option key={k} value={k}>
                    {pickTerm(lang, k, v)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Master-Detail Analytical Ledger */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.18fr_0.82fr]">
        {/* Left: Ranked Ledger */}
        <div className="panel-elevated overflow-hidden rounded-lg border border-rule">
          <div className="grid grid-cols-[36px_minmax(0,1fr)_72px] items-center gap-2.5 border-b border-rule bg-surface-elevated px-3 py-2.5 text-[11px] font-medium text-ink-muted sm:grid-cols-[48px_minmax(0,1fr)_104px_80px_68px] sm:gap-3 sm:px-4">
            <div>{t.colRank}</div>
            <div>{t.colTopic}</div>
            <div className="hidden sm:block">{t.colType}</div>
            <div className="text-right sm:hidden">{t.colCountShare}</div>
            <div className="hidden text-right sm:block">{t.colCount}</div>
            <div className="hidden text-right sm:block">{t.colShare}</div>
          </div>

          <div className="divide-y divide-rule">
            {filtered.map((item, idx) => {
              const score = getScore(item)
              const barPct = Math.max(3, Math.round((score / maxScore) * 100))
              const act = actionabilityBadge(item.actionability, lang)
              const isSelected = activeInspector?.tag === item.tag
              const isWarning = item.type === 'regret' || item.type === 'warning_dont'
              const barCls = isWarning
                ? 'bg-rose'
                : item.actionability === 'high_actionable'
                  ? 'bg-sage'
                  : 'bg-gold'

              return (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => {
                    onSelectAdvice(item)
                    if (window.innerWidth < 1024) {
                      onOpenMobileSheet(item)
                    }
                  }}
                  className={`group grid w-full grid-cols-[36px_minmax(0,1fr)_72px] items-center gap-2.5 px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-border sm:grid-cols-[48px_minmax(0,1fr)_104px_80px_68px] sm:gap-3 sm:px-4 ${
                    isSelected
                      ? 'bg-surface-active'
                      : '[@media(hover:hover)]:hover:bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${
                        isSelected
                          ? 'bg-gold'
                          : idx < 3
                            ? 'bg-ink-muted'
                            : 'bg-transparent'
                      }`}
                    />
                    <span
                      className={`font-mono-num text-xs font-semibold ${
                        idx < 3 ? 'text-gold-ink' : 'text-ink-muted'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-ink">
                        {pickTerm(lang, item.tag, item.tag_zh)}
                      </span>
                      {isWarning && (
                        <span className="shrink-0 rounded bg-rose-soft px-1.5 py-0.5 text-[10px] font-medium text-rose-ink">
                          {t.badgePitfall}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2.5">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-track">
                        <div
                          className={`h-full rounded-full ${barCls}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      {lang !== 'en' && (
                        <span className="hidden truncate text-[11px] text-ink-muted md:inline" lang="en">
                          {item.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden items-center gap-1.5 text-xs text-ink-secondary sm:flex">
                    <span className={`size-1.5 shrink-0 rounded-full ${act.dotCls}`} />
                    <span className="truncate">{act.label}</span>
                  </div>

                  <div className="font-mono-num text-right">
                    <div className="text-sm font-semibold text-ink">
                      {score}
                      {unitShort && (
                        <span className="ml-0.5 text-[11px] font-normal text-ink-muted">{unitShort}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-ink-muted sm:hidden">
                      {item.unique_guest_pct.toFixed(1)}%
                    </div>
                  </div>

                  <div className="font-mono-num hidden text-right text-xs text-ink-secondary sm:block">
                    {item.unique_guest_pct.toFixed(1)}%
                  </div>
                </button>
              )
            })}

            {filtered.length === 0 && (
              <div className="py-14 text-center text-xs text-ink-muted">{t.emptyAdvice}</div>
            )}
          </div>
        </div>

        {/* Right: Pinned Desktop Evidence Inspector */}
        <div className="panel-elevated hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-140px)] lg:min-h-[560px] lg:overflow-hidden lg:rounded-lg lg:border lg:border-rule">
          {activeInspector && (
            <EvidenceContent
              item={activeInspector}
              lang={lang}
              industriesZh={data.taxonomy.industries_zh}
              wealthTiersZh={data.taxonomy.wealth_tiers_zh}
            />
          )}
        </div>
      </div>
    </div>
  )
}
