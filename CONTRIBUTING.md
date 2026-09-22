# Contributing

> For the separately supplied **local revision source**, use its README and
> `build\Build-Bundle.ps1`. It rebuilds from a verified release snapshot using
> asserted local fixups and its own tests. The source-maintenance instructions
> below describe the original maintainer layout, not that local reconstruction.

Thanks for taking a look. This repository has one unusual rule that is worth reading before you change anything.

**Maintainer reference:** `build`, `payload`, `dist`, and the repository-level `tests` below refer to a source checkout, not the all-in-one user ZIP. Bundle users only need the root [README.md](README.md). Keep a source checkout separately if you intend to change or rebuild the kit.

## Where a change belongs

Most of what ships is **generated**. `dist/` is rebuilt from scratch on every build, so edits made there are silently discarded the next time anyone runs the build.

| You want to change | Edit |
|---|---|
| Microsoft's skill content | asserted fix-ups in `build/Build-Kit.ps1` or `build/upstream-fixups.json` |
| An add-on, launcher, or validator written for this kit | `payload/` |
| Build behaviour or a verification check | `build/Build-Kit.ps1` |
| Bundled examples, workspace preparation, or bundle packaging | `examples/`, `tools/prepare-workspace.mjs`, `build/Build-Bundle.ps1`, `build/bundle-examples.json` |
| Documentation | `README.md`, `GUIDE.md`, `NOTICE.md`, `docs/` |
| Anything in `dist/` | nothing — rebuild instead |

## Issues that belong upstream

