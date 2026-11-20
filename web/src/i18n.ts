export type Lang = 'zh-CN' | 'zh-TW' | 'en'

let cnToTw: ((text: string) => string) | null = null
let twLoadPromise: Promise<void> | null = null
const twCache = new Map<string, string>()

export function ensureTraditionalLoaded(): Promise<void> {
  if (cnToTw) return Promise.resolve()
  if (!twLoadPromise) {
    twLoadPromise = import('opencc-js/cn2t').then((OpenCC) => {
      cnToTw = OpenCC.Converter({ from: 'cn', to: 'tw' })
    })
  }
  return twLoadPromise
}

export function toTraditional(text: string): string {
  if (!text) return ''
  if (!cnToTw) return text
  const cached = twCache.get(text)
  if (cached !== undefined) return cached
  const converted = cnToTw(text)
  twCache.set(text, converted)
  return converted
}

export function pickText(lang: Lang, zhCn: string | undefined, en: string | undefined): string {
  if (lang === 'en') return (en && en.trim()) || zhCn || ''
  if (lang === 'zh-TW') return toTraditional(zhCn || '')
  return zhCn || ''
}

export function pickTerm(lang: Lang, enKey: string, zhCn?: string): string {
  if (lang === 'en') return enKey
  const src = zhCn || enKey
  if (lang === 'zh-TW') return toTraditional(src)
  return src
}

export function htmlLangCode(lang: Lang): string {
  if (lang === 'zh-TW') return 'zh-Hant'
  if (lang === 'en') return 'en'
  return 'zh-Hans'
}

export interface UiStrings {
  pageTitle: string
  skipToContent: string
  loading: string
  loadErrorTitle: string
  loadErrorHint: string
  brandSubtitle: string
  sourceLabel: string
  dateTo: string
  effectiveInterviews: string
  episodesUnit: string
  totalViews: string
  themeLabel: string
  lightMode: string
  darkMode: string
  langSwitchLabel: string
  kpiGuests: string
  kpiMergedPrefix: string
  kpiMergedSuffix: string
  kpiAdvice: string
  kpiRawPrefix: string
  kpiTop1Global: string
  kpiTop1Action: string
  tabLeaderboard: string
  tabActionable: string
  tabCross: string
  tabGuests: string
  tabVideos: string
  sortLabel: string
  sortUnique: string
  sortNonComp: string
  sortRaw: string
  sortWeighted: string
  searchAdvicePlaceholder: string
  filterActionAll: string
  filterActionHigh: string
  filterActionStrategic: string
  filterActionMindset: string
  filterCatAll: string
  filterWealthAll: string
  colRank: string
  colTopic: string
  colType: string
  colCountShare: string
  colCount: string
  colShare: string
  unitPeople: string
  unitPerson: string
  unitScore: string
  unitTimes: string
  badgePitfall: string
  emptyAdvice: string
  drawerLabel: string
  closeEvidence: string
  rankPrefix: string
  evidenceUnique: string
  evidenceNoComp: string
  evidenceRaw: string
  filterWealthQuotes: string
  topIndustries: string
  searchQuotesPlaceholder: (n: number) => string
  clearFilter: string
  viewsSuffix: string
  emptyQuotes: string
  actHigh: string
  actStrategic: string
  actMindset: string
  typeRegret: string
  typeWarning: string
  typeAdvice: string
  actionableTitle: string
  actionableDesc: string
  regretsTitle: string
  regretsDesc: string
  totalItemsCount: (n: number) => string
  zeroTitle: string
  zeroDesc: (n: number) => string
  filterIndustryAll: string
  searchZeroPlaceholder: string
  paginationInfo: (page: number, total: number, count: number, unit: string) => string
  prevPage: string
  nextPage: string
  unitPlans: string
  unitGuests: string
  unitVideos: string
  wealthMatrixTitle: string
  wealthMatrixDesc: string
  matrixColTopic: string
  matrixTierB: string
  matrixTierD: string
  matrixTierM: string
  industryTitle: string
  industryDesc: string
  originTitle: string
  originDesc: string
  skillsTitle: string
  skillsDesc: string
  booksTitle: string
  booksDesc: string
  mentionsCount: (n: number) => string
  methodologyTitle: string
  methodologyP1a: string
  methodologyP1b: string
  methodologyP2a: string
  methodologyP2b: string
  methodologyP3: string
  searchGuestsPlaceholder: string
  onlyNamed: string
  guestsTotalCount: (n: number) => string
  namedGuestLabel: string
  extractedPrefix: string
  extractedSuffix: string
  appearancesSuffix: string
  viewProfile: string
  closeGuestModal: string
  firstBreakTitle: string
  zeroStartGuestTitle: string
  skillsEmphasized: string
  booksMentorsMentioned: string
  allAdviceQuotesTitle: (n: number) => string
  primarySource: string
  watchFullVideo: string
  videoFilterAll: string
  videoStreet: string
  videoDeep: string
  videoComp: string
  videoNonInterview: string
  videoNoSub: string
  searchVideosPlaceholder: string
  colVideoTitle: string
  colVideoType: string
  colPublishDate: string
  colDuration: string
  colViews: string
  colGuestsExtracted: string
  colSource: string
  watchLink: string
}

