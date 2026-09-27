# Copilot instructions: Agent 365 Onboarding Kit bundle

This folder is an extracted **release bundle** of `AkramMSFT/agent365-sdk-onboarding-experience`. It holds the built drop-in kit (`kit/`), seven starter agents (`examples/`), the workspace tools (`tools/`) and the docs. It is **not** the source repository. `build/`, `payload/`, `build/test-*.mjs` and the CI workflows mentioned in `README.md` and `CONTRIBUTING.md` are not included here.

This file is for working on the bundle itself. `kit/.a365-kit/copilot-instructions.md` is a different file: it is shipped guidance for *consumer* agent projects, and `agent365-kit.ps1 -WireCopilot` appends it to their `.github/copilot-instructions.md`.

## Commands

### From this bundle root

```powershell
node tools/prepare-workspace.mjs --list
node tools/prepare-workspace.mjs --example <id|blank> --destination <NEW dir outside the bundle>
node tools/bulk-onboard.mjs <agents-file> --dry-run      # needs herdr running; see docs/BULK-ONBOARDING.md

# Check every shipped file against BUNDLE-MANIFEST.json (on macOS/Linux, `sha256sum -c SHA256SUMS.txt` does the same)
node -e "const f=require('fs'),c=require('crypto');let bad=0;for(const e of JSON.parse(f.readFileSync('BUNDLE-MANIFEST.json','utf8')).files){const d=f.readFileSync(e.path);if(d.length!==e.bytes||c.createHash('sha256').update(d).digest('hex')!==e.sha256){bad++;console.log('MISMATCH '+e.path)}}console.log(bad?bad+' file(s) differ':'All manifest files match');process.exitCode=bad?1:0"
```

### Example agents

Prepare a workspace first, then run these from inside it (not from `examples/<id>/`). Tests and mock modes make no model or tenant calls. `--live` is opt-in and may be billed.

| Example | Restore | All tests | Single test | Offline demo |
|---|---|---|---|---|
| `nodejs-tool-agent` | `npm ci` | `npm test` | `node --test --test-name-pattern="word counter" sdk-check.mjs` | `npm start` |
| `python-teammate` | `python -m pip install --target deps -r requirements-lock.txt` | `python -I -S run_offline.py` | `python -I -S run_offline.py --pattern test_mcp_contracts.py` | `python demo.py "Hello Agent 365"` |
| `dotnet-tool-agent`, `dotnet-agent365-lab` | `dotnet restore --locked-mode` | `dotnet run -- --self-test` (there is no test project) | n/a | `dotnet run -- --mock "Hello Agent 365"` |
| `java-tool-agent` | (online, via Maven) | `mvn test` | `mvn "-Dtest=AgentTest#wordCount" test` | `mvn exec:java "-Dexec.args=--mock Hello Agent 365"` |
| `go-tool-agent` | none (stdlib only) | `go test` | `go test -run TestWordCount` | `go run . --mock "Hello Agent 365"` |
| `rust-tool-agent` | (online, via Cargo) | `cargo test --locked` | `cargo test --locked word_count` | `cargo run --locked -- --mock "Hello Agent 365"` |

`python -I -S` is required, because `run_offline.py` refuses to run with global site-packages. It blocks non-loopback networking and fails unless it reports `NETWORK_GUARD_BLOCKS=0`. `dotnet-agent365-lab` also has the offline `.\Test-Agent365TokenPlan.ps1`. Its `--a365`, `--a365-check`, `--dlp-check`, `--teams` and `--mail-*` modes need tenant configuration, and some also need a model key.

### Kit helpers (run from a prepared workspace or agent project root; they resolve paths from the cwd)

```powershell
node .a365-kit/doctor.js [--json] [--quiet] [--setup]       # prerequisite check; exits 1 only if a required tool is missing
node .a365-kit/hooks/stop/validate-<skill>.js               # one stop-hook validator against the cwd project
node .a365-kit/local-work.mjs status|timings|clear|run <profile> [--force]
node .a365-kit/grant-observability.mjs --check              # read-only; --grant needs an admin signed in to az
node .a365-kit/run-a365.mjs setup <subcommand> ...          # wraps the a365 CLI; only forwards `setup`
```

