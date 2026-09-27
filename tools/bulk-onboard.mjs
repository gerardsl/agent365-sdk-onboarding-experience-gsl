#!/usr/bin/env node
// Starts one herdr workspace per agent project and asks a coding CLI in each to run the
// Agent 365 onboarding, so several agents can be onboarded side by side.
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadManifest } from './prepare-workspace.mjs';

export const DEFAULT_PROMPT = 'Onboard this agent to Agent 365.';
export const STATE_FILE = '.a365-bulk-onboard.json';
export const EXIT = { ok: 0, usage: 2, partial: 3 };
export const DEFAULT_PARALLEL = 4;
const MAX_PARALLEL = 16;
const CLIS = ['copilot', 'claude'];

const HELP = `Usage: node tools/bulk-onboard.mjs <agents-file> [options]
       node tools/bulk-onboard.mjs <agents-file> --status
       node tools/bulk-onboard.mjs <agents-file> --send-prompt

  <agents-file>          One agent project folder per line. A short name may follow a comma:
                           C:\\src\\hr-agent, hr-agent
                         Blank lines and lines starting with # are ignored.
  --cli copilot|claude   CLI to start in each workspace (default: copilot).
  --prompt TEXT          What to ask each CLI (default: "${DEFAULT_PROMPT}").
  --parallel N           Agents handled at the same time, 1 to ${MAX_PARALLEL} (default: ${DEFAULT_PARALLEL}).
                         --parallel 1 handles them one after another.
  --install-kit          Copy this bundle's kit into folders that do not have it yet.
  --dry-run              Check everything and print the plan without starting anything.
  --status               Show each agent's state: working, blocked, done or idle.
  --send-prompt          Send the prompt to agents that started but were not prompted yet.

herdr must already be running: start it with "herdr" in another terminal.
Progress is recorded in ${STATE_FILE}, next to the agents file.
`;

export class UsageError extends Error {}

export function parseArgs(argv) {
  const o = { mode: 'start', cli: 'copilot', prompt: DEFAULT_PROMPT, installKit: false, dryRun: false, parallel: DEFAULT_PARALLEL };
  const value = (i, name) => {
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new UsageError(`${name} needs a value`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') o.mode = 'help';
    else if (a === '--status') o.mode = 'status';
    else if (a === '--send-prompt') o.mode = 'send-prompt';
    else if (a === '--install-kit') o.installKit = true;
    else if (a === '--dry-run') o.dryRun = true;
    else if (a === '--cli') {
      o.cli = value(i++, a);
      if (!CLIS.includes(o.cli)) throw new UsageError(`--cli takes ${CLIS.join(' or ')}`);
    }
    else if (a === '--prompt') {
      o.prompt = value(i++, a);
      if (!o.prompt.trim()) throw new UsageError('--prompt cannot be empty');
    }
    else if (a === '--parallel') {
      const text = value(i++, a);
      o.parallel = /^\d+$/.test(text) ? Number(text) : NaN;
      if (!(o.parallel >= 1 && o.parallel <= MAX_PARALLEL)) throw new UsageError(`--parallel takes a whole number from 1 to ${MAX_PARALLEL}`);
    }
    else if (a.startsWith('--')) throw new UsageError(`Unknown option: ${a}`);
    else if (o.listFile) throw new UsageError('Give one agents file.');
    else o.listFile = a;
  }
  if (o.mode !== 'help' && !o.listFile) throw new UsageError('Give the agents file. See --help.');
  return o;
}

export function agentName(raw) {
  let n = raw.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^[^a-z]+/, '').replace(/-+$/, '');
  if (!n) n = 'agent';
  return n.slice(0, 32).replace(/-+$/, '');
}

export function readAgents(listFile) {
  if (!fs.existsSync(listFile)) throw new UsageError(`Agents file not found: ${listFile}`);
  const base = path.dirname(path.resolve(listFile));
  const agents = [];
  const used = new Set();
  for (const [index, line] of fs.readFileSync(listFile, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    const text = line.trim();
    if (!text || text.startsWith('#')) continue;
    const comma = text.lastIndexOf(',');
    const folder = (comma > 0 ? text.slice(0, comma) : text).trim().replace(/^"(.*)"$/, '$1');
    const dir = path.resolve(base, folder);
    let name = agentName(comma > 0 ? text.slice(comma + 1).trim() : path.basename(dir));
    if (used.has(name)) {
      let n = 2;
      while (used.has(`${name.slice(0, 29)}-${n}`)) n++;
      name = `${name.slice(0, 29)}-${n}`;
    }
    used.add(name);
    agents.push({ name, dir, line: index + 1 });
  }
  if (!agents.length) throw new UsageError('The agents file lists no folders.');
  return agents;
}

// Asynchronous so several agents can wait on herdr at once. The result mapping matches the
// former spawnSync runner: a launch failure or timeout is 127, a signal without a status is 1.
function herdrRunner(args) {
  return new Promise(resolve => {
    execFile('herdr', args, { encoding: 'utf8', timeout: 330_000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && (typeof error.code === 'string' || error.killed)) resolve({ code: 127, stdout: '', stderr: error.message });
      else resolve({ code: error ? (error.code ?? 1) : 0, stdout: stdout ?? '', stderr: stderr ?? '' });
    });
  });
}