const ZH_CN: UiStrings = {
  pageTitle: "Millionaires' Secret: @theschoolofhardknocks 富豪经验全量图谱",
  skipToContent: '跳转到主要内容',
  loading: '正在载入 @theschoolofhardknocks 全量富豪经验图谱...',
  loadErrorTitle: '无法加载统计数据集',
  loadErrorHint: '请检查本地数据文件或尝试刷新页面',
  brandSubtitle: '富豪经验全量图谱',
  sourceLabel: '数据来源',
  dateTo: '至',
  effectiveInterviews: '有效访谈',
  episodesUnit: '期',
  totalViews: '总观看',
  themeLabel: '外观模式切换',
  lightMode: '浅色',
  darkMode: '深色',
  langSwitchLabel: '语言切换',
  kpiGuests: '独立受访富豪',
  kpiMergedPrefix: '合并',
  kpiMergedSuffix: '次合集',
  kpiAdvice: '去重经验票数',
  kpiRawPrefix: '原始',
  kpiTop1Global: '总榜 TOP 1 共识',
  kpiTop1Action: '实操榜 TOP 1',
  tabLeaderboard: '核心经验排行榜',
  tabActionable: '实操 & 避坑与 $0 起家',
  tabCross: '身家 / 行业 / 技能交叉',
  tabGuests: '富豪档案库',
  tabVideos: '全频道样本审计',
  sortLabel: '统计口径',
  sortUnique: '独立富豪数',
  sortNonComp: '剔除合集',
  sortRaw: '总提及次数',
  sortWeighted: '播放量加权',
  searchAdvicePlaceholder: '搜经验关键词...',
  filterActionAll: '全部属性',
  filterActionHigh: '可落地实操',
  filterActionStrategic: '商业原则',
  filterActionMindset: '思维心态',
  filterCatAll: '全部分类',
  filterWealthAll: '全部身家',
  colRank: '排名',
  colTopic: '经验主题',
  colType: '属性',
  colCountShare: '数量 / 占比',
  colCount: '数量',
  colShare: '占比',
  unitPeople: '位',
  unitPerson: '人',
  unitScore: '分',
  unitTimes: '次',
  badgePitfall: '避坑',
  emptyAdvice: '没有符合当前筛选条件的经验主题，请尝试放宽过滤条件。',
  drawerLabel: '原话证据溯源',
  closeEvidence: '关闭证据面板',
  rankPrefix: 'RANK #',
  evidenceUnique: '独立富豪认可',
  evidenceNoComp: '不含合集独立',
  evidenceRaw: '全频道提及次',
  filterWealthQuotes: '按身家段位过滤原话',
  topIndustries: '高频行业:',
  searchQuotesPlaceholder: (n) => `筛选 ${n} 条原话（人名 / 观点 / 关键词）...`,
  clearFilter: '清除筛选',
  viewsSuffix: '观看',
  emptyQuotes: '没有匹配当前筛选条件的原话记录。',
  actHigh: '可落地实操',
  actStrategic: '商业原则',
  actMindset: '思维心态',
  typeRegret: '后悔复盘',
  typeWarning: '避坑警告',
  typeAdvice: '成功经验',
  actionableTitle: '可落地实操排行榜',
  actionableDesc: '剔除宏观心态鸡汤，普通人可立即执行的动作',
  regretsTitle: "富豪避坑与后悔榜 (Don'ts)",
  regretsDesc: '用真金白银和人生遗憾换来的反面警示',
  totalItemsCount: (n) => `共 ${n} 项`,
  zeroTitle: '灵魂拷问专题: 如果今天手里只有 $0，你会怎么做？',
  zeroDesc: (n) => `汇总 ${n} 位受访者给出的冷启动路线与第一动作`,
  filterIndustryAll: '全部行业',
  searchZeroPlaceholder: '搜冷启动关键词...',
  paginationInfo: (p, t, c, u) => `第 ${p} / ${t} 页 · 共 ${c} ${u}`,
  prevPage: '上一页',
  nextPage: '下一页',
  unitPlans: '条方案',
  unitGuests: '位受访者',
  unitVideos: '期视频',
  wealthMatrixTitle: '不同身家段位心法对比: 十亿富豪 ($1B+) vs 千万富豪 ($10M+) vs 百万富翁 ($1M+)',
  wealthMatrixDesc: '观察随着资产量级跃升，受访者强调的经验重点如何发生迁移（点击任意主题查看原话）',
  matrixColTopic: '核心经验主题 (Top 12)',
  matrixTierB: '十亿美元级 ($1B+)',
  matrixTierD: '千万美元级 ($10M+)',
  matrixTierM: '百万美元级 ($1M+)',
  industryTitle: '出富豪最多的行业分布与各行业 Top 3 心法',
  industryDesc: '按独立受访富豪主营行业统计',
  originTitle: '第一桶金出身路径',
  originDesc: '白手起家 vs 职业高管 vs 家族继承',
  skillsTitle: '高频推荐核心技能榜',
  skillsDesc: '受访富豪最强调掌握的硬技能与软实力',
  booksTitle: '高频提及书籍 / 精神导师榜',
  booksDesc: '被至少 2 位独立受访富豪点名推荐的书籍或榜样',
  mentionsCount: (n) => `${n} 次提及`,
  methodologyTitle: '统计方法论与样本偏差说明',
  methodologyP1a: '去重口径: 频道内存在专题混剪与年度合集，同一位名人或同一段街头片段可能出现在多期视频中。本看板按「独立受访者」去重合并（共合并 ',
  methodologyP1b: ' 次重复片段），确保每位富豪对同一条经验只计 1 票。',
  methodologyP2a: '样本清洗: 已自动识别并剔除早期（2021 至 2022 年）非访谈类清单视频 ',
  methodologyP2b: ' 期，仅统计真实富豪与创业者访谈。',
  methodologyP3: '采样特征与幸存者偏差: 频道早期多在比佛利、迈阿密等富人区街头随机采访豪车车主，导致地产、消费品牌及高佣金销售创业者占比较高，且部分街头自报收入未经财务审计。建议结合「可落地实操」与「避坑与后悔榜」交叉参考。',
  searchGuestsPlaceholder: '搜富豪姓名、行业、第一桶金故事或关键词...',
  onlyNamed: '仅实名嘉宾',
  guestsTotalCount: (n) => `${n} 位独立受访者`,
  namedGuestLabel: '实名嘉宾',
  extractedPrefix: '提取',
  extractedSuffix: '条经验',
  appearancesSuffix: '期',
  viewProfile: '查看档案 →',
  closeGuestModal: '关闭嘉宾档案',
  firstBreakTitle: '第一桶金与发家史',
  zeroStartGuestTitle: '如果从 $0 重新开始，Ta 会怎么做？',
  skillsEmphasized: '强调技能',
  booksMentorsMentioned: '提及书籍 / 导师',
  allAdviceQuotesTitle: (n) => `全部核心经验与原话 (${n})`,
  primarySource: '主出处:',
  watchFullVideo: '观看原片',
  videoFilterAll: '全部',
  videoStreet: '街头多访',
  videoDeep: '深度专访',
  videoComp: '专题合集',
  videoNonInterview: '早期非访谈',
  videoNoSub: '无字幕',
  searchVideosPlaceholder: '搜视频标题或 ID...',
  colVideoTitle: '视频标题',
  colVideoType: '分类',
  colPublishDate: '发布日期',
  colDuration: '时长',
  colViews: '播放量',
  colGuestsExtracted: '提取嘉宾',
  colSource: '原片',
  watchLink: '观看',
}