### Source repository only (from CONTRIBUTING.md; not runnable here)

```powershell
.\build\Build-Kit.ps1 -UpstreamRef <upstreamCommit> -Zip    # add -BuiltUtc "<builtUtc>" for a byte-identical rebuild
.\build\Build-Kit.ps1 -UpstreamPath C:\src\agent365-skills  # build from a local upstream clone
node build/check-examples.mjs
node --test build/test-doctor.mjs build/test-local-work.mjs build/test-grant-observability.mjs build/test-bulk-onboard.mjs
node --test --test-name-pattern="duplicate commands" build/test-doctor.mjs   # single test
```

Take `upstreamCommit` and `builtUtc` from `kit/.a365-kit/KIT-VERSION.json`. Pass `builtUtc` as the exact recorded string, not as a converted PowerShell date. Requires PowerShell 7+, Git and Node.js.

## Architecture

- **Repackaging pipeline.** Microsoft publishes `microsoft/agent365-skills` as a Claude Code plugin. The build clones upstream at the recorded commit and applies asserted fix-ups. It then overlays the kit-authored `payload/` and emits `kit/`, `BUNDLE-MANIFEST.json`, `SHA256SUMS.txt` and two zips: a kit-only zip for extracting into an existing project, and this bundle. The version must agree across `build/kit.version`, `KIT-VERSION.json`, the manifest's `kitVersion`/`bundleVersion` and the `v<version>` tag.
- **`kit/` becomes the root of a consumer agent project** when extracted:
  - `.a365-kit/` is the canonical copy:
    - `skills/`: Microsoft's 8 skills.
    - `addons/`: the kit's 7 add-ons.
    - `shared/`: cross-skill docs. `agent-detection.md` sets the stack-detection rules. `local-runtime-lessons.md` holds verified corrections that override older snippets inside the skills. `local-work.md` covers local detection resume and reuse of restore/build results.
    - `hooks/`: validators and their libraries.
    - `lib/`: shared modules.
    - Helper scripts.
    - `KIT-VERSION.json`: lists the skills and add-ons, which tells `-Update` which folders the kit owns.
  - `.claude/skills/` (Claude Code) and `.agents/skills/` (Copilot, Cursor, Codex, Gemini CLI and others) are **byte-identical, flattened copies** of `.a365-kit/skills/*` plus `.a365-kit/addons/*`, 15 skills in total. One copy can serve every CLI only because each in-skill reference is a project-relative `.a365-kit/...` path.
  - `agent365-kit.ps1` / `agent365-kit.sh` are the launchers: prerequisite check, CLI detection, `-WireCopilot`, `-WireClaudeHook` and `-Update`. The update source resolves from `-UpdateFrom`, then `A365_KIT_UPDATE_SOURCE`, then `a365-kit.config.json`, then `KIT-VERSION.json`'s `updateSource`, then the public release.
- **Skill routing.** `a365-setup` is the entry point. It hands off to `make-ai-teammate` (AI Teammate) or `make-a365-agent` (blueprint, OBO or S2S). Those continue into `instrument-observability` and `add-workiq-tools`; Work IQ is skipped for S2S. `test-local`, `a365-code-validator` and `purview-dlp-integration` are standalone. Setup writes `.a365-workspace-detection.local.json` in the agent project. Later skills and validators read that file, and code-edit phases must not run without it.
- **Hooks.** Each `SKILL.md` front matter declares a `preToolUse` path guard (`hooks/preToolUse/path-guard.js`) and a `stop` validator (`hooks/stop/validate-<skill>.js`). **Only Claude Code executes hooks.** Every other CLI gets the skills but no end-of-session check. `settings-fragment.json` adds an optional SessionStart version notice (`kit-version.js`).
- **Workspace tools.**
  - `prepare-workspace.mjs` copies `kit/**` with the `kit/` prefix stripped, plus `examples/<id>/**` with its own prefix stripped, into a NEW directory. It verifies each file's byte count and SHA-256 against the manifest, refuses destinations that exist or overlap the bundle, and writes a `.gitignore` only when the example doesn't ship one.
  - `bulk-onboard.mjs` reuses `loadManifest` and the same integrity rule for `--install-kit`, drives herdr, and records state in `.a365-bulk-onboard.json` next to the agents file.
