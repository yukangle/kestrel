# Kestrel User Guide

Kestrel is a local-first AI frontier-agent prototype for macOS. The current
release is a deterministic, no-API-key vertical slice: it inspects a workspace,
emits a shared session event stream, and presents the foundation through a CLI
and an Electron desktop shell.

This guide describes what works today and distinguishes it from capabilities in
the original design document, `2026_09_19_custom_ai_frontier.md`.

## Requirements

- macOS with Node.js 20 or newer
- npm
- A terminal
- This repository checked out locally

Apple Silicon and Intel Macs are supported by the TypeScript/Node workflow.
The current project does not yet publish a signed `.app`, DMG, or notarized
release artifact.

## Install

From the Kestrel directory:

```bash
npm install
```

## Verify the checkout

Run the type checker, tests, and TypeScript build:

```bash
npm run typecheck
npm test
npm run build
```

The build writes JavaScript to `dist/`. The `dist/` directory is generated and
is ignored by Git.

## Run the CLI locally

Create a read-only planning session:

```bash
npm run start:cli -- plan "Map the current project"
```

Run a review-mode inspection session:

```bash
npm run start:cli -- run "Inspect the source tree"
```

Use another workspace:

```bash
npm run start:cli -- plan --workspace /path/to/project "Summarize this workspace"
```

Emit machine-readable, versioned JSONL events:

```bash
npm run start:cli -- run --json "Inspect this workspace"
```

JSON mode writes protocol events to stdout. Human-readable failures are written
to stderr and a failed session sets a non-zero exit code.

## Run the Electron desktop shell

Compile first and open the desktop shell:

```bash
npm run start:desktop
```

After changing desktop code, close every existing Kestrel window and start a
fresh process. `npm run start:desktop` rebuilds the main process, preload bridge,
and renderer before opening the window.

If a previous build reported `ERR_FILE_NOT_FOUND`, stop that Electron process
and rerun the command from the project root. The build copies the renderer to
`dist/electron/renderer/index.html` and the main process verifies that absolute
path before loading it.

The desktop workspace is connected to the shared runtime. Enter a workspace
path (use `.` for the current project), choose `Plan`, `Review`, or `Act`, type
a task, and select **Run session**. Runtime events appear in the center
timeline. Use **New session** to clear the timeline.

The current provider is deterministic and task-sensitive, but it is still a
local mock rather than a real language model and does not require an API key. It
desktop client does not yet edit files, run shell commands, request approvals,
connect to hosted model providers, or persist sessions. Close the window to
exit. On macOS, the app lifecycle remains available while the application is
active, following normal Electron behavior.

## Build for distribution

The supported local distribution build is the compiled TypeScript output:

```bash
npm run build
```

The build also copies the Electron renderer into `dist/electron/renderer`, so
the compiled desktop entry point has all of its local UI assets.

You can launch the compiled CLI directly:

```bash
node dist/cli.js plan "Inspect this workspace"
```

You can launch the compiled desktop entry point with Electron:

```bash
./node_modules/.bin/electron dist/electron/main.js
```

Packaging into a signed/notarized macOS `.app` or DMG is not configured yet.
Do not treat `dist/` as a self-contained distributable; it still requires the
project dependencies and Electron runtime.

## Current mock UI

The original design document includes a five-area desktop concept: workspace
and session rail, session timeline, composer, inspector, and runtime status.
The repository keeps the current mock screen as an SVG:

![Current Kestrel desktop mock UI](mock.svg)

Source: [`mock.svg`](mock.svg)

The mock is a design reference. The implemented Electron shell currently
contains a smaller status screen and does not yet implement the mock's live
timeline, approvals, diff viewer, or inspector.

## Design verification

Compared with `2026_09_19_custom_ai_frontier.md`:

| Design area | Status | Current state |
|---|---|---|
| Shared runtime and protocol | Partial | Shared TypeScript runtime and event types exist. |
| CLI client | Partial | `plan`, `run`, `--json`, and workspace selection work. |
| Electron client | Partial | Secure workspace UI, preload bridge, runtime IPC, and live timeline exist; approvals, diffs, and settings are not wired. |
| Workspace read/search | Partial | Top-level workspace summary exists; bounded file reads/search are not implemented. |
| Patch editing and Git tools | Not started | No mutation or Git tool implementation exists. |
| Shell runner and approvals | Not started | No command runner or policy enforcement exists. |
| Providers | Not started | Only a deterministic mock provider exists. |
| Persistence/resume/export | Not started | No SQLite session store exists. |
| MCP/plugins | Not started | No MCP or plugin surface exists. |
| Packaging | Not started | No signed/notarized macOS artifact is configured. |
| Evaluation fixtures | Partial | Basic runtime tests exist; the design's regression suite does not. |

The current implementation therefore satisfies the design's early protocol-first
vertical-slice direction, but it does not claim completion of the later phases.
The highest-value next implementation steps are a real provider adapter, bounded
read/search and patch tools, policy enforcement, persistence, and a typed
Electron preload bridge.

## Troubleshooting

### `npm install` fails

Confirm that Node.js 20 or newer is active:

```bash
node --version
npm --version
```

Then retry `npm install` from the project root.

### The desktop shell does not open

Rebuild and launch the compiled entry point:

```bash
npm run build
./node_modules/.bin/electron dist/electron/main.js
```

### A CLI command reports usage

The current syntax is:

```text
kestrel <plan|run> <task> [--json] [--workspace <path>]
```

With npm, pass the command after `--`, for example:

```bash
npm run start:cli -- plan "Inspect this workspace"
```
