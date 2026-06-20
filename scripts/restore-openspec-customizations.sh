#!/usr/bin/env bash
# Restores custom additions to OpenSpec SKILL.md files after `openspec update`.
# Safe to run multiple times — checks for existing content before inserting.

set -e
SKILLS=".claude/skills"

echo "🔧 Restoring OpenSpec customizations..."

# ─────────────────────────────────────────────────────────────
# 1. openspec-explore: Archaeology step
# ─────────────────────────────────────────────────────────────
EXPLORE="$SKILLS/openspec-explore/SKILL.md"
ARCHAEOLOGY_MARKER="Archaeology (when a new change or feature is proposed)"

if grep -q "$ARCHAEOLOGY_MARKER" "$EXPLORE" 2>/dev/null; then
  echo "  ✓ explore: Archaeology already present"
else
  python3 - "$EXPLORE" <<'PYEOF'
import sys, re

path = sys.argv[1]
content = open(path).read()

insert_after = "**Investigate the codebase**\n- Map existing architecture relevant to the discussion\n- Find integration points\n- Identify patterns already in use\n- Surface hidden complexity"

addition = """
**Archaeology (when a new change or feature is proposed)**
- Search the codebase for all files related to the domain being changed
- Check `openspec/technical-backlog.md` for known legacy issues in this area
- Identify existing design assumptions that could conflict with the proposed change
- Present a conflict map before moving to a proposal — list each conflict and the recommended handling (fix, bypass, or accept)"""

if insert_after in content:
    new_content = content.replace(insert_after, insert_after + "\n" + addition)
    open(path, 'w').write(new_content)
    print("  ✓ explore: Archaeology section added")
else:
    print("  ⚠ explore: anchor text not found — manual check needed")
PYEOF
fi

# ─────────────────────────────────────────────────────────────
# 2. openspec-propose: Implementation Notes guardrail
# ─────────────────────────────────────────────────────────────
PROPOSE="$SKILLS/openspec-propose/SKILL.md"
NOTES_MARKER="Implementation Notes section at the end of design.md"

if grep -q "$NOTES_MARKER" "$PROPOSE" 2>/dev/null; then
  echo "  ✓ propose: Implementation Notes guardrail already present"
else
  python3 - "$PROPOSE" <<'PYEOF'
import sys

path = sys.argv[1]
content = open(path).read()

anchor = "- Verify each artifact file exists after writing before proceeding to next"
addition = """
- **Always append an Implementation Notes section at the end of design.md** — this is mandatory context for Gemini CLI / Antigravity when they implement:

  ```markdown
  ## Implementation Notes (for Gemini / Antigravity)

  **已知遗留冲突：**
  - [根据 explore 阶段发现填写：文件 + 冲突描述 + 绕开方式，若无则写"无已知冲突"]

  **禁止触碰范围：**
  - [列出不得修改的文件或模块，若无则写"无限制"]

  **本 change 边界：**
  - [只允许改动的文件范围]

  **其他注意事项：**
  - [特殊约束、已知 gotchas，若无则写"无"]
  ```"""

if anchor in content:
    new_content = content.replace(anchor, anchor + addition)
    open(path, 'w').write(new_content)
    print("  ✓ propose: Implementation Notes guardrail added")
else:
    print("  ⚠ propose: anchor text not found — manual check needed")
PYEOF
fi

# ─────────────────────────────────────────────────────────────
# 3. openspec-archive-change: AI Constraints Check
# ─────────────────────────────────────────────────────────────
ARCHIVE="$SKILLS/openspec-archive-change/SKILL.md"
CONSTRAINT_MARKER="AI Constraints Check"

if grep -q "$CONSTRAINT_MARKER" "$ARCHIVE" 2>/dev/null; then
  echo "  ✓ archive: AI Constraints Check already present"
else
  python3 - "$ARCHIVE" <<'PYEOF'
import sys

path = sys.argv[1]
content = open(path).read()

anchor = "**Guardrails**"
addition = """**Before archiving — AI Constraints Check**

Ask the user: "在这次 change 里，Gemini 或 Antigravity 有没有犯过可以用规则预防的错误？"

- 有 → 提示用户把这条规则加入 `rules/ai-constraints.md`，格式参考文件现有条目
- 没有 → 直接继续 archive

这一步保持 `rules/ai-constraints.md` 与实际问题同步，不要跳过。

"""

if anchor in content:
    new_content = content.replace(anchor, addition + anchor, 1)
    open(path, 'w').write(new_content)
    print("  ✓ archive: AI Constraints Check added")
else:
    print("  ⚠ archive: anchor text not found — manual check needed")
PYEOF
fi

echo ""
echo "✅ Done. Run this script after every \`openspec update\`."
