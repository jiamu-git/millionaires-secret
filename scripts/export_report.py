#!/usr/bin/env python3
"""Generate a concise Markdown analytical report from dashboard_data.json."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "aggregated" / "dashboard_data.json"
REPORT_PATH = ROOT / "REPORT.md"


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    ov = data["overview"]
    rankings = data["advice_rankings"]

    lines = [
        "# Millionaires' Secret — `@theschoolofhardknocks` 富豪经验全量统计报告",
        "",
        f"- **统计范围**：频道全部长视频 `{ov['total_playlist_videos']}` 期（清洗提取 `{ov['extracted_videos']}` 期，其中有效富豪访谈 `{ov['interview_videos']}` 期，剔除早期非访谈 `{ov['non_interview_videos']}` 期，另有 `{ov['video_type_counts'].get('no_transcript', 0)}` 期无英文字幕的早期视频）",
        f"- **受访者去重统计**：全频道共出现 `{ov['total_raw_guest_appearances']}` 人次，按人物实名与合集片段原话查重合并后为 **`{ov['unique_guests_count']}` 位独立受访富豪**（剔除 `{ov['compilation_clips_deduped']}` 次重复/合集出镜）",
        f"- **经验条目总数**：去重后 `{ov['total_unique_advice_endorsements']}` 条独立支持票（原始 `{ov['total_raw_advice_mentions']}` 条），覆盖 `{ov['total_views_analyzed']:,}` 次观看",
        "",
        "## 一、核心经验总排行榜 Top 15（按独立受访富豪人数）",
        "",
        "| 排名 | 经验主题 | 分类 | 实操属性 | 独立富豪数 | 占比 | 含合集总提及 |",
        "|---:|---|---|---|---:|---:|---:|",
    ]

    act_map = {
        "high_actionable": "可落地实操",
        "strategic_principle": "商业/财富原则",
        "mindset_general": "思维与心态",
    }

    for r in rankings[:15]:
        lines.append(
            f"| {r['rank']} | **{r['tag_zh']}** ({r['tag']}) | {r['category_zh']} | {act_map.get(r['actionability'], r['actionability'])} | {r['unique_guest_count']} | {r['unique_guest_pct']}% | {r['raw_mention_count']} |"
        )

    lines += [
        "",
        "## 二、剔除鸡汤：可落地实操 Top 10",
        "",
        "| 排名 | 实操动作 | 独立富豪数 | 占比 | 代表原话 |",
        "|---:|---|---:|---:|---|",
    ]
    actionable = [r for r in rankings if r["actionability"] == "high_actionable" and r["type"] == "advice_do"]
    for i, r in enumerate(actionable[:10], 1):
        sample = r["quotes"][0]["summary_zh"] if r["quotes"] else ""
        guest = r["quotes"][0]["guest_name"] if r["quotes"] else ""
        lines.append(
            f"| {i} | **{r['tag_zh']}** | {r['unique_guest_count']} | {r['unique_guest_pct']}% | {guest}：{sample} |"
        )

    lines += [
        "",
        "## 三、富豪避坑与后悔榜（Don'ts & Regrets）",
        "",
        "| 排名 | 避坑/后悔主题 | 独立富豪数 | 占比 |",
        "|---:|---|---:|---:|",
    ]
    regrets = [r for r in rankings if r["type"] in {"warning_dont", "regret"}]
    for i, r in enumerate(regrets, 1):
        lines.append(
            f"| {i} | **{r['tag_zh']}** ({r['tag']}) | {r['unique_guest_count']} | {r['unique_guest_pct']}% |"
        )

    lines += [
        "",
        "## 四、行业分布 Top 8",
        "",
        "| 行业 | 独立富豪数 | 占比 | 该行业最常强调的经验 |",
        "|---|---:|---:|---|",
    ]
    for ind in data["industries"][:8]:
        top_t = "、".join(f"{t['tag_zh']}({t['count']})" for t in ind["top_tags"][:3])
        lines.append(f"| {ind['industry_zh']} | {ind['count']} | {ind['pct']}% | {top_t} |")

    lines += [
        "",
        "## 五、高频核心技能 & 高频书单/导师",
        "",
        "### 核心技能 Top 8",
    ]
    for i, sk in enumerate(data["skills_ranking"][:8], 1):
        lines.append(f"{i}. **{sk['skill_zh']}** ({sk['skill']}) — {sk['count']} 位 ({sk['pct']}%)")

    lines += ["", "### 高频提及书籍 / 精神导师 Top 10"]
    for i, bm in enumerate(data["books_and_mentors"][:10], 1):
        lines.append(f"{i}. **{bm['name']}** — {bm['count']} 次提及")

    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {REPORT_PATH}")


if __name__ == "__main__":
    main()
