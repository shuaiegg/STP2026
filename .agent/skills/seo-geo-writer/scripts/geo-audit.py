#!/usr/bin/env python3
"""
GEO Content Audit Script

Analyzes markdown content for GEO (Generative Engine Optimization) readiness.
Checks AI extractability, structure, and citation potential.

Usage:
    python geo-audit.py content.md
    python geo-audit.py content.md --brand "Scale to Top"
    python geo-audit.py content.md --json
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional


@dataclass
class AuditResult:
    """Audit result with score and details."""
    passed: bool
    score: int
    max_score: int
    issues: list[str]
    suggestions: list[str]
    details: dict


def count_words(text: str) -> int:
    """Count words, handling both CJK and Latin text."""
    # Count CJK characters
    cjk_chars = len(re.findall(r'[\u4e00-\u9fff\u3400-\u4dbf]', text))
    # Count Latin words
    latin_text = re.sub(r'[\u4e00-\u9fff\u3400-\u4dbf]', ' ', text)
    latin_words = len(latin_text.split())
    return cjk_chars + latin_words


def get_first_paragraph(content: str) -> str:
    """Extract first paragraph after any frontmatter."""
    # Remove frontmatter
    content = re.sub(r'^---.*?---\s*', '', content, flags=re.DOTALL)
    # Remove H1
    content = re.sub(r'^#\s+.*?\n', '', content)
    # Get first paragraph
    paragraphs = [p.strip() for p in content.split('\n\n') if p.strip() and not p.startswith('#')]
    return paragraphs[0] if paragraphs else ""


def audit_direct_answer(content: str) -> tuple[int, list[str], list[str]]:
    """Check if content has a clear direct answer in the first paragraph."""
    score = 0
    issues = []
    suggestions = []

    first_para = get_first_paragraph(content)
    word_count = count_words(first_para)

    # Check length (ideal: 30-60 words/chars)
    if word_count <= 60:
        score += 15
    elif word_count <= 100:
        score += 10
        suggestions.append(f"首段 {word_count} 字/词，建议精简至 60 以内便于 AI 提取")
    else:
        score += 5
        issues.append(f"首段过长（{word_count} 字/词），AI 难以快速提取核心答案")

    # Check for definition pattern ("X is/是...")
    has_definition = bool(re.search(r'(是|为|指|means|is|refers to|defined as)', first_para))
    if has_definition:
        score += 5
    else:
        suggestions.append("首段建议使用「X 是...」或「X refers to...」的定义句式")

    return score, issues, suggestions


def audit_heading_structure(content: str) -> tuple[int, list[str], list[str], dict]:
    """Check heading hierarchy and structure."""
    score = 0
    issues = []
    suggestions = []

    h1_matches = re.findall(r'^#\s+(.+)$', content, re.MULTILINE)
    h2_matches = re.findall(r'^##\s+(.+)$', content, re.MULTILINE)
    h3_matches = re.findall(r'^###\s+(.+)$', content, re.MULTILINE)

    details = {
        "h1_count": len(h1_matches),
        "h2_count": len(h2_matches),
        "h3_count": len(h3_matches),
        "h2_titles": h2_matches[:5],  # First 5 for reference
    }

    # H1 check
    if len(h1_matches) == 1:
        score += 5
    elif len(h1_matches) == 0:
        issues.append("缺少 H1 标题")
    else:
        issues.append(f"存在 {len(h1_matches)} 个 H1 标题，应只有 1 个")

    # H2 check (ideal: 3-7)
    if 3 <= len(h2_matches) <= 7:
        score += 10
    elif len(h2_matches) < 3:
        score += 5
        suggestions.append(f"H2 标题数量偏少（{len(h2_matches)}），建议 3-7 个主要章节")
    else:
        score += 8
        suggestions.append(f"H2 标题数量较多（{len(h2_matches)}），内容可能需要重组")

    # Question-format H2s (good for FAQ/AEO)
    question_h2s = [h for h in h2_matches if re.search(r'[?？]|^(What|How|Why|When|Which|是什么|为什么|如何|怎么)', h)]
    if question_h2s:
        score += 5
        details["question_h2s"] = len(question_h2s)

    return score, issues, suggestions, details


def audit_lists_and_tables(content: str) -> tuple[int, list[str], list[str], dict]:
    """Check for structured content elements."""
    score = 0
    issues = []
    suggestions = []

    # Bullet/numbered lists
    list_items = re.findall(r'^[\s]*[-*+]\s+.+$|^\d+\.\s+.+$', content, re.MULTILINE)
    has_lists = len(list_items) > 0

    # Tables
    tables = re.findall(r'\|.+\|', content)
    has_tables = len(tables) > 2  # At least header + separator + 1 row

    # Code blocks
    code_blocks = re.findall(r'```[\s\S]*?```', content)

    details = {
        "list_items": len(list_items),
        "has_tables": has_tables,
        "code_blocks": len(code_blocks),
    }

    if has_lists:
        score += 5
    else:
        suggestions.append("建议添加列表来组织要点，增强可扫描性和 AI 提取性")

    if has_tables:
        score += 5
    else:
        suggestions.append("对比类内容建议使用表格展示")

    return score, issues, suggestions, details


def audit_brand_binding(content: str, brand: Optional[str] = None) -> tuple[int, list[str], list[str]]:
    """Check for brand entity binding."""
    score = 0
    issues = []
    suggestions = []

    if not brand:
        return score, issues, suggestions

    # Count brand mentions
    brand_pattern = re.escape(brand)
    mentions = len(re.findall(brand_pattern, content, re.IGNORECASE))

    if mentions >= 3:
        score += 10
    elif mentions >= 1:
        score += 5
        suggestions.append(f"品牌「{brand}」仅出现 {mentions} 次，建议在方法论/框架处自然绑定")
    else:
        issues.append(f"内容缺少品牌「{brand}」绑定，难以被 AI 归因引用")

    return score, issues, suggestions


def audit_cta(content: str) -> tuple[int, list[str], list[str]]:
    """Check for appropriate CTAs."""
    score = 0
    issues = []
    suggestions = []

    # Low-friction CTA patterns
    cta_patterns = [
        r'下载|Download',
        r'获取|Get',
        r'免费|Free',
        r'模板|Template',
        r'Checklist|清单',
        r'指南|Guide',
        r'工具|Tool',
        r'立即|Now',
        r'开始|Start',
        r'试用|Try',
    ]

    has_cta = any(re.search(p, content, re.IGNORECASE) for p in cta_patterns)

    if has_cta:
        score += 5
    else:
        suggestions.append("建议添加低摩擦 CTA（如：模板下载、Checklist、免费工具等）")

    return score, issues, suggestions


def audit_internal_links(content: str) -> tuple[int, list[str], list[str], dict]:
    """Check internal linking."""
    score = 0
    issues = []
    suggestions = []

    # Markdown links
    links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
    internal_links = [l for l in links if not l[1].startswith(('http://', 'https://', 'mailto:'))]
    external_links = [l for l in links if l[1].startswith(('http://', 'https://'))]

    details = {
        "internal_links": len(internal_links),
        "external_links": len(external_links),
    }

    # Internal links (ideal: 3-5)
    if len(internal_links) >= 3:
        score += 5
    elif len(internal_links) >= 1:
        score += 3
        suggestions.append(f"内链数量偏少（{len(internal_links)}），建议 3-5 个相关内链")
    else:
        suggestions.append("缺少内链，建议添加 3-5 个相关文章链接")

    return score, issues, suggestions, details


def audit_eeat_signals(content: str) -> tuple[int, list[str], list[str]]:
    """Check for E-E-A-T signals."""
    score = 0
    issues = []
    suggestions = []

    # Experience signals ("我们发现", "In our experience", etc.)
    experience_patterns = [
        r'我们发现|我们的经验|在.*实践中',
        r'In our experience|We found|We discovered|After.*projects',
        r'经过.*测试|通过.*验证',
    ]
    has_experience = any(re.search(p, content, re.IGNORECASE) for p in experience_patterns)

    # Data/statistics
    has_data = bool(re.search(r'\d+%|\d+\s*[倍x×]|\$[\d,]+|[\d,]+\s*(用户|users|客户|customers)', content))

    # Citations/sources
    has_citations = bool(re.search(r'根据|According to|研究表明|数据显示|Source:|来源:', content))

    if has_experience:
        score += 5
    else:
        suggestions.append("建议添加第一手经验表述（如：「我们在 X 项目中发现...」）")

    if has_data:
        score += 5
    else:
        suggestions.append("建议添加具体数据或统计支撑观点")

    if has_citations:
        score += 5
    else:
        suggestions.append("建议添加权威来源引用增强可信度")

    return score, issues, suggestions


def audit_content(content: str, brand: Optional[str] = None) -> AuditResult:
    """Run full GEO audit on content."""
    total_score = 0
    max_score = 100
    all_issues = []
    all_suggestions = []
    all_details = {}

    # 1. Direct Answer (20 points)
    score, issues, suggestions = audit_direct_answer(content)
    total_score += score
    all_issues.extend(issues)
    all_suggestions.extend(suggestions)

    # 2. Heading Structure (20 points)
    score, issues, suggestions, details = audit_heading_structure(content)
    total_score += score
    all_issues.extend(issues)
    all_suggestions.extend(suggestions)
    all_details["structure"] = details

    # 3. Lists and Tables (10 points)
    score, issues, suggestions, details = audit_lists_and_tables(content)
    total_score += score
    all_issues.extend(issues)
    all_suggestions.extend(suggestions)
    all_details["elements"] = details

    # 4. Brand Binding (10 points)
    score, issues, suggestions = audit_brand_binding(content, brand)
    total_score += score
    all_issues.extend(issues)
    all_suggestions.extend(suggestions)

    # 5. CTA (5 points)
    score, issues, suggestions = audit_cta(content)
    total_score += score
    all_issues.extend(issues)
    all_suggestions.extend(suggestions)

    # 6. Internal Links (5 points)
    score, issues, suggestions, details = audit_internal_links(content)
    total_score += score
    all_issues.extend(issues)
    all_suggestions.extend(suggestions)
    all_details["links"] = details

    # 7. E-E-A-T Signals (15 points)
    score, issues, suggestions = audit_eeat_signals(content)
    total_score += score
    all_issues.extend(issues)
    all_suggestions.extend(suggestions)

    # Normalize to 100
    # Current max is ~75, scale up
    normalized_score = min(100, int(total_score * 100 / 75))

    return AuditResult(
        passed=normalized_score >= 70,
        score=normalized_score,
        max_score=max_score,
        issues=all_issues,
        suggestions=all_suggestions,
        details=all_details,
    )


def print_report(result: AuditResult, verbose: bool = True):
    """Print human-readable audit report."""
    status = "✅ PASSED" if result.passed else "❌ NEEDS IMPROVEMENT"
    print(f"\n{'='*50}")
    print(f"GEO Content Audit Report")
    print(f"{'='*50}")
    print(f"\nScore: {result.score}/{result.max_score} {status}")

    if result.issues:
        print(f"\n🚨 Issues ({len(result.issues)}):")
        for issue in result.issues:
            print(f"  • {issue}")

    if result.suggestions and verbose:
        print(f"\n💡 Suggestions ({len(result.suggestions)}):")
        for suggestion in result.suggestions:
            print(f"  • {suggestion}")

    if verbose and result.details:
        print(f"\n📊 Details:")
        if "structure" in result.details:
            s = result.details["structure"]
            print(f"  • H1: {s['h1_count']}, H2: {s['h2_count']}, H3: {s['h3_count']}")
        if "elements" in result.details:
            e = result.details["elements"]
            print(f"  • Lists: {e['list_items']} items, Tables: {e['has_tables']}, Code blocks: {e['code_blocks']}")
        if "links" in result.details:
            l = result.details["links"]
            print(f"  • Internal links: {l['internal_links']}, External links: {l['external_links']}")

    print(f"\n{'='*50}\n")


def main():
    parser = argparse.ArgumentParser(description="GEO Content Audit Tool")
    parser.add_argument("file", help="Markdown file to audit")
    parser.add_argument("--brand", help="Brand name to check for binding")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--quiet", action="store_true", help="Only show score and issues")

    args = parser.parse_args()

    file_path = Path(args.file)
    if not file_path.exists():
        print(f"Error: File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    content = file_path.read_text(encoding="utf-8")
    result = audit_content(content, brand=args.brand)

    if args.json:
        print(json.dumps(asdict(result), indent=2, ensure_ascii=False))
    else:
        print_report(result, verbose=not args.quiet)

    # Exit with non-zero if audit failed
    sys.exit(0 if result.passed else 1)


if __name__ == "__main__":
    main()
