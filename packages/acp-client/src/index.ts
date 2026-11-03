import {
  client,
  ndJsonStream,
  PROTOCOL_VERSION,
  type AgentCapabilities,
  type ClientConnection,
  type ContentBlock,
  type Implementation,
  type InitializeResponse,
  type NewSessionRequest,
  type NewSessionResponse,
  type PromptResponse,
  type RequestPermissionRequest,
  type RequestPermissionResponse,
  type SessionNotification,
  type SessionUpdate,
  type StopReason,
} from '@agentclientprotocol/sdk';

export type {
  ContentBlock,
  InitializeResponse,
  McpServer,
  NewSessionRequest,
  NewSessionResponse,
  PermissionOption,
  PromptResponse,
  RequestPermissionRequest,
  RequestPermissionResponse,
  SessionNotification,
  SessionUpdate,
  StopReason,
} from '@agentclientprotocol/sdk';

export type AcpSessionStatus =
  'idle' | 'prompting' | 'cancelling' | 'error' | 'disconnected' | 'disposed';

/** A bounded, per-session protocol history suitable for a host's FlipCard renderer. */
export interface AcpSessionState {
  sessionId: string;
  cwd: string;
  status: AcpSessionStatus;
  turn: number;
  updates: readonly SessionUpdate[];
  droppedUpdates: number;
  pendingPermissions: readonly RequestPermissionRequest[];
  stopReason: StopReason | null;
  error: string | null;
}

export type AcpSessionEvent =
  | { type: 'state' }
  | { type: 'update'; notification: SessionNotification }
  | { type: 'permission-request'; request: RequestPermissionRequest }
  | {
      type: 'permission-response';
      request: RequestPermissionRequest;
      response: RequestPermissionResponse;
    }
  | { type: 'error'; error: unknown };

export interface AcpClientOptions {
  /** Agent stdout, or equivalent UTF-8 NDJSON input supplied by the host. */
  input: ReadableStream<Uint8Array>;
  /** Agent stdin, or equivalent UTF-8 NDJSON output supplied by the host. */
  output: WritableStream<Uint8Array>;
  clientInfo?: Implementation;
  /** Maximum retained updates per session; older updates are counted and evicted. Default: 1000. */
  maxUpdates?: number;
  /**
   * Return an offered optionId only after explicit user consent, or null to cancel.
   * No handler means cancellation, never automatic approval. Observe signal to dismiss UI.
   */
  onPermission?: (
    request: RequestPermissionRequest,
    context: { signal: AbortSignal },
  ) => string | null | Promise<string | null>;
}

export interface AcpSession {
  readonly id: string;
  readonly configuration: NewSessionResponse;
  /** Detached snapshot; mutating it cannot change the client or another session. */
  readonly state: AcpSessionState;
  /** Synchronous, isolated listeners; listener failures are recorded in state.error. */
  subscribe(listener: (state: AcpSessionState, event: AcpSessionEvent) => void): () => void;
  /** Only one turn may be active on a given session. Different sessions can run concurrently. */
  prompt(prompt: string | readonly ContentBlock[]): Promise<PromptResponse>;
  /** Send session/cancel, then await the actual session/prompt response, not a synthetic stop. */
  cancel(): Promise<PromptResponse | undefined>;
  /**
   * Gracefully cancel and await any turn, then detach this local session.
   * Does not delete saved sessions. Use client.dispose() to force a stuck agent to disconnect.
   */
  dispose(): Promise<void>;
}

export interface AcpClient {
  readonly initialization: InitializeResponse;
  readonly closed: Promise<void>;
  createSession(request: NewSessionRequest): Promise<AcpSession>;
  /**
   * Reject outstanding requests, abort permission UI, and release listeners and stream locks.
   * Initiates transport abortion without waiting for a stalled underlying writer.
   * The host remains responsible for terminating any agent subprocess.
   */
  dispose(): Promise<void>;
}

function isAbsolutePath(path: string): boolean {
  return (
    typeof path === 'string' &&
    !path.includes('\0') &&
    /^(?:\/|[a-zA-Z]:[\\/]|\\\\[^\\]+\\[^\\]+(?:\\|$))/.test(path)
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function choosePermission(
  handler: NonNullable<AcpClientOptions['onPermission']>,
  request: RequestPermissionRequest,
  signal: AbortSignal,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const abort = () => resolve(null);
    if (signal.aborted) {
      resolve(null);
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
    void Promise.resolve()
      .then(() => (signal.aborted ? null : handler(request, { signal })))
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort));
  });
}

class Session implements AcpSession {
  private status: AcpSessionStatus = 'idle';
  private turn = 0;
  private updates: SessionUpdate[] = [];
  private droppedUpdates = 0;
  private stopReason: StopReason | null = null;
  private error: string | null = null;
  private readonly permissions = new Map<symbol, RequestPermissionRequest>();
  private readonly listeners = new Set<(state: AcpSessionState, event: AcpSessionEvent) => void>();
  private active?: { completion: Promise<PromptResponse>; controller: AbortController };
  private disposing = false;
  private disposal?: Promise<void>;

