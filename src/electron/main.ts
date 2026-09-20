import { app, BrowserWindow, ipcMain } from "electron";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { AgentRuntime } from "../core.js";
import type { SessionMode } from "../protocol.js";

type SessionRequest = {
  workspace: string;
  task: string;
  mode: SessionMode;
};

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: resolve(import.meta.dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  const rendererPath = resolve(import.meta.dirname, "renderer", "index.html");
  if (!existsSync(rendererPath)) {
    console.error(`Kestrel renderer not found: ${rendererPath}`);
    return;
  }

  void window.loadURL(pathToFileURL(rendererPath).toString()).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to load the Kestrel renderer: ${message}`);
  });
  window.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });
  window.webContents.on("preload-error", (_event, preloadPath, error) => {
    console.error(`Failed to load preload ${preloadPath}: ${error.message}`);
  });
}

function registerSessionHandlers(): void {
  ipcMain.on("session.start", (event, request: SessionRequest) => {
    console.log("Received desktop session request.");
    if (
      !request ||
      typeof request.workspace !== "string" ||
      typeof request.task !== "string" ||
      !request.task.trim() ||
      !["plan", "review", "act"].includes(request.mode)
    ) {
      event.sender.send("session.event", {
        type: "session.failed",
        sessionId: "desktop",
        error: "Invalid session request."
      });
      return;
    }

    void (async () => {
      for await (const agentEvent of new AgentRuntime().run(request.task.trim(), request.workspace, request.mode)) {
        console.log(`Desktop session event: ${agentEvent.type}`);
        event.sender.send("session.event", agentEvent);
      }
    })();
  });
}

app.whenReady().then(() => {
  registerSessionHandlers();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
