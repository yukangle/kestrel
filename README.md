# Kestrel

Kestrel is a personal, local-first AI frontier agent designed around one shared runtime with two clients:

- **CLI** for interactive work, scripting, and CI;
- **Electron desktop** for sessions, approvals, and visual inspection.

This first vertical slice intentionally runs without API keys. It uses a deterministic mock provider and real workspace inspection so the protocol, CLI, and desktop boundaries can be tested before adding a model provider.

## Quick start

```text
npm install
npm run typecheck
npm test
npm run start:cli -- plan "Map the current project"
npm run start:cli -- run "Inspect this workspace"
```

To open the desktop shell:

```text
npm run start:desktop
```

The desktop UI provides a workspace path, policy mode, task composer, and live
session timeline backed by the shared runtime. It currently uses the
deterministic mock provider; file edits, shell commands, approvals, and real
model providers are not implemented yet. See [Kestrel.User.Guide.md](Kestrel.User.Guide.md)
for macOS usage, build instructions, and design coverage.

## Current architecture

```text
CLI / Electron renderer
          |
    host adapters
          |
 versioned protocol
          |
     agent core
       /     \
 provider   workspace tools
```

Next implementation steps are a real provider adapter, persistent sessions, patch editing, policy enforcement, and a supervised runner.