function json(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function herdrError(result) {
  const body = json(result.stderr) ?? json(result.stdout);
  return { code: body?.error?.code ?? `exit_${result.code}`, message: body?.error?.message ?? (result.stderr || result.stdout).trim() };
}

// herdr can report a CLI as ready while it is still updating itself, and text typed then is
// lost. With --wait, herdr fails with agent_prompt_stalled when the agent shows no activity
// within five seconds, and times out only after activity was seen.
export async function sendPrompt(herdr, name, prompt) {
  const r = await herdr(['agent', 'prompt', name, prompt, '--wait', '--timeout', '30000']);
  if (r.code === 0) return { sent: true };
  const e = herdrError(r);
  if (e.code === 'timeout') return { sent: true };
  if (e.code === 'agent_prompt_stalled') return { sent: false, note: 'request not confirmed; check the session, then --send-prompt' };
  if (e.code === 'agent_blocked') return { sent: false, note: 'waiting for you; answer it in herdr, then --send-prompt' };
  return { sent: false, note: `prompt failed: ${e.message}` };
}

function kitInstalled(dir) {
  return fs.existsSync(path.join(dir, '.a365-kit', 'KIT-VERSION.json'));
}

// The same integrity rule as prepare-workspace.mjs: every kit file must match the manifest.
export function installKit(bundleRoot, dir) {
  const manifest = loadManifest(bundleRoot);
  const files = manifest.files.filter(f => f.path.startsWith('kit/'));
  const plan = files.map(f => {
    const data = fs.readFileSync(path.join(bundleRoot, ...f.path.split('/')));
    if (data.length !== f.bytes || createHash('sha256').update(data).digest('hex') !== f.sha256) {
      throw new Error(`Bundle integrity check failed: ${f.path}`);
    }
    return { out: path.join(dir, ...f.path.split('/').slice(1)), data, mode: f.path === 'kit/agent365-kit.sh' ? 0o755 : 0o666 };
  });
  const clash = plan.find(p => fs.existsSync(p.out));
  if (clash) throw new Error(`${path.relative(dir, clash.out)} already exists; nothing was copied into ${dir}.`);
  const created = new Set();
  for (const p of plan) {
    const parent = path.dirname(p.out);
    if (!created.has(parent)) { fs.mkdirSync(parent, { recursive: true }); created.add(parent); }
    fs.writeFileSync(p.out, p.data, { flag: 'wx', mode: p.mode });
  }
  return plan.length;
}

// Runs worker(item, index) for every item, at most `limit` at a time; results keep item order.
async function eachLimited(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return results;
}

function statePath(listFile) {
  return path.join(path.dirname(path.resolve(listFile)), STATE_FILE);
}

function loadState(listFile) {
  const p = statePath(listFile);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : { agents: {} };
}

function saveState(listFile, state) {
  fs.writeFileSync(statePath(listFile), JSON.stringify(state, null, 2) + '\n');
}

function table(log, rows) {
  const w = [Math.max(5, ...rows.map(r => r[0].length)), Math.max(6, ...rows.map(r => r[1].length))];
  log(`${'Agent'.padEnd(w[0])}  ${'Pane'.padEnd(w[1])}  State`);
  for (const r of rows) log(`${r[0].padEnd(w[0])}  ${r[1].padEnd(w[1])}  ${r[2]}`);
}

export async function main(argv, deps = {}) {
  const log = deps.log ?? (s => process.stdout.write(s + '\n'));
  const err = deps.err ?? (s => process.stderr.write(s + '\n'));
  const herdr = deps.herdr ?? herdrRunner;
  const bundleRoot = deps.bundleRoot ?? path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  try {
    const o = parseArgs(argv);
    if (o.mode === 'help') { log(HELP); return EXIT.ok; }
    const agents = readAgents(o.listFile);
    const state = loadState(o.listFile);

    if (o.mode === 'status' || o.mode === 'send-prompt') {
      const outcomes = await eachLimited(agents, o.parallel, async a => {
        const s = state.agents[a.name];
        if (!s?.pane) return { row: [a.name, '-', 'not started'] };
        const got = await herdr(['agent', 'get', a.name]);
        const status = got.code === 0 ? json(got.stdout)?.result?.agent?.agent_status ?? 'unknown' : 'not running';
        if (o.mode === 'send-prompt' && !s.prompted && (status === 'idle' || status === 'done')) {
          const sent = await sendPrompt(herdr, a.name, o.prompt);
          if (sent.sent) { s.prompted = true; return { row: [a.name, s.pane, 'prompted'] }; }
          return { row: [a.name, s.pane, sent.note], failed: true };
        }
        const note = !s.prompted && status === 'blocked' ? ' (answer it in herdr, then --send-prompt)' : '';
        return { row: [a.name, s.pane, `${status}${s.prompted ? '' : ', not prompted'}${note}`] };
      });
      if (o.mode === 'send-prompt') saveState(o.listFile, state);
      table(log, outcomes.map(outcome => outcome.row));
      return outcomes.some(outcome => outcome.failed) ? EXIT.partial : EXIT.ok;
    }

    const problems = [];
    for (const a of agents) {
      if (!fs.existsSync(a.dir) || !fs.statSync(a.dir).isDirectory()) problems.push(`line ${a.line}: ${a.dir} is not a folder`);
      else if (!kitInstalled(a.dir) && !o.installKit) problems.push(`line ${a.line}: ${a.dir} has no kit (add --install-kit, or extract the kit there first)`);
      if (state.agents[a.name]?.pane) problems.push(`line ${a.line}: ${a.name} was already started (see --status)`);
    }
    const probe = await herdr(['workspace', 'list']);
    if (probe.code !== 0) {
      problems.push(probe.code === 127
        ? 'herdr is not installed or not on PATH. See docs/BULK-ONBOARDING.md.'
        : 'herdr is not running. Start it with "herdr" in another terminal, then run this again.');
    }
    if (problems.length) { for (const p of problems) err(p); err('Nothing was started.'); return EXIT.usage; }

    if (o.dryRun) {
      for (const a of agents) {
        log(`${a.name}: ${kitInstalled(a.dir) ? '' : 'install kit, '}workspace in ${a.dir}, start ${o.cli}, prompt "${o.prompt}"`);
      }
      log('Dry run: nothing was started.');
      return EXIT.ok;
    }

    const outcomes = await eachLimited(agents, o.parallel, async a => {
      const record = { dir: a.dir, cli: o.cli, prompted: false };
      const outcome = { record, registered: false };
      try {
        if (!kitInstalled(a.dir)) installKit(bundleRoot, a.dir);
        const created = await herdr(['workspace', 'create', '--cwd', a.dir, '--label', a.name, '--no-focus']);
        if (created.code !== 0) throw new Error(`workspace: ${herdrError(created).message}`);
        const result = json(created.stdout)?.result;
        record.workspace = result?.workspace?.workspace_id;
        record.pane = result?.root_pane?.pane_id;
        if (!record.pane) throw new Error('herdr did not return a pane id');
        outcome.registered = true;

        const started = await herdr(['agent', 'start', a.name, '--kind', o.cli, '--pane', record.pane, '--timeout', '120000']);
        if (started.code !== 0) {
          const e = herdrError(started);
          outcome.row = [a.name, record.pane, e.code === 'agent_not_ready'
            ? 'waiting for you (for example a folder trust question); then --send-prompt'
            : `CLI did not start: ${e.message}`];
          outcome.failed = e.code !== 'agent_not_ready';
          return outcome;
        }
        const sent = await sendPrompt(herdr, a.name, o.prompt);
        if (!sent.sent) {
          outcome.row = [a.name, record.pane, sent.note];
          outcome.failed = sent.note.startsWith('prompt failed');
          return outcome;
        }
        record.prompted = true;
        outcome.row = [a.name, record.pane, 'onboarding started'];
      } catch (e) {
        outcome.failed = true;
        outcome.row = [a.name, record.pane ?? '-', `failed: ${e.message}`];
      }
      return outcome;
    });
    agents.forEach((a, index) => { if (outcomes[index].registered) state.agents[a.name] = outcomes[index].record; });
    saveState(o.listFile, state);
    table(log, outcomes.map(outcome => outcome.row));
    log('');
    log('Attach with "herdr" to follow every onboarding. A blocked session is waiting for your answer.');
    log('Check progress any time with --status.');
    return outcomes.some(outcome => outcome.failed) ? EXIT.partial : EXIT.ok;
  } catch (e) {
    if (e instanceof UsageError) { err(e.message); return EXIT.usage; }
    err(e.message);
    return EXIT.usage;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code; });
}
