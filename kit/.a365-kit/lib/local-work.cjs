'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');

const SCHEMA = 1;
const DETECTION_FILE = '.a365-workspace-detection.local.json';
const GENERATED = new Set(['node_modules', 'bin', 'obj', 'dist', 'out', 'target', '.venv', 'venv', 'deps', '__pycache__']);
const DEPENDENCIES = new Set(['node_modules', '.venv', 'venv', 'deps']);
const KIT_DIRS = new Set(['.a365-kit', '.agents', '.claude']);
const LOCAL_FIELDS = ['agentStack', 'programmingLanguage', 'usesTeamsOrCopilot'];
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const MODULE_HASH = digest(fs.readFileSync(__filename));
const PROFILES = {
  'dotnet-restore': { command: 'dotnet restore', family: 'dotnet', restore: true, timeout: 180000 },
  'dotnet-build': { command: 'dotnet build --no-restore -v minimal', family: 'dotnet', timeout: 25000 },
  'npm-install': { command: 'npm install', family: 'node', restore: true, timeout: 180000 },
  // `-p typescript` pins the binary to the real compiler: a bare `npx tsc` without a local
  // TypeScript install fetches and runs the unrelated, deprecated `tsc` package instead.
  typescript: { command: 'npx --no-install -p typescript tsc --noEmit', aliases: ['npx tsc --noEmit'], family: 'node', timeout: 15000 },
  'node-build': { family: 'node', timeout: 180000, custom: true },
  'python-restore': { family: 'python', restore: true, timeout: 180000 },
  'uv-sync': { command: 'uv sync', family: 'python', restore: true, timeout: 180000, custom: true },
};

class Uncacheable extends Error {
  constructor(reason) { super(reason); this.reason = reason; }
}

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function externalInput(root, directory, value) {
  const normalized = value.replace(/[\\/]/g, path.sep);
  return /[$&%]/.test(value) || (process.platform !== 'win32' && /^[A-Za-z]:/.test(value)) ||
    !inside(root, path.resolve(directory, normalized));
}

