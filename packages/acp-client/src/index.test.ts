// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  agent,
  ndJsonStream,
  PROTOCOL_VERSION,
  type AgentCapabilities,
  type AgentRequestContext,
  type InitializeRequest,
  type NewSessionRequest,
  type NewSessionResponse,
  type PromptRequest,
  type PromptResponse,
  type RequestPermissionRequest,
  type RequestPermissionResponse,
} from '@agentclientprotocol/sdk';
import { connectAcp, type AcpClientOptions, type AcpSessionEvent } from './index';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const cleanup: Array<() => Promise<void> | void> = [];
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close();
});

type PromptHandler = (
  context: AgentRequestContext<PromptRequest>,
) => Promise<PromptResponse> | PromptResponse;

function fixture(
  onPrompt: PromptHandler = () => ({ stopReason: 'end_turn' }),
  onCancel: (sessionId: string) => void = () => {},
  version = PROTOCOL_VERSION,
  capabilities: AgentCapabilities = { promptCapabilities: { image: true } },
  onNewSession?: (request: NewSessionRequest) => NewSessionResponse | Promise<NewSessionResponse>,
) {
  const toAgent = new TransformStream<Uint8Array>();
  const toClient = new TransformStream<Uint8Array>();
  const initializations: InitializeRequest[] = [];
  const newSessions: NewSessionRequest[] = [];
  const cancellations: string[] = [];
  const connection = agent()
    .onRequest('initialize', ({ params }) => {
      initializations.push(params);
      return {
        protocolVersion: version,
        agentInfo: { name: 'fixture-agent', version: '1.0.0' },
        agentCapabilities: capabilities,
      };
    })
    .onRequest('session/new', ({ params }) => {
      newSessions.push(params);
      return onNewSession?.(params) ?? { sessionId: `session-${newSessions.length}` };
    })
    .onRequest('session/prompt', onPrompt)
    .onNotification('session/cancel', ({ params }) => {
      cancellations.push(params.sessionId);
      onCancel(params.sessionId);
    })
    .connect(ndJsonStream(toClient.writable, toAgent.readable));
  cleanup.push(() => connection.close());
  return {
    connection,
    initializations,
    newSessions,
    cancellations,
    input: toClient.readable,
    output: toAgent.writable,
    async disconnect() {
      const writer = toClient.writable.getWriter();
      try {
        await writer.close();
      } finally {
        writer.releaseLock();
      }
    },
    async connect(options: Partial<AcpClientOptions> = {}) {
      const client = await connectAcp({
        input: toClient.readable,
        output: toAgent.writable,
        ...options,
      });
      cleanup.push(() => client.dispose());
      return client;
    },
  };
}

function permission(sessionId: string): RequestPermissionRequest {
  return {
    sessionId,
    toolCall: { toolCallId: 'tool-1', title: 'Run tests', kind: 'execute' },
    options: [
      { optionId: 'choice-deny-927', name: 'Deny', kind: 'reject_once' },
      { optionId: 'choice-allow-382', name: 'Allow once', kind: 'allow_once' },
    ],
  };
}

