const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kestrel", {
  startSession(request) {
    ipcRenderer.send("session.start", request);
  },
  onEvent(listener) {
    const handler = (_event, payload) => listener(payload);
    ipcRenderer.on("session.event", handler);
    return () => ipcRenderer.removeListener("session.event", handler);
  }
});
