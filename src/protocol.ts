export type SessionMode = "plan" | "review" | "act";

export type AgentCommand =
  | { type: "session.create"; mode?: SessionMode; workspace: string }
  | { type: "message.send"; sessionId: string; text: string }
  | { type: "session.cancel"; sessionId: string };

export type AgentEvent =
  | { type: "session.started"; sessionId: string; workspace: string; mode: SessionMode }
  | { type: "assistant.delta"; sessionId: string; text: string }
  | { type: "tool.started"; sessionId: string; tool: string; input: string }
  | { type: "tool.output"; sessionId: string; tool: string; output: string }
  | { type: "approval.required"; sessionId: string; action: string; reason: string }
  | { type: "session.completed"; sessionId: string }
  | { type: "session.failed"; sessionId: string; error: string };

export interface AgentSession {
  id: string;
  workspace: string;
  mode: SessionMode;
  createdAt: string;
}

export interface AgentProvider {
  respond(input: { prompt: string; workspaceSummary: string }): Promise<string>;
}
