# State Ownership and Boundaries

This document defines where app state belongs and which UI areas should subscribe to it.

## Provider responsibilities

- `SessionContext`
  - Connected drive identities, drive metadata, usage limits, login/logout.
  - Should not be used for high-frequency task progress.
- `LogicalFoldersContext`
  - Logical folder manifests, entries, and backend placement metadata.
  - Source of truth for explorer data.
- `TasksContext`
  - Background operations (upload/copy/move/delete) and retry/cleanup actions.
  - Split subscriptions:
    - `useTasksActions()` for enqueue/retry controls in broad pages.
    - `useTasksState()` for task UIs and progress visuals.

## Subscription guidance

- Prefer actions-only hooks in high-level pages to avoid render thrash.
- Subscribe to state as close to the visual consumer as possible.
- Memoize row/list components in explorer-like UIs.

## Error isolation

- Keep a top-level app `ErrorBoundary` around routing.
- Keep local `ErrorBoundary` wrappers around explorer-heavy surfaces.
- Never rely on error boundaries for async handler failures; use `try/catch` and explicit user-facing errors.

## Rendering safety rules

- Do not introduce `dangerouslySetInnerHTML` for legal or remote content.
- If future requirements require rendering remote markup:
  - sanitize before render with a maintained sanitizer library,
  - restrict allowed tags/attributes,
  - keep a default plain-text fallback path.

