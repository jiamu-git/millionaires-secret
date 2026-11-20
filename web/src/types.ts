export type VideoType =
  | 'street_multi'
  | 'deep_dive_single'
  | 'topic_compilation'
  | 'non_interview'
  | 'no_transcript'

export type Actionability =
  | 'high_actionable'
  | 'strategic_principle'
  | 'mindset_general'

export type AdviceType = 'advice_do' | 'warning_dont' | 'regret'

export interface QuoteEntry {
  guest_name: string
  role_or_title: string
  industry: string
  wealth_tier: string
  wealth_detail: string
  origin_type: string
  video_id: string
  video_title: string
  upload_date: string
  view_count: number
  timestamp_sec: number
  quote: string
  summary_zh: string
  summary_en: string
}

export interface AdviceRankItem {
  rank: number
  tag: string
  tag_zh: string
  desc: string
  category: string
  category_zh: string
  type: AdviceType
  actionability: Actionability
  unique_guest_count: number
  unique_guest_pct: number
  non_compilation_guest_count: number
  raw_mention_count: number
  view_weighted_score: number
  by_wealth_tier: Record<string, number>
  by_industry: Record<string, number>
  by_origin: Record<string, number>
  by_year: Record<string, number>
  quotes: QuoteEntry[]
}

export interface IndustrySummary {
  industry: string
  industry_zh: string
  count: number
  pct: number
  wealth_tiers: Record<string, number>
  top_tags: { tag: string; tag_zh: string; count: number }[]
}

export interface WealthTierSummary {
  wealth_tier: string
  wealth_tier_zh: string
  count: number
  pct: number
  top_tags: { tag: string; tag_zh: string; count: number; pct: number }[]
}

export interface OriginSummary {
  origin_type: string
  origin_type_zh: string
  count: number
  pct: number
  top_tags: { tag: string; tag_zh: string; count: number }[]
}

export interface GuestItem {
  guest_key: string
  guest_name: string
  is_named: boolean
  role_or_title: string
  industry: string
  industry_zh: string
  wealth_tier: string
  wealth_tier_zh: string
  wealth_detail: string
  origin_type: string
  origin_type_zh: string
  first_money_or_break: string
  first_money_or_break_en?: string
  zero_start_advice: string
  zero_start_advice_en?: string
  recommended_skills: string[]
  recommended_books_or_mentors: string[]
  appearance_count: number
  primary_video_id: string
  primary_video_title: string
  max_view_count: number
  advice_tags: string[]
  advice_items: {
    canonical_tag: string
    category: string
    type: AdviceType
    actionability: Actionability
    summary_zh: string
    summary_en: string
    quote: string
    timestamp_sec: number
    video_id: string
    video_title: string
    view_count: number
  }[]
}

export interface VideoRecord {
  id: string
  url: string
  title: string
  upload_date: string
  year: string
  duration: number
  view_count: number
  like_count: number
  word_count: number
  video_type: VideoType
  is_compilation_warning: boolean
  guest_count: number
}

export interface ZeroStartEntry {
  guest_name: string
  role_or_title: string
  industry: string
  wealth_tier: string
  wealth_detail: string
  zero_start_advice: string
  zero_start_advice_en?: string
  video_id: string
  video_title: string
  view_count: number
}

export interface DashboardData {
  generated_at: string
  overview: {
    channel_handle: string
    channel_url: string
    total_playlist_videos: number
    cleaned_transcripts: number
    extracted_videos: number
    interview_videos: number
    non_interview_videos: number
    video_type_counts: Record<string, number>
    total_raw_guest_appearances: number
    unique_guests_count: number
    compilation_clips_deduped: number
    total_unique_advice_endorsements: number
    total_raw_advice_mentions: number
    total_views_analyzed: number
    date_min: string
    date_max: string
    unmapped_other_tags: Record<string, number>
  }
  taxonomy: {
    categories: Record<string, string>
    industries_zh: Record<string, string>
    wealth_tiers_zh: Record<string, string>
    origin_types_zh: Record<string, string>
    skills_zh: Record<string, string>
  }
  advice_rankings: AdviceRankItem[]
  industries: IndustrySummary[]
  wealth_tiers: WealthTierSummary[]
  origins: OriginSummary[]
  skills_ranking: { skill: string; skill_zh: string; count: number; pct: number }[]
  books_and_mentors: { name: string; count: number }[]
  zero_start_playbook: ZeroStartEntry[]
  guests: GuestItem[]
  videos: VideoRecord[]
}