- Running a CLI at this bundle root does **not** load the kit's skills, because they sit under `kit/`. To exercise a skill, prepare a workspace and start the CLI there.

## Conventions

### Where a change belongs

`kit/`, `BUNDLE-MANIFEST.json` and `SHA256SUMS.txt` are generated. Make lasting changes in the source repository:

| Change | Where |
|---|---|
| Microsoft skill content | a fix-up in `build/upstream-fixups.json`, or a packaging fix-up in `build/Build-Kit.ps1` |
| Add-ons, launchers, validators, helpers | `payload/` |
| Examples and tools | `examples/`, `tools/`, and the catalog in `build/bundle-examples.json` |
| Docs | `README.md`, `GUIDE.md`, `NOTICE.md`, `docs/` |

The top of `NOTICE.md` is the authoritative list of which kit files are kit-authored and which come from upstream. Problems with what a skill *does* belong upstream at `microsoft/agent365-skills`. Problems with packaging, launchers, the checker, add-ons or the build belong in this repository.

**Every file in this bundle is listed in the manifest**, docs included. Editing a file under `kit/` or `examples/<id>/` makes `prepare-workspace.mjs` (and `bulk-onboard.mjs --install-kit`, for kit files) fail with `Bundle integrity check failed: <path>` until the build regenerates the manifest. New unlisted files, including this one, are ignored by those tools.

### Fix-ups to upstream text

- Each fix-up's `find` must match upstream exactly, and `expectedCount` must equal the actual match count. A mismatch fails the build on purpose.
- Anchor on the smallest unique span of upstream text, never on text another fix-up wrote.
- Each fix-up needs three things:
  1. A comment naming the defect and its `NOTICE.md` section.
  2. A `NOTICE.md` entry describing the failure it prevents.
  3. Stated evidence, such as "compiled and ran", "verified against a live tenant", "read from the shipped SDK source" or "transcribed, not yet run".
- Prefer fixing the skill over fixing only a validator. Validators only run under Claude Code.

### Path and namespace invariants

- `${CLAUDE_PLUGIN_ROOT}` and `/agent365:` must not appear anywhere except `NOTICE.md`. The build fails if they survive.
- Paths in skill bodies are `.a365-kit/...`.
- Hook commands are `node "${CLAUDE_PROJECT_DIR}/.a365-kit/hooks/..."`, quoted so paths with spaces work.
- Skills are invoked as `/<name>`.

### Validators (`kit/.a365-kit/hooks/stop/*.js`)

- **Contract.** CommonJS, run with the agent project as the cwd. Write `{"ok":true}` or `{"ok":false,"reason":"..."}` to stdout and exit 0 or 1.
- **Shared libraries.** Use `hooks/lib/project-scan.js` for the single tree walk; it skips hidden directories and build output. Use `hooks/lib/env-config.js` for active `.env` values, which ignores comments and `.example` files when a real `.env` exists.
- **`VALIDATE_SKIP_EXEC=1`** skips `a365` and build execution for offline tests. Never use it as a speed-up.
- **Test against three cases:** the broken pattern, the correct pattern, and whatever is most likely to cause a false positive. A check that fires on correct code is worse than no check. `node --check` is not enough, because it accepts code that fails to load as CommonJS; run the validator against a real project.
- **Module formats.** Write new shared modules as `.cjs` and ESM entry points as `.mjs`, as `lib/local-work.cjs` and `local-work.mjs` do. Consumer projects may declare `"type": "module"`.

