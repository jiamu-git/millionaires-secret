import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Search } from 'lucide-react'
import { Lang, UI_DICT, videoTypeLabel } from '../i18n'
import { DashboardData, VideoType } from '../types'
import { formatDateStr, formatTimestamp, formatViews } from '../utils'

interface Props {
  data: DashboardData
  lang: Lang
}

const VIDEO_TYPE_CLS: Record<VideoType, string> = {
  street_multi: 'border-gold-border bg-gold-soft text-gold-ink',
  deep_dive_single: 'border-sage-border bg-sage-soft text-sage-ink',
  topic_compilation: 'border-rule-strong bg-surface-elevated text-ink',
  non_interview: 'border-rule bg-surface text-ink-muted',
  no_transcript: 'border-rule bg-surface text-ink-muted',
}

const PAGE_SIZE = 50

export function VideosTab({ data, lang }: Props) {
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const t = UI_DICT[lang]

  const filtered = useMemo(() => {
    return data.videos.filter((v) => {
      if (typeFilter !== 'ALL' && v.video_type !== typeFilter) return false
      if (search.trim()) {
        const term = search.toLowerCase()
        return v.title.toLowerCase().includes(term) || v.id.toLowerCase().includes(term)
      }
      return true
    })
  }, [data.videos, typeFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 border-b border-rule pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.colVideoType}>
          {[
            ['ALL', `${t.videoFilterAll} (${data.videos.length})`],
            ['street_multi', `${t.videoStreet} (${data.overview.video_type_counts.street_multi || 0})`],
            ['deep_dive_single', `${t.videoDeep} (${data.overview.video_type_counts.deep_dive_single || 0})`],
            ['topic_compilation', `${t.videoComp} (${data.overview.video_type_counts.topic_compilation || 0})`],
            ['non_interview', `${t.videoNonInterview} (${data.overview.video_type_counts.non_interview || 0})`],
            ['no_transcript', `${t.videoNoSub} (${data.overview.video_type_counts.no_transcript || 0})`],
          ].map(([k, label]) => {
            const active = typeFilter === k
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setTypeFilter(k)
                  setPage(1)
                }}
                aria-pressed={active}
                className={`min-h-[36px] rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border ${
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

        <div className="relative sm:w-64">
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
            aria-label={t.searchVideosPlaceholder}
            placeholder={t.searchVideosPlaceholder}
            className="min-h-[38px] w-full rounded-md border border-rule-strong bg-control py-1.5 pr-3 pl-8 text-xs text-ink placeholder-ink-muted focus:border-gold-border focus:outline-none"
          />
        </div>
      </div>

      <div className="panel-elevated overflow-x-auto rounded-lg border border-rule">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-rule bg-surface-elevated text-ink-muted">
              <th className="px-4 py-2.5 font-medium">{t.colVideoTitle}</th>
              <th className="px-4 py-2.5 font-medium">{t.colVideoType}</th>
              <th className="px-4 py-2.5 font-medium">{t.colPublishDate}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t.colDuration}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t.colViews}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t.colGuestsExtracted}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t.colSource}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {pageItems.map((v) => {
              const cls = VIDEO_TYPE_CLS[v.video_type] || VIDEO_TYPE_CLS.street_multi
              return (
                <tr key={v.id} className="[@media(hover:hover)]:hover:bg-surface-elevated">
                  <td className="max-w-md px-4 py-3 font-medium text-ink">{v.title}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded border px-2 py-0.5 text-[11px] ${cls}`}>
                      {videoTypeLabel(lang, v.video_type)}
                    </span>
                  </td>
                  <td className="font-mono-num whitespace-nowrap px-4 py-3 text-ink-muted">
                    {formatDateStr(v.upload_date)}
                  </td>
                  <td className="font-mono-num whitespace-nowrap px-4 py-3 text-right text-ink-secondary">
                    {formatTimestamp(v.duration)}
                  </td>
                  <td className="font-mono-num whitespace-nowrap px-4 py-3 text-right text-ink">
                    {formatViews(v.view_count)}
                  </td>
                  <td className="font-mono-num whitespace-nowrap px-4 py-3 text-right font-semibold text-gold-ink">
                    {v.guest_count}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-border [@media(hover:hover)]:hover:underline"
                    >
                      {t.watchLink} <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-rule pt-3 text-xs text-ink-muted">
          <span className="font-mono-num">
            {t.paginationInfo(safePage, totalPages, filtered.length, t.unitVideos)}
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
    </div>
  )
}
