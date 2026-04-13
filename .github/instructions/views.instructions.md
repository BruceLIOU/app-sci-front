---
applyTo: "src/views/**/*.{ts,tsx}"
description: "Use when: implementing page-level views and screen behavior"
---

# Front Views Rules

- Keep page-level orchestration in views and reusable UI in components.
- Follow existing route and layout patterns from `src/routes.tsx` and `src/layout`.
- Keep role-based access behavior intact.
- Use explicit loading and error handling around async calls.
- Prefer typed selectors/actions and avoid `any` in view logic.
- Keep navigation and state flows consistent with existing Redux Toolkit patterns.
