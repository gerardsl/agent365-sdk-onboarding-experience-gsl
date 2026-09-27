#!/usr/bin/env node
// Prerequisite check shared by agent365-kit.ps1 (Windows) and agent365-kit.sh (macOS/Linux).
// Exits 1 only when a required prerequisite is missing.

'use strict';

const { exec } = require('node:child_process');

function runCommand(cmd, { timeout = 20000 } = {}) {
  return new Promise(resolve => {
    exec(cmd, {
      encoding: 'utf8',
      timeout,
      windowsHide: true,
    }, (error, stdout) => resolve(error ? null : stdout.trim()));
  });
}

function createProbe(run = runCommand) {
  const pending = new Map();
  const queue = [];
  let active = 0;
  const drain = () => {
    while (active < 4 && queue.length) {
      const { cmd, resolve, reject } = queue.shift();
      active++;
      Promise.resolve().then(() => run(cmd)).then(resolve, reject).finally(() => {
        active--;
        drain();
      });
    }
  };
  return cmd => {
    if (!pending.has(cmd)) {
      pending.set(cmd, new Promise((resolve, reject) => {
        queue.push({ cmd, resolve, reject });
        drain();
      }));
    }
    return pending.get(cmd);
  };
}

function firstVersion(text) {
  if (!text) return null;
  const m = text.match(/\d+\.\d+(\.\d+)?/);
  return m ? m[0] : null;
}

function majorOf(version) {
  if (!version) return -1;
  return parseInt(version.split('.')[0], 10);
}

