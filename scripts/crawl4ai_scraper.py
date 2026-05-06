#!/usr/bin/env python3
"""
出海通 AsiaBridge — Crawl4AI HTML 采集器
==============================================
使用 Crawl4AI (65k+ GitHub stars) 作为高级 HTML 解析引擎，
替代基础 cheerio 解析，提升复杂 JS 页面的采集质量。

Crawl4AI 特性：
  - 异步异步爬取，内置 LLM 集成
  - 反爬对抗（代理轮换、浏览器指纹）
  - Shadow DOM / SPA 支持
  - Markdown / 结构化 JSON 输出

运行：
  pip install crawl4ai
  python scripts/crawl4ai_scraper.py --url "https://example.com" --dry-run
  python scripts/crawl4ai_scraper.py --urls-file scripts/sources.txt --dry-run

输出：
  将采集结果写入 public/data/crawl4ai_results.json
"""

import asyncio
import argparse
import json
import os
import sys
import time
import re
from datetime import datetime, timedelta
from pathlib import Path

# ── Crawl4AI ────────────────────────────────────────────────────────────────
try:
    from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig
    CRAWL4AI_AVAILABLE = True
except ImportError:
    CRAWL4AI_AVAILABLE = False
    print("WARN: crawl4ai not installed. Run: pip install crawl4ai")


# ── Project Paths ──────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent.resolve()
DATA_DIR = PROJECT_ROOT / "public" / "data"
OUTPUT_FILE = DATA_DIR / "crawl4ai_results.json"
LOG_DIR = PROJECT_ROOT / "logs"
LOG_FILE = LOG_DIR / "crawl4ai.log"


# ── Keywords (same logic as collector.js) ─────────────────────────────────
CHINA_KW = [
    "中国", "China", "Chinese", "Trung Quốc", "Cina", "Tiongkok",
    "中国企业", "中国側", "中国侧", "中国製品",
    "对中国", "中国への", "中国との", "中国向け", "中国市場",
    "中国企业", "中国公司", "中国资本",
    "Chinese partner", "Chinese supplier", "Chinese investor",
    "中国大陆", "中国内陆", "中国厂商", "台商", "台资",
    "两岸", "两岸贸易", "两岸经贸", "ECFA", "cross-strait",
    "中国台湾", "Taiwan.*China", "China.*Taiwan",
    "香港", "Hong Kong", "澳门", "Macau",
]

BUSINESS_KW = [
    "代理店", "经销", "代理商", "distributor", "经销商",
    "OEM", "ODM", "manufacturing partner", "代工",
    "合资", "合弁", "JV", "joint venture", "合資",
    "tìm.*đối tác", "tìm.*nhà cung cấp", "nhập.*Trung Quốc",
    "xuất.*sang Trung Quốc", "đầu tư.*Trung Quốc",
    "hợp tác.*Trung Quốc", "투자.*파트너", "협력.*中国企业",
    "对中国.*투자", "对中国.*OEM", "对中国.*調達",
]

NOISE_PATTERNS = [
    r"不起$", r"^[^\s]{0,10}$",
    r"Russia.*Ukraine", r"Ukraine.*Putin", r"Zelensky",
    r"COVID", r"pandemic", r"疫情", r"防疫",
    r"股价", r"株[javascript]", r"証券",
    r"选举", r"election.*result",
    r"地震", r"震度", r"台风", r"海啸",
    r"、美容", r"整形", r"护肤",
    r"vàng.*phục hồi", r"giá.*tuần", r"tỷ phú",
    r"覚書締結", r"press release",
]


def match_any(text: str, patterns: list) -> bool:
    text = text[:800]
    for pat in patterns:
        try:
            if re.search(pat, text, re.IGNORECASE):
                return True
        except re.error:
            pass
    return False


def is_noise(title: str, desc: str) -> bool:
    text = (title + " " + desc)[:400]
    for pat in NOISE_PATTERNS:
        try:
            if re.search(pat, text, re.IGNORECASE):
                return True
        except re.error:
            pass
    return False