function context(options = {}) {
  const cwd = fs.realpathSync(options.cwd ?? process.cwd());
  const home = options.home ?? os.homedir();
  const root = options.stateRoot ?? path.join(home, '.cache', 'agent365-onboarding');
  const directory = path.join(root, digest(process.platform === 'win32' ? cwd.toLowerCase() : cwd));
  return {
    cwd, directory, home, env: options.env ?? process.env,
    racyNs: options.racyNs ?? RACY_NS,
    execute: options.execute ?? ((command, settings) => execSync(command, {
      ...settings, encoding: 'utf8', stdio: 'pipe', windowsHide: true, maxBuffer: 8 * 1024 * 1024,
    })),
    warn: options.warn ?? (message => process.stderr.write(`[local-work] ${message}\n`)),
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function readReceipt(ctx, name) {
  try {
    const file = path.join(ctx.directory, name);
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('linked receipt');
    const value = readJson(file);
    if (!value || value.schema !== SCHEMA) throw new Error('receipt schema');
    return value;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    if (error instanceof SyntaxError || error.message === 'linked receipt' || error.message === 'receipt schema') {
      ctx.warn('Invalid local receipt; it will not be reused.');
      return null;
    }
    throw error;
  }
}

function writeReceipt(ctx, name, value) {
  const temporary = path.join(ctx.directory, `${name}.${crypto.randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, JSON.stringify({ schema: SCHEMA, ...value }) + '\n', { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, path.join(ctx.directory, name));
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function ensureState(ctx) {
  fs.mkdirSync(ctx.directory, { recursive: true, mode: 0o700 });
  if (fs.lstatSync(ctx.directory).isSymbolicLink()) throw new Error('Local state directory must not be a symbolic link.');
  if (process.platform !== 'win32') fs.chmodSync(ctx.directory, 0o700);
}

function locked(ctx, action, timeout = 30000) {
  ensureState(ctx);
  const file = path.join(ctx.directory, 'work.lock');
  const owner = { pid: process.pid, host: digest(os.hostname()), nonce: crypto.randomUUID() };
  const candidate = path.join(ctx.directory, `lock-${owner.nonce}.tmp`);
  const until = Date.now() + timeout;
  fs.writeFileSync(candidate, JSON.stringify(owner), { flag: 'wx', mode: 0o600 });
  try { for (;;) {
    try {
      // Publish a complete owner atomically, including if this process exits mid-acquisition.
      fs.linkSync(candidate, file);
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let previous;
      try { previous = readJson(file); }
      catch (readError) {
        if (readError.code === 'ENOENT') continue;
        if (!(readError instanceof SyntaxError)) throw readError;
      }
      if (previous && previous.host === owner.host && Number.isSafeInteger(previous.pid) &&
          previous.pid > 0 && typeof previous.nonce === 'string') {
        try { process.kill(previous.pid, 0); }
        catch (signalError) {
          if (signalError.code !== 'ESRCH') throw signalError;
          if (fs.existsSync(file) && readJson(file).nonce === previous.nonce) {
            fs.unlinkSync(file);
            ctx.warn('Removed a lock left by an exited local process.');
            continue;
          }
        }
      }
      if (Date.now() >= until) throw new Error('Another local operation holds the workspace lock; retry after it finishes.');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  } } finally { fs.unlinkSync(candidate); }
  try { return action(); }
  finally {
    if (fs.existsSync(file) && readJson(file).nonce === owner.nonce) fs.unlinkSync(file);
  }
}

function timing(ctx, stage, outcome, start) {
  const record = readReceipt(ctx, 'timings.json');
  const events = timingEvents(ctx, record);
  events.push({ stage, outcome, durationMs: Math.round(performance.now() - start), at: new Date().toISOString() });
  writeReceipt(ctx, 'timings.json', { events: events.slice(-100) });
}

function timingEvents(ctx, record) {
  if (!record) return [];
  const stages = new Set(['detection', ...Object.keys(PROFILES)]);
  const outcomes = new Set(['missing', 'refresh-required', 'unchanged', 'recorded', 'reused', 'executed', 'failed']);
  if (!Array.isArray(record.events) || record.events.some(event =>
    !event || !stages.has(event.stage) || !outcomes.has(event.outcome) ||
    !Number.isSafeInteger(event.durationMs) || event.durationMs < 0 ||
    typeof event.at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(event.at) ||
    !Number.isFinite(Date.parse(event.at)))) {
    ctx.warn('Invalid local timing history; discarding it.');
    return [];
  }
  return record.events.map(({ stage, outcome, durationMs, at }) => ({ stage, outcome, durationMs, at }));
}

function policy() {
  const hash = crypto.createHash('sha256').update(MODULE_HASH);
  for (const relative of ['shared/agent-detection.md', 'shared/local-work.md', 'KIT-VERSION.json']) {
    const file = path.join(__dirname, '..', ...relative.split('/'));
    hash.update(relative);
    if (fs.existsSync(file)) hash.update(fs.readFileSync(file));
  }
  return hash.digest('hex');
}

function listing(root, { detection = false, dependencies = [] } = {}) {
  const entries = [];
  let bytes = 0, count = 0;
  const visit = (directory, base, generated = false, external = false, ancestors = new Set(), dependency = false) => {
    const real = fs.realpathSync(directory);
    if (!inside(base, real)) throw new Uncacheable('external-link');
    if (ancestors.has(real)) throw new Uncacheable('cyclic-link');
    const seen = new Set([...ancestors, real]);
    for (const entry of fs.readdirSync(real, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      if (entry.name === '.git' || entry.name === '__pycache__') continue;
      if (detection && (GENERATED.has(entry.name) || KIT_DIRS.has(entry.name) || entry.name === DETECTION_FILE)) continue;
      const file = path.join(real, entry.name);
      const stat = fs.statSync(file, { bigint: true });
      if (stat.isDirectory()) {
        visit(file, base, generated || GENERATED.has(entry.name), external, seen, dependency || DEPENDENCIES.has(entry.name));
      } else if (stat.isFile()) {
        if (entry.isSymbolicLink() && !inside(base, fs.realpathSync(file))) throw new Uncacheable('external-link');
        bytes += Number(stat.size);
        if (++count > 30000 || bytes > 512 * 1024 * 1024) throw new Uncacheable('fingerprint-limit');
        entries.push({ file, base, stat, generated, external, dependency, entryName: entry.name });
      } else {
        throw new Uncacheable('special-file');
      }
    }
  };
  visit(root, root);
  for (const dependency of [...new Set(dependencies)].sort()) visit(dependency, fs.realpathSync(dependency), true, true);
  return { entries, files: entries.filter(item => !item.external).map(item => item.file) };
}

function fingerprint(list, cache) {
  const source = crypto.createHash('sha256');
  const stableSource = crypto.createHash('sha256');
  const all = crypto.createHash('sha256');
  const dependencyHash = crypto.createHash('sha256');
  for (const { file, base, stat, generated, external, dependency, entryName } of list.entries) {
    const name = JSON.stringify([external ? base : '', path.relative(base, file)]);
    let content = cache?.lookup(name, stat);
    if (content === undefined) {
      const data = fs.readFileSync(file);
      const after = fs.statSync(file, { bigint: true });
      // Windows can update ctime on the first read without changing the contents.
      if (after.size !== stat.size || after.mtimeNs !== stat.mtimeNs) {
        throw new Uncacheable('files-changing');
      }
      content = digest(data);
      cache?.store(name, after, content);
    }
    const item = `${name.length}:${name}:${Number(stat.mode)}:${content}\n`;
    all.update(item);
    if (external || dependency || entryName === 'project.assets.json' || /\.nuget\.(?:g\.(?:props|targets)|dgspec\.json)$/.test(entryName)) {
      dependencyHash.update(item);
    }
    if (!generated && !external) {
      source.update(item);
      if (!['package-lock.json', 'packages.lock.json', 'uv.lock'].includes(entryName)) stableSource.update(item);
    }
  }
  return {
    source: source.digest('hex'), stableSource: stableSource.digest('hex'),
    dependencies: dependencyHash.digest('hex'), all: all.digest('hex'), files: list.files,
  };
}

function inventory(root, options = {}) {
  return fingerprint(listing(root, options), options.cache);
}

// Content digests are reused only while a file's identity, size, timestamps and mode are
// unchanged, as git does. Files changed within RACY_NS of being read are never cached,
// because a coarse timestamp could hide a second change. Keys and values are digests.
const RACY_NS = 2_000_000_000n;
const cacheKey = (name, stat) => digest(JSON.stringify([name,
  ...[stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs, stat.mode].map(String)])).slice(0, 32);

function digestCache(ctx, name) {
  const file = path.join(ctx.directory, name);
  let entries = new Map();
  try {
    if (!fs.lstatSync(file).isSymbolicLink()) {
      const value = readJson(file);
      if (value?.schema === SCHEMA && value.entries && typeof value.entries === 'object') {
        entries = new Map(Object.entries(value.entries).filter(([key, content]) =>
          /^[a-f0-9]{32}$/.test(key) && /^[a-f0-9]{64}$/.test(content)));
      }
    }
  } catch { /* A missing or unreadable cache only means files are read again. */ }
  const used = new Map();
  let consulted = false, added = false;
  return {
    lookup(fileName, stat) {
      consulted = true;
      const key = cacheKey(fileName, stat);
      const content = entries.get(key);
      if (content !== undefined) used.set(key, content);
      return content;
    },
    store(fileName, stat, content) {
      const now = BigInt(Date.now()) * 1_000_000n;
      const newest = stat.mtimeNs > stat.ctimeNs ? stat.mtimeNs : stat.ctimeNs;
      if (newest > now || now - newest < ctx.racyNs) return;
      const key = cacheKey(fileName, stat);
      entries.set(key, content);
      used.set(key, content);
      added = true;
    },
    save() {
      if (!consulted || (!added && used.size === entries.size)) return;
      try { writeReceipt(ctx, name, { entries: Object.fromEntries(used) }); }
      catch { /* The cache is an optimization; a failed write never affects the result. */ }
    },
  };
}

function localFacts(ctx) {
  let cache;
  try { cache = readJson(path.join(ctx.cwd, DETECTION_FILE)); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    if (error instanceof SyntaxError) throw new Error('Detection JSON is invalid; refresh local detection before editing agent code.');
    throw error;
  }
  if (!cache || typeof cache.agentStack !== 'string' || !cache.agentStack.trim() ||
      typeof cache.programmingLanguage !== 'string' || !cache.programmingLanguage.trim() ||
      ![0, 1, false, true].includes(cache.usesTeamsOrCopilot)) {
    throw new Error('Detection metadata is incomplete; refresh local detection without inventing defaults.');
  }
  return {
    classification: Object.fromEntries(LOCAL_FIELDS.map(key => [key, cache[key]])),
    metadata: digest(JSON.stringify(Object.entries(cache).filter(([key]) => key !== 'detectedAt').sort())),
  };
}

function detection(action, options = {}) {
  const ctx = context(options), start = performance.now();
  return locked(ctx, () => {
    const facts = localFacts(ctx);
    if (!facts) {
      if (action === 'record') throw new Error('No detection metadata exists; perform local detection first.');
      timing(ctx, 'detection', 'missing', start);
      return { status: 'missing', localOnly: true };
    }
    let signature;
    const cache = digestCache(ctx, 'digests-detection.json');
    try { signature = digest(JSON.stringify([ctx.cwd, policy(), facts, inventory(ctx.cwd, { detection: true, cache }).source])); }
    catch (error) {
      if (!(error instanceof Uncacheable)) throw error;
      if (action === 'record') throw new Error(`Cannot record local detection: ${error.reason}.`);
      ctx.warn(`Local detection needs a fresh scan: ${error.reason}.`);
      timing(ctx, 'detection', 'refresh-required', start);
      return { status: 'refresh-required', localOnly: true, reason: error.reason };
    }
    cache.save();
    if (action === 'record') {
      writeReceipt(ctx, 'detection.json', { signature });
      timing(ctx, 'detection', 'recorded', start);
      return { status: 'recorded', localOnly: true };
    }
    const previous = readReceipt(ctx, 'detection.json');
    const status = !options.force && previous?.signature === signature ? 'unchanged' : 'refresh-required';
    timing(ctx, 'detection', status, start);
    return { status, localOnly: true };
  });
}

function probe(ctx, command) {
  return ctx.execute(command, { cwd: ctx.cwd, env: ctx.env, timeout: 10000 }).toString().trim();
}

function profileFor(name, ctx) {
  if (!Object.hasOwn(PROFILES, name)) throw new Error('Unknown local-work profile; see --help.');
  const profile = { ...PROFILES[name], name };
  if (name === 'node-build') {
    const scripts = readJson(path.join(ctx.cwd, 'package.json')).scripts ?? {};
    if (scripts.build) {
      profile.command = 'npm run build';
      profile.custom = !/^tsc(?: --noEmit)?$/.test(scripts.build);
    } else if (scripts.compile) {
      profile.command = 'npm run compile';
      profile.custom = !/^tsc(?: --noEmit)?$/.test(scripts.compile);
    }
    else return profileFor('typescript', ctx);
  }
  if (name === 'python-restore') {
    profile.python = process.platform === 'win32' ? 'python' : 'python3';
    profile.requirements = ['requirements-lock.txt', 'requirements.txt'].find(file => fs.existsSync(path.join(ctx.cwd, file)));
    profile.command = `${profile.python} -m pip install ${profile.requirements ? `-r ${profile.requirements}` : '.'}`;
  }
  return profile;
}

function buildSnapshot(ctx, profile) {
  if (profile.custom) throw new Uncacheable('custom-build-script');
  let toolchain, dependencies = [], reusable = true;
  if (profile.family === 'node') {
    toolchain = [];
    const manifest = readJson(path.join(ctx.cwd, 'package.json'));
    if (profile.restore) {
      const lock = path.join(ctx.cwd, 'package-lock.json');
      if (!fs.existsSync(lock)) throw new Uncacheable('unlocked-dependencies');
      reusable = fs.existsSync(path.join(ctx.cwd, 'node_modules'));
      const lockData = readJson(lock);
      if (![2, 3].includes(lockData.lockfileVersion) || !lockData.packages) throw new Uncacheable('unsupported-lockfile');
      if (['preinstall', 'install', 'postinstall', 'prepare', 'prepublish'].some(key => manifest.scripts?.[key]) ||
          Object.values(lockData.packages).some(pkg => pkg.hasInstallScript || pkg.link ||
            (pkg.resolved && !/^https?:\/\//.test(pkg.resolved)))) {
        throw new Uncacheable('install-lifecycle');
      }
    } else if (!fs.existsSync(path.join(ctx.cwd, 'tsconfig.json')) ||
               !fs.existsSync(path.join(ctx.cwd, 'node_modules', 'typescript', 'bin', 'tsc'))) {
      reusable = false;
    }
  } else if (profile.family === 'dotnet') {
    toolchain = [];
    const overrides = new Set(['outdir', 'outputpath', 'baseoutputpath', 'intermediateoutputpath',
      'baseintermediateoutputpath', 'msbuildprojectextensionspath', 'csctoolpath', 'csctoolexe', 'msbuildsdkspath']);
    if (Object.keys(ctx.env).some(key => overrides.has(key.toLowerCase()) && ctx.env[key])) {
      throw new Uncacheable('custom-msbuild-paths');
    }
  } else {
    const info = JSON.parse(probe(ctx, `${profile.python} -c "import json,sys; print(json.dumps([sys.executable,sys.prefix,sys.version]))"`));
    if (!Array.isArray(info) || info.length !== 3 || !inside(ctx.cwd, fs.realpathSync(info[1]))) {
      throw new Uncacheable('external-python-environment');
    }
    toolchain = info;
    if (!profile.requirements || !fs.readFileSync(path.join(ctx.cwd, profile.requirements), 'utf8').split(/\r?\n/)
      .filter(line => line.trim() && !line.trim().startsWith('#'))
      .every(line => /^[A-Za-z0-9_.-]+(?:\[[A-Za-z0-9_,.-]+\])?==[A-Za-z0-9_.+-]+(?:\s*#.*)?$/.test(line.trim()))) {
      throw new Uncacheable('unpinned-python-requirements');
    }
  }
  const list = listing(ctx.cwd);
  for (const file of list.files) {
    const relative = path.relative(ctx.cwd, file);
    if (relative.split(path.sep).some(part => GENERATED.has(part) || KIT_DIRS.has(part))) continue;
    if (/\.(csproj|props|targets)$/i.test(file)) {
      const text = fs.readFileSync(file, 'utf8');
      if (/<(?:Import|Target|UsingTask|Exec)\b|\$\(\[/.test(text)) throw new Uncacheable('custom-msbuild-inputs');
      if (/<(?:OutDir|OutputPath|BaseOutputPath|IntermediateOutputPath|BaseIntermediateOutputPath|MSBuildProjectExtensionsPath|CscToolPath|CscToolExe|MSBuildSDKsPath)\b/i.test(text)) {
        throw new Uncacheable('custom-msbuild-paths');
      }
      if (/<[\w.]*(?:Path|Paths|Directory|Dir|File|Files|Root|Icon|Manifest)\b[^>]*>[^<]*\$\(/i.test(text)) {
        throw new Uncacheable('dynamic-msbuild-paths');
      }
      for (const match of text.matchAll(/<[\w.]+>\s*([^<>]+?)\s*<\/[\w.]+>/g)) {
        if ((/(^|[\\/])\.\.([\\/]|$)|^[\\/]|^[A-Za-z]:/.test(match[1])) &&
            externalInput(ctx.cwd, path.dirname(file), match[1])) throw new Uncacheable('external-build-inputs');
      }
      for (const match of text.matchAll(/(?:Include|HintPath)\s*=\s*(["'])([\s\S]*?)\1/g)) {
        if (match[2].split(';').some(value => externalInput(ctx.cwd, path.dirname(file), value.trim()))) {
          throw new Uncacheable('external-build-inputs');
        }
      }
      for (const match of text.matchAll(/<HintPath>\s*([^<]+)\s*<\/HintPath>/g)) {
        if (externalInput(ctx.cwd, path.dirname(file), match[1].trim())) {
          throw new Uncacheable('external-build-inputs');
        }
      }
    }
    if (profile.family === 'node' && /\.json$/i.test(file)) {
      const config = fs.readFileSync(file, 'utf8');
      if (!/"(?:compilerOptions|extends|references|files|include|exclude)"\s*:/.test(config)) continue;
      const parsed = JSON.parse(config);
      if (parsed.compilerOptions?.plugins?.length) throw new Uncacheable('compiler-plugins');
      const bases = parsed.extends === undefined ? [] : Array.isArray(parsed.extends) ? parsed.extends : [parsed.extends];
      for (const base of bases) {
        if (typeof base !== 'string' || (!base.startsWith('.') && !path.isAbsolute(base)) ||
            base.split(/[\\/]/).some(part => GENERATED.has(part) || KIT_DIRS.has(part))) {
          throw new Uncacheable('package-typescript-config');
        }
      }
      for (const match of config.matchAll(/"(?:\\.|[^"\\])*"/g)) {
        const value = JSON.parse(match[0]);
        if (value.includes('${')) throw new Uncacheable('dynamic-typescript-inputs');
        if ((/(^|[\\/])\.\.([\\/]|$)|^[\\/]|^[A-Za-z]:/.test(value)) &&
            externalInput(ctx.cwd, path.dirname(file), value)) {
          throw new Uncacheable('external-build-inputs');
        }
      }
    }
  }
  const ancestorInputs = [];
  let repository = fs.existsSync(path.join(ctx.cwd, '.git'));
  for (let parent = path.dirname(ctx.cwd); ; parent = path.dirname(parent)) {
    repository ||= fs.existsSync(path.join(parent, '.git'));
    if (profile.family === 'node' && fs.existsSync(path.join(parent, 'node_modules'))) throw new Uncacheable('ancestor-node-dependencies');
    for (const name of ['Directory.Build.props', 'Directory.Build.targets', 'Directory.Packages.props', 'global.json', 'NuGet.Config', 'nuget.config', '.npmrc']) {
      const file = path.join(parent, name);
      if (fs.existsSync(file)) ancestorInputs.push([file, digest(fs.readFileSync(file))]);
      if (name.startsWith('Directory.') && fs.existsSync(file)) throw new Uncacheable('ancestor-msbuild-inputs');
    }
    if (path.dirname(parent) === parent) break;
  }
  for (const file of [
    path.join(ctx.home, '.npmrc'),
    path.join(ctx.home, '.nuget', 'NuGet', 'NuGet.Config'),
    path.join(ctx.home, '.config', 'NuGet', 'NuGet.Config'),
    ...(ctx.env.APPDATA ? [path.join(ctx.env.APPDATA, 'NuGet', 'NuGet.Config')] : []),
  ]) {
    if (fs.existsSync(file)) ancestorInputs.push([file, digest(fs.readFileSync(file))]);
  }
  if (profile.family === 'dotnet') {
    const assets = list.files.filter(file => path.basename(file) === 'project.assets.json' && path.basename(path.dirname(file)) === 'obj');
    reusable = assets.length > 0 &&
      (profile.restore || list.files.some(file => file.split(path.sep).includes('bin') && file.endsWith('.dll')));
    for (const file of assets) {
      const data = readJson(file);
      for (const library of Object.values(data.libraries ?? {})) {
        if (library.type !== 'package' || typeof library.path !== 'string') continue;
        if (library.path.split('/').some(part => !part || part === '.' || part === '..')) throw new Uncacheable('invalid-package-path');
        if ((library.files ?? []).some(file => /(^|\/)(build[^/]*|analyzers)\//i.test(file))) {
          throw new Uncacheable('package-build-extensions');
        }
        const folder = Object.keys(data.packageFolders ?? {}).map(root => path.join(root, ...library.path.split('/')))
          .find(candidate => fs.existsSync(candidate));
        if (!folder) throw new Uncacheable('missing-dependency-artifacts');
        dependencies.push(folder);
      }
    }
  }
  if (profile.family === 'dotnet') {
    const command = repository
      ? 'dotnet --info && git status --porcelain=v2 --branch --untracked-files=no && git config --list --show-origin'
      : 'dotnet --info';
    toolchain = [probe(ctx, command)];
  } else if (profile.family === 'node') {
    toolchain = [process.version, process.execPath, probe(ctx, 'npm --version')];
  }
  if (toolchain.some(value => typeof value !== 'string' || !value.trim())) throw new Uncacheable('unverified-toolchain');
  // Content is hashed only after every cheaper reason to skip reuse has been ruled out.
  const tree = dependencies.length ? inventory(ctx.cwd, { dependencies, cache: ctx.cache }) : fingerprint(list, ctx.cache);
  const environment = Object.entries(ctx.env).filter(([key]) => !['A365_LOCAL_WORK_FORCE', 'VALIDATE_SKIP_EXEC'].includes(key)).sort();
  const settings = digest(JSON.stringify([ctx.cwd, policy(), profile.command, toolchain, environment, ancestorInputs]));
  const signature = digest(JSON.stringify([settings, tree.all]));
  return { signature, settings, reusable, source: tree.source, stableSource: tree.stableSource, dependencies: tree.dependencies };
}

function snapshotOrMiss(ctx, profile) {
  try { return buildSnapshot(ctx, profile); }
  catch (error) {
    if (error instanceof Uncacheable) {
      ctx.warn(`${profile.name}: executing without reuse (${error.reason}).`);
      return null;
    }
    if (error instanceof SyntaxError || ['ENOENT', 'EACCES', 'EPERM', 'ENOTDIR'].includes(error.code) ||
        typeof error.status === 'number' || error.signal) {
      ctx.warn(`${profile.name}: fingerprint unavailable; executing the real command.`);
      return null;
    }
    throw error;
  }
}

function run(name, options = {}) {
  const ctx = context(options), profile = profileFor(name, ctx), start = performance.now();
  const timeout = options.timeout ?? profile.timeout;
  let completed;
  const execute = () => {
    try {
      const output = ctx.execute(profile.command, { cwd: ctx.cwd, env: ctx.env, timeout }).toString();
      return { ok: true, output, reused: false, profile: profile.name, buildSucceeded: output.includes('Build succeeded') };
    } catch (error) {
      if (typeof error.status !== 'number' && !error.signal && !error.code) throw error;
      return {
        ok: false, reused: false, profile: profile.name,
        output: [(error.stdout ?? '').toString(), (error.stderr ?? '').toString(), error.code ?? error.signal ?? ''].filter(Boolean).join('\n'),
      };
    }
  };
  try { return locked(ctx, () => {
    const fresh = options.force || ctx.env.A365_LOCAL_WORK_FORCE === '1' || Boolean(ctx.env.CI);
    ctx.cache = digestCache(ctx, 'digests.json');
    try {
      const before = fresh ? null : snapshotOrMiss(ctx, profile);
      const file = `run-${profile.name}.json`;
      const receipt = readReceipt(ctx, file);
      if (before?.reusable && receipt?.signature === before.signature && receipt.profile === profile.name && receipt.ok === true) {
        completed = { ok: true, output: '', reused: true, profile: profile.name, buildSucceeded: receipt.buildSucceeded === true };
        timing(ctx, profile.name, 'reused', start);
        return completed;
      }
      if (fs.existsSync(path.join(ctx.directory, file))) fs.unlinkSync(path.join(ctx.directory, file));
      const result = completed = execute();
      if (result.ok && !fresh && before) {
        const after = snapshotOrMiss(ctx, profile);
        if (before && after?.reusable && before.settings === after.settings &&
            (profile.restore ? before.stableSource === after.stableSource :
              before.source === after.source && before.dependencies === after.dependencies)) {
          writeReceipt(ctx, file, { profile: profile.name, signature: after.signature, ok: true, buildSucceeded: result.buildSucceeded });
        } else if (after) {
          ctx.warn(`${profile.name}: no reusable receipt was recorded; inputs or artifacts changed during execution.`);
        }
      }
      timing(ctx, profile.name, result.ok ? 'executed' : 'failed', start);
      return result;
    } finally { ctx.cache.save(); }
  }, timeout); } catch (error) {
    if (!['EACCES', 'EPERM', 'EROFS', 'ENOSPC', 'EMFILE', 'ENFILE', 'ENOTDIR', 'ENOSYS', 'ENOTSUP'].includes(error.code)) throw error;
    ctx.warn(`Local receipt storage is unavailable (${error.code}); no result will be inferred from missing state.`);
    return completed ?? execute();
  }
}

function runBuild(command, timeout, options = {}) {
  const name = Object.keys(PROFILES).find(key => !PROFILES[key].restore &&
    (PROFILES[key].command === command || PROFILES[key].aliases?.includes(command)));
  if (!name) throw new Error('Unsupported shared compiler command.');
  const result = run(name, { ...options, timeout });
  return name === 'dotnet-build' ? { ...result, ok: result.ok && result.buildSucceeded } : result;
}

function timings(options = {}) {
  const ctx = context(options);
  return locked(ctx, () => timingEvents(ctx, readReceipt(ctx, 'timings.json')));
}

function clear(options = {}) {
  const ctx = context(options);
  return locked(ctx, () => {
    for (const name of ['detection.json', 'timings.json', 'digests.json', 'digests-detection.json', ...Object.keys(PROFILES).map(profile => `run-${profile}.json`)]) {
      const file = path.join(ctx.directory, name);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });
}

module.exports = { detection, run, runBuild, timings, clear, inventory, PROFILES };
