import { useEffect, useState } from 'react'
import { AlertTriangle, Award, BarChart3, ExternalLink, Film, Globe, Moon, Sun, Users } from 'lucide-react'
import { ActionableRegretsTab } from './components/ActionableRegretsTab'
import { CrossAnalysisTab } from './components/CrossAnalysisTab'
import { EvidenceDrawer } from './components/EvidenceDrawer'
import { GuestsTab } from './components/GuestsTab'
import { LeaderboardTab } from './components/LeaderboardTab'
import { VideosTab } from './components/VideosTab'
import { ensureTraditionalLoaded, htmlLangCode, Lang, pickTerm, UI_DICT } from './i18n'
import { AdviceRankItem, DashboardData } from './types'
import { formatDateStr, formatViews } from './utils'

type TabKey = 'leaderboard' | 'actionable' | 'cross' | 'guests' | 'videos'
type ThemeMode = 'light' | 'dark'

export function App() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('leaderboard')
  const [selectedAdvice, setSelectedAdvice] = useState<AdviceRankItem | null>(null)
  const [drawerAdvice, setDrawerAdvice] = useState<AdviceRankItem | null>(null)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('theme')
      if (q === 'dark' || q === 'light') return q
      return localStorage.getItem('ms-theme-v2') === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('lang')
      if (q === 'en' || q === 'zh-TW' || q === 'zh-CN') return q
      const saved = localStorage.getItem('ms-lang')
      if (saved === 'en' || saved === 'zh-TW' || saved === 'zh-CN') return saved
      return 'zh-CN'
    } catch {
      return 'zh-CN'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem('ms-theme-v2', theme)
    } catch {
      // ignore storage failures
    }
  }, [theme])

  const [twLoaded, setTwLoaded] = useState(false)

  useEffect(() => {
    document.documentElement.lang = htmlLangCode(lang)
    document.title = UI_DICT[lang].pageTitle
    try {
      localStorage.setItem('ms-lang', lang)
    } catch {
      // ignore storage failures
    }
    if (lang === 'zh-TW' && !twLoaded) {
      ensureTraditionalLoaded().then(() => setTwLoaded(true))
    }
  }, [lang, twLoaded])

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}dashboard_data.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json: DashboardData) => {
        setData(json)
        if (json.advice_rankings.length > 0) {
          setSelectedAdvice(json.advice_rankings[0])
        }
      })
      .catch((err) => setError(String(err)))
  }, [])

  const t = UI_DICT[lang]

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="panel-elevated max-w-md rounded-lg border border-rose-border p-6">
          <div className="text-base font-bold text-rose-ink">{t.loadErrorTitle}</div>
          <p className="mt-2 text-xs text-ink-secondary">
            {t.loadErrorHint} ({error})
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-ink-secondary">{t.loading}</div>
      </div>
    )
  }

  const ov = data.overview
  const topGlobal = data.advice_rankings[0]
  const topActionable = data.advice_rankings.find(
    (x) => x.actionability === 'high_actionable' && x.type === 'advice_do',
  )

  const tabs: { key: TabKey; label: string; icon: typeof Award }[] = [
    { key: 'leaderboard', label: t.tabLeaderboard, icon: Award },
    { key: 'actionable', label: t.tabActionable, icon: AlertTriangle },
    { key: 'cross', label: t.tabCross, icon: BarChart3 },
    { key: 'guests', label: t.tabGuests, icon: Users },
    { key: 'videos', label: t.tabVideos, icon: Film },
  ]

  const langOptions: { key: Lang; shortLabel: string; aria: string }[] = [
    { key: 'zh-CN', shortLabel: '简', aria: '简体中文' },
    { key: 'zh-TW', shortLabel: '繁', aria: '繁體中文' },
    { key: 'en', shortLabel: 'EN', aria: 'English' },
  ]

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-gold focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
      >
        {t.skipToContent}
      </a>

      {/* Compact Analytical Masthead */}
      <header className="border-b border-rule bg-header">
        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <div
                aria-hidden="true"
                className="font-editorial flex size-9 shrink-0 items-center justify-center rounded border border-gold-border bg-gold-soft text-base font-bold text-gold-ink"
              >
                M
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  <h1
                    className="font-editorial en-display text-xl font-bold tracking-tight text-ink sm:text-2xl"
                    lang="en"
                  >
                    Millionaires&apos; Secret
                  </h1>
                  <span className="text-xs font-medium text-ink-muted">
                    {t.brandSubtitle}
                  </span>
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-ink-muted">
                  <span>{t.sourceLabel}</span>
                  <a
                    href={ov.channel_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border [@media(hover:hover)]:hover:underline"
                  >
                    {ov.channel_handle}
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                  <span className="text-ink-faint" aria-hidden="true">·</span>
                  <span className="font-mono-num">
                    {formatDateStr(ov.date_min)} {t.dateTo} {formatDateStr(ov.date_max)}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-ink-secondary sm:gap-3">
              <span>
                {t.effectiveInterviews}{' '}
                <strong className="font-mono-num text-ink">{ov.interview_videos}</strong>{' '}
                / {ov.total_playlist_videos} {t.episodesUnit}
              </span>
              <span className="text-ink-faint" aria-hidden="true">|</span>
              <span>
                {t.totalViews}{' '}
                <strong className="font-mono-num text-gold-ink">
                  {formatViews(ov.total_views_analyzed)}
                </strong>
              </span>

              {/* Language Switcher */}
              <div
                role="group"
                aria-label={t.langSwitchLabel}
                className="inline-flex items-center rounded-md border border-rule-strong bg-control p-0.5"
              >
                <Globe className="mx-1.5 size-3.5 text-ink-muted" aria-hidden="true" />
                {langOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setLang(opt.key)}
                    aria-pressed={lang === opt.key}
                    aria-label={opt.aria}
                    className={`min-h-[30px] rounded px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border ${
                      lang === opt.key
                        ? 'bg-gold-soft text-gold-ink'
                        : 'text-ink-muted [@media(hover:hover)]:hover:text-ink'
                    }`}
                  >
                    {opt.shortLabel}
                  </button>
                ))}
              </div>

              {/* Dark / Light Mode Switch */}
              <div
                role="group"
                aria-label={t.themeLabel}
                className="inline-flex items-center rounded-md border border-rule-strong bg-control p-0.5"
              >
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  aria-pressed={theme === 'dark'}
                  aria-label={t.darkMode}
                  className={`inline-flex min-h-[30px] items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border ${
                    theme === 'dark'
                      ? 'bg-gold-soft text-gold-ink'
                      : 'text-ink-muted [@media(hover:hover)]:hover:text-ink'
                  }`}
                >
                  <Moon className="size-3.5" aria-hidden="true" />
                  <span>{t.darkMode}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  aria-pressed={theme === 'light'}
                  aria-label={t.lightMode}
                  className={`inline-flex min-h-[30px] items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border ${
                    theme === 'light'
                      ? 'bg-gold-soft text-gold-ink'
                      : 'text-ink-muted [@media(hover:hover)]:hover:text-ink'
                  }`}
                >
                  <Sun className="size-3.5" aria-hidden="true" />
                  <span>{t.lightMode}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hairline Status Summary Ledger */}
          <div className="mt-4 grid grid-cols-2 divide-rule border-y border-rule lg:grid-cols-4 lg:divide-x">
            <div className="min-w-0 border-b border-r border-rule py-3 pr-3 lg:border-b-0 lg:border-r-0 lg:pr-4">
              <div className="text-[11px] text-ink-muted">{t.kpiGuests}</div>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-mono-num text-xl font-bold text-gold-ink">
                  {ov.unique_guests_count}
                </span>
                <span className="font-mono-num text-[11px] text-ink-muted">
                  {t.kpiMergedPrefix} {ov.compilation_clips_deduped} {t.kpiMergedSuffix}
                </span>
              </div>
            </div>

            <div className="min-w-0 border-b border-rule py-3 pl-3 lg:border-b-0 lg:px-4">
              <div className="text-[11px] text-ink-muted">{t.kpiAdvice}</div>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-mono-num text-xl font-bold text-ink">
                  {ov.total_unique_advice_endorsements.toLocaleString()}
                </span>
                <span className="font-mono-num text-[11px] text-ink-muted">
                  {t.kpiRawPrefix} {ov.total_raw_advice_mentions.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="min-w-0 border-r border-rule py-3 pr-3 lg:border-r-0 lg:px-4">
              <div className="text-[11px] text-ink-muted">{t.kpiTop1Global}</div>
              <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <span className="min-w-0 truncate text-xs font-semibold text-ink sm:text-sm">
                  {topGlobal ? pickTerm(lang, topGlobal.tag, topGlobal.tag_zh) : '-'}
                </span>
                <span className="font-mono-num shrink-0 text-xs font-medium text-gold-ink">
                  {topGlobal?.unique_guest_pct.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="min-w-0 py-3 pl-3 lg:pl-4">
              <div className="text-[11px] text-ink-muted">{t.kpiTop1Action}</div>
              <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <span className="min-w-0 truncate text-xs font-semibold text-sage-ink sm:text-sm">
                  {topActionable ? pickTerm(lang, topActionable.tag, topActionable.tag_zh) : '-'}
                </span>
                <span className="font-mono-num shrink-0 text-xs font-medium text-sage-ink">
                  {topActionable?.unique_guest_pct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex gap-1 overflow-x-auto pt-1" aria-label="Main views">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative inline-flex min-h-[42px] shrink-0 items-center gap-2 px-3.5 py-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border ${
                    active
                      ? 'text-gold-ink'
                      : 'text-ink-muted [@media(hover:hover)]:hover:text-ink'
                  }`}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  <span>{tab.label}</span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute right-2 bottom-0 left-2 h-[2px] bg-gold"
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            data={data}
            lang={lang}
            selectedItem={selectedAdvice}
            onSelectAdvice={setSelectedAdvice}
            onOpenMobileSheet={setDrawerAdvice}
          />
        )}
        {activeTab === 'actionable' && (
          <ActionableRegretsTab data={data} lang={lang} onSelectAdvice={setDrawerAdvice} />
        )}
        {activeTab === 'cross' && (
          <CrossAnalysisTab data={data} lang={lang} onSelectAdvice={setDrawerAdvice} />
        )}
        {activeTab === 'guests' && <GuestsTab data={data} lang={lang} />}
        {activeTab === 'videos' && <VideosTab data={data} lang={lang} />}
      </main>

      <EvidenceDrawer
        item={drawerAdvice}
        lang={lang}
        industriesZh={data.taxonomy.industries_zh}
        wealthTiersZh={data.taxonomy.wealth_tiers_zh}
        onClose={() => setDrawerAdvice(null)}
      />
    </div>
  )
}

export default App
