#!/usr/bin/env node
import process from "node:process";
import { AgentRuntime } from "./core.js";
import type { AgentEvent, SessionMode } from "./protocol.js";

function usage(): never {
  console.error("Usage: kestrel <plan|run> <task> [--json] [--workspace <path>]");
  process.exit(2);
}

function getOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function render(event: AgentEvent, json: boolean): void {
  if (json) {
    console.log(JSON.stringify({ version: 1, ...event }));
    return;
  }
  switch (event.type) {
    case "session.started": console.log(`Kestrel session ${event.sessionId} · ${event.mode}`); break;
    case "tool.started": console.log(`→ ${event.tool}`); break;
    case "tool.output": console.log(`  ${event.output}`); break;
    case "assistant.delta": console.log(`\n${event.text}`); break;
    case "session.completed": console.log("\n✓ session completed"); break;
    case "session.failed": console.error(`\n✗ ${event.error}`); process.exitCode = 1; break;
    case "approval.required": console.log(`? approval: ${event.action} (${event.reason})`); break;
  }
}

const [command, ...rawArgs] = process.argv.slice(2);
if (!command || !["plan", "run"].includes(command)) usage();
const json = rawArgs.includes("--json");
const workspace = getOption(rawArgs, "--workspace") ?? process.cwd();
const task = rawArgs.filter((arg, index, args) => !["--json", "--workspace", args[index - 1] === "--workspace" ? arg : ""].includes(arg)).join(" ");
if (!task) usage();

const mode: SessionMode = command === "plan" ? "plan" : "review";
for await (const event of new AgentRuntime().run(task, workspace, mode)) render(event, json);
