## ADDED Requirements

### Requirement: Tools page presents each tool with beginner-friendly description
Each tool on the tools page SHALL display a clear, plain-language description of what the tool does and who it is for — not just a feature name.

#### Scenario: Tool card shows use-case description
- **WHEN** a visitor views the tools page
- **THEN** each tool card SHALL show: tool name, 1–2 sentence plain-language description, and a CTA button
- **THEN** the description SHALL answer "what can I do with this?" not "what is this feature?"

#### Scenario: Tool cards are accessible to keyboard navigation
- **WHEN** a user navigates the tools page by keyboard (Tab key)
- **THEN** each tool card's CTA SHALL be reachable and activatable via keyboard

### Requirement: Tools page groups tools by use case or audience
If more than 4 tools exist, the tools page SHALL organize tools into labeled groups (e.g., "SEO 分析", "内容创作", "竞争对手研究") rather than a flat undifferentiated list.

#### Scenario: Tools are grouped when count exceeds 4
- **WHEN** the tools page renders with 5 or more tools
- **THEN** tools SHALL be organized under labeled section headings
- **THEN** each section SHALL have a short description of who that group of tools is for

### Requirement: Tools page shows credit cost per tool
Each tool card SHALL display the credit cost required to use that tool, positioned as secondary information below the tool description.

#### Scenario: Credit cost is visible but not dominant
- **WHEN** a visitor views a tool card
- **THEN** the credit cost SHALL be visible (e.g., "2 积分/次") using `text-sm text-muted` styling
- **THEN** the credit cost SHALL NOT be the most visually prominent element on the card

### Requirement: Tools page text content is i18n-ready
All tool names, descriptions, and group headings SHALL be defined as named constants or props — not inline hardcoded strings in JSX.

#### Scenario: Tool copy is defined at file scope
- **WHEN** a developer reads the tools page file
- **THEN** all user-visible strings SHALL be in a `const TOOLS` array or `const COPY` object at file scope
- **THEN** the JSX SHALL reference these constants, not contain inline literal strings

### Requirement: Tools page applies new design tokens
All visual styles on the tools page SHALL use the new design token system — rounded-lg cards, sky blue accent for CTAs, no brutalist shadows.

#### Scenario: Tool CTA buttons use primary brand color
- **WHEN** a tool card renders its action button
- **THEN** the button SHALL use the `primary` or `secondary` Button variant from the updated Button component