  constructor(
    private readonly connection: ClientConnection,
    private readonly request: NewSessionRequest,
    private readonly response: NewSessionResponse,
    private readonly capabilities: AgentCapabilities,
    private readonly options: AcpClientOptions,
    private readonly detach: () => void,
  ) {}

  get id(): string {
    return this.response.sessionId;
  }

  get configuration(): NewSessionResponse {
    return structuredClone(this.response);
  }

  get state(): AcpSessionState {
    return structuredClone({
      sessionId: this.id,
      cwd: this.request.cwd,
      status: this.status,
      turn: this.turn,
      updates: this.updates,
      droppedUpdates: this.droppedUpdates,
      pendingPermissions: [...this.permissions.values()],
      stopReason: this.stopReason,
      error: this.error,
    });
  }

  subscribe(listener: (state: AcpSessionState, event: AcpSessionEvent) => void): () => void {
    this.assertAvailable();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: AcpSessionEvent = { type: 'state' }): void {
    for (const listener of [...this.listeners]) {
      if (!this.listeners.has(listener)) continue;
      try {
        listener(this.state, structuredClone(event));
      } catch (error) {
        // A renderer must not break permission handling or another session's cleanup.
        this.error = errorMessage(error);
      }
    }
  }

  private assertAvailable(): void {
    if (this.disposing || this.status === 'disposed' || this.connection.signal.aborted) {
      throw new Error('ACP session is disposed or disconnected');
    }
  }

  prompt(prompt: string | readonly ContentBlock[]): Promise<PromptResponse> {
    this.assertAvailable();
    if (this.active) {
      throw new Error('An ACP prompt is already active for this session');
    }
    const controller = new AbortController();
    const content: ContentBlock[] =
      typeof prompt === 'string' ? [{ type: 'text', text: prompt }] : structuredClone([...prompt]);
    for (const block of content) {
      const capability =
        block.type === 'resource'
          ? 'embeddedContext'
          : block.type === 'image' || block.type === 'audio'
            ? block.type
            : undefined;
      if (capability && !this.capabilities.promptCapabilities?.[capability]) {
        throw new Error(`Agent does not support ACP prompt capability: ${capability}`);
      }
    }
    this.status = 'prompting';
    this.stopReason = null;
    this.error = null;
    this.turn += 1;
    const completion = this.connection.agent
      .request('session/prompt', { sessionId: this.id, prompt: content })
      .then((response) => {
        const stopReasons: readonly StopReason[] = [
          'end_turn',
          'max_tokens',
          'max_turn_requests',
          'refusal',
          'cancelled',
        ];
        if (!response || !stopReasons.includes(response.stopReason)) {
          throw new Error('Agent returned an invalid ACP prompt stopReason');
        }
        return response;
      })
      .then(
        (response) => {
          this.active = undefined;
          controller.abort();
          this.permissions.clear();
          if (!this.connection.signal.aborted) {
            this.status = 'idle';
            this.stopReason = response.stopReason;
            this.emit();
          }
          return response;
        },
        (error: unknown) => {
          this.active = undefined;
          controller.abort();
          this.permissions.clear();
          if (!this.connection.signal.aborted) {
            this.status = 'error';
            this.error = errorMessage(error);
            this.emit({ type: 'error', error });
          }
          throw error;
        },
      );
    this.active = { completion, controller };
    void completion.catch(() => {});
    this.emit();
    return completion;
  }

  async cancel(): Promise<PromptResponse | undefined> {
    const active = this.active;
    if (!active) return undefined;
    if (this.status !== 'cancelling' && !this.connection.signal.aborted) {
      this.status = 'cancelling';
      active.controller.abort();
      this.emit();
      // SDK write failures close the connection and reject the outstanding turn.
      // Do not block settlement on a transport write that cannot complete.
      void this.connection.agent.notify('session/cancel', { sessionId: this.id }).catch(() => {});
    }
    return active.completion;
  }

  dispose(): Promise<void> {
    if (!this.disposal) {
      this.disposing = true;
      this.disposal = Promise.resolve().then(() => this.finishDisposal());
    }
    return this.disposal;
  }

  private async finishDisposal(): Promise<void> {
    try {
      await this.cancel();
    } finally {
      this.status = 'disposed';
      this.permissions.clear();
      this.detach();
      this.emit();
      this.listeners.clear();
    }
  }

  receive(notification: SessionNotification): void {
    if (this.status === 'disposed' || this.status === 'disconnected') return;
    this.updates.push(structuredClone(notification.update));
    if (this.updates.length > (this.options.maxUpdates ?? 1000)) {
      this.updates.shift();
      this.droppedUpdates += 1;
    }
    this.emit({ type: 'update', notification });
  }

  disconnect(): void {
    if (this.status === 'disposed') return;
    this.status = 'disconnected';
    this.error = errorMessage(this.connection.signal.reason ?? 'ACP connection closed');
    this.active?.controller.abort();
    this.permissions.clear();
    this.emit();
    this.listeners.clear();
  }