describe('ACP v1 NDJSON client', () => {
  it('negotiates wire v1 without advertising unsupported host capabilities', async () => {
    const server = fixture();
    const client = await server.connect();
    expect(server.initializations).toEqual([
      {
        protocolVersion: 1,
        clientCapabilities: {
          auth: { terminal: false },
          fs: { readTextFile: false, writeTextFile: false },
          terminal: false,
        },
        clientInfo: { name: 'flipcard-acp', version: '0.1.0' },
      },
    ]);
    expect(client.initialization.agentInfo?.name).toBe('fixture-agent');
    const request: NewSessionRequest = {
      cwd: 'C:\\workspace',
      mcpServers: [{ name: 'tools', command: 'node', args: ['server.js'], env: [] }],
    };
    const session = await client.createSession(request);
    expect(server.newSessions).toEqual([request]);
    expect(session.state).toMatchObject({ cwd: request.cwd, status: 'idle', turn: 0 });
    await expect(client.createSession({ cwd: 'relative', mcpServers: [] })).rejects.toThrow(
      'absolute',
    );
    await expect(client.createSession({ cwd: 'C:relative', mcpServers: [] })).rejects.toThrow(
      'absolute',
    );
    await expect(
      client.createSession({
        cwd: '/absolute',
        additionalDirectories: ['relative'],
        mcpServers: [],
      }),
    ).rejects.toThrow('absolute');
    expect(server.newSessions).toHaveLength(1);
  });

  it('rejects incompatible versions and closes the failed connection', async () => {
    const server = fixture(undefined, undefined, 999);
    await expect(server.connect()).rejects.toThrow('Unsupported ACP protocol version: 999');
    await server.connection.closed;
    expect(server.newSessions).toEqual([]);
  });

  it('streams real session updates before the final prompt response with bounded snapshots', async () => {
    const received = deferred<void>();
    const finish = deferred<PromptResponse>();
    const server = fixture(async ({ client, params }) => {
      expect(params.prompt).toEqual([{ type: 'text', text: 'Hello' }]);
      for (const text of ['one', 'two', 'three']) {
        await client.notify('session/update', {
          sessionId: params.sessionId,
          update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text } },
        });
      }
      received.resolve();
      return finish.promise;
    });
    const client = await server.connect({ maxUpdates: 2 });
    const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
    const events: AcpSessionEvent[] = [];
    session.subscribe((_state, event) => events.push(event));
    const turn = session.prompt('Hello');
    await received.promise;
    await vi.waitFor(() => expect(session.state.updates).toHaveLength(2));
    expect(session.state).toMatchObject({
      status: 'prompting',
      turn: 1,
      droppedUpdates: 1,
      stopReason: null,
    });
    expect(events.filter((event) => event.type === 'update')).toHaveLength(3);
    const snapshot = session.state;
    (snapshot.updates as unknown[]).length = 0;
    expect(session.state.updates).toHaveLength(2);
    expect(() => session.prompt('overlap')).toThrow('already active');
    finish.resolve({ stopReason: 'end_turn' });
    await expect(turn).resolves.toEqual({ stopReason: 'end_turn' });
    expect(session.state).toMatchObject({ status: 'idle', stopReason: 'end_turn' });
  });

  it('keeps concurrent sessions isolated, including tools and permission callbacks', async () => {
    const requests: string[] = [];
    const server = fixture(async ({ params, client }) => {
      const text = params.sessionId;
      await client.notify('session/update', {
        sessionId: params.sessionId,
        update: { sessionUpdate: 'tool_call', toolCallId: text, title: text },
      });
      const response = await client.request(
        'session/request_permission',
        permission(params.sessionId),
      );
      expect(response.outcome).toEqual({ outcome: 'selected', optionId: 'choice-deny-927' });
      return { stopReason: 'end_turn' };
    });
    const client = await server.connect({
      onPermission: (request) => {
        requests.push(request.sessionId);
        return request.options[0]!.optionId;
      },
    });
    const a = await client.createSession({ cwd: '/a', mcpServers: [] });
    const b = await client.createSession({ cwd: '/b', mcpServers: [] });
    await Promise.all([a.prompt('A'), b.prompt('B')]);
    expect(requests.sort()).toEqual([a.id, b.id]);
    expect(a.state.updates).toMatchObject([{ toolCallId: a.id }]);
    expect(b.state.updates).toMatchObject([{ toolCallId: b.id }]);
    expect(a.state.pendingPermissions).toEqual([]);
    expect(b.state.pendingPermissions).toEqual([]);
  });

  it.each([
    ['no callback', undefined, { outcome: 'cancelled' }],
    ['explicit cancellation', (): null => null, { outcome: 'cancelled' }],
    [
      'explicit consent',
      (): string => 'choice-allow-382',
      { outcome: 'selected', optionId: 'choice-allow-382' },
    ],
    ['invented option ID', (): string => 'allow_once', { outcome: 'cancelled' }],
    [
      'mutated options',
      (request: RequestPermissionRequest): string => {
        request.options.push({ optionId: 'invented', name: 'Approve', kind: 'allow_always' });
        return 'invented';
      },
      { outcome: 'cancelled' },
    ],
    [
      'failing callback',
      () => {
        throw new Error('UI failed');
      },
      { outcome: 'cancelled' },
    ],
  ] as const)('handles permissions safely: %s', async (_label, onPermission, expected) => {
    let response: RequestPermissionResponse | undefined;
    const server = fixture(async ({ params, client }) => {
      response = await client.request('session/request_permission', permission(params.sessionId));
      return { stopReason: 'end_turn' };
    });
    const client = await server.connect({ onPermission });
    const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
    await session.prompt('test');
    expect(response?.outcome).toEqual(expected);
    expect(session.state.pendingPermissions).toEqual([]);
    if (_label === 'invented option ID') {
      expect(session.state.error).toContain('not offered');
    }
    if (_label === 'failing callback') expect(session.state.error).toBe('UI failed');
  });

  it('cancels pending permission UI but waits for the real terminal response and trailing updates', async () => {
    const asked = deferred<void>();
    const cancelled = deferred<void>();
    const permissionResult = deferred<RequestPermissionResponse>();
    const decision = deferred<string | null>();
    const finish = deferred<PromptResponse>();
    let uiSignal: AbortSignal | undefined;
    const server = fixture(
      async ({ client, params }) => {
        permissionResult.resolve(
          await client.request('session/request_permission', permission(params.sessionId)),
        );
        await client.notify('session/update', {
          sessionId: params.sessionId,
          update: {
            sessionUpdate: 'agent_message_chunk',
            content: { type: 'text', text: 'Stopping safely' },
          },
        });
        return finish.promise;
      },
      () => cancelled.resolve(),
    );
    const client = await server.connect({
      onPermission: (_request, { signal }) => {
        uiSignal = signal;
        asked.resolve();
        return decision.promise;
      },
    });
    const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
    const turn = session.prompt('test');
    await asked.promise;
    let settled = false;
    const cancellation = session.cancel().then((result) => {
      settled = true;
      return result;
    });
    await cancelled.promise;
    expect(uiSignal?.aborted).toBe(true);
    expect(await permissionResult.promise).toEqual({ outcome: { outcome: 'cancelled' } });
    await vi.waitFor(() => expect(session.state.updates).toHaveLength(1));
    expect(settled).toBe(false);
    expect(session.state.status).toBe('cancelling');
    expect(session.state.stopReason).toBeNull();
    decision.resolve('choice-allow-382');
    finish.resolve({ stopReason: 'cancelled' });
    await expect(cancellation).resolves.toEqual({ stopReason: 'cancelled' });
    await expect(turn).resolves.toEqual({ stopReason: 'cancelled' });
    expect(session.state).toMatchObject({ status: 'idle', stopReason: 'cancelled' });
  });

  it('denies unknown-session permissions and ignores their updates', async () => {
    const handler = vi.fn(() => 'choice-allow-382');
    const server = fixture();
    const client = await server.connect({ onPermission: handler });
    const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
    await server.connection.client.notify('session/update', {
      sessionId: 'unknown',
      update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'wrong' } },
    });
    const result = await server.connection.client.request(
      'session/request_permission',
      permission('unknown'),
    );
    expect(result.outcome).toEqual({ outcome: 'cancelled' });
    expect(handler).not.toHaveBeenCalled();
    expect(session.state.updates).toEqual([]);
  });

  it('does not convert an agent error into successful completion', async () => {
    const server = fixture(() => {
      throw new Error('agent failed');
    });
    const client = await server.connect();
    const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
    await expect(session.prompt('fail')).rejects.toThrow('Internal error');
    expect(session.state).toMatchObject({ status: 'error', stopReason: null });
  });

  it('cleans up active turns and permission callbacks when the agent disconnects', async () => {
    const asked = deferred<void>();
    let uiSignal: AbortSignal | undefined;
    const server = fixture(async ({ client, params }) => {
      await client.request('session/request_permission', permission(params.sessionId));
      return { stopReason: 'end_turn' };
    });
    const client = await server.connect({
      onPermission: (_request, { signal }) => {
        uiSignal = signal;
        asked.resolve();
        return new Promise(() => {});
      },
    });
    const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
    const turn = session.prompt('test');
    const rejection = expect(turn).rejects.toThrow();
    await asked.promise;
    await server.disconnect();
    await client.closed;
    await rejection;
    expect(uiSignal?.aborted).toBe(true);
    expect(session.state).toMatchObject({
      status: 'disconnected',
      stopReason: null,
      pendingPermissions: [],
    });
    expect(() => session.prompt('again')).toThrow('disconnected');
  });

  it('disposes one session without disconnecting the others or retaining subscriptions', async () => {
    const server = fixture();
    const client = await server.connect();
    const a = await client.createSession({ cwd: '/a', mcpServers: [] });
    const b = await client.createSession({ cwd: '/b', mcpServers: [] });
    const listener = vi.fn();
    a.subscribe(listener);
    await a.dispose();
    const calls = listener.mock.calls.length;
    await server.connection.client.notify('session/update', {
      sessionId: a.id,
      update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'late' } },
    });
    await b.prompt('still active');
    expect(a.state.status).toBe('disposed');
    expect(a.state.updates).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(calls);
    expect(() => a.prompt('disposed')).toThrow('disposed');
    await client.dispose();
    expect(b.state.status).toBe('disconnected');
  });

  it('only sends optional prompt content and MCP transports negotiated by the agent', async () => {
    const prompts: PromptRequest[] = [];
    const server = fixture(({ params }) => {
      prompts.push(params);
      return { stopReason: 'end_turn' };
    });
    const client = await server.connect();
    const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
    const image = { type: 'image', data: 'aGVsbG8=', mimeType: 'image/png' } as const;
    await session.prompt([image]);
    expect(prompts[0]?.prompt).toEqual([image]);
    expect(() => session.prompt([{ type: 'audio', data: 'aA==', mimeType: 'audio/wav' }])).toThrow(
      'audio',
    );
    expect(() =>
      session.prompt([
        {
          type: 'resource',
          resource: { uri: 'file:///workspace/a.txt', text: 'context' },
        },
      ]),
    ).toThrow('embeddedContext');
    expect(session.state.turn).toBe(1);
    await expect(
      client.createSession({
        cwd: '/workspace',
        mcpServers: [
          { type: 'http', name: 'remote', url: 'https://example.test/mcp', headers: [] },
        ],
      }),
    ).rejects.toThrow('MCP transport: http');
    expect(server.newSessions).toHaveLength(1);

    const capable = fixture(undefined, undefined, PROTOCOL_VERSION, {
      mcpCapabilities: { http: true, sse: true },
      promptCapabilities: { audio: true, embeddedContext: true },
    });
    const capableClient = await capable.connect();
    const request: NewSessionRequest = {
      cwd: '\\\\server\\share\\workspace',
      additionalDirectories: ['C:\\other'],
      mcpServers: [
        { type: 'http', name: 'http', url: 'https://example.test/mcp', headers: [] },
        { type: 'sse', name: 'sse', url: 'https://example.test/sse', headers: [] },
      ],
    };
    const capableSession = await capableClient.createSession(request);
    expect(capable.newSessions).toEqual([request]);
    await capableSession.prompt([
      { type: 'audio', data: 'aA==', mimeType: 'audio/wav' },
      { type: 'resource', resource: { uri: 'file:///workspace/a.txt', text: 'context' } },
    ]);
  });

  it('isolates caller mutations of initialization, configuration, and session requests', async () => {
    const server = fixture();
    const client = await server.connect();
    client.initialization.protocolVersion = 999;
    expect(client.initialization.protocolVersion).toBe(PROTOCOL_VERSION);
    const request = { cwd: '/original', mcpServers: [] };
    const creating = client.createSession(request);
    request.cwd = '/mutated';
    const session = await creating;
    session.configuration.sessionId = 'mutated';
    expect(session.id).toBe('session-1');
    expect(session.state.cwd).toBe('/original');
    expect(server.newSessions[0]?.cwd).toBe('/original');
  });

  it('rejects duplicate or empty session identifiers without replacing live sessions', async () => {
    const server = fixture(undefined, undefined, PROTOCOL_VERSION, {}, () => ({
      sessionId: 'same',
    }));
    const client = await server.connect();
    const session = await client.createSession({ cwd: '/one', mcpServers: [] });
    await expect(client.createSession({ cwd: '/two', mcpServers: [] })).rejects.toThrow(
      'duplicate',
    );
    await server.connection.client.notify('session/update', {
      sessionId: 'same',
      update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'original' } },
    });
    await session.prompt('still usable');
    expect(session.state.updates).toHaveLength(1);
    const invalid = fixture(undefined, undefined, PROTOCOL_VERSION, {}, () => ({ sessionId: '' }));
    const invalidClient = await invalid.connect();
    await expect(invalidClient.createSession({ cwd: '/one', mcpServers: [] })).rejects.toThrow(
      'invalid ACP sessionId',
    );
  });

  it('gracefully disposes an active session only after its real final response', async () => {
    const started = deferred<void>();
    const finish = deferred<PromptResponse>();
    const server = fixture(({ params }) => {
      if (params.sessionId === 'session-1') {
        started.resolve();
        return finish.promise;
      }
      return { stopReason: 'end_turn' };
    });
    const client = await server.connect();
    const a = await client.createSession({ cwd: '/a', mcpServers: [] });
    const b = await client.createSession({ cwd: '/b', mcpServers: [] });
    const turn = a.prompt('long turn');
    await started.promise;
    const cancellation = a.cancel();
    const disposed = a.dispose();
    expect(a.dispose()).toBe(disposed);
    let settled = false;
    void disposed.then(() => {
      settled = true;
    });
    await b.prompt('independent');
    expect(server.cancellations).toEqual([a.id]);
    expect(settled).toBe(false);
    expect(() => a.prompt('too late')).toThrow('disposed');
    finish.resolve({ stopReason: 'cancelled' });
    await expect(turn).resolves.toEqual({ stopReason: 'cancelled' });
    await expect(cancellation).resolves.toEqual({ stopReason: 'cancelled' });
    await disposed;
    expect(a.state).toMatchObject({ status: 'disposed', stopReason: 'cancelled' });
    await b.prompt('still independent');
  });

  it('settles prompts, cancellation, and session disposal when the whole client is disposed', async () => {
    const started = deferred<void>();
    const server = fixture(() => {
      started.resolve();
      return new Promise(() => {});
    });
    const client = await server.connect();
    const a = await client.createSession({ cwd: '/a', mcpServers: [] });
    const b = await client.createSession({ cwd: '/b', mcpServers: [] });
    const turnA = expect(a.prompt('A')).rejects.toThrow('disposed');
    const turnB = expect(b.prompt('B')).rejects.toThrow('disposed');
    await started.promise;
    const cancellation = expect(a.cancel()).rejects.toThrow('disposed');
    const disposal = expect(a.dispose()).rejects.toThrow('disposed');
    await client.dispose();
    await Promise.all([turnA, turnB, cancellation, disposal]);
    expect(a.state.status).toBe('disposed');
    expect(b.state.status).toBe('disconnected');
    await expect(client.createSession({ cwd: '/later', mcpServers: [] })).rejects.toThrow(
      'disconnected',
    );
    expect(server.output.locked).toBe(false);
  });

  it('keeps disposal idempotent when a state observer re-enters it', async () => {
    const finish = deferred<PromptResponse>();
    const server = fixture(
      () => finish.promise,
      () => finish.resolve({ stopReason: 'cancelled' }),
    );
    const client = await server.connect();
    const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
    const turn = session.prompt('test');
    let nested: Promise<void> | undefined;
    session.subscribe((state) => {
      if (state.status === 'cancelling') nested = session.dispose();
    });
    const disposal = session.dispose();
    await disposal;
    await turn;
    expect(nested).toBe(disposal);
    expect(server.cancellations).toEqual([session.id]);
  });

  it('rejects a pending session creation when disconnected', async () => {
    const requested = deferred<void>();
    const server = fixture(undefined, undefined, PROTOCOL_VERSION, {}, () => {
      requested.resolve();
      return new Promise(() => {});
    });
    const client = await server.connect();
    const creating = expect(
      client.createSession({ cwd: '/pending', mcpServers: [] }),
    ).rejects.toThrow('disposed');
    await requested.promise;
    await client.dispose();
    await creating;
  });

  it('does not let throwing observers break streaming, permission denial, or disconnect cleanup', async () => {
    let decision: RequestPermissionResponse | undefined;
    const server = fixture(async ({ client, params }) => {
      await client.notify('session/update', {
        sessionId: params.sessionId,
        update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'hello' } },
      });
      decision = await client.request('session/request_permission', permission(params.sessionId));
      return { stopReason: 'end_turn' };
    });
    const client = await server.connect();
    const a = await client.createSession({ cwd: '/a', mcpServers: [] });
    const b = await client.createSession({ cwd: '/b', mcpServers: [] });
    const observed = vi.fn();
    a.subscribe(() => {
      throw new Error('renderer failed');
    });
    a.subscribe(observed);
    await expect(a.prompt('test')).resolves.toEqual({ stopReason: 'end_turn' });
    expect(a.state.error).toBe('renderer failed');
    expect(observed).toHaveBeenCalled();
    expect(decision?.outcome).toEqual({ outcome: 'cancelled' });
    await client.dispose();
    expect(a.state.status).toBe('disconnected');
    expect(b.state.status).toBe('disconnected');
  });

  it('aborts permission UI when the agent cancels its permission request', async () => {
    const asked = deferred<void>();
    const decision = deferred<RequestPermissionResponse>();
    let uiSignal: AbortSignal | undefined;
    const server = fixture(async ({ client, params }) => {
      const cancellation = new AbortController();
      const response = client.request('session/request_permission', permission(params.sessionId), {
        cancellationSignal: cancellation.signal,
      });
      await asked.promise;
      cancellation.abort();
      decision.resolve(await response);
      return { stopReason: 'end_turn' };
    });
    const client = await server.connect({
      onPermission: (_request, { signal }) => {
        uiSignal = signal;
        asked.resolve();
        return new Promise(() => {});
      },
    });
    const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
    await session.prompt('test');
    expect(uiSignal?.aborted).toBe(true);
    expect(await decision.promise).toEqual({ outcome: { outcome: 'cancelled' } });
    expect(session.state.pendingPermissions).toEqual([]);
  });

  it('settles a cancelled turn on disposal even with a stalled transport write', async () => {
    const started = deferred<void>();
    const stalled = deferred<void>();
    const release = deferred<void>();
    let blocked = false;
    const server = fixture(() => {
      started.resolve();
      return new Promise(() => {});
    });
    const output = new WritableStream<Uint8Array>({
      async write(chunk) {
        if (blocked) {
          stalled.resolve();
          await release.promise;
          return;
        }
        const writer = server.output.getWriter();
        try {
          await writer.write(chunk);
        } finally {
          writer.releaseLock();
        }
      },
      abort: (reason) => server.output.abort(reason),
    });
    cleanup.push(() => release.resolve());
    const client = await server.connect({ output });
    const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
    const turn = expect(session.prompt('wait')).rejects.toThrow('disposed');
    await started.promise;
    blocked = true;
    const cancellation = expect(session.cancel()).rejects.toThrow('disposed');
    await stalled.promise;
    await client.dispose();
    await Promise.all([turn, cancellation]);
    expect(output.locked).toBe(false);
    expect(session.state.status).toBe('disconnected');
    release.resolve();
    await server.connection.closed;
  });

  it.each(['null', '{}', '{"stopReason":"invented"}'])(
    'rejects malformed terminal wire responses and permits a later turn: %s',
    async (json) => {
      let first = true;
      const server = fixture(() => {
        if (first) {
          first = false;
          // Deliberately send an invalid JSON-RPC result through the real SDK transport.
          return JSON.parse(json);
        }
        return { stopReason: 'end_turn' };
      });
      const client = await server.connect();
      const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
      await expect(session.prompt('invalid')).rejects.toThrow('invalid ACP prompt stopReason');
      expect(session.state).toMatchObject({ status: 'error', stopReason: null });
      await expect(session.prompt('retry')).resolves.toEqual({ stopReason: 'end_turn' });
      expect(session.state).toMatchObject({ status: 'idle', turn: 2, error: null });
    },
  );

  it('uses the real terminal reason even when a cancellation races successful completion', async () => {
    const started = deferred<void>();
    const finish = deferred<PromptResponse>();
    const server = fixture(
      () => {
        started.resolve();
        return finish.promise;
      },
      () => finish.resolve({ stopReason: 'end_turn' }),
    );
    const client = await server.connect();
    const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
    await expect(session.cancel()).resolves.toBeUndefined();
    const turn = session.prompt('test');
    await started.promise;
    await expect(session.cancel()).resolves.toEqual({ stopReason: 'end_turn' });
    await expect(turn).resolves.toEqual({ stopReason: 'end_turn' });
    expect(session.state.stopReason).toBe('end_turn');
  });

  it('denies permission requests on idle sessions without invoking the host', async () => {
    const handler = vi.fn(() => 'choice-allow-382');
    const server = fixture();
    const client = await server.connect({ onPermission: handler });
    const session = await client.createSession({ cwd: '/workspace', mcpServers: [] });
    const response = await server.connection.client.request(
      'session/request_permission',
      permission(session.id),
    );
    expect(response.outcome).toEqual({ outcome: 'cancelled' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('settles all sessions when an output write fails', async () => {
    let failed = false;
    const server = fixture();
    const output = new WritableStream<Uint8Array>({
      async write(chunk) {
        if (failed) throw new Error('transport failed');
        const writer = server.output.getWriter();
        try {
          await writer.write(chunk);
        } finally {
          writer.releaseLock();
        }
      },
    });
    const client = await server.connect({ output });
    const a = await client.createSession({ cwd: '/a', mcpServers: [] });
    const b = await client.createSession({ cwd: '/b', mcpServers: [] });
    failed = true;
    const turns = [
      expect(a.prompt('A')).rejects.toThrow('transport failed'),
      expect(b.prompt('B')).rejects.toThrow('transport failed'),
    ];
    await client.closed;
    await Promise.all(turns);
    expect(a.state.status).toBe('disconnected');
    expect(b.state.status).toBe('disconnected');
    expect(output.locked).toBe(false);
  });

  it.each([0, -1, 0.5, Number.POSITIVE_INFINITY, Number.NaN])(
    'rejects an invalid update bound before taking ownership of streams: %s',
    async (maxUpdates) => {
      const input = new ReadableStream<Uint8Array>();
      const output = new WritableStream<Uint8Array>();
      await expect(connectAcp({ input, output, maxUpdates })).rejects.toThrow(
        'positive safe integer',
      );
      expect(input.locked).toBe(false);
      expect(output.locked).toBe(false);
    },
  );
});