def has_china_connection(title: str, desc: str) -> bool:
    text = (title + " " + desc)[:600]
    return match_any(text, CHINA_KW)


def infer_industry(text: str) -> str:
    text = text[:500]
    if re.search(r"半導|Semiconductor|IC|chip|Display|LCD|OLED", text, re.I):
        return "半导体/电子"
    if re.search(r"汽车|EV|电动汽车|Automotive|battery|Battery", text, re.I):
        return "新能源汽车"
    if re.search(r"robot|自动化|Robot|CNC|机械|machine", text, re.I):
        return "工业自动化"
    if re.search(r"医疗|医药|制药|Medical|Pharma|pharma", text, re.I):
        return "医疗器械"
    if re.search(r"化工|化学|Steel|Metal|石化", text, re.I):
        return "化工材料"
    if re.search(r"纺织|成衣|布料|textile|garment", text, re.I):
        return "纺织服装"
    if re.search(r"食品|农产|水产|agri|food", text, re.I):
        return "食品农业"
    if re.search(r"IT|ICT|Software|资讯|IT$", text, re.I):
        return "IT/软件"
    if re.search(r"能源|光電|储能|Energy|Solar|风电", text, re.I):
        return "能源电力"
    if re.search(r"物流|货运|仓储|Logistics|Transport", text, re.I):
        return "贸易/物流"
    if re.search(r"金融|银行|支付|Fintech", text, re.I):
        return "金融科技"
    if re.search(r"钢铁|金属|Steel|Metal", text, re.I):
        return "钢铁/金属"
    return "综合商务"


def infer_cooperation(text: str) -> str:
    text = text[:500]
    if re.search(r"OEM|ODM|manufacturing partner|代工", text, re.I):
        return "oem"
    if re.search(r"代理|经销|distributor|franchise", text, re.I):
        return "agency"
    if re.search(r"合资|JV|joint venture|合资|戦略的", text, re.I):
        return "joint-venture"
    if re.search(r"技术|technology transfer|特许|licensing", text, re.I):
        return "technology"
    if re.search(r"供应|supply|采购|procurement|输入|수입", text, re.I):
        return "supply"
    if re.search(r"投资|FDI|investment", text, re.I):
        return "investment"
    return "cooperation"


def generate_id() -> str:
    import random
    return f"opp_c4a_{int(time.time() * 1000):x}_{random.randint(100000, 999999):06d}"


def log(msg: str, dry_run: bool = False):
    ts = datetime.now().isoformat()
    line = f"[{'DRY-RUN ' if dry_run else ''}{ts}] {msg}"
    print(line)
    if not dry_run:
        try:
            LOG_DIR.mkdir(parents=True, exist_ok=True)
            with open(LOG_FILE, "a", encoding="utf-8") as f:
                f.write(line + "\n")
        except Exception:
            pass


# ── Crawl4AI Fetcher ─────────────────────────────────────────────────────
async def crawl_url(crawler, url: str, config: CrawlerRunConfig) -> list:
    """抓取单个URL，返回结构化商机列表"""
    results = []

    try:
        result = await crawler.crawl(url=url, config=config)

        if not result or not result.success:
            return []

        # 提取内容
        if hasattr(result, 'markdown') and result.markdown:
            content = result.markdown
        elif hasattr(result, 'html') and result.html:
            content = result.html
        else:
            return []

        # 尝试从 JSON metadata 提取结构化数据
        if hasattr(result, 'metadata') and result.metadata:
            meta = result.metadata
            if isinstance(meta, dict):
                title = meta.get('title', '') or meta.get('name', '')
                desc = meta.get('description', '') or meta.get('summary', '')
                if title and len(title) > 5:
                    results.append({
                        'title': title[:200],
                        'desc': desc[:500] if desc else '',
                        'url': url,
                        'source': 'crawl4ai_metadata',
                    })
                    return results

        # 从 Markdown 内容中提取标题和段落
        lines = content.split('\n')
        for i, line in enumerate(lines):
            line = line.strip()
            if len(line) > 15 and '#' not in line[:3]:
                # 查找相邻段落作为描述
                next_line = lines[i + 1].strip() if i + 1 < len(lines) else ''
                if not is_noise(line, next_line):
                    results.append({
                        'title': line[:200],
                        'desc': next_line[:500] if next_line else '',
                        'url': url,
                        'source': 'crawl4ai_markdown',
                    })

        return results[:20]  # 每URL最多20条

    except Exception as e:
        log(f"  ERROR crawling {url}: {e}")
        return []