function checks(probe, { platform, nodeVersion, setup }) {
  const isWin = platform === 'win32';
  const detected = async (cmd, label) => await probe(cmd) ? label : null;
  // Required checks block onboarding. Optional ones depend on the agent's stack.
  const definitions = [
    {
      key: 'node',
      label: 'Node.js 18+',
      required: true,
      why: 'Runs the skill validators bundled with this kit.',
      probe: () => nodeVersion.replace(/^v/, ''),
      ok: v => majorOf(v) >= 18,
      install: isWin
        ? 'winget install --id OpenJS.NodeJS.LTS -e'
        : 'brew install node   # or https://nodejs.org',
    },
    {
      key: 'ai_cli',
      label: 'An AI coding CLI',
      required: true,
      why: 'Reads the skills and drives the onboarding. Any one of these is enough.',
      probe: async () => {
        const found = await Promise.all([
          detected('claude --version', 'Claude Code'),
          (async () => await detected(isWin ? 'where copilot' : 'command -v copilot', 'Copilot CLI') ||
            await detected('gh copilot --help', 'Copilot CLI (via gh)'))(),
          detected(isWin ? 'where cursor-agent' : 'command -v cursor-agent', 'Cursor'),
          detected(isWin ? 'where codex' : 'command -v codex', 'Codex'),
          detected(isWin ? 'where gemini' : 'command -v gemini', 'Gemini CLI'),
        ]);
        return found.filter(Boolean).join(', ') || null;
      },
      ok: v => !!v,
      install: 'pick one -- Copilot: npm install -g @github/copilot   |   '
        + 'Claude Code: npm install -g @anthropic-ai/claude-code   |   '
        + 'Cursor / Codex / Gemini CLI: install per their docs',
    },
    {
      key: 'dotnet',
      label: '.NET SDK 8+',
      required: true,
      why: 'The a365 CLI ships as a .NET global tool. SDK, not just runtime.',
      probe: async () => firstVersion(await probe('dotnet --version')),
      ok: v => majorOf(v) >= 8,
      install: isWin
        ? 'winget install --id Microsoft.DotNet.SDK.8 -e'
        : 'brew install --cask dotnet-sdk   # or https://dot.net/download',
    },
    {
      key: 'a365',
      label: 'a365 CLI',
      required: true,
      why: 'Creates the Agent 365 Blueprint and Entra identity for your agent.',
      probe: async () => firstVersion(await probe('a365 --version')),
      ok: v => !!v,
      install: 'dotnet tool install -g Microsoft.Agents.A365.DevTools.Cli',
    },
    {
      key: 'az',
      label: 'Azure CLI',
      required: true,
      why: 'Tenant sign-in and Entra app registration.',
      probe: async () => firstVersion(await probe('az version')),
      ok: v => !!v,
      install: isWin
        ? 'winget install --id Microsoft.AzureCLI -e'
        : 'brew install azure-cli',
    },
    {
      key: 'azlogin',
      label: 'Azure CLI signed in',
      required: false,
      why: 'Setup needs an authenticated tenant context.',
      // Masked: this often runs on a screen share during a customer demo.
      probe: async () => {
        const tenant = await probe('az account show --query tenantId -o tsv');
        return tenant ? tenant.slice(0, 8) + '-...' : null;
      },
      ok: v => !!v,
      install: 'az login --allow-no-subscriptions',
    },
    {
      key: 'git',
      label: 'Git',
      required: true,
      why: 'Used to scaffold starter agents from Agent365-Samples.',
      probe: async () => firstVersion(await probe('git --version')),
      ok: v => !!v,
      install: isWin ? 'winget install --id Git.Git -e' : 'brew install git',
    },
    {
      key: 'pwsh',
      label: 'PowerShell 7+',
      required: setup,
      why: 'Some a365 setup fallbacks emit PowerShell for an admin to run.',
      probe: async () => firstVersion(await probe('pwsh --version')),
      ok: v => majorOf(v) >= 7,
      install: isWin
        ? 'winget install --id Microsoft.PowerShell -e'
        : 'brew install --cask powershell',
    },
    {
      key: 'python',
      label: setup ? 'Python 3.11+' : 'Python 3.10+',
      required: false,
      why: 'Only for Python agents (LangChain, OpenAI Agents SDK, Google ADK).',
      probe: async () => firstVersion(await probe(isWin ? 'python --version' : 'python3 --version') ||
        (setup && !isWin ? await probe('python --version') : null)),
      ok: v => {
        if (!v) return false;
        const parts = v.split('.').map(Number);
        return parts[0] > 3 || (parts[0] === 3 && parts[1] >= (setup ? 11 : 10));
      },
      install: isWin
        ? 'winget install --id Python.Python.3.12 -e'
        : 'brew install python@3.12',
    },
  ];

  if (setup) definitions.push(
    {
      key: 'azmodule',
      label: 'Az.Accounts 2+',
      required: true,
      why: 'Used by a365 setup requirements and admin consent scripts.',
      probe: async () => firstVersion(await probe('pwsh -NoProfile -NonInteractive -Command "[string](Get-Module -ListAvailable Az.Accounts | Select-Object -First 1 -ExpandProperty Version)"')),
      ok: v => majorOf(v) >= 2,
      install: 'pwsh -Command "Install-Module -Name Az -AllowClobber -Scope CurrentUser -Force -Repository PSGallery"',
    },
    {
      key: 'gh',
      label: 'GitHub CLI',
      required: false,
      why: 'Needed when cloning a starter through gh; optional for existing agents.',
      probe: async () => firstVersion(await probe('gh --version')),
      ok: v => !!v,
      install: isWin ? 'winget install --id GitHub.cli -e' : 'brew install gh',
    },
    {
      key: 'npm',
      label: 'npm',
      required: false,
      why: 'Required for Node.js agents.',
      probe: async () => firstVersion(await probe('npm --version')),
      ok: v => !!v,
      install: isWin ? 'winget install --id OpenJS.NodeJS.LTS -e' : 'brew install node',
    },
    {
      key: 'uv',
      label: 'uv',
      required: false,
      why: 'Recommended package manager for Python Agent 365 agents.',
      probe: async () => firstVersion(await probe('uv --version')),
      ok: v => !!v,
      install: isWin ? 'python -m pip install uv' : 'python3 -m pip install uv',
    },
  );
  // Setup runs inside a coding CLI and verifies identity separately in Step 2.
  return setup ? definitions.filter(check => !['ai_cli', 'azlogin'].includes(check.key)) : definitions;
}