### Helper CLIs

- Offline tests rely on injectable dependencies: exported `main(argv, deps)` and functions that take injected `run`, `start`, `herdr` or `log` callbacks.
- Exit codes are contracts:
  - `run-a365.mjs` preserves CLI failures. It returns `2` when the `maven-prod` / `Agent365.Observability.OtelWrite` admin hand-off is pending, even if `a365` exited 0.
  - `grant-observability.mjs`: `0` ok, `2` usage, `3` missing, `4` grant incomplete.
  - `bulk-onboard.mjs`: `0` ok, `2` usage, `3` partial.
- `doctor.js` runs at most 4 probes at once and masks the tenant id, because it often runs on a screen share.
- `kit-version.js` must never fail or block a session.

### Launchers

- Keep `agent365-kit.ps1` and `agent365-kit.sh` at parity (`-WireCopilot` ↔ `--wire-copilot`, and so on).
- The `.ps1` launcher must run under both Windows PowerShell 5.1 and 7, and must never write a BOM; CI checks both.
  - Use its `Read-KitText`, `Write-KitText` and `ConvertFrom-KitJson` helpers.
  - Never use `-Encoding UTF8` or `ConvertFrom-Json -AsHashtable` directly.
- `-Update` treats the archive as untrusted. It replaces only kit-owned paths and never touches the agent, `.env`, config or `.claude/settings.json`.
- `agent365-kit.sh --update` must keep working on minimal Linux: without `curl`/`wget` it downloads with Node's `fetch`, and without `unzip` it extracts with the embedded Node extractor (GNU tar cannot read zips). Node is the one tool guaranteed present.
- Zips built on Windows drop the executable bit, so `prepare-workspace.mjs` and `bulk-onboard.mjs --install-kit` write `agent365-kit.sh` as `0755`, and the docs tell macOS/Linux users to `chmod +x` after `unzip`.
- Every shipped `.ps1` is BOM-less UTF-8, so keep string literals ASCII. Windows PowerShell 5.1 reads BOM-less scripts as Windows-1252, where a UTF-8 em dash ends in byte 0x94, a closing quote, and the script no longer parses (`NOTICE.md` section 23). Parse-check with `powershell.exe` as well as `pwsh`.

### Line endings

Set in `.gitattributes`:

- `*.sh`, `*.js`, `*.cjs` and `*.mjs` are LF. A CRLF shebang breaks bash.
- `*.ps1` is CRLF.
- Manifest-listed paths are `-text`, so their bytes and hashes survive checkout on every platform.

### Examples

- **Offline first.** Tests use in-memory models and loopback HTTP only.
- **Providers.** `MODEL_PROVIDER` is `mistral`, `openai` or `gemini`. Never reuse one provider's key for another. The Java, Go and Rust examples read process environment variables only; they do not load `.env`.
- **Pinned dependencies.** Keep them pinned (`packages.lock.json` with `--locked-mode`, `requirements-lock.txt`, `package-lock.json` with `npm ci`, `Cargo.lock` with `--locked`). Don't bump to latest.
- **Frameworks.** Keep each example's framework. The Java example is not LangChain4j. Go and Rust are manual-integration stacks, so don't regenerate them in another language.
- **Adding an example.** The id must match `^[a-z0-9-]+$` and live at `examples/<id>`. Its files must not collide with kit files at the workspace root. It also needs a catalog entry and a row in `docs/AGENT-EXAMPLES.md`.

### Claims and secrets

- **Local success is not proof of onboarding.** A passing offline test, an HTTP 200, an exporter 200 or a validator reporting `ok` on Go or Rust says nothing about tenant registration, consent, Teams delivery or telemetry ingestion. Don't claim any of those without live evidence.
- **Never commit** `.env`, `a365.generated.config.json`, `.a365-workspace-detection.local.json`, `.a365-tokens.local.json` or `.a365-runtime.local.json`. Never invent tenant, blueprint or object ids.
- **Commit messages** explain the failure the change prevents, not only the change.
