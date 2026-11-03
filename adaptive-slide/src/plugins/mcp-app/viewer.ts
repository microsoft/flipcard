import { createViewerApp } from "./viewer-app.js";

const app = createViewerApp();
void app.connect().catch((error: unknown) => {
  const status = document.getElementById("status");
  if (status) status.textContent = `Unable to connect to the MCP Apps host: ${String(error)}`;
});
window.addEventListener("pagehide", () => { void app.close(); }, { once: true });