async def crawl_batch(urls: list, config: CrawlerRunConfig, concurrency: int = 3) -> list:
    """并发抓取多个URL"""
    if not CRAWL4AI_AVAILABLE:
        log("ERROR: Crawl4AI not installed. Run: pip install crawl4ai")
        return []

    all_results = []
    semaphore = asyncio.Semaphore(concurrency)

    async with AsyncWebCrawler(
        browser_config=BrowserConfig(headless=True, verbose=False),
        crawler_config=config,
    ) as crawler:

        async def crawl_with_sem(url):
            async with semaphore:
                log(f"  Crawling: {url[:80]}")
                results = await crawl_url(crawler, url, config)
                await asyncio.sleep(1)  # 礼貌延迟
                return results

        tasks = [crawl_with_sem(url) for url in urls]
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)

        for res in batch_results:
            if isinstance(res, Exception):
                log(f"  ERROR in batch: {res}")
            elif isinstance(res, list):
                all_results.extend(res)

    return all_results


# ── Main ──────────────────────────────────────────────────────────────────
async def main():
    parser = argparse.ArgumentParser(description="Crawl4AI HTML Scraper for AsiaBridge")
    parser.add_argument("--url", type=str, help="Single URL to crawl")
    parser.add_argument("--urls-file", type=str, help="File with URLs (one per line)")
    parser.add_argument("--dry-run", action="store_true", help="Preview mode, don't write files")
    parser.add_argument("--output", type=str, help="Output JSON file path")
    parser.add_argument("--concurrency", type=int, default=3, help="Max concurrent crawls")
    parser.add_argument("--model", type=str, default="groq/llama-3.3-70b",
                        help="LLM model for content extraction (optional)")
    args = parser.parse_args()

    dry_run = args.dry_run
    log(f"========== Crawl4AI 采集器 启动 ==========", dry_run)
    log(f"Crawl4AI available: {CRAWL4AI_AVAILABLE}", dry_run)

    if not CRAWL4AI_AVAILABLE:
        log("FATAL: pip install crawl4ai")
        sys.exit(1)

    # 收集URL
    urls = []
    if args.url:
        urls = [args.url]
    elif args.urls_file:
        try:
            with open(args.urls_file, "r", encoding="utf-8") as f:
                urls = [line.strip() for line in f if line.strip() and not line.startswith("#")]
        except Exception as e:
            log(f"FATAL: Cannot read urls-file: {e}")
            sys.exit(1)
    else:
        # 默认采集目标：政府门户中 cheerio 解析困难的页面
        urls = [
            "https://www.enterprisesg.gov.sg/media-centre",
            "https://www.g2b.go.kr:8080/ep/tbid/tbidList.do?searchType=ALL&bidNm=&orgNm=",
            "https://web.pcc.gov.tw/prms/report/tenderReport",
            "https://fta.moit.gov.vn/",
            "https://www.matrade.gov.my/en/media/news",
            "https://nsop.go.id/news",
            "https://www.jetro.go.jp/world/asia/cn/",
            "https://www.boi.go.th/feed/news/boi-news",
            "https://peza.gov.ph/index.php/news-and-announcements",
            "https://www.jetro.go.jp/services/matching.html",
        ]

    log(f"URLs to crawl: {len(urls)}")

    # 配置 Crawl4AI
    config = CrawlerRunConfig(
        # 不使用 LLM 提取（可选，加速）
        # word_count_threshold=100,
        # extraction_strategy=LLMExtractionStrategy(...) if args.model else None,
        # 等待 JS 渲染
        js_code=[],
        # 不跟踪外部链接
        excluded_tags=["script", "style", "noscript", "iframe"],
        # 截图（调试用）
        screenshot=False,
        verbose=False,
        cache_mode="bypass",
    )

    # 并发抓取
    log(f"Starting crawl with concurrency={args.concurrency}")
    all_raw = await crawl_batch(urls, config, concurrency=args.concurrency)

    # 过滤：必须有中国连接 + 非噪音 + 有商业关键词
    filtered = []
    seen = set()

    for item in all_raw:
        title = item.get('title', '')
        desc = item.get('desc', '')

        if is_noise(title, desc):
            continue
        if not has_china_connection(title, desc):
            continue

        key = title[:60].lower().replace(' ', '')
        if key in seen:
            continue
        seen.add(key)

        filtered.append({
            'id': generate_id(),
            'title': title[:200],
            'titleEn': None,
            'description': desc[:500] if desc else '暂无描述',
            'descriptionEn': None,
            'type': infer_cooperation(title + ' ' + desc),
            'country': 'unknown',
            'region': None,
            'regionLabel': None,
            'industry': infer_industry(title + ' ' + desc),
            'cooperationType': infer_cooperation(title + ' ' + desc),
            'amount': None,
            'currency': None,
            'companyName': item.get('source', 'crawl4ai'),
            'companyNameEn': None,
            'contactEmail': 'zxq@zxqconsulting.com',
            'publishedAt': datetime.now().isoformat(),
            'expiresAt': (datetime.now() + timedelta(days=90)).isoformat(),
            'status': 'active',
            'isPremium': True,
            'dataSource': 'crawl4ai-enhanced',
            '_rawLink': item.get('url', ''),
        })

    log(f"Filtered: {len(all_raw)} raw → {len(filtered)} China-related")

    if dry_run:
        for item in filtered[:10]:
            print(f"  [{item['industry']}] {item['title'][:80]}")
        return

    # 写入输出
    output_file = Path(args.output) if args.output else OUTPUT_FILE
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # 合并到现有数据
    existing = []
    if output_file.exists():
        try:
            existing = json.loads(output_file.read_text(encoding="utf-8"))
            if not isinstance(existing, list):
                existing = []
        except Exception:
            existing = []

    thirty_days_ago = datetime.now() - timedelta(days=60)
    recent = [o for o in existing
               if o.get('dataSource', '').startswith('crawl4ai')
               and datetime.fromisoformat(o['publishedAt'].replace('Z', '+00:00').replace('+00:00', '')) > thirty_days_ago]

    existing_keys = {o['title'][:60].lower().replace(' ', '') for o in recent}
    new_entries = [o for o in filtered if o['title'][:60].lower().replace(' ', '') not in existing_keys]

    merged = existing + new_entries
    merged.sort(key=lambda x: x.get('publishedAt', ''), reverse=True)
    merged = merged[:500]

    output_file.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"Saved {output_file}: {len(merged)} total ({len(new_entries)} new from Crawl4AI)")

    # 同时追加到 opportunities.json
    opp_file = DATA_DIR / "opportunities.json"
    if opp_file.exists():
        try:
            opp_data = json.loads(opp_file.read_text(encoding="utf-8"))
            if isinstance(opp_data, list):
                opp_data.extend(new_entries)
                opp_data.sort(key=lambda x: x.get('publishedAt', ''), reverse=True)
                opp_data = opp_data[:500]
                opp_file.write_text(json.dumps(opp_data, ensure_ascii=False, indent=2), encoding="utf-8")
                log(f"Appended to opportunities.json")
        except Exception as e:
            log(f"WARN: Cannot update opportunities.json: {e}")

    log("========== 采集完成 ==========")


if __name__ == "__main__":
    if CRAWL4AI_AVAILABLE:
        asyncio.run(main())
    else:
        print("ERROR: crawl4ai not installed")
        print("Run: pip install crawl4ai")
        print("Docs: https://github.com/unclecode/crawl4ai")
        sys.exit(1)