  async requestPermission(
    request: RequestPermissionRequest,
    requestSignal: AbortSignal,
  ): Promise<RequestPermissionResponse> {
    const cancelled: RequestPermissionResponse = { outcome: { outcome: 'cancelled' } };
    const active = this.active;
    if (!active || this.status !== 'prompting' || this.disposing) return cancelled;
    const signal = AbortSignal.any([
      active.controller.signal,
      this.connection.signal,
      requestSignal,
    ]);
    const key = Symbol();
    const storedRequest = structuredClone(request);
    this.permissions.set(key, storedRequest);
    this.emit({ type: 'permission-request', request: storedRequest });
    let response = cancelled;
    try {
      const optionId = this.options.onPermission
        ? await choosePermission(this.options.onPermission, structuredClone(request), signal)
        : null;
      if (optionId !== null && !signal.aborted) {
        if (!request.options.some((option) => option.optionId === optionId)) {
          throw new Error('Permission handler returned an optionId not offered by the agent');
        }
        response = { outcome: { outcome: 'selected', optionId } };
      }
    } catch (error) {
      // Handler failures are explicitly surfaced, but must never grant tool execution.
      this.error = errorMessage(error);
      this.emit({ type: 'error', error });
    } finally {
      this.permissions.delete(key);
      this.emit({ type: 'permission-response', request: storedRequest, response });
    }
    return response;
  }
}

/**
 * Connect to an actual ACP v1 agent over host-owned streams. This does not spawn a
 * process or make browser stdio available; the host supplies and owns that transport.
 * Filesystem, terminal and elicitation capabilities are intentionally not advertised.
 */
export async function connectAcp(options: AcpClientOptions): Promise<AcpClient> {
  if (
    options.maxUpdates !== undefined &&
    (!Number.isSafeInteger(options.maxUpdates) || options.maxUpdates < 1)
  ) {
    throw new Error('maxUpdates must be a positive safe integer');
  }
  options = { ...options };
  const sessions = new Map<string, Session>();
  const outputWriter = options.output.getWriter();
  const output = new WritableStream<Uint8Array>({
    write: (chunk) => outputWriter.write(chunk),
  });
  const connection = client()
    .onNotification('session/update', ({ params }) => {
      sessions.get(params.sessionId)?.receive(params);
    })
    .onRequest('session/request_permission', ({ params, signal }) => {
      return (
        sessions.get(params.sessionId)?.requestPermission(params, signal) ?? {
          outcome: { outcome: 'cancelled' as const },
        }
      );
    })
    .connect(ndJsonStream(output, options.input));
  // SDK close cancels its input reader, but does not close the underlying output.
  const closed = connection.closed.then(() => {
    // WritableStream.abort waits for in-flight writes, which may never settle.
    // Local lifecycle settlement must not depend on a cooperative transport.
    void outputWriter.abort(connection.signal.reason).catch(() => {});
    outputWriter.releaseLock();
  });
  connection.signal.addEventListener(
    'abort',
    () => {
      for (const session of sessions.values()) session.disconnect();
      sessions.clear();
    },
    { once: true },
  );
  let initialization: InitializeResponse;
  try {
    initialization = await connection.agent.request('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      clientCapabilities: {},
      clientInfo: options.clientInfo ?? { name: 'flipcard-acp', version: '0.1.0' },
    });
    if (initialization.protocolVersion !== PROTOCOL_VERSION) {
      throw new Error(`Unsupported ACP protocol version: ${initialization.protocolVersion}`);
    }
  } catch (error) {
    connection.close(error);
    await closed;
    throw error;
  }
  return {
    get initialization() {
      return structuredClone(initialization);
    },
    closed,
    async createSession(request) {
      if (connection.signal.aborted) throw new Error('ACP client is disconnected');
      if (
        !isAbsolutePath(request.cwd) ||
        request.additionalDirectories?.some((path) => !isAbsolutePath(path))
      ) {
        throw new Error('ACP session paths must be absolute');
      }
      const payload = structuredClone(request);
      for (const server of payload.mcpServers) {
        if ('type' in server && !initialization.agentCapabilities?.mcpCapabilities?.[server.type]) {
          throw new Error(`Agent does not support ACP MCP transport: ${server.type}`);
        }
      }
      const response = await connection.agent.request('session/new', payload);
      if (connection.signal.aborted) throw new Error('ACP client is disconnected');
      if (!response || typeof response.sessionId !== 'string' || !response.sessionId) {
        throw new Error('Agent returned an invalid ACP sessionId');
      }
      if (sessions.has(response.sessionId)) {
        throw new Error('Agent returned a duplicate ACP sessionId');
      }
      const session = new Session(
        connection,
        payload,
        response,
        initialization.agentCapabilities ?? {},
        options,
        () => {
          sessions.delete(response.sessionId);
        },
      );
      sessions.set(response.sessionId, session);
      return session;
    },
    async dispose() {
      connection.close(new Error('ACP client disposed'));
      await closed;
    },
  };
}
