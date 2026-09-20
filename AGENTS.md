# Kestrel agent instructions

## Project purpose

Kestrel is a local-first AI frontier-agent prototype for macOS. It is intentionally
small and uses one TypeScript runtime with two intended clients:

- `src/cli.ts`: command-line client for interactive and automation-oriented runs.
- `src/electron/`: Electron desktop shell and renderer.

The original product/design reference is
`2026_09_19_custom_ai_frontier.md`. The current implementation is a Phase 1
vertical slice, not a complete implementation of every phase in that document.

## Repository layout

```text
src/
  cli.ts                 CLI argument parsing and event rendering
  core.ts                Agent runtime and deterministic mock provider
  protocol.ts            Shared session commands, events, and provider types
  electron/main.ts       Electron main process and runtime IPC
  electron/preload.ts    Narrow context-isolated renderer bridge
  electron/renderer/     Desktop workspace renderer
tests/
  core.test.ts           Runtime and workspace-summary tests
```

Generated JavaScript is written to `dist/`. Do not edit generated files; change
`src/` and rebuild.

## Development commands

Run these from the project root:

```bash
npm install
npm run typecheck
npm test
npm run build
npm run start:cli -- plan "Map the current project"
npm run start:cli -- run "Inspect this workspace"
npm run start:desktop
```

`run` currently uses the deterministic mock provider and review mode; it does
not call a hosted model or edit files. `--json` emits versioned JSONL events:

```bash
npm run start:cli -- run --json "Inspect this workspace"
```

## Coding conventions

- Use strict TypeScript and ESM-compatible imports with `.js` extensions.
- Keep the CLI and Electron clients dependent on shared protocol/runtime types;
  do not duplicate agent behavior in either client.
- Prefer explicit discriminated unions for commands and events.
- Keep filesystem behavior bounded and deterministic for tests.
- Surface errors as `session.failed` events or normal process errors; do not hide
  failures behind empty success responses.
- Keep generated output, `node_modules/`, and `.kestrel/` out of source changes.
- Add or update Vitest coverage for runtime behavior changes.

## Electron safety

The Electron window must retain `contextIsolation: true`, `nodeIntegration: false`,
and `sandbox: true`. Do not expose unrestricted filesystem, shell, IPC, or
provider-secret access to the renderer. New main/preload APIs must be narrow,
typed, and validated.

## Current implementation boundary

Implemented today:

- shared session/event types;
- plan/review session creation;
- workspace directory summary;
- deterministic provider response;
- CLI human-readable and JSONL rendering;
- secure Electron shell with task composer and live runtime event timeline;
- TypeScript build and runtime tests.

Not implemented yet:

- real provider adapters and streaming model calls;
- patch editing, shell execution, Git tools, MCP, policy enforcement;
- SQLite persistence, resume/export, checkpoints, rollback, cancellation;
- Electron approvals, diffs, provider settings, and packaged/notarized application;
- packaged/notarized distributable application.

When extending the project, update `Kestrel.User.Guide.md` and its HTML version
when user-visible commands or supported platforms change.
