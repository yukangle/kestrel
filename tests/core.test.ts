import { describe, expect, it } from "vitest";
import { AgentRuntime, MockProvider, summarizeWorkspace } from "../src/core.js";

const workspace = new URL("../", import.meta.url).pathname;

describe("Kestrel runtime", () => {
  it("summarizes a workspace without node_modules or dotfiles", async () => {
    const summary = await summarizeWorkspace(workspace);
    expect(summary).toContain("package.json");
    expect(summary).not.toContain("node_modules");
  });

  it("emits a complete session event sequence", async () => {
    const events = [];
    for await (const event of new AgentRuntime().run("inspect the project", workspace)) events.push(event);
    expect(events[0]?.type).toBe("session.started");
    expect(events.some((event) => event.type === "tool.output")).toBe(true);
    expect(events.at(-1)?.type).toBe("session.completed");
  });

  it("tailors deterministic mock responses to the requested task", async () => {
    const provider = new MockProvider();
    const testResponse = await provider.respond({
      prompt: "What tests should I run?",
      workspaceSummary: "file: package.json, file: README.md, dir: src"
    });
    const docsResponse = await provider.respond({
      prompt: "Update the documentation",
      workspaceSummary: "file: package.json, file: README.md, dir: src"
    });

    expect(testResponse).toContain("Kestrel test review");
    expect(testResponse).toContain("Run the existing test suite");
    expect(docsResponse).toContain("Kestrel documentation review");
    expect(docsResponse).toContain("README.md");
    expect(testResponse).not.toBe(docsResponse);
  });
});