const ZH_TW: UiStrings = {
  pageTitle: "Millionaires' Secret: @theschoolofhardknocks 富豪經驗全量圖譜",
  skipToContent: '跳至主要內容',
  loading: '正在載入 @theschoolofhardknocks 全量富豪經驗圖譜...',
  loadErrorTitle: '無法載入統計資料集',
  loadErrorHint: '請檢查本地資料檔案或嘗試重新整理頁面',
  brandSubtitle: '富豪經驗全量圖譜',
  sourceLabel: '資料來源',
  dateTo: '至',
  effectiveInterviews: '有效訪談',
  episodesUnit: '期',
  totalViews: '總觀看',
  themeLabel: '外觀模式切換',
  lightMode: '淺色',
  darkMode: '深色',
  langSwitchLabel: '語言切換',
  kpiGuests: '獨立受訪富豪',
  kpiMergedPrefix: '合併',
  kpiMergedSuffix: '次合集',
  kpiAdvice: '去重經驗票數',
  kpiRawPrefix: '原始',
  kpiTop1Global: '總榜 TOP 1 共識',
  kpiTop1Action: '實操榜 TOP 1',
  tabLeaderboard: '核心經驗排行榜',
  tabActionable: '實操 & 避坑與 $0 起家',
  tabCross: '身家 / 產業 / 技能交叉',
  tabGuests: '富豪檔案庫',
  tabVideos: '全頻道樣本審計',
  sortLabel: '統計口徑',
  sortUnique: '獨立富豪數',
  sortNonComp: '剔除合集',
  sortRaw: '總提及次數',
  sortWeighted: '觀看數加權',
  searchAdvicePlaceholder: '搜尋經驗關鍵字...',
  filterActionAll: '全部屬性',
  filterActionHigh: '可落地實操',
  filterActionStrategic: '商業原則',
  filterActionMindset: '思維心態',
  filterCatAll: '全部分類',
  filterWealthAll: '全部身家',
  colRank: '排名',
  colTopic: '經驗主題',
  colType: '屬性',
  colCountShare: '數量 / 佔比',
  colCount: '數量',
  colShare: '佔比',
  unitPeople: '位',
  unitPerson: '人',
  unitScore: '分',
  unitTimes: '次',
  badgePitfall: '避坑',
  emptyAdvice: '沒有符合目前篩選條件的經驗主題，請嘗試放寬條件。',
  drawerLabel: '原話證據溯源',
  closeEvidence: '關閉證據面板',
  rankPrefix: 'RANK #',
  evidenceUnique: '獨立富豪認可',
  evidenceNoComp: '不含合集獨立',
  evidenceRaw: '全頻道提及次',
  filterWealthQuotes: '依身家層級過濾原話',
  topIndustries: '高頻產業:',
  searchQuotesPlaceholder: (n) => `篩選 ${n} 條原話（人名 / 觀點 / 關鍵字）...`,
  clearFilter: '清除篩選',
  viewsSuffix: '觀看',
  emptyQuotes: '沒有符合目前篩選條件的原話紀錄。',
  actHigh: '可落地實操',
  actStrategic: '商業原則',
  actMindset: '思維心態',
  typeRegret: '後悔復盤',
  typeWarning: '避坑警告',
  typeAdvice: '成功經驗',
  actionableTitle: '可落地實操排行榜',
  actionableDesc: '剔除宏觀心態雞湯，一般人可立即執行的行動',
  regretsTitle: "富豪避坑與後悔榜 (Don'ts)",
  regretsDesc: '用真金白銀與人生遺憾換來的反面警示',
  totalItemsCount: (n) => `共 ${n} 項`,
  zeroTitle: '靈魂拷問專題: 如果今天手裡只有 $0，你會怎麼做？',
  zeroDesc: (n) => `彙整 ${n} 位受訪者給出的冷啟動路線與第一行動`,
  filterIndustryAll: '全部產業',
  searchZeroPlaceholder: '搜尋冷啟動關鍵字...',
  paginationInfo: (p, t, c, u) => `第 ${p} / ${t} 頁 · 共 ${c} ${u}`,
  prevPage: '上一頁',
  nextPage: '下一頁',
  unitPlans: '條方案',
  unitGuests: '位受訪者',
  unitVideos: '部影片',
  wealthMatrixTitle: '不同身家層級心法對比: 十億富豪 ($1B+) vs 千萬富豪 ($10M+) vs 百萬富翁 ($1M+)',
  wealthMatrixDesc: '觀察隨著資產量級躍升，受訪者強調的經驗重點如何轉移（點擊任意主題查看原話）',
  matrixColTopic: '核心經驗主題 (Top 12)',
  matrixTierB: '十億美元級 ($1B+)',
  matrixTierD: '千萬美元級 ($10M+)',
  matrixTierM: '百萬美元級 ($1M+)',
  industryTitle: '產出最多富豪的產業分布與各產業 Top 3 心法',
  industryDesc: '依獨立受訪富豪主營產業統計',
  originTitle: '第一桶金出身路徑',
  originDesc: '白手起家 vs 職業高管 vs 家族傳承',
  skillsTitle: '高頻推薦核心技能榜',
  skillsDesc: '受訪富豪最強調掌握的硬技能與軟實力',
  booksTitle: '高頻提及書籍 / 精神導師榜',
  booksDesc: '被至少 2 位獨立受訪富豪點名推薦的書籍或榜樣',
  mentionsCount: (n) => `${n} 次提及`,
  methodologyTitle: '統計方法論與樣本偏差說明',
  methodologyP1a: '去重口徑: 頻道內存在專題混剪與年度合集，同一位名人或同一段街頭片段可能出現在多部影片中。本看板依「獨立受訪者」去重合併（共合併 ',
  methodologyP1b: ' 次重複片段），確保每位富豪對同一條經驗只計 1 票。',
  methodologyP2a: '樣本清洗: 已自動識別並剔除早期（2021 至 2022 年）非訪談類清單影片 ',
  methodologyP2b: ' 部，僅統計真實富豪與創業者訪談。',
  methodologyP3: '採樣特徵與倖存者偏差: 頻道早期多在比佛利、邁阿密等富人區街頭隨機採訪豪車車主，導致地產、消費品牌與高佣金銷售創業者佔比較高，且部分街頭自報收入未經財務審計。建議搭配「可落地實操」與「避坑與後悔榜」交叉參考。',
  searchGuestsPlaceholder: '搜尋富豪姓名、產業、第一桶金故事或關鍵字...',
  onlyNamed: '僅看實名嘉賓',
  guestsTotalCount: (n) => `${n} 位獨立受訪者`,
  namedGuestLabel: '實名嘉賓',
  extractedPrefix: '萃取',
  extractedSuffix: '條經驗',
  appearancesSuffix: '部',
  viewProfile: '查看檔案 →',
  closeGuestModal: '關閉嘉賓檔案',
  firstBreakTitle: '第一桶金與發家史',
  zeroStartGuestTitle: '如果從 $0 重新開始，Ta 會怎麼做？',
  skillsEmphasized: '強調技能',
  booksMentorsMentioned: '提及書籍 / 導師',
  allAdviceQuotesTitle: (n) => `全部核心經驗與原話 (${n})`,
  primarySource: '主出處:',
  watchFullVideo: '觀看原片',
  videoFilterAll: '全部',
  videoStreet: '街頭多訪',
  videoDeep: '深度專訪',
  videoComp: '專題合集',
  videoNonInterview: '早期非訪談',
  videoNoSub: '無字幕',
  searchVideosPlaceholder: '搜尋影片標題或 ID...',
  colVideoTitle: '影片標題',
  colVideoType: '分類',
  colPublishDate: '發布日期',
  colDuration: '時長',
  colViews: '觀看數',
  colGuestsExtracted: '萃取嘉賓',
  colSource: '原片',
  watchLink: '觀看',
}

