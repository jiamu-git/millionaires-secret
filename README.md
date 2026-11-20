# Millionaires' Secret

**`@theschoolofhardknocks` 富豪访谈全量经验图谱与交互式实证看板**

在线交互看板（GitHub Pages）：[https://jiamu-git.github.io/millionaires-secret/](https://jiamu-git.github.io/millionaires-secret/)

对 YouTube 频道 [@theschoolofhardknocks](https://www.youtube.com/@theschoolofhardknocks/videos) 全部长视频访谈进行全量抓取、字幕清洗、结构化抽取与人物/片段跨期去重，提炼出真正被高频重复验证的富豪核心经验排行榜、可落地实操动作、避坑与后悔清单、`$0` 冷启动方案、不同身家/行业交叉对比及全片时间戳原话溯源。

---

## 核心统计概览

| 统计维度 | 指标数值 | 说明 |
|---|---:|---|
| 频道长视频样本 | **197** 期 | 时间跨度 `2021-07-01` 至 `2026-11-10`，累计覆盖 `141,638,570` 次观看 |
| 有效访谈期数 | **170** 期 | 深度专访 `51` 期 + 街头多访 `117` 期 + 专题合集 `2` 期（已剔除早期非访谈 `24` 期与无英文字幕 `3` 期） |
| 独立受访富豪 | **595** 位 | 原始出镜 `637` 人次，按人物实名及合集片段原话查重合并 `42` 次重复出镜 |
| 独立经验支持票 | **2,740** 条 | 原始提及 `2,825` 次，映射至 `36` 个标准化经验标签（每名受访者对同一经验仅计 `1` 票） |

> 完整文字版统计简报见 [`REPORT.md`](./REPORT.md)，表格导出见 [`data/aggregated/advice_ranking.csv`](./data/aggregated/advice_ranking.csv) 与 [`data/aggregated/guests.csv`](./data/aggregated/guests.csv)。

---

## 核心经验 Top 10 速览（按独立受访富豪数）

| 排名 | 经验主题 | 属性 | 独立富豪数 | 占比 |
|---:|---|---|---:|---:|
| 1 | 极致努力与超强韧性 (`Relentless Work Ethic & Grit`) | 思维心态 | 224 | 37.6% |
| 2 | 自信笃定、打破自我设限 (`Self-Belief & Rejecting Limiting Beliefs`) | 思维心态 | 176 | 29.6% |
| 3 | 信仰、感恩与回馈社会 (`Faith, Gratitude & Giving Back`) | 思维心态 | 139 | 23.4% |
| 4 | 精通销售、沟通与说服力 (`Master Sales & Persuasion`) | 可落地实操 | 139 | 23.4% |
| 5 | 经营高质量人脉与圈子 (`Build High-Value Network & Relationships`) | 可落地实操 | 135 | 22.7% |
| 6 | 招比自己强的人、打造团队与授权 (`Hire A-Players & Delegate`) | 商业原则 | 127 | 21.3% |
| 7 | 克服恐惧、敢于承担风险 (`Overcome Fear & Take Calculated Risks`) | 商业原则 | 112 | 18.8% |
| 8 | 拥抱失败与拒绝、快速复盘 (`Embrace Failure & Rejection`) | 思维心态 | 110 | 18.5% |
| 9 | 热爱与极致专注、保持饥饿感 (`Obsession, Passion & Curiosity`) | 思维心态 | 96 | 16.1% |
| 10 | 解决真实痛点、创造超预期价值 (`Solve Real Pain Points & Deliver Value`) | 商业原则 | 94 | 15.8% |

---

## 看板功能特性

1. **核心经验排行榜（Master-Detail 证据台）**
   - 支持 **独立富豪数**、**剔除合集**、**总提及次数**、**观看数加权** 四种口径实时排序与关键词、属性、分类、身家段位过滤。
   - 右侧联动展示每位富豪的时间戳原话、观点提炼与 YouTube 原片空降直达链接。
2. **可落地实操 & 避坑榜 & `$0` 冷启动专题**
   - 剥离宏观心态鸡汤，单独提取普通人可直接执行的实操排行榜与富豪反面警示（`Don'ts & Regrets`）。
   - 汇总近 500 条「如果今天手里只有 `$0` 你会怎么做」冷启动路线与第一动作，支持按行业检索与分页。
3. **身家 / 行业 / 技能 / 书籍交叉矩阵**
   - 对比十亿美元级（`$1B+`）、千万美元级（`$10M+`）、百万富翁（`$1M+`）在关键心法上的比重迁移。
   - 统计出身路径（白手起家 / 职业高管 / 家族继承）、高频核心技能与高频提及书单/精神导师。
4. **富豪档案库与全频道样本审计**
   - 按姓名、行业、发家史检索 595 位独立受访者档案（附全部个人语录、技能与书单）。
   - 透明展示全部 197 期长视频的分类状态、去重口径与样本幸存者偏差说明。
5. **三语支持 & 深浅双主题**
   - 右上角支持 **简体中文（默认）/ 繁体中文（按需加载 `opencc-js`）/ English** 一键切换，并与 `?lang=` / `localStorage` 同步。
   - 默认 **Dark 黑曜石研报主题**，支持一键切换 **Light 暖纸主题**（支持 `?theme=` URL 参数覆盖）。

---

## 目录结构

```text
millionaires-secret/
├── .github/workflows/
│   └── deploy-pages.yml          # GitHub Actions 自动构建并发布至 GitHub Pages
├── data/
│   ├── taxonomy.json             # 36 个标准化经验标签、11 大行业与 5 级身家分类体系
│   ├── raw/playlist.json         # 频道 197 期长视频元数据索引（videos/ 缓存已 gitignore）
│   ├── clean/                    # 去重滚动字幕并合并章节/播放量后的清洗文本（194 期）
│   ├── extracted/                # 结构化抽取的每期嘉宾、身家、技能、引语与时间戳（194 期）
│   └── aggregated/
│       ├── dashboard_data.json   # 看板主聚合数据
│       ├── guest_translations_en.json # 552 条嘉宾发家史与 $0 起家方案英文译文
│       ├── advice_ranking.csv    # 排行榜 CSV 导出
│       └── guests.csv            # 独立受访者档案 CSV 导出
├── scripts/
│   ├── fetch_all.py              # yt-dlp 并发拉取视频 .info.json 与英文 .vtt 字幕
│   ├── clean_transcripts.py      # VTT 滚动字幕去重与 15 秒语义分段合并
│   ├── taxonomy.py               # 分类体系加载助手
│   ├── extract_workflow.py       # 多智能体工作流结构化抽取脚本（run_workflow）
│   ├── translate_guests_en.py    # 多智能体工作流嘉宾摘要英文翻译脚本（run_workflow）
│   ├── aggregate.py              # 嘉宾跨视频去重、统计聚合与 CSV/JSON 输出
│   ├── audit_data.py             # 数据完整性与未映射标签审计脚本
│   └── export_report.py          # 从聚合数据生成 REPORT.md 静态报告
├── web/                          # React + Vite + TypeScript + Tailwind CSS v4 前端看板
│   ├── public/
│   │   ├── dashboard_data.json   # 构建时直接打包进静态产物的聚合数据集
│   │   ├── favicon.svg
│   │   └── .nojekyll
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts            # 支持相对路径 ('./') 与 VITE_BASE_PATH 动态适配 Pages 子路径
├── REPORT.md                     # Markdown 版全量分析简报
└── README.md
```

---

## 本地开发与构建

### 1. 运行前端看板

> 仓库已内含完整的预处理与聚合产物 [`web/public/dashboard_data.json`](./web/public/dashboard_data.json)，无需重新下载视频或配置 Python 环境即可直接运行或部署前端。

```bash
cd web
npm install
npm run dev
```

构建生产静态产物：

```bash
cd web
npm run build      # 输出至 web/dist/
npm run preview    # 本地预览构建产物
```

若需要模拟 GitHub Pages 子路径部署测试：

```bash
VITE_BASE_PATH=/millionaires-secret npm --prefix web run build
```

### 2. 重新聚合与审计数据（Python 3.10+）

若仅调整分类口径或归并规则，可直接基于仓库内置的 `data/clean/` 与 `data/extracted/` 重算汇总：

```bash
python3 scripts/aggregate.py      # 更新 data/aggregated/ 与 web/public/dashboard_data.json
python3 scripts/audit_data.py     # 检查抽取覆盖率、时间戳与 Top 10 统计
python3 scripts/export_report.py  # 同步刷新 REPORT.md
```

如需从头抓取最新视频字幕（需本机安装 `yt-dlp` 并可访问 YouTube）：

```bash
python3 scripts/fetch_all.py --workers 6   # 下载 .info.json 与 .vtt 至 data/raw/videos/
python3 scripts/clean_transcripts.py       # 生成 data/clean/
```

注：[`scripts/extract_workflow.py`](./scripts/extract_workflow.py) 与 [`scripts/translate_guests_en.py`](./scripts/translate_guests_en.py) 为面向多智能体并行编排运行时（`run_workflow`）编写的结构化抽取/翻译工作流脚本，依赖编排环境中的 `agent` / `parallel` / `phase` 原语，不能直接以普通 `python3` 命令行独立运行。

---

## 部署至 GitHub 与 GitHub Pages

本项目已配置 GitHub Actions 工作流 [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) 以及自适应基础路径 [`web/vite.config.ts`](./web/vite.config.ts)，推送到仓库后即可自动完成构建并上线 Pages。

### 第一步：初始化仓库并推送到 GitHub

在项目根目录执行：

```bash
git init
git add .
git commit -m "feat: initial millionaires-secret empirical dashboard"
git branch -M main
git remote add origin git@github.com:jiamu-git/millionaires-secret.git
git push -u origin main
```

> 说明：[`.gitignore`](./.gitignore) 已排除约 `414 MB` 的 `data/raw/videos/` 原始字幕缓存、`web/node_modules/` 与 `web/dist/`，仅保留约 `23.2 MB` 源码与清洗/聚合数据集（单文件最大为 `6.8 MB` 的 `dashboard_data.json`），可直接顺畅推送至 GitHub。

### 第二步：开启 GitHub Pages（GitHub Actions 模式）

1. 打开仓库页面，进入 **Settings** -> **Pages**。
2. 在 **Build and deployment** -> **Source** 下拉菜单中选择 **`GitHub Actions`**（不要选择 `Deploy from a branch`）。
3. 进入 **Actions** 标签页查看 **Deploy Dashboard to GitHub Pages** 工作流运行状态（首次启用后如未自动触发，可点击 **Run workflow** 手动运行一次）。
4. 工作流绿色完成后即可访问：[https://jiamu-git.github.io/millionaires-secret/](https://jiamu-git.github.io/millionaires-secret/)。

后续每次向 `main`（或 `master`）分支推送代码，GitHub Actions 都会自动读取 Pages 子路径注入 `VITE_BASE_PATH`，执行 `npm ci && npm run build`，并将 `web/dist/` 发布到线上。

---

## 技术栈与数据免责声明

- **前端技术栈**：React 18、TypeScript 5.6、Vite 6、Tailwind CSS v4、`lucide-react`、`opencc-js`（动态按需分包）
- **数据来源与局限**：所有原始访谈与引语版权归 [@theschoolofhardknocks](https://www.youtube.com/@theschoolofhardknocks) 原频道所有。街头访谈中部分受访者自报资产未经第三方财务审计，且早期采样偏重北美豪车聚集区与创业群体，存在一定幸存者偏差，建议结合「可落地实操」与「避坑与后悔榜」交叉参考。
