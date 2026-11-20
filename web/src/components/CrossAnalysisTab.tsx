import { useMemo } from 'react'
import { BookOpen, Briefcase, Crown, Info, Layers, Wrench } from 'lucide-react'
import { Lang, pickTerm, UI_DICT } from '../i18n'
import { AdviceRankItem, DashboardData } from '../types'

interface Props {
  data: DashboardData
  lang: Lang
  onSelectAdvice: (item: AdviceRankItem) => void
}

export function CrossAnalysisTab({ data, lang, onSelectAdvice }: Props) {
  const t = UI_DICT[lang]
  const tagMap = useMemo(
    () => new Map(data.advice_rankings.map((x) => [x.tag, x])),
    [data.advice_rankings],
  )

  const handleTagClick = (tagName: string) => {
    const found = tagMap.get(tagName)
    if (found) onSelectAdvice(found)
  }

  const maxIndustry = Math.max(1, ...data.industries.map((x) => x.count))
  const maxSkill = Math.max(1, ...data.skills_ranking.map((x) => x.count))
  const maxBook = Math.max(1, ...data.books_and_mentors.map((x) => x.count))

  const tiersToCompare = data.wealth_tiers.filter(
    (wt) =>
      wt.count > 0 &&
      (wt.wealth_tier.includes('Billionaire') ||
        wt.wealth_tier.includes('Decamillionaire') ||
        wt.wealth_tier.includes('Millionaire')),
  )

  const matrixTags = useMemo(() => {
    const bTier = tiersToCompare.find((wt) => wt.wealth_tier.includes('Billionaire'))
    const dTier = tiersToCompare.find((wt) => wt.wealth_tier.includes('Decamillionaire'))
    const mTier = tiersToCompare.find((wt) => wt.wealth_tier.includes('Millionaire'))
    return data.advice_rankings.slice(0, 12).map((item) => {
      const bCount = item.by_wealth_tier['Billionaire ($1B+)'] || 0
      const dCount = item.by_wealth_tier['Decamillionaire+ ($10M-$999M)'] || 0
      const mCount = item.by_wealth_tier['Millionaire ($1M-$9.9M)'] || 0
      return {
        item,
        bPct: bTier?.count ? Math.round((bCount / bTier.count) * 1000) / 10 : 0,
        dPct: dTier?.count ? Math.round((dCount / dTier.count) * 1000) / 10 : 0,
        mPct: mTier?.count ? Math.round((mCount / mTier.count) * 1000) / 10 : 0,
      }
    })
  }, [data.advice_rankings, tiersToCompare])

  return (
    <div className="flex flex-col gap-10">
      {/* Wealth Tier Cross-Comparison Matrix */}
      <section aria-labelledby="heading-wealth-matrix" className="flex flex-col gap-4">
        <div className="flex items-start gap-2.5 border-b border-rule-strong pb-3">
          <Crown className="mt-0.5 size-4 shrink-0 text-gold-ink" aria-hidden="true" />
          <div>
            <h2 id="heading-wealth-matrix" className="text-base font-bold text-ink">
              {t.wealthMatrixTitle}
            </h2>
            <p className="text-xs text-ink-muted">{t.wealthMatrixDesc}</p>
          </div>
        </div>

        <div className="panel-elevated overflow-x-auto rounded-lg border border-rule">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-rule bg-surface-elevated text-ink-secondary">
                <th className="px-4 py-2.5 font-medium">{t.matrixColTopic}</th>
                <th className="px-4 py-2.5 text-right font-medium text-gold-ink">
                  {t.matrixTierB} ({tiersToCompare[0]?.count || 0})
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-ink">
                  {t.matrixTierD} ({tiersToCompare[1]?.count || 0})
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-sage-ink">
                  {t.matrixTierM} ({tiersToCompare[2]?.count || 0})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {matrixTags.map(({ item, bPct, dPct, mPct }) => (
                <tr
                  key={item.tag}
                  className="[@media(hover:hover)]:hover:bg-surface-elevated"
                >
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => handleTagClick(item.tag)}
                      className="text-left font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border [@media(hover:hover)]:hover:text-gold-ink"
                    >
                      {pickTerm(lang, item.tag, item.tag_zh)}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-track sm:block">
                        <div className="h-full bg-gold" style={{ width: `${Math.min(100, bPct * 2)}%` }} />
                      </div>
                      <span className="font-mono-num w-12 font-semibold text-gold-ink">
                        {bPct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-track sm:block">
                        <div className="h-full bg-ink-muted" style={{ width: `${Math.min(100, dPct * 2)}%` }} />
                      </div>
                      <span className="font-mono-num w-12 text-ink-secondary">
                        {dPct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-track sm:block">
                        <div className="h-full bg-sage" style={{ width: `${Math.min(100, mPct * 2)}%` }} />
                      </div>
                      <span className="font-mono-num w-12 text-sage-ink">
                        {mPct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Industry Distribution + Origin Breakdown */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Industry ranking */}
        <section aria-labelledby="heading-industry" className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex items-start gap-2.5 border-b border-rule-strong pb-3">
            <Briefcase className="mt-0.5 size-4 shrink-0 text-gold-ink" aria-hidden="true" />
            <div>
              <h2 id="heading-industry" className="text-base font-bold text-ink">
                {t.industryTitle}
              </h2>
              <p className="text-xs text-ink-muted">{t.industryDesc}</p>
            </div>
          </div>

          <div className="panel-elevated divide-y divide-rule overflow-hidden rounded-lg border border-rule">
            {data.industries.map((ind) => (
              <div key={ind.industry} className="px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-ink">
                    {pickTerm(lang, ind.industry, ind.industry_zh)}
                  </span>
                  <span className="font-mono-num text-xs text-ink-secondary">
                    {ind.count}{t.unitPerson ? ` ${t.unitPerson}` : ''}{' '}
                    <span className="text-ink-muted">({ind.pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.max(3, (ind.count / maxIndustry) * 100)}%` }}
                  />
                </div>
                {ind.top_tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ind.top_tags.slice(0, 3).map((tt) => (
                      <button
                        key={tt.tag}
                        type="button"
                        onClick={() => handleTagClick(tt.tag)}
                        className="rounded border border-rule bg-surface px-2 py-0.5 text-[11px] text-ink-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border [@media(hover:hover)]:hover:border-gold-border [@media(hover:hover)]:hover:text-gold-ink"
                      >
                        {pickTerm(lang, tt.tag, tt.tag_zh)}{' '}
                        <span className="font-mono-num text-ink-muted">({tt.count})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Origin breakdown */}
        <section aria-labelledby="heading-origin" className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 border-b border-rule-strong pb-3">
            <Layers className="mt-0.5 size-4 shrink-0 text-gold-ink" aria-hidden="true" />
            <div>
              <h2 id="heading-origin" className="text-base font-bold text-ink">
                {t.originTitle}
              </h2>
              <p className="text-xs text-ink-muted">{t.originDesc}</p>
            </div>
          </div>

          <div className="panel-elevated divide-y divide-rule overflow-hidden rounded-lg border border-rule">
            {data.origins
              .filter((o) => o.count > 0)
              .map((o) => (
                <div key={o.origin_type} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {pickTerm(lang, o.origin_type, o.origin_type_zh)}
                    </span>
                    <span className="font-mono-num text-xs text-ink-secondary">
                      {o.count}{t.unitPerson ? ` ${t.unitPerson}` : ''}{' '}
                      <span className="text-ink-muted">({o.pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-track">
                    <div
                      className="h-full rounded-full bg-ink-secondary"
                      style={{ width: `${Math.max(4, o.pct)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.top_tags.slice(0, 3).map((tagItem) => (
                      <span
                        key={tagItem.tag}
                        className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] text-ink-secondary"
                      >
                        {pickTerm(lang, tagItem.tag, tagItem.tag_zh)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>

      {/* Skills + Books & Mentors */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Skills */}
        <section aria-labelledby="heading-skills" className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 border-b border-rule-strong pb-3">
            <Wrench className="mt-0.5 size-4 shrink-0 text-sage-ink" aria-hidden="true" />
            <div>
              <h2 id="heading-skills" className="text-base font-bold text-ink">
                {t.skillsTitle}
              </h2>
              <p className="text-xs text-ink-muted">{t.skillsDesc}</p>
            </div>
          </div>

          <div className="panel-elevated divide-y divide-rule overflow-hidden rounded-lg border border-rule">
            {data.skills_ranking.slice(0, 10).map((sk, idx) => (
              <div key={sk.skill} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-ink">
                    <span className="font-mono-num mr-2 text-sage-ink">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-medium">
                      {pickTerm(lang, sk.skill, sk.skill_zh)}
                    </span>
                    {lang !== 'en' && (
                      <span className="ml-1.5 text-ink-muted" lang="en">
                        ({sk.skill})
                      </span>
                    )}
                  </span>
                  <span className="font-mono-num shrink-0 text-ink-secondary">
                    {sk.count}{t.unitPerson ? ` ${t.unitPerson}` : ''}{' '}
                    <span className="text-ink-muted">({sk.pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full bg-sage"
                    style={{ width: `${Math.max(4, (sk.count / maxSkill) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Books & Mentors */}
        <section aria-labelledby="heading-books" className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 border-b border-rule-strong pb-3">
            <BookOpen className="mt-0.5 size-4 shrink-0 text-gold-ink" aria-hidden="true" />
            <div>
              <h2 id="heading-books" className="text-base font-bold text-ink">
                {t.booksTitle}
              </h2>
              <p className="text-xs text-ink-muted">{t.booksDesc}</p>
            </div>
          </div>

          <div className="panel-elevated divide-y divide-rule overflow-hidden rounded-lg border border-rule">
            {data.books_and_mentors.slice(0, 12).map((bm, idx) => (
              <div key={bm.name} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-ink">
                    <span className="font-mono-num mr-2 text-gold-ink">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {bm.name}
                  </span>
                  <span className="font-mono-num shrink-0 text-ink-secondary">
                    {t.mentionsCount(bm.count)}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.max(6, (bm.count / maxBook) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Methodology & Bias Disclosure */}
      <section
        aria-labelledby="heading-methodology"
        className="panel-elevated rounded-lg border border-rule p-5"
      >
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-4 shrink-0 text-gold-ink" aria-hidden="true" />
          <div className={`${lang === 'en' ? 'leading-relaxed' : 'cjk-prose'} flex flex-col gap-2 text-xs text-ink-secondary`}>
            <h3 id="heading-methodology" className="text-sm font-semibold text-ink">
              {t.methodologyTitle}
            </h3>
            <p>
              1. {t.methodologyP1a}
              <span className="font-mono-num font-semibold text-gold-ink">
                {data.overview.compilation_clips_deduped}
              </span>
              {t.methodologyP1b}
            </p>
            <p>
              2. {t.methodologyP2a}
              <span className="font-mono-num font-semibold text-ink">
                {data.overview.non_interview_videos}
              </span>
              {t.methodologyP2b}
            </p>
            <p>3. {t.methodologyP3}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
