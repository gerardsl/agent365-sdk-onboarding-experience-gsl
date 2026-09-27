# Local resume, restores and compiler checks

These operations optimize local work only. A receipt never proves registration,
consent, identity, Teams delivery, telemetry delivery or policy enforcement.
Keep every existing capability check, authentication choice and approval gate.

## Refresh local detection without provisioning

Run from the agent workspace:

```powershell
node .\.a365-kit\local-work.mjs status
```

On macOS/Linux use the corresponding `.a365-kit/local-work.mjs` path.

`unchanged` permits reuse of only `agentStack`, `programmingLanguage` and
`usesTeamsOrCopilot`. `missing` or `refresh-required` means classify the local
project again; elapsed time alone does not invalidate it. An invalid metadata
error also requires local repair. None of these results means a blueprint was
deleted or that setup must provision a new identity.

When local refresh is needed:

1. Follow `.a365-kit/shared/agent-detection.md` and `a365-setup` Phase 1A's
   language/framework/CEA detection rules, including unsupported-stack guards.
   Preserve the existing framework. Confirm ambiguous or changed classification
   with the user; never invent defaults.
2. Re-evaluate the composite capability signals before making skip decisions:
   observability needs initialization, token resolution and handler scopes;
   Work IQ needs a nonempty manifest and framework wiring, plus Word mention
   wiring where required. A resume receipt never substitutes for these checks.
3. Merge confirmed local facts and freshly recomputed composite flags into
   `.a365-workspace-detection.local.json`.
   Preserve explicit capability, authentication, hosting and reuse choices.
   Do not reset them, infer tenant completion, or invent identifiers. Re-read
   actual a365 configuration rather than trusting cached blueprint fields.
4. After fresh detection and its required confirmation, run:

   ```powershell
   node .\.a365-kit\local-work.mjs record
   ```

   This records a fingerprint of local inputs and classification, not their
   contents, and does not modify the detection JSON. Never use `record` merely
   to make a stale or incomplete classification look current.
5. Return to the calling skill's existing kind/authentication and blueprint
   verification gates. If registration is genuinely absent and the selected
   capability requires it, use the normal approved `a365-setup` flow. Do not
   invoke provisioning because the local snapshot was missing or old.

If Node or local receipt storage is unavailable, report that reuse is unavailable
and perform the normal local detection directly. Valid, confirmed detection
metadata must still exist before code edits. Install Node only with the existing
approval flow. Do not replace a failed local refresh with assumed success.

## Shared restore and build execution

Run the existing approved work through the profiles below. Package additions
still change the dependency manifest and invalidate relevant results; do not
skip those additions or combine unrelated user approvals.

| Profile | Work performed |
| --- | --- |
| `dotnet-restore` | `dotnet restore` |
| `dotnet-build` | `dotnet build --no-restore -v minimal` |
| `npm-install` | `npm install` |
| `typescript` | `npx --no-install -p typescript tsc --noEmit` (fails fast when TypeScript is not installed locally) |
| `node-build` | Existing `build` script, otherwise `compile`, otherwise TypeScript |
| `python-restore` | Active Python's pip, using `requirements-lock.txt`, then `requirements.txt`, otherwise the project |
| `uv-sync` | Existing `uv sync` workflow, executed fresh |

For example:

```powershell
node .\.a365-kit\local-work.mjs run dotnet-restore && node .\.a365-kit\local-work.mjs run dotnet-build
```

Restores retain installation approval requirements. A failed command remains
nonzero and its output is shown; do not invoke a different build to hide failure.
Python import checks and all feature-specific validators still run. The three
hosting/observability/Work IQ validators share only their compiler execution.
Do not enable `VALIDATE_SKIP_EXEC` to obtain a speedup.

Reuse requires unchanged source/configuration, dependency contents, installed
artifacts, toolchain reports and process environment. Failed results are never
cached. Fingerprinting adds work to the first execution; savings come from
repeated checks. Later checks re-read only files whose identity, size,
timestamps or mode changed, as git does; files changed within two seconds of
being read are always read again, and the digest cache holds only digests.
Cheaper reasons to skip reuse are checked before any file is hashed.
Use the timing history to assess the actual project.
Missing artifacts, custom MSBuild inputs or package build extensions, external links/configuration,
install lifecycle scripts, unpinned/global Python environments and unsupported
or oversized input inventories prevent reuse; the original command still runs.
Arbitrary npm build scripts and uv synchronization always run. Plain `tsc`
scripts can reuse their own successful results, without conflating emit and
no-emit checks. Concurrent validators coordinate through a workspace-local lock
in the current user's cache.

Use `--force` or `A365_LOCAL_WORK_FORCE=1` to execute fresh. CI always executes
fresh. Explicit registry/audit refresh requests must also use `--force`: local
receipts do not assert that remote package advisories are current.
Use the original approved command directly if local state storage cannot
be used; do not declare a build successful because the helper was unavailable.

## Timings and reset

```powershell
node .\.a365-kit\local-work.mjs timings
node .\.a365-kit\local-work.mjs clear
```

Receipts live outside the project, under the current user's
`.cache\agent365-onboarding` directory, separated by a hash of the real workspace
path. The last 100 local-operation timings contain only stage, outcome, duration
and timestamp. Receipts store digests, not file contents, environment values,
identifiers, command output or credentials. These timings do not measure model
thinking or tenant-service waits.

`clear` removes only this workspace's receipts and timing history, never agent
files or tenant configuration. Interrupted-process locks are recovered only when
their owner has exited; a live owner is not bypassed.
