# Claude Instructions - app-sci-front

## Project Stack
- React 19 + Vite + TypeScript
- Redux Toolkit for state management
- CoreUI component ecosystem
- Zod v4 for client-side validation where needed

## Architecture
- Views live in `src/views`.
- Reusable UI components live in `src/components`.
- Shared hooks live in `src/hooks`.
- API and external calls live in `src/services`.
- Put pure helpers in `src/utils` and schema logic in `src/validation`.

## Coding Guidelines
- Use functional components and hooks.
- Keep components focused and split large files into smaller units.
- Prefer strongly typed props and avoid `any`.
- Follow existing route and layout structure in `src/routes.tsx` and `src/layout`.
- Avoid introducing a new UI pattern when an existing CoreUI pattern already exists.

## UX and Behavior
- Keep loading, empty, and error states explicit.
- Preserve existing navigation and role-based access behavior.
- Do not break responsiveness across desktop and mobile.

## Commands
- Dev: npm run dev
- Build: npm run build
- Lint: npm run lint
- Preview: npm run preview

## Change Strategy
- Prefer minimal, localized edits.
- Keep naming and file organization consistent with the current codebase.
- Add concise comments only for complex logic.
