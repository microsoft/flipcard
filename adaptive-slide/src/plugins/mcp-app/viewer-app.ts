import { App } from "@modelcontextprotocol/ext-apps";

type Data = Record<string, unknown>;
const object = (value: unknown): Data => value && typeof value === "object" && !Array.isArray(value) ? value as Data : {};
export function createViewerApp(doc: Document = document): App {
  const el = <T extends HTMLElement>(id: string): T => {
    const node = doc.getElementById(id);
    if (!node) throw new Error(`Missing viewer element: ${id}`);
    return node as T;
  };
  const text = (tag: string, value: unknown) => {
    const node = doc.createElement(tag);
    node.textContent = String(value ?? "");
    return node;
  };
  const app = new App({ name: "Adaptive Slide viewer", version: "0.2.0" }, {}, { strict: true, autoResize: false });
  let deck: Data | undefined;
  let slides: Data[] = [];
  let index = 0;
  let ready = false;
  let disposed = false;
  let revision = 0;
  const setTheme = (context: { theme?: string }): void => {
    if (context.theme === "light" || context.theme === "dark") doc.documentElement.dataset.theme = context.theme;
  };
  const deactivate = (): void => {
    disposed = true;
    ready = false;
    revision++;
    for (const id of ["prev", "next", "list"]) el<HTMLButtonElement>(id).disabled = true;
    el("prev").removeEventListener("click", previous);
    el("next").removeEventListener("click", next);
    el("list").removeEventListener("click", list);
  };

  function tile(value: unknown, depth = 0): HTMLElement {
    const data = object(value);
    const node = doc.createElement("section");
    node.className = "tile";
    if (data.isVisible === false || depth > 20) return node;
    switch (data.type) {
      case "Tile.Text":
        node.append(text(data.style === "heading" ? "h2" : data.style === "subheading" ? "h3" : "p", data.text));
        break;
      case "Tile.Code":
        if (data.title) node.append(text("h3", data.title));
        node.append(text("pre", data.code));
        break;
      case "Tile.Image":
        node.append(text("p", data.altText ?? data.caption ?? "Image"));
        node.append(text("small", "External images are disabled in this offline MCP App."));
        break;
      case "Tile.Container":
        node.classList.add("container");
        node.style.flexDirection = data.layout === "row" ? "row" : "column";
        if (Array.isArray(data.items)) node.append(...data.items.map(item => tile(item, depth + 1)));
        break;
      case "Tile.Chart": {
        if (data.title) node.append(text("h3", data.title));
        const chart = object(data.data);
        const labels = Array.isArray(chart.labels) ? chart.labels : [];
        const sets = Array.isArray(chart.datasets) ? chart.datasets.map(object) : [];
        const table = doc.createElement("table");
        for (let i = 0; i < labels.length; i++) {
          const row = doc.createElement("tr");
          row.append(text("th", labels[i]), ...sets.map(set => text("td", Array.isArray(set.values) ? set.values[i] : "")));
          table.append(row);
        }
        node.append(table);
        break;
      }
      default:
        node.append(text("pre", JSON.stringify(data, null, 2)));
    }
    return node;
  }

  function render(): void {
    const slide = slides[index];
    const viewport = el("viewport");
    viewport.replaceChildren();
    if (!slide) {
      viewport.textContent = "This deck contains no slides.";
    } else {
      const body = doc.createElement("article");
      body.className = "slide";
      const layout = object(slide.layout);
      const columns = typeof layout.columns === "number" && Number.isInteger(layout.columns) && layout.columns > 0 && layout.columns < 13 ? layout.columns : 1;
      if (layout.mode === "grid") body.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
      if (slide.title) viewport.append(text("h1", slide.title));
      if (Array.isArray(slide.body)) body.append(...slide.body.map(value => tile(value)));
      viewport.append(body);
    }
    el("counter").textContent = slides.length ? `${index + 1} / ${slides.length}` : "0 / 0";
    el<HTMLButtonElement>("prev").disabled = index <= 0;
    el<HTMLButtonElement>("next").disabled = index >= slides.length - 1;
    el("notes").textContent = String(slide?.notes ?? "");
    el("notes").hidden = !slide?.notes;
  }

  function load(value: unknown): void {
    if (disposed) return;
    const input = object(value);
    if (input.type !== "AdaptiveDeck" || !Array.isArray(input.slides) ||
        input.slides.some(slide => !slide || typeof slide !== "object" || Array.isArray(slide))) {
      el("status").textContent = "Expected an AdaptiveDeck with a slides array.";
      return;
    }
    deck = input;
    revision++;
    slides = input.slides.map(object);
    index = 0;
    el("deck-title").textContent = String(input.title ?? "Adaptive Slide");
    el<HTMLButtonElement>("list").disabled = !ready;
    el("status").textContent = "Deck ready.";
    el("slide-list").hidden = true;
    el("slide-list").textContent = "";
    render();
  }

  app.ontoolinput = params => {
    if (disposed) return;
    if (typeof params.arguments?.deck === "string") {
      try { load(JSON.parse(params.arguments.deck)); } catch { el("status").textContent = "Invalid deck JSON."; }
    }
  };
  app.ontoolresult = result => {
    if (disposed) return;
    if (result.isError) { el("status").textContent = "The server could not present this deck."; return; }
    load(result.structuredContent);
  };
  app.ontoolcancelled = () => {
    revision++;
    el<HTMLButtonElement>("list").disabled = !ready || !deck;
    el("status").textContent = "Presentation cancelled.";
  };
  app.onerror = error => { el("status").textContent = error.message; };
  app.onhostcontextchanged = setTheme;
  app.onclose = deactivate;
  app.onteardown = async () => { deactivate(); return {}; };
  const previous = (): void => { if (index > 0) { index--; render(); } };
  const next = (): void => { if (index + 1 < slides.length) { index++; render(); } };
  const list = (): void => {
    if (!deck || !ready || el<HTMLButtonElement>("list").disabled) return;
    const requestRevision = revision;
    const button = el<HTMLButtonElement>("list");
    button.disabled = true;
    void app.callServerTool({ name: "list-slides", arguments: { deck: JSON.stringify(deck) } }).then(result => {
      if (disposed || revision !== requestRevision) return;
      if (result.isError) { el("status").textContent = "The server could not list these slides."; return; }
      el("slide-list").hidden = false;
      el("slide-list").textContent = result.content?.filter(item => item.type === "text").map(item => item.text).join("\n") ?? "";
    }, error => {
      if (!disposed && revision === requestRevision) el("status").textContent = String(error);
    }).finally(() => {
      if (disposed || revision === requestRevision) button.disabled = !ready;
    });
  };
  el("prev").addEventListener("click", previous);
  el("next").addEventListener("click", next);
  el("list").addEventListener("click", list);
  const connect = app.connect.bind(app);
  app.connect = async (...args: Parameters<App["connect"]>) => {
    await connect(...args);
    if (disposed) return;
    ready = !!app.getHostCapabilities()?.serverTools;
    setTheme(app.getHostContext() ?? {});
    el<HTMLButtonElement>("list").disabled = !deck || !ready;
    if (!deck) el("status").textContent = "Connected. Waiting for a deck…";
  };
  const close = app.close.bind(app);
  app.close = async () => { deactivate(); await close(); };
  return app;
}
