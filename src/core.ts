import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { AgentEvent, AgentProvider, AgentSession, SessionMode } from "./protocol.js";

export class MockProvider implements AgentProvider {
  async respond(input: { prompt: string; workspaceSummary: string }): Promise<string> {
    const task = input.prompt.trim();
    const normalizedTask = task.toLowerCase();
    const files = input.workspaceSummary
      .split(", ")
      .filter((entry) => entry.startsWith("file:"))
      .map((entry) => entry.slice("file:".length).trim());
    const directories = input.workspaceSummary
      .split(", ")
      .filter((entry) => entry.startsWith("dir:"))
      .map((entry) => entry.slice("dir:".length).trim());

    if (/\b(test|tests|testing|spec|vitest)\b/.test(normalizedTask)) {
      return [
        "## Kestrel test review",
        `I found ${files.length} visible files and ${directories.length} visible directories in the workspace.`,
        "Suggested validation focus:",
        "1. Run the existing test suite.",
        "2. Inspect failures and identify the smallest responsible change.",
        "3. Re-run the targeted test, then the full suite.",
        `Requested task: ${task}`
      ].join("\n");
    }

    if (/\b(document|documentation|docs?|readme|guide)\b/.test(normalizedTask)) {
      return [
        "## Kestrel documentation review",
        `Visible documentation candidates: ${files.filter((file) => /\.(md|html|txt)$/i.test(file)).join(", ") || "none found"}.`,
        "Suggested documentation workflow:",
        "1. Read the existing project guidance.",
        "2. Compare commands and behavior with the implementation.",
        "3. Update only user-visible instructions that are out of date.",
        `Requested task: ${task}`
      ].join("\n");
    }

    if (/\b(file|files|source|code|tree|structure|repo|repository|workspace)\b/.test(normalizedTask)) {
      return [
        "## Kestrel workspace inspection",
        `Visible files (${files.length}): ${files.join(", ") || "none"}`,
        `Visible directories (${directories.length}): ${directories.join(", ") || "none"}`,
        "Suggested inspection workflow:",
        "1. Read the relevant entry points.",
        "2. Trace the runtime path for the requested behavior.",
        "3. Report findings and identify the smallest next change.",
        `Requested task: ${task}`
      ].join("\n");
    }

    return [
      "## Kestrel task plan",
      `I understood the request as: ${task}`,
      `Workspace snapshot: ${files.length} files and ${directories.length} directories are visible.`,
      "Next steps:",
      "1. Identify the files and tools relevant to this request.",
      "2. Make the smallest reviewable change or produce the requested explanation.",
      "3. Validate the result and report any limitation.",
    ].join("\n");
  }
}

export async function summarizeWorkspace(workspace: string): Promise<string> {
  const entries = await readdir(workspace, { withFileTypes: true });
  const visible = entries
    .filter((entry) => !entry.name.startsWith(".") && entry.name !== "node_modules")
    .slice(0, 30)
    .map((entry) => `${entry.isDirectory() ? "dir" : "file"}: ${entry.name}`);
  return visible.length > 0 ? visible.join(", ") : "empty workspace";
}

export class AgentRuntime {
  constructor(private readonly provider: AgentProvider = new MockProvider()) {}

  async *run(prompt: string, workspace: string, mode: SessionMode = "plan"): AsyncGenerator<AgentEvent> {
    const session: AgentSession = {
      id: randomUUID(),
      workspace: join(workspace),
      mode,
      createdAt: new Date().toISOString()
    };

    yield { type: "session.started", sessionId: session.id, workspace: session.workspace, mode };
    yield { type: "tool.started", sessionId: session.id, tool: "workspace.summary", input: workspace };

    try {
      const summary = await summarizeWorkspace(workspace);
      yield { type: "tool.output", sessionId: session.id, tool: "workspace.summary", output: summary };
      const response = await this.provider.respond({ prompt, workspaceSummary: summary });
      yield { type: "assistant.delta", sessionId: session.id, text: response };
      yield { type: "session.completed", sessionId: session.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      yield { type: "session.failed", sessionId: session.id, error: message };
    }
  }
}
