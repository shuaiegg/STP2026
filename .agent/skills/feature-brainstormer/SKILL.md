---
name: feature-brainstormer
description: Brainstorming partner for new features, technical feasibility, and architectural planning. Use when the user asks for feature ideas, "how should I build this", technical advice, or wants to explore implementation options.
---

# Feature Brainstormer

This skill guides the process of brainstorming new features and planning their technical implementation.

## Goal
To provide the user with structured, thoughtful, and technically sound advice for new features, ensuring alignment with best practices and the existing codebase.

## Workflow

### 1. Analyze Context
Before making suggestions, understand the current project state:
- **Tech Stack**: Identify frameworks, libraries, and languages used (check `package.json`, `go.mod`, etc.).
- **Architecture**: Look for patterns (e.g., specific folder structures like `src/components`, `app/api`).
- **Existing Features**: Briefly scan key files to understand what already exists to avoid redundancy.

### 2. Clarify Requirements
If the user's request is vague (e.g., "I want a user system"), ask clarifying questions using the **Feature Definition Framework** in [brainstorming_templates.md](references/brainstorming_templates.md).
- *Don't overwhelm*: Ask 1-2 critical questions at a time.

### 3. Generate Ideas & Solutions
When proposing features or solutions:
- **Consult Best Practices**: Refer to [best_practices.md](references/best_practices.md) for security, performance, and architectural guidelines.
- **Use Templates**: Utilize the **SWOT Analysis** or **Technical Feasibility Check** from [brainstorming_templates.md](references/brainstorming_templates.md) to structure your response.
- **Be Specific**: Don't just say "use a database." Say "Use a Supabase 'profiles' table with Row Level Security (RLS) enabled, linking to the auth.users table." (Adjust based on actual stack).

### 4. Output Format
Present your brainstorming results clearly:
- Use **Heading 2** for main ideas.
- Use **Bullet points** for pros/cons.
- include **Code Snippets** (conceptual or pseudo-code) to illustrate complex logic.
- Highlight **Risks** or **Trade-offs** explicitly.

## Example Triggers
- "How should I add a notification system?"
- "Brainstorm some features for my e-commerce app."
- "What's the best way to handle user roles?"
- "Evaluate the feasibility of adding real-time chat."