This project repackages [microsoft/agent365-skills](https://github.com/microsoft/agent365-skills). If the problem is with what a skill *does* — the questions it asks, the code it generates, the order of its phases — report it at [their issue tracker](https://github.com/microsoft/agent365-skills/issues), not here.

Report here anything about the packaging, the launchers, the prerequisite checker, the build, the add-ons, or the documentation.

If you are not sure which it is, open it here and we will move it.

## Changing Microsoft's skills

Every edit to upstream content is a **fix-up** that names a file, the exact text it expects to find, and the replacement. Packaging/hook adaptations use the `$fixups` array:

```powershell
@{
    File = 'skills\instrument-observability\SKILL.md'
    Find = @'
<the exact upstream text>
'@
    Replace = @'
<the replacement>
'@
}
```

The `Find` block must match upstream exactly. If it does not, the build throws rather than continuing, which is deliberate: an upstream rewording should stop the build loudly instead of producing a patched file that no longer says what we assumed.

SDK/playbook corrections use `build/upstream-fixups.json`, applied **after** consumer Copilot instructions are staged and before payload overlay/discovery copies:

```json
{
  "id": "descriptive-unique-id",
  "path": "skills\\example\\SKILL.md",
  "find": "exact old text",
  "replace": "corrected text",
  "expectedCount": 1,
  "verification": "The exact package versions and executable/source evidence.",
  "note": "Related NOTICE.md section and any limitations."
}
```

Rules run in array order against LF-normalized content. A later rule may match an earlier replacement. `Apply-UpstreamFixups.ps1` verifies **every expected occurrence count before writing any of these replacements**. Do not lower the count or remove an assertion merely to make a newer upstream snapshot build.

Three things are expected of a fix-up:

1. **A comment above it or JSON `note`** naming the defect and the `NOTICE.md` section that documents it.
2. **An entry in [`NOTICE.md`](NOTICE.md)** explaining the failure it prevents, with upstream's own justification where one exists — several fixes exist only to make one language behave the way another already does.
3. **Evidence.** Say how you know. "Compiled and ran", "verified against a live tenant", "read from the shipped SDK source" and "transcribed, not yet run" are all acceptable; leaving it unsaid is not.

Prefer fixing the skill over fixing only the validator. Validator hooks run under Claude Code and nothing else, so a validator-only fix leaves every other CLI unprotected.

## Building

Requires PowerShell 7+, Git and Node.js.

```powershell
.\build\Build-Kit.ps1 -Zip
```

The build fails rather than emitting output it cannot verify. A green build means no dangling path tokens, every referenced path resolves, every bundled JS file parses, the discovery copies match, and every fix-up still matched its upstream text.

`node --check` is not sufficient on its own for validator changes — it accepts code that fails to load as a CommonJS module. Run the validator against a real project before committing.

### Building the all-in-one bundle

```powershell
.\build\Build-Bundle.ps1
node --test .\tests\bundle.test.js .\tests\documentation.test.js .\tests\build.test.js
```

This packages the current `dist` alongside the unified README, example source and lockfiles. It does not download upstream or restore SDKs. Bump `build/bundle.version` for bundle releases; `build/kit.version` remains the independently versioned kit. Existing ZIPs are refused unless `-Force` is explicit. Example files are allowlisted in `build/bundle-examples.json`; add new files there deliberately. Never include `.env`, caches or real generated identity configuration.

The bundle tests build and extract disposable archives, verify all hashes and exact kit bytes, test workspace isolation/refusal cases, and check local documentation links from the extracted root. Sample SDK tests are separate opt-in restores, documented in README; no model or tenant credentials are needed for those offline checks. The Python sample's host/modules and existing SDK tests must remain byte-identical to `tests/upstream-python` unless both copies and their verified contract are deliberately updated.

For a fresh Windows SDK restore and smoke check of all three examples from the actual ZIP (Node 24, .NET SDK 8 and Python 3.12 required):

```powershell
.\tests\bundle-sdk-check.ps1 -Bundle .\agent365-onboarding-bundle-v0.2.0.zip
```

Package downloads need network access; model/tenant transports remain mocked. The script removes its disposable workspaces and virtual environments afterwards.

## Testing a change

After building, run the local regression suite from the repository root:

```powershell
node --test
```

Run a single case or one test file while iterating:

```powershell
node --test --test-name-pattern="quoted exporter" .\tests\validators.test.js
node --test .\tests\build.test.js
```

The suite uses Node's built-in test runner. PowerShell 7 is needed for launcher/build/workflow tests; Git Bash is used for Bash checks on Windows. Distribution and validator tests run against `dist` by default. To test a disposable build instead:

```powershell
.\build\Build-Kit.ps1 -UpstreamPath C:\src\agent365-skills -OutDir .\tmp\test-dist
$env:A365_KIT_TEST_DIR = (Resolve-Path .\tmp\test-dist).Path
node --test
Remove-Item Env:\A365_KIT_TEST_DIR
```

Rebuild after editing `payload` or fix-ups so tests exercise the new packaged files. Build/workflow tests use disposable source copies and mocked Git/GitHub commands; validator fixtures set `VALIDATE_SKIP_EXEC=1` to avoid invoking tenant tools. These tests do not establish that consent, hosting, or a live model integration works.

The runtime suite starts both launchers repeatedly in isolated fixtures to test updates, failure recovery, wiring and prerequisite/version checks. Allow several minutes; it does not launch a real coding assistant or perform live tenant onboarding.

`tests/examples.test.js` exercises the kit-owned reference code offline. Optional real-SDK fixture helpers live alongside it (`examples-sdk-check.js`, `examples-python-sdk.py`, and `examples-dotnet.cs`). Their compilation/HTTP checks are separate from tenant integration; do not describe mocked model, token-exchange, or policy responses as live-service verification. SDK evidence and remaining limits are recorded in `NOTICE.md`, the upstream JSON rules, and `tests/upstream-python/repair-manifest.json`.

After changing a fenced TypeScript example, regenerate its hash-bound JavaScript fixture using Node 24 (Node 22.13+ supports the required API):

```powershell
node .\tests\examples-typescript.js update
node --test .\tests\examples.test.js
```

Normal example tests also run on Node 18 and 20 without silent skips; only fixture regeneration needs the newer TypeScript API. CI pins Node 24 for reproducibility. Java fixture generation supports an isolated Maven compile; the audit compiled all five classes rather than relying only on parser checks.

### Optional pinned Python SDK verification

The six modules in `tests/upstream-python/app` are the generated profile, not substitutes for it. `tests/upstream.test.js` checks their verified LF hashes against the packaged reference fences. The optional SDK suite exercises the actual framework, host, middleware, token lifecycle and MCP transport using local/mocked peers.

Use **Python 3.12** and an isolated dependency directory, not a global install:

```powershell
$deps = Join-Path $env:TEMP ("a365-py-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
python -m pip install --target $deps -r .\tests\upstream-python\requirements-lock.txt
python -I -S .\tests\upstream-python\run_offline.py --deps $deps
```

The audit ran **25 tests in about ten seconds** on Windows ARM64. The runner rejects unexpected dependency versions and external network access; another platform needs compatible wheels. Run it in a managed process with a bounded timeout (90 seconds is ample for the recorded run), stop that specific process if it stalls, and remove the temporary dependency directory afterward. Do not launch a tenant/model session to bypass an offline-test failure.

Validators should be exercised against both the broken and the correct pattern, plus whatever is most likely to produce a false positive. A check that fires on correct code is worse than no check, because it trains people to ignore it.

For skill changes, the meaningful test is a CLI actually reading the skill and producing something that builds and runs.

## Commits

Explain the failure the change prevents, not only the change. The commit log is the record of why the kit differs from upstream, and it is expected to be readable a year later by someone deciding whether to trust it.
