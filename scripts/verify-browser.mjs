import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdtemp, mkdir, open, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const script = process.argv[2] === 'expedition' ? 'scripts/verify-expedition.mjs' : 'scripts/verify-atlas.mjs';
if (process.env.MINERVA_URL) {
  const child = spawn(process.execPath, [script], { stdio: 'inherit' });
  const [code] = await once(child, 'exit');
  process.exitCode = code ?? 1;
} else {
  const dir = await mkdtemp(`${tmpdir()}/minerva-browser-`);
  const artifacts = resolve(process.env.MINERVA_ARTIFACTS ?? 'evaluation-artifacts/browser');
  await mkdir(artifacts, { recursive: true });
  const listener = createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const env = { ...process.env, MINERVA_URL: `http://127.0.0.1:${port}`, MINERVA_ARTIFACTS: artifacts,
    MINERVA_EXPERIMENT_DB: `${dir}/runs.sqlite`, MINERVA_EXPERIMENT_PROVIDER: 'fixture',
    EXPEDITION_DATABASE_URL: '', MINERVA_EXPERIMENT_LIVE: '0', VERCEL: '',
    AI_GATEWAY_API_KEY: '', VERCEL_OIDC_TOKEN: '', OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '',
    MINERVA_LIVE: '0', MINERVA_LIVE_TALK_MOVES: '0', MINERVA_WANDER_REGRESSION: '0' };
  const logs = await Promise.all(['server', 'worker'].map(name => open(`${artifacts}/${name}.log`, 'w')));
  const children = [];
  const start = (args, stdio) => {
    const child = spawn(process.execPath, args, { env, stdio });
    children.push(child);
    return child;
  };
  const stop = async () => {
    await Promise.all(children.map(async child => {
      if (child.exitCode !== null || child.signalCode) return;
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
      await exited;
      clearTimeout(timer);
    }));
  };
  const interrupt = () => { void stop(); };
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  try {
    const server = start(['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], ['ignore', logs[0].fd, logs[0].fd]);
    const deadline = Date.now() + 60000;
    let ready = false;
    while (Date.now() < deadline && server.exitCode === null) {
      try {
        const response = await fetch(`${env.MINERVA_URL}/api/expedition/runs`, { signal: AbortSignal.timeout(2000) });
        const settings = await response.json();
        if (response.ok && settings.configured && settings.limitMicros === 0) { ready = true; break; }
      } catch { /* Wait for the isolated server to bind. */ }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error(`Synthetic server unavailable. Run npm run build first.\n${await readFile(`${artifacts}/server.log`, 'utf8')}`);
    start(['scripts/expedition-worker.mjs'], ['ignore', logs[1].fd, logs[1].fd]);
    console.log(`Browser verification: isolated production server and synthetic worker at ${env.MINERVA_URL}`);
    for (const entry of ['scripts/verify-expedition-start.mjs', script]) {
      const replay = start([entry], 'inherit');
      const [code] = await once(replay, 'exit');
      process.exitCode = code ?? 1;
      if (process.exitCode) break;
    }
  } finally {
    await stop();
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    await Promise.all(logs.map(log => log.close()));
    await rm(dir, { recursive: true, force: true });
  }
}
