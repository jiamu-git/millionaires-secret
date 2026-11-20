import { Lang, UI_DICT } from './i18n'

export function formatViews(views: number): string {
  if (!views) return '0'
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${Math.round(views / 1_000)}K`
  return String(views)
}

export function formatTimestamp(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function formatDateStr(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd || '-'
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
}

export function ytTimestampUrl(videoId: string, sec: number): string {
  const t = Math.max(0, Math.floor(sec || 0))
  return `https://www.youtube.com/watch?v=${videoId}&t=${t}s`
}

export function actionabilityBadge(
  act: string,
  lang: Lang = 'zh-CN',
): { label: string; dotCls: string; pillCls: string } {
  const t = UI_DICT[lang]
  switch (act) {
    case 'high_actionable':
      return {
        label: t.actHigh,
        dotCls: 'bg-sage',
        pillCls: 'border-sage-border bg-sage-soft text-sage-ink',
      }
    case 'strategic_principle':
      return {
        label: t.actStrategic,
        dotCls: 'bg-gold',
        pillCls: 'border-gold-border bg-gold-soft text-gold-ink',
      }
    default:
      return {
        label: t.actMindset,
        dotCls: 'bg-ink-muted',
        pillCls: 'border-rule-strong bg-surface-elevated text-ink-secondary',
      }
  }
}

export function adviceTypeBadge(
  type: string,
  lang: Lang = 'zh-CN',
): { label: string; pillCls: string } {
  const t = UI_DICT[lang]
  if (type === 'regret') {
    return {
      label: t.typeRegret,
      pillCls: 'border-rose-border bg-rose-soft text-rose-ink',
    }
  }
  if (type === 'warning_dont') {
    return {
      label: t.typeWarning,
      pillCls: 'border-rose-border bg-rose-soft text-rose-ink',
    }
  }
  return {
    label: t.typeAdvice,
    pillCls: 'border-gold-border bg-gold-soft text-gold-ink',
  }
}

export function wealthBadgeCls(tier: string): string {
  if (tier.includes('Billionaire')) {
    return 'border-gold-border bg-gold-soft text-gold-ink'
  }
  if (tier.includes('Decamillionaire')) {
    return 'border-rule-strong bg-surface-elevated text-ink'
  }
  if (tier.includes('Millionaire')) {
    return 'border-sage-border bg-sage-soft text-sage-ink'
  }
  if (tier.includes('High Earner')) {
    return 'border-rule bg-surface text-ink-secondary'
  }
  return 'border-rule bg-surface text-ink-muted'
}
