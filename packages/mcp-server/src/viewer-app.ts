import { App } from '@modelcontextprotocol/ext-apps';

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined;
}

export function createViewerApp(doc: Document = document): App {
  const app = new App({ name: 'FlipCard viewer', version: '0.1.0' }, {}, { autoResize: false, strict: true });
  const element = <T extends HTMLElement>(id: string): T => {
    const node = doc.getElementById(id);
    if (!node) throw new Error(`Missing viewer element: ${id}`);
    return node as T;
  };
  const status = element('status');
  const generate = element<HTMLButtonElement>('regenerate');
  const flip = element<HTMLButtonElement>('flip');
  const title = element<HTMLInputElement>('title');
  const category = element<HTMLSelectElement>('category-select');
  let back = false;
  let connected = false;
  let disposed = false;
  let revision = 0;
  const setTheme = (context: { theme?: string }): void => {
    if (context.theme === 'light' || context.theme === 'dark') doc.documentElement.dataset.theme = context.theme;
  };
  const deactivate = (): void => {
    disposed = true;
    connected = false;
    revision++;
    generate.disabled = true;
    flip.disabled = true;
    flip.removeEventListener('click', onFlip);
    element('generate').removeEventListener('submit', onGenerate);
  };

  const showFace = (): void => {
    element('front').hidden = back;
    element('back').hidden = !back;
    flip.textContent = back ? 'Show front face' : 'Show back face';
    flip.setAttribute('aria-pressed', String(back));
  };
  const render = (value: unknown): void => {
    const manifest = record(value);
    const design = record(manifest?.design);
    const front = record(design?.front);
    const schema = record(manifest?.schema);
    const rear = record(schema?.back);
    if (!manifest || !front || !rear) {
      status.textContent = 'The tool did not return a FlipCard manifest.';
      return;
    }
    const name = typeof design?.category === 'string' ? design.category : 'teal';
    element('category').textContent = name;
    element('front-title').textContent = String(front.title ?? 'FlipCard');
    element('summary').textContent = String(front.summary ?? '');
    element('back-title').textContent = String(rear.title ?? 'Manifest');
    element('fields').textContent = JSON.stringify(rear.fields ?? [], null, 2);
    element('manifest').textContent = JSON.stringify(manifest, null, 2);
    title.value = String(front.title ?? '');
    category.value = name;
    flip.disabled = false;
    status.textContent = 'Card ready. Flip to inspect its contract, or generate another.';
    showFace();
  };
  const receive = (result: { isError?: boolean; structuredContent?: unknown }): void => {
    if (disposed) return;
    if (result.isError) {
      status.textContent = 'The server could not generate the card.';
      return;
    }
    render(record(result.structuredContent)?.manifest);
  };
  app.ontoolinput = params => {
    if (disposed) return;
    revision++;
    if (typeof params.arguments?.frontTitle === 'string') title.value = params.arguments.frontTitle;
    if (typeof params.arguments?.category === 'string') category.value = params.arguments.category;
    status.textContent = 'Generating card…';
  };
  app.ontoolresult = result => { revision++; receive(result); };
  app.ontoolcancelled = () => { revision++; status.textContent = 'Card generation cancelled.'; };
  app.onerror = error => { status.textContent = `Host error: ${error.message}`; };
  app.onhostcontextchanged = setTheme;
  app.onclose = deactivate;
  app.onteardown = async () => {
    deactivate();
    return {};
  };
  const onFlip = (): void => { back = !back; showFace(); };
  const onGenerate = (event: Event): void => {
    event.preventDefault();
    if (!connected || generate.disabled) return;
    const requestRevision = ++revision;
    generate.disabled = true;
    status.textContent = 'Generating card…';
    void app.callServerTool({
      name: 'generate_manifest',
      arguments: { frontTitle: title.value, category: category.value },
    }).then(result => {
      if (revision === requestRevision) receive(result);
    }, error => {
      if (disposed || revision !== requestRevision) return;
      status.textContent = error instanceof Error ? error.message : 'Generation failed.';
    }).finally(() => { generate.disabled = !connected; });
  };
  flip.addEventListener('click', onFlip);
  element<HTMLFormElement>('generate').addEventListener('submit', onGenerate);
  const connect = app.connect.bind(app);
  app.connect = async (...args: Parameters<App['connect']>) => {
    await connect(...args);
    if (disposed) return;
    connected = !!app.getHostCapabilities()?.serverTools;
    generate.disabled = !connected;
    setTheme(app.getHostContext() ?? {});
    if (status.textContent === 'Connecting to host…') status.textContent = connected
      ? 'Connected. Generate a card to begin.' : 'Connected. Waiting for a card from the host.';
  };
  const close = app.close.bind(app);
  app.close = async () => { deactivate(); await close(); };
  return app;
}
