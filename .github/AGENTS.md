# AGENTS - app-sci-front

## Goal
Deliver consistent React screens and components with minimal, safe, and maintainable edits.

## Priorities
1. Functional correctness and UX clarity.
2. Consistency with existing CoreUI and routing/layout patterns.
3. Type safety and maintainability.
4. Responsive behavior across devices.

## Working Rules
- Prefer localized edits and avoid unrelated refactors.
- Keep reusable UI in components and orchestration in views.
- Preserve navigation and role-based access behavior.
- Keep loading, empty, and error states explicit.
- Use typed props/hooks/selectors and avoid `any`.
- Reuse existing Redux Toolkit and CoreUI patterns.

## Verification
- Run build/lint for significant UI changes.
- Verify no obvious regression in route flow and responsiveness.
