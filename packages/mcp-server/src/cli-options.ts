import { validateLocalHost } from './http.js';

export function parseCliArgs(args: string[]): { transport: 'stdio' | 'http'; host: string; port: number; help: boolean } {
  const options = { transport: 'stdio' as 'stdio' | 'http', host: '127.0.0.1', port: 3000, help: false };
  const seen = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    const key = args[i]!;
    if (key === '--help') {
      options.help = true;
      continue;
    }
    if (!['--transport', '--host', '--port'].includes(key) || seen.has(key)) {
      throw new Error(`Unknown or repeated argument: ${key}`);
    }
    seen.add(key);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    if (key === '--transport') {
      if (value !== 'stdio' && value !== 'http') throw new Error('Transport must be stdio or http.');
      options.transport = value;
    } else if (key === '--host') {
      validateLocalHost(value);
      options.host = value;
    } else {
      if (!/^[0-9]+$/.test(value) || Number(value) < 1 || Number(value) > 65535) throw new Error('Port must be an integer from 1 to 65535.');
      options.port = Number(value);
    }
  }
  if (options.transport === 'stdio' && (seen.has('--host') || seen.has('--port'))) {
    throw new Error('--host and --port require --transport http.');
  }
  return options;
}