// Measured slowest first, so they overlap the quick probes. Results keep definition order.
const LAUNCH_ORDER = ['azlogin', 'az', 'a365', 'azmodule', 'npm', 'pwsh', 'dotnet'];

async function collectReport({
  platform = process.platform, nodeVersion = process.version, setup = false,
  run = runCommand,
} = {}) {
  const probe = createProbe(run);
  const list = checks(probe, { platform, nodeVersion, setup });
  const rank = check => {
    const index = LAUNCH_ORDER.indexOf(check.key);
    return index < 0 ? LAUNCH_ORDER.length : index;
  };
  const pending = new Map();
  for (const check of [...list].sort((a, b) => rank(a) - rank(b))) pending.set(check, check.probe());
  const results = await Promise.all(list.map(async check => {
    const value = await pending.get(check);
    return {
      key: check.key,
      label: check.label,
      required: check.required,
      why: check.why,
      value,
      passed: check.ok(value),
      install: check.install,
    };
  }));
  return { ok: results.every(r => !r.required || r.passed), platform, results };
}

async function main(argv = process.argv.slice(2), { log = console.log, color, ...options } = {}) {
  const args = new Set(argv);
  if (args.has('--help')) {
    log('Usage: node .a365-kit/doctor.js [--json] [--quiet] [--setup]\n' +
      '--setup selects the setup-skill tool scan, including Az.Accounts, gh, npm and uv.\n' +
      'Independent probes run at most four at a time. Every invocation checks fresh state.\n' +
      'No software is installed, no tenant settings are changed and no report is persisted.');
    return 0;
  }
  const report = await collectReport({ ...options, setup: args.has('--setup') });
  const { results } = report;

  const missingRequired = results.filter(r => r.required && !r.passed);
  const missingOptional = results.filter(r => !r.required && !r.passed);

  if (args.has('--json')) {
    log(JSON.stringify(report, null, 2));
    return report.ok ? 0 : 1;
  }

  const ESC = String.fromCharCode(27);
  const GREEN = ESC + '[32m';
  const RED = ESC + '[31m';
  const YELLOW = ESC + '[33m';
  const DIM = ESC + '[2m';
  const BOLD = ESC + '[1m';
  const RESET = ESC + '[0m';

  const useColor = color ?? (Boolean(process.stdout.isTTY) && !process.env.NO_COLOR);
  const paint = (code, text) => (useColor ? code + text + RESET : text);

  log('');
  log(paint(BOLD, 'Agent 365 Onboarding Kit -- prerequisite check'));
  log('');

  const width = results.reduce((max, r) => Math.max(max, r.label.length), 0);

  for (const r of results) {
    if (args.has('--quiet') && r.passed) continue;
    let mark;
    if (r.passed) mark = paint(GREEN, ' ok ');
    else if (r.required) mark = paint(RED, 'MISS');
    else mark = paint(YELLOW, 'opt ');
    const detail = paint(DIM, r.passed ? (r.value || '') : r.why);
    log('  [' + mark + '] ' + r.label.padEnd(width) + '  ' + detail);
  }

  if (missingRequired.length || missingOptional.length) {
    log('');
    log(paint(BOLD, 'To install what is missing:'));
    log('');
    for (const r of missingRequired.concat(missingOptional)) {
      const tag = r.required ? paint(RED, 'required') : paint(YELLOW, 'optional');
      log('  ' + r.label + ' (' + tag + ')');
      log(paint(DIM, '      ' + r.install));
    }
  }

  log('');
  if (missingRequired.length === 0) {
    log(paint(GREEN, '  All required prerequisites are present.'));
    log('');
    return 0;
  }

  const n = missingRequired.length;
  log(paint(RED, '  ' + n + ' required prerequisite' + (n === 1 ? '' : 's') +
    ' missing -- install, then re-run.'));
  log('');
  return 1;
}

module.exports = { runCommand, createProbe, collectReport, main };

if (require.main === module) {
  main().then(code => { process.exitCode = code; }).catch(error => {
    console.error(`Prerequisite check failed: ${error.message}`);
    process.exitCode = 1;
  });
}