const EN: UiStrings = {
  pageTitle: "Millionaires' Secret: @theschoolofhardknocks Full Interview Index",
  skipToContent: 'Skip to main content',
  loading: 'Loading @theschoolofhardknocks millionaire archive...',
  loadErrorTitle: 'Unable to load dataset',
  loadErrorHint: 'Check the local data file or try refreshing',
  brandSubtitle: 'Empirical Wealth Index',
  sourceLabel: 'Source',
  dateTo: 'to',
  effectiveInterviews: 'Interviews',
  episodesUnit: 'videos',
  totalViews: 'Views',
  themeLabel: 'Appearance theme',
  lightMode: 'Light',
  darkMode: 'Dark',
  langSwitchLabel: 'Language selector',
  kpiGuests: 'Unique Guests',
  kpiMergedPrefix: 'Deduped',
  kpiMergedSuffix: 'clips',
  kpiAdvice: 'Unique Endorsements',
  kpiRawPrefix: 'Raw',
  kpiTop1Global: '#1 Overall Consensus',
  kpiTop1Action: '#1 Actionable Habit',
  tabLeaderboard: 'Leaderboard',
  tabActionable: 'Actionable & Don’ts ($0)',
  tabCross: 'Wealth / Industry Matrix',
  tabGuests: 'Guest Directory',
  tabVideos: 'Video Audit',
  sortLabel: 'Metric',
  sortUnique: 'Unique Guests',
  sortNonComp: 'No Compilations',
  sortRaw: 'Raw Mentions',
  sortWeighted: 'View-Weighted',
  searchAdvicePlaceholder: 'Search advice themes...',
  filterActionAll: 'All tiers',
  filterActionHigh: 'Actionable',
  filterActionStrategic: 'Strategic',
  filterActionMindset: 'Mindset',
  filterCatAll: 'All categories',
  filterWealthAll: 'All net worths',
  colRank: 'Rank',
  colTopic: 'Theme',
  colType: 'Tier',
  colCountShare: 'Count / %',
  colCount: 'Guests',
  colShare: 'Share',
  unitPeople: '',
  unitPerson: '',
  unitScore: 'pts',
  unitTimes: 'x',
  badgePitfall: "Don't",
  emptyAdvice: 'No themes match the current filters. Try broadening your selection.',
  drawerLabel: 'Verbatim quote evidence',
  closeEvidence: 'Close evidence drawer',
  rankPrefix: 'RANK #',
  evidenceUnique: 'Unique Guests',
  evidenceNoComp: 'Non-Compilation',
  evidenceRaw: 'Raw Mentions',
  filterWealthQuotes: 'Filter quotes by wealth tier',
  topIndustries: 'Top industries:',
  searchQuotesPlaceholder: (n) => `Filter ${n} quotes (name, insight, keyword)...`,
  clearFilter: 'Clear',
  viewsSuffix: 'views',
  emptyQuotes: 'No quotes match the current filters.',
  actHigh: 'Actionable',
  actStrategic: 'Strategic',
  actMindset: 'Mindset',
  typeRegret: 'Regret',
  typeWarning: 'Warning',
  typeAdvice: 'Advice',
  actionableTitle: 'Most Repeated Actionable Habits',
  actionableDesc: 'Concrete steps beyond general motivation',
  regretsTitle: "Top Warnings & Regrets (Don'ts)",
  regretsDesc: 'Costly mistakes high-net-worth founders warn against',
  totalItemsCount: (n) => `${n} themes`,
  zeroTitle: 'Cold-Start Playbook: "If you started over with $0 today?"',
  zeroDesc: (n) => `${n} concrete zero-capital strategies shared by interviewees`,
  filterIndustryAll: 'All industries',
  searchZeroPlaceholder: 'Search $0 strategies...',
  paginationInfo: (p, t, c, u) => `Page ${p} / ${t} · ${c} ${u}`,
  prevPage: 'Previous',
  nextPage: 'Next',
  unitPlans: 'entries',
  unitGuests: 'guests',
  unitVideos: 'videos',
  wealthMatrixTitle: 'Cross-Tier Matrix: Billionaires ($1B+) vs Decamillionaires ($10M+) vs Millionaires ($1M+)',
  wealthMatrixDesc: 'See how priorities shift as net worth scales (click any theme for quotes)',
  matrixColTopic: 'Top 12 Themes',
  matrixTierB: 'Billionaire ($1B+)',
  matrixTierD: 'Decamillionaire ($10M+)',
  matrixTierM: 'Millionaire ($1M+)',
  industryTitle: 'Industry Distribution & Top 3 Takeaways',
  industryDesc: 'Share of unique interviewees by primary industry',
  originTitle: 'Wealth Origin Path',
  originDesc: 'Self-made vs executive vs inherited',
  skillsTitle: 'Top Recommended Core Skills',
  skillsDesc: 'Hard and soft skills most emphasized by guests',
  booksTitle: 'Most Cited Books & Mentors',
  booksDesc: 'Books or role models recommended by at least 2 unique guests',
  mentionsCount: (n) => `${n} mentions`,
  methodologyTitle: 'Methodology & Sample Bias Disclosure',
  methodologyP1a: 'Deduplication: Compilations and multi-guest mashups often reuse clips of named founders or street interviews. This index deduplicates by unique guest (merging ',
  methodologyP1b: ' duplicate appearances) so each guest gets at most 1 vote per theme.',
  methodologyP2a: 'Filtering: Automatically excluded ',
  methodologyP2b: ' early (2021-2022) non-interview commentary/listicle videos so counts reflect actual founder and wealth interviews.',
  methodologyP3: 'Sample Characteristics & Survivorship Bias: Street interviews in affluent neighborhoods (e.g., Beverly Hills, Miami, Dubai) naturally skew toward real estate, consumer brands, luxury supercar owners, and commission-heavy sales; self-reported figures are unaudited. Cross-check Actionable Habits alongside Warnings & Regrets.',
  searchGuestsPlaceholder: 'Search name, industry, origin story, or keyword...',
  onlyNamed: 'Named guests only',
  guestsTotalCount: (n) => `${n} unique guests`,
  namedGuestLabel: 'Named guest',
  extractedPrefix: '',
  extractedSuffix: 'insights',
  appearancesSuffix: 'videos',
  viewProfile: 'Inspect →',
  closeGuestModal: 'Close guest profile',
  firstBreakTitle: 'First Break & Origin Story',
  zeroStartGuestTitle: 'How would they restart from $0 today?',
  skillsEmphasized: 'Emphasized Skills',
  booksMentorsMentioned: 'Books & Mentors Cited',
  allAdviceQuotesTitle: (n) => `All Extracted Insights & Quotes (${n})`,
  primarySource: 'Source:',
  watchFullVideo: 'Watch full video',
  videoFilterAll: 'All',
  videoStreet: 'Street Multi',
  videoDeep: 'Deep Dive',
  videoComp: 'Compilation',
  videoNonInterview: 'Non-Interview',
  videoNoSub: 'No Captions',
  searchVideosPlaceholder: 'Search video title or ID...',
  colVideoTitle: 'Video Title',
  colVideoType: 'Category',
  colPublishDate: 'Published',
  colDuration: 'Duration',
  colViews: 'Views',
  colGuestsExtracted: 'Guests',
  colSource: 'Video',
  watchLink: 'Watch',
}

export const UI_DICT: Record<Lang, UiStrings> = {
  'zh-CN': ZH_CN,
  'zh-TW': ZH_TW,
  en: EN,
}

export function videoTypeLabel(lang: Lang, type: string): string {
  const map: Record<string, Record<Lang, string>> = {
    street_multi: { 'zh-CN': '街头多富豪访谈', 'zh-TW': '街頭多富豪訪談', en: 'Street Multi-Guest' },
    deep_dive_single: { 'zh-CN': '一对一深度专访', 'zh-TW': '一對一深度專訪', en: '1-on-1 Deep Dive' },
    topic_compilation: { 'zh-CN': '专题合集 (已去重)', 'zh-TW': '專題合集 (已去重)', en: 'Topic Compilation' },
    non_interview: { 'zh-CN': '早期非访谈 (已剔除)', 'zh-TW': '早期非訪談 (已剔除)', en: 'Non-Interview' },
    no_transcript: { 'zh-CN': '早期无英文字幕', 'zh-TW': '早期無英文字幕', en: 'No Captions' },
  }
  return map[type]?.[lang] || type
}
