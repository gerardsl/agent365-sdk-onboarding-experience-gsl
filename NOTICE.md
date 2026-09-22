# Attribution and modifications

## Observability access-package recovery: local revision 0.2.3

Added the requested recovery for this exact reported setup message:

```text
Custom permission configuration requires tenant admin action.
An administrator must grant the blueprint consent for maven-prod [Agent365.Observability.OtelWrite] via the Entra portal.
```

The access-package recipe is Resource `maven-prod`, Type `OAuthApplication`,
Sub Type `API`, Role `Agent365.Observability.OtelWrite`, then an initial policy,
assignment to the intended blueprint, and a wait for assignment status **Delivered**.
The exact resource labels come from the operator's reported recovery requirement.
Microsoft's agent access-package, API resource-role and assignment documentation
supports the governance/assignment model and distinguishes approval from delivery.

The installed `a365` binary is not modified. The new kit-owned
`.a365-kit/run-a365.mjs` forwards approved setup commands and emits this handoff
on the resource-specific message; zero becomes pending-action exit 2 only for that
message, and other nonzero statuses are preserved. No retry, output log file,
automatic assignment or consent occurs. Output is piped, so TTY-sensitive CLI
behavior may differ from invoking `a365` directly.

Assertions in `build/local-fixups.json` add the recovery to canonical setup,
provisioning and instrumentation skills and consumer instructions. Both discovery
trees are generated from the canonical files. Launchers advertise the runner.
All seven examples remain unchanged from the preceding customer archive.
The customer README's current-version/extraction instructions are updated for this
new archive rather than pointing customers at the historical v0.2.0 baseline.

Offline evidence: `tests/consent-recovery.test.mjs` covers exact/colored/chunked and
large-output recognition, unrelated-error negatives, argument preservation,
no shell expansion, original-output/nonzero preservation, pending-zero handling,
missing CLI handling, unchanged generated files and all prepared example layouts.
Packaging tests validate generated hashes, refusal semantics and discovery equality.
No customer tenant was modified and no live Delivered assignment is claimed.

## Additional language examples: local revision 0.2.2

Java, Go and Rust console tool agents were added without altering the original
three examples or changing the extended .NET runtime's tenant behavior.
Each uses a bounded model/tool/model loop with count/reverse tools, an offline
default and explicit provider-specific credentials for live inference.
Java dependencies/plugins are versioned, Go uses only its standard library,
and Rust includes Cargo.lock and a dependency-compatible minimum compiler version.

Validation uses isolated toolchains (Go 1.27.1, Microsoft JDK 21.0.12.1/Maven 3.9.11,
Rust 1.98.1 with a portable GNU linker on Windows). Tests exercise Unicode tools,
provider-key isolation, loop limits and loopback HTTP contracts. No live inference
or tenant onboarding was performed for these new examples. Toolchain binaries and
dependency caches are not included in the user bundle.

The catalog marks Java/Go/Rust as requiring deliberate/manual integration.
An unknown-language kit validator returning ok is not evidence that these agents
are registered, authenticated, Teams-hosted or governed. See docs/AGENT-EXAMPLES.md.

## Local revision 2026-09-15

This is a local release-snapshot revision, not an official maintainer release.
Base bundle SHA-256:
`7e37426889aab4584227268f50f1e847d3ba0f63c81b2df85cf737e835a7d143`.
The matching maintainer packaging/test source was unavailable; the local source
deliverable records its own importer, asserted fixups, allowlist, builder and tests.

The original three examples are preserved. An optional `dotnet-agent365-lab` example
generalizes the executable patterns developed during a local onboarding exercise.
No tenant, operator, mailbox, tunnel, message ID or credential from that exercise
is included. Microsoft resource identifiers and clearly synthetic test fixtures
remain where required by the protocols.

Changes prevent confusing blueprint/child/user/client identities, expiry being
misdiagnosed as licensing, generated endpoint settings overriding runtime identity,
JWT being disabled by generated Development configuration, MCP name collisions,
unsafe development TLS behavior, false observability failures from bootstrap-file
layout, and claiming delivery/enforcement from an incomplete proxy check.
The guide also distinguishes device-code support and active/PIM roles per command.

Upstream snapshot changes are applied by `build/local-fixups.json` with exact
occurrence assertions. The .NET auth reference now fails if its token-validation
section is missing and does not honor an Enabled=false bypass. The observability
validator scans non-test C# bootstrap modules/local settings; JSON log-category
absence is advisory rather than a false assertion that Defender delivery cannot occur.
Canonical skills/add-ons are copied byte-for-byte into both discovery trees at build.

Evidence: .NET 8 / Windows ARM64 offline SDK checks cover function loops, MSAL OBO
requests, identity boundaries, fail-mode behavior, transport limits and tool naming.
Prior live checks established a single user's Teams reply, Work IQ discovery,
agent-user mailbox sending, successful telemetry receipts and a synthetic prompt
block. An external email accepted by the recipient server was found in Junk,
demonstrating why SMTP handoff is not Inbox placement. Generic provider selection
and packaging safeguards are tested offline in this revision.

No claim is made that this revision eliminates external licensing, consent, service
availability, PIM expiry, recipient filtering, policy propagation or billing issues.
It is not a multi-user production deployment or evidence of universal response DLP.
See `docs/LOCAL-REVISION.md` for the supported path and verification boundaries.

## Bundled third-party content

This kit redistributes **[microsoft/agent365-skills](https://github.com/microsoft/agent365-skills)**.

> Copyright (c) Microsoft Corporation.
> Licensed under the MIT License.

The bundled version and the exact upstream commit are recorded in `.a365-kit/KIT-VERSION.json` in every build.

The skills under `.a365-kit/skills/`, shared references, original hooks, and staged `.a365-kit/copilot-instructions.md` originate upstream. Kit-authored files come from `payload/`: add-ons and their validators, `hooks/lib/env-config.js`, `doctor.js`, `kit-version.js`, `settings-fragment.json`, the two launchers, and `AGENT365-KIT-README.md`. `KIT-VERSION.json` is generated by the build.

---

## Modifications made when repackaging

The goal is a faithful repackage with explicit, narrowly scoped correctness fixes. Packaging adaptations and behavior changes are recorded below and applied mechanically by `build/Build-Kit.ps1`. SDK/playbook repairs are recorded in `build/upstream-fixups.json`, with evidence there and in the shared Python profile manifest under `tests/upstream-python`; `build/Apply-UpstreamFixups.ps1` checks their exact occurrence counts after Copilot guidance is staged. Assertions stop the build when upstream no longer matches a patch.

### 1. `${CLAUDE_PLUGIN_ROOT}` path tokens

`${CLAUDE_PLUGIN_ROOT}` is set by the host only when skills load as a plugin. In a drop-in install it is unset, so every path built from it resolves to nothing.

Because `.a365-kit/` mirrors the upstream layout exactly (`skills/`, `shared/`, `hooks/`), one substitution fixes every in-body reference:

```
${CLAUDE_PLUGIN_ROOT}/shared/agent-detection.md   ->   .a365-kit/shared/agent-detection.md
```

These are prose instructions the model resolves with its own file tools, and a project-relative path works regardless of whether the host expands variables in skill content.

### 2. Hook commands

Hook `command:` values are executed by the host, so they need an absolute path. These get `${CLAUDE_PROJECT_DIR}` instead, which Claude Code expands reliably, quoted so paths containing spaces survive:

```yaml
# before
command: node ${CLAUDE_PLUGIN_ROOT}/hooks/stop/validate-a365-setup.js
# after
command: node "${CLAUDE_PROJECT_DIR}/.a365-kit/hooks/stop/validate-a365-setup.js"
```

### 3. `path-guard.js` — restoring a guard that would otherwise disable itself

Upstream refuses writes inside `CLAUDE_PLUGIN_ROOT`, so skills cannot rewrite their own instructions. That check is conditional on the variable being set:

```js
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT
  ? safeRealpath(path.resolve(process.env.CLAUDE_PLUGIN_ROOT))
  : null;   // <- drop-in install lands here; the guard silently switches off
```

The kit adds a fallback to the kit folder inside the project. The environment variable is still honoured first, so the file behaves identically if it ever *is* loaded as a plugin. The block message was updated to name the kit folder rather than an environment variable the user never set.

This restores a protection lost by drop-in installation. Verified with four cases: writing into the kit blocks, writing outside the project blocks, writing to agent source is allowed, and non-write tools pass through. Additional boundary fixes and regression coverage are recorded in section 15.

### 4. `/agent365:` command namespace

Upstream instructs the user to re-run skills as `/agent365:<name>`. That namespace is created by installing the plugin. Project skills are invoked as `/<name>`, so `/agent365:make-ai-teammate` becomes `/make-ai-teammate`. CLIs other than Claude Code use trigger phrases and ignore slash commands entirely.

This is applied to reference docs and validator scripts as well as `SKILL.md` files, because the validators print these strings back to the user in failure messages.

### 5. `scripts/check-version.js` replaced

Upstream's version check tells the user to run `gh skill add microsoft/agent365-skills` — the install path this kit exists to avoid. It is replaced by `kit-version.js`, which reports when Microsoft has published a newer skills release than the bundled one and points at re-downloading the kit. It is optional, silent when up to date or offline, and never blocks a session.

### 6. `copilot-instructions.md` relocated

Staged at `.a365-kit/copilot-instructions.md` rather than shipped at `.github/copilot-instructions.md`. That file is commonly project-owned, and an archive extraction would overwrite it with no warning. The launcher's `-WireCopilot` flag creates it, or appends to an existing one. Its relative links are repointed from `../plugins/agent365/...` to `../.a365-kit/...` so they resolve from `.github/`.

### 7. One wording fix-up

`a365-code-validator/SKILL.md` explains how to run its validator "from the plugin source", with a fallback for when the runtime cannot expand `${CLAUDE_PLUGIN_ROOT}`. After the substitution in (1) that passage no longer parses as English. It is rewritten to describe running from the project root, with an absolute-path fallback.

The build asserts this passage still matches upstream before patching it, so an upstream rewording fails the build rather than shipping a broken instruction.

### 8. `validate-make-ai-teammate.js` — one bug fix

This is an early behavior fix, rather than a path adaptation. Later behavior corrections are recorded separately below.

Upstream's `validate-make-ai-teammate.js` detects a Python project **only** by the presence of `pyproject.toml`:

```js
const hasPyproject  = fs.existsSync(path.join(cwd, 'pyproject.toml'));
```

Every sibling validator (`validate-instrument-observability.js`, `validate-add-workiq-tools.js`, `validate-test-local.js`, `validate-a365-code-validator.js`) accepts `requirements.txt` as well, and so does the skills' own stack detection. The result is that a `requirements.txt`-only Python project falls through to the Node.js default and fails eight TypeScript checks that do not apply to it — `src/index.ts not found`, `package.json not found`, `tsconfig.json not found`, and so on.

In Claude Code this validator runs as a **stop hook that refuses to end the session** until it passes, so a false negative is not cosmetic: it blocks the session. Three checks in this one file assume a layout that upstream's own `make-ai-teammate` skill does not enforce when it edits an existing project:

| Check | Upstream assumption | What the kit accepts instead |
|---|---|---|
| Language detection | Python ⇔ `pyproject.toml` exists | `pyproject.toml` **or** `requirements.txt`, matching every sibling validator |
| Check 2, `agent.py` | Must be at the project root | Root, or anywhere in the scanned tree (e.g. `src/agent.py`) |
| Check 4, dependencies | Read from `pyproject.toml` only, underscore-only names | `pyproject.toml` or `requirements.txt`, whichever exists; hyphen and underscore forms compared as equal, as pip treats them |

Without the first fix a `requirements.txt` project falls through to the Node.js default and fails eight TypeScript checks. With only the first fix, Check 4 would then read a `pyproject.toml` that does not exist. So the three are applied together. The *content* of each check — what must be present in `agent.py`, which packages are required — is unchanged.

Found 2026-09-03 while onboarding an existing Python / OpenAI Agents SDK project (`src/` layout, `requirements.txt`) through the kit: the skill adapted to the layout correctly and the validator then reported it as a failed Node.js project. Reported upstream.

### 9. `validate-instrument-observability.js` — exporter value, not just presence

The `a365` CLI stamps `ENABLE_A365_OBSERVABILITY_EXPORTER=false` into `.env`, and `instrument-observability` has an explicit invariant not to overwrite an existing value ("Preserve existing values … Add only missing keys"); it is meant to *warn* instead. Upstream's validator then checks only that the key **exists**:

```js
const hasEnvConfig = envFiles.some(f => fileContains(f, 'ENABLE_A365_OBSERVABILITY_EXPORTER'));
```

For an environment-controlled exporter, an agent with the exporter switched off consequently passes validation as fully instrumented without exporting its spans.

The kit initially added a `true` value check. The September audit refines it to account for actual SDK precedence: Node explicit `enableObservabilityExporter` options override the environment; Python combines `a365_enable_observability_exporter` and the environment flag with OR. A false `.env` therefore does **not** establish that export is disabled when code explicitly enables it. The current check accepts a recognized code enable signal or an effective environment enable signal, and does not claim ingestion was verified.

Found 2026-09-04 after several hours of live Teams traffic produced no activity. The instrumentation was correct throughout; only the last hop was disabled.

### 10. `instrument-observability/SKILL.md` — the skill now sets the exporter, not just reports it

Section 9 makes a disabled exporter visible. This makes the skill fix it.

Invariant 1 told the skill to preserve an existing `ENABLE_A365_OBSERVABILITY_EXPORTER`, and rule 6 told it to report that value back to the user when it was `false`. Because `a365 setup` stamps the key as `false` before this skill ever runs, the key always exists, so the preserve branch always won. The outcome of "add observability to my agent" was an agent correctly instrumented, building a span per turn, exporting none of them, with the fact recorded in one line of a long completion summary.

For the Agent 365 export target, the kit rewrites three passages in the Node.js / Python path:

| Passage | Upstream | Kit |
|---|---|---|
| Invariant 1 | Preserve an existing exporter value | Preserve every value **except** the exporter switch; set that to `true` and say so |
| Rule 6 | Tell the user it is off and how to turn it on | Tell the user it was off and that you turned it on, and to restart |
| Phase 9 next steps | "Enable exporting when ready for production" | "Confirm the exporter is still on — a later `a365 setup` run can reset it" |

Upstream's own .NET path already does exactly this. Invariant 3 reads: *"`EnableAgent365Exporter: true` at the root. `a365 setup` may write `false`; this skill corrects it."* The Node.js and Python branches were inconsistent with .NET on the same decision, and the kit makes them agree.

An explicitly selected local/console-only target must instead preserve that choice and disable the remote exporter using the SDK's effective settings; section 18 records that correction. This matters outside Claude Code too: only Claude Code automatically runs the stop hooks, so correcting the skill itself is necessary for other CLIs.

Found and fixed 2026-09-04, alongside section 9. Reported upstream.


### 11. `references/python-observability.md` — the OBO token resolver must be synchronous

The Python OBO sample wires the exporter's token resolver like this:

```python
a365_token_resolver=_token_cache.get_observability_token,
```

`AgenticTokenCache.get_observability_token` is declared `async def`, and the exporter calls the resolver synchronously from its own batch-export thread:

```python
return self._token_resolver(agent_id, tenant_id)
```

So it receives an un-awaited coroutine rather than a token. The next guard is `if not token:` — and a coroutine object is **truthy**, so the one check that would have caught this passes. The exporter then builds `f"Bearer {token}"`, sending the literal text `Bearer <coroutine object AgenticTokenCache.get_observability_token at 0x...>`. The service cannot read a tenant out of that and answers:

```json
{"code":"EndpointInvalid","message":"Tenant id  is invalid.","innererror":{"code":"TenantIdInvalid"}}
```

The blank in *"Tenant id  is invalid"* is the tell: the tenant is unreadable, not absent from the agent's configuration. Chasing the configured `TENANTID` — which is correct — leads nowhere.

Upstream's own documentation already says what the contract is. Its kwarg table describes `a365_token_resolver` as a *"Sync callable `(agent_id, tenant_id) -> str | None`"*, and its S2S sample passes a sync lambda correctly. Only the OBO sample is wrong, and `AgenticTokenCache` exposes no sync accessor, so that sample cannot work as written.

The kit replaces it with a bridge that marshals the coroutine onto the host's event loop via `run_coroutine_threadsafe` and returns `None` on failure, so a telemetry fault never costs a turn. It is applied in three places, because any one alone leaves a way through:

| Where | Why it is needed |
|---|---|
| `references/python-observability.md` | The code the skill copies from. Also shows where to capture the loop — the per-turn handler the skill already wraps with `InvokeAgentScope`, so nothing outside the skill's own edits has to change. |
| `SKILL.md` | Read before any reference doc, and it stated the broken wiring outright. Fixing only the reference leaves the model with a contradiction and the wrong instruction first. |
| `validate-instrument-observability.js` | Catches the pattern in code already written, including agents onboarded before this kit version. Matches `a365_token_resolver=` bound directly to `get_observability_token`; the bridge mentions the same symbol and is correctly ignored. |

Leaving the captured loop unset prevents token resolution. The September audit also found disconnected cache producer/consumer wiring and a released-SDK `TokenResponse` normalization requirement; a synchronous bridge alone does not solve those problems. See section 18.

Found 2026-09-04 on a live Python OBO agent: the agent answered normally in Teams while every export was rejected. Verified fixed against the same tenant — `HTTP 200`, three spans, all sinks accepting. Reported upstream.


### 12. `instrument-observability` — the Node.js OBO path

Section 11 is Python-only. Node.js does not share that defect: its `AgenticTokenCacheInstance` splits the work that Python collapses into one `async def`, and the shipped types confirm the split.

```ts
getObservabilityToken(agentId, tenantId): string | null;   // sync cache read — the resolver
refreshObservabilityToken(...): Promise<void>;             // async, awaited once per turn
```

Passing the sync getter as `tokenResolver` is therefore correct on Node. But the split creates a different failure with the same outcome — an agent that traces and exports nothing — and `SKILL.md` walks into it twice.

**The cache is only filled per turn.** `tokenResolver` reads a cache that nothing populates unless `refreshObservabilityToken` is called at the start of each handler turn. Miss it and the resolver returns `''` on every export. Upstream instructs the call in Phase 4 and names the symptom in its own troubleshooting table, so this one is documented — but nothing verified it, and the two halves live in different phases.

**The method name is wrong in `SKILL.md`.** It writes `AgenticTokenCacheInstance.RefreshObservabilityToken` — PascalCase, in the Phase 4 code sample a CLI copies verbatim. The shipped API is `refreshObservabilityToken`, camelCase since GA 1.0, which upstream's own reference doc states explicitly at the top of its auth table. The PascalCase name is `undefined`, so the call throws a `TypeError` on the agent's first turn. Both occurrences are corrected.

The kit adds two validator checks for the OBO path: a `tokenResolver` reading the cache with no `refreshObservabilityToken` anywhere, and the PascalCase spelling. Verified across three states — refresh missing, refresh misspelled, refresh correct.

Found 2026-09-04 while confirming whether the section 11 fix left Node.js exposed. Reported upstream.


### 13. `validate-instrument-observability.js` — the .NET branch

.NET does not share the section 11 defect either, and this was verified by reflecting over the shipped assemblies rather than reading the docs:

```
delegate AsyncAuthTokenResolver(String agentId, String tenantId) -> Task<...>
Agent365ExporterOptions.TokenResolver : AsyncAuthTokenResolver
```

The resolver is async **by type**, so the exporter awaits it and the reference doc's `async (agentId, tenantId) => await tokenCache.GetObservabilityToken(...)` is correct. `AgenticTokenCache` has the same shape as Python's — sync `RegisterObservability`, async `GetObservabilityToken` — but because the delegate is declared async, there is no mismatch.

The earlier .NET instructions already covered the exporter switch and per-turn `RegisterObservability()`. That did not establish that the newer distro automatically registered the cache: the September SDK probe disproved that assumption. Section 18 records the explicit cache/resolver and options-property repairs.

What was missing was verification. The validator's .NET branch checked only that `EnableAgent365Exporter` **exists** — the same defect section 9 fixed for Node.js and Python, left in place for .NET — so an agent with the exporter off passed as fully instrumented. And nothing checked the per-turn registration, so an OBO agent whose token cache is never filled also passed.

Both checks were added. The environment-oriented check inspects root `appsettings.json`, not `appsettings.Development.json`. The updated OBO check requires an explicit resolver on the distro path and per-turn `RegisterObservability` when the SDK cache is used. A custom resolver need not use that cache. Static marker checks do not prove DI composition or telemetry delivery.

Found 2026-09-04 while checking whether sections 11 and 12 left .NET exposed.

### 14. Environment-value validation — active settings, not comments or examples

The earlier exporter checks accepted a commented `true`, a value beginning with `true`, an earlier assignment superseded by `false`, or an enabled `.env.example` beside a disabled `.env`. They also rejected a valid quoted value. As a result, a disabled exporter could pass and a correctly configured one could fail.

The kit-owned `hooks/lib/env-config.js` reads assignments, handles quoted values and `export`, ignores comments, and honors the last assignment. The project's `.env` takes precedence over example files. Node.js and Python observability validators use this helper through asserted fix-ups; the kit's Java exporter and local-channel validators use it directly. The local-channel check still inspects both `.env` and `.env.example`, because neither should enable an unauthenticated listener by default.

Evidence: deterministic Node test fixtures for enabled/disabled, commented, quoted, duplicate, and example-file settings. These test static validation, not delivery to the telemetry service.

### 15. `path-guard.js` — nested new paths and Windows casing

The original real-path fallback resolved only an immediate parent. If a new file had multiple missing parent directories beneath a junction or symlink, resolution fell back to the unexpanded path. A path lexically inside the project could consequently point outside it. String-prefix containment also rejected legitimate new paths whose Windows casing differed from the project root.

Resolve the nearest existing ancestor before appending missing path components, and compare containment with `path.relative`. Ignore non-tool JSON events such as `null` without crashing. The original drop-in kit-folder protection remains in place.

Evidence: local junction fixtures reproduce the original outside-write allowance without performing the write. Regression tests cover nested junctions, Windows case variants, allowed source writes, blocked kit/outside writes, read-only events, and malformed/non-tool events.

### 16. `validate-add-workiq-tools.js` — honor the S2S early exit

The skill explicitly exits without modifying an S2S project because this kit's Work IQ wiring requires a delegated user token. Its validator nevertheless demanded a manifest and MCP wiring, blocking a session after the skill had correctly refused an unsupported mode.

Read the cached auth mode case-insensitively and return a nonblocking explanatory verdict for S2S, matching the existing early-exit behavior for unsupported frameworks. OBO and agentic-user validation remain unchanged.

Evidence: S2S and uppercase `S2S` fixtures, plus a supported OBO fixture that must still fail without its manifest and wiring.

### 17. Setup diagnostics — status is not a permission or hosting requirement

The setup/registration validators interpreted `completed:false` as proof of missing OAuth consent and directed the operator toward administrator grants. The registration validator also warned every non-Azure agent that an App Service managed identity was required for observability.

Incomplete setup can instead reflect the selected hosting/endpoint state. Warnings now direct the operator to inspect setup, endpoint and consent results separately. Remove the unconditional Azure managed-identity warning; Azure hosting/federation is optional, and a valid token resolver can use other supported credentials.

Evidence: registry-only fixtures with recorded resource consent and `completed:false` remain valid without misleading consent or Azure-hosting diagnostics. Permission/hosting distinctions were checked against the current Microsoft Agent 365 developer identity, setup and deployment documentation linked from the README.

### 18. SDK and playbook correctness audit — September 2026

The reviewed upstream snapshot is **agent365-skills v1.0.2, commit `99a3ceb`**. A successful packaging build did not establish that its embedded application examples compiled or started. SDK corrections are applied to the canonical content **before** both discovery copies are created; the same guidance is also repaired in the staged consumer Copilot instructions.

| Area | Failure prevented | Evidence |
|---|---|---|
| .NET teammate generation | Missing sample-local authentication helper, premature observability-cache dependency, obsolete session/streaming APIs, wrong tool argument/options, missing Semantic Kernel tooling packages and notification extension calls. | Complete extracted AF and SK fixtures compile after repair. The shared authentication helper retains the MIT notice and a pinned [official sample source](https://github.com/microsoft/Agent365-Samples/blob/87dca88dfc73bc386f6a93602f911ef112231976/dotnet/agent-framework/sample-agent/AspNetExtensions.cs). |
| .NET observability | `UseMicrosoftOpenTelemetry` did not register/connect the OBO application cache; S2S examples referenced a nonexistent `Agent365.Exporter` property. | Real `Microsoft.OpenTelemetry` **1.0.3** DI probe after `builder.Build()` and compilation of the corrected S2S scaffold. Empty-cache lookup returns null; no Entra token exchange was performed. |
| Python host, Agent Framework and token lifecycle | The shared host used nonexistent APIs and lacked an executable entry point; framework/MCP contracts were incompatible; the exporter read a different cache from its producer. | **25 offline tests**, independently rerun in **10.1 seconds**, cover the pinned Python 3.12 / Agents 1.6 / AF 1.17 / OpenTelemetry 1.2 profile: health 200, anonymous/invalid-token 401, authenticated mocked message/notification dispatch, real SDK model/MCP transports with mocked peers, shared token resolution, cancellation and shutdown. External network guard recorded **zero** attempted external connections. |
| Node framework clients | LangChain returned a structured-content union where the host required a string; Claude used the Messages SDK constructor on the Agent SDK package; notifications/Word called a missing client method. | TypeScript compilation against LangChain **1.5.10/core 1.2.9** and Claude Agent SDK **0.3.261**, plus generated-client interface checks. |
| Node managed-identity token request | MSAL silently discarded an unsupported `fmiPath` option, despite an `as any` cast. | Actual MSAL Node **3.8.10** with a mocked network client omitted the field. The replacement explicitly serializes `fmi_path` in the form POST; no live credential was used. |
| Python alternative clients | Claude passed a prompt to `receive_response`; Google ADK ran without a session and supplied a string instead of `Content`. | Released Claude SDK **0.1.7** and Google ADK **1.18.0** contracts. Submission/response iteration, session creation, and content types are corrected; no model call is claimed. |
| Work IQ instructions | Main Python instructions contradicted their reference with a nonexistent import and an ignored environment key. | Released AF tooling extension **1.0.0** and its documented framework-specific service. Unsupported Python branches are not made supported by a module rename. |
| Framework detection | Common hosting packages misclassified Semantic Kernel, OpenAI, Claude and ADK projects as Agent Framework. | Cross-reference of actual generated dependency sets. Detection now uses the LLM framework, not shared hosting/activity packages. |
| Validation commands | Build failures were converted to successful “no script” messages; unquoted log-level pipes prevented startup; one .NET install command supplied two package names. | Offline npm/shell fixtures preserve failure exit **17** and actually invoke the selected startup command; .NET CLI confirms one package per command. |
| Playground installation | The package name was confused with its executable name. | npm metadata and [Microsoft Learn](https://learn.microsoft.com/en-us/microsoft-365/agents-sdk/test-with-toolkit-project) confirm `@microsoft/m365agentsplayground`; the executable remains `agentsplayground`. |
| Exporter validation | Environment-only checks misclassified explicit code options; the standalone Python validator accepted a .NET-only key and rejected a valid Python OR configuration. | Actual Node configuration and Python distro expressions, plus positive/negative local fixtures. Console-only instructions must disable every effective remote-export enable signal. |

The JSON rules and `tests/upstream-python/repair-manifest.json` record the package/source evidence, grouped Python profile checks, and remaining limits. `source-hashes.json` records the verified LF equivalents of the original Windows file hashes; regression tests compare the generated reference code to the SDK-tested modules across line-ending conversions.

Integration fixes keep the hook contracts consistent: the pinned Python AF profile uses the tested core discovery adapter rather than requiring an incompatible extension; baggage middleware remains a valid preservation anchor. An explicitly recorded `observabilityExportMode=console` validates local initialization and exporter selection without demanding remote tokens or claiming backend delivery. Local-test instructions use the actual configured port, require health **200**, fail after bounded retries, and no longer claim that a client channel flag bypasses server JWT validation.

The patch-runner tests cover sequential replacements, line endings, missing/duplicated text, invalid rules, and unchanged files after a later assertion failure.

**These are local compilation, source-contract, or mocked-boundary checks—not live tenant verification.** They do not establish Teams delivery, Work IQ authorization, Connector replies, model access, telemetry ingestion, or Purview blocking. Do not interpret an SDK source check as a successful deployment.

### 19. Late exporter-contract verification — v0.1.2

The delayed SDK follow-up confirmed two cases not covered by the initial v0.1.1 regression suite:

- **Node:** `enableConsoleExporters` belongs at the top level of `useMicrosoftOpenTelemetry(...)`, not inside `a365`. The example and validator now require the correct level; nested flags, comments and string values cannot satisfy the console check.
- **.NET:** unified-distro `o.Exporters` selection overrides the legacy root `EnableAgent365Exporter` flag. Four real **Microsoft.OpenTelemetry 1.0.3** cases crossed root `true`/`false` with explicit Agent365/Console selection. Agent365 cases invoked the resolver; Console cases did not. Null-token fixtures prevented backend delivery. The validator now honors recognized explicit selections rather than reporting that root `false` necessarily disables export.

The prompt-based stop check also respects explicit console intent instead of demanding remote S2S token initialization. Additional regressions cover these cases. **Use v0.1.2 instead of v0.1.1 for distribution**; the earlier ZIP is retained only as a historical build.

---

## Kit add-ons — not Microsoft's

Everything under `.a365-kit/addons/` (and its copies in `.claude/skills/` and `.agents/skills/`), the paired add-on validators, and the kit's environment helper are **written for this kit**, copyright Akram Eleyan, MIT. They follow upstream's skill format so every CLI discovers them the same way, but they are not part of `microsoft/agent365-skills` and should not be reported there.

| Add-on | Fills this gap | Basis |
|---|---|---|
| `add-messaging-endpoint` | Adds the missing HTTP host, tunnel and endpoint registration for an ordinary registered agent. | Current audit: real Python Agents **1.6.0** / observability **1.3.8** imports, health **200**, anonymous message **401**, mocked authenticated turns and shutdown. Node/.NET compilation/API checks; no live Connector reply. |
| `a365-kit` | Prerequisites, read-only version inspection, explicit updates and update-source selection. | Isolated launcher/runtime regression suite; version inspection no longer invokes an update. |
| `add-lab-tools` | Opt-in in-process utilities and bounded web-fetch tools. External input/egress remains a separate trust boundary. | Fixed Python/Node callable-tool contracts and streaming limits. Real Node SDK invocation and .NET bounded-fetch/transform checks, plus Python behavioral fixtures. |
| `add-mcp-server` | Direct external MCP connections; not automatically registered with or governed by Agent 365. | Explicit Python connect/cleanup lifecycle; Node connection cleanup; .NET SDK 1.x APIs and disposable-client/tool ownership. No external MCP service integration claimed. |
| `test-local-channel` | Intentional loopback-only development listener, off by default; production `/api/messages` stays authenticated. | Offline callback, listener cleanup, malformed-request and configuration fixtures. Local chat is not delegated Work IQ or DLP verification. |
| `add-java-agent` | Java host, inbound validation and custom telemetry export without claiming an official Java Agent 365 SDK. | Current audit compiled **all five classes** using isolated Microsoft JDK **21.0.12.1 ARM64**, Maven **3.9.11**, `--release 17`, Jackson **2.17.2** and Nimbus **9.40**. Build succeeded; class outputs verified. No live tenant verification. |
| `add-purview-dlp` | Prompt/response API hooks plus consent, app-scoped policy and billing guidance. Supported prompt blocking must be verified separately. | Python/Node fail-closed boundary fixtures and .NET compilation/HTTP checks, including the actual string-returning `ExchangeTurnTokenAsync` contract. No live policy-ingestion or blocking claim. |

The seven Microsoft skills are untouched by the add-ons: they reference upstream files, never modify them.

The current add-on audit covered all **seven playbooks and seventeen unique language references**. Repairs include per-turn Work IQ isolation; preservation of static tools/options; bounded streaming reads; DLP error/status handling; separate delegated/application identity rules; authenticated messaging regardless of Node environment; explicit .NET `PORT`; and Java bootstrap, audience, routing, claim, token-cache and shutdown corrections. Persistent offline tests are under `tests/examples*`: **15/15 pass without skips on Node 18.20.8 and Node 20.19.0**. SHA-256-bound transpiled TypeScript fixtures allow older Node versions to exercise the same examples; stale fixtures fail rather than skip. Earlier maintainer live results are historical evidence, not a rerun of these changes.

## Kit build and validator corrections — September 2026

- Purview validation recognizes quoted JSON keys in `appsettings.json`, including the application-location GUID. It accepts delegated `/me` or token-user helpers and explicit authorized user targets for app-only flows; it no longer requires every implementation to decode a JWT or treat a service-principal `oid` as a user.
- The lab-tools validator recognizes .NET `TransformText`, including when text transformation is the only selected tool group.
- The build rejects output paths overlapping kit or upstream sources and cleans temporary clones after clone/layout failures, not just failures after staging.
- Upstream refresh resolves branches, lightweight tags, and annotated tags to commits. It checks Git exit codes explicitly, does not push after a failed commit, and updates release assets rather than failing on an existing release tag.
- Both launchers validate an update archive/manifest and destination ownership before replacing files, preserve user configuration/instructions, and roll back failures including partially completed moves. Invalid or failed operations return a failure status instead of reporting success.
- Coding-CLI detection recognizes Codex and existing `gh copilot` without triggering a download. The optional freshness hook uses semantic-version comparison, namespaced six-hour caching, and bounded noninteractive probes. Its SessionStart timeout is five seconds, not a millisecond value supplied to a seconds-based setting.

Evidence: executable local fixtures and mocked Git/GitHub workflow tests under `tests/`, including 142 targeted PowerShell/Bash/runtime cases at the audit date. No tenant permissions or remote releases are changed by these tests.

---

## What is *not* changed

- No new tenant entitlement, administrator authority, or resource permission is implied by repackaging.
- No live tenant, consent, policy, deployment, or remote-release changes are performed by the local audit/tests.
- No unsupported framework becomes supported merely by changing an import. Explicit support boundaries remain visible.
- No hidden modifications to upstream: packaging and correctness changes are recorded above and applied through asserted source fix-ups.
- Kit-authored Purview, ordinary-agent hosting, local-channel and Java extensions remain separately labelled add-ons.

## Reporting issues

Problems with the skills themselves — what they do, ask, or generate — belong upstream at
[microsoft/agent365-skills](https://github.com/microsoft/agent365-skills/issues). Problems with the
packaging, the launchers, the prerequisite doctor, or the build belong in this repository.

---

## All-in-one onboarding bundle — v0.2.0

`agent365-onboarding-bundle-v0.2.0.zip` packages the **unchanged corrected kit v0.1.2** under `kit\`, alongside bundle-authored Node.js and .NET console tool-agent starters, a Python AI Teammate sample, `tools\prepare-workspace.mjs`, and the existing documentation/legal files. The Python sample follows the repaired pinned profile described above and includes its own offline tests. These sample/helper additions are distinct from Microsoft's upstream skills; they do not add further upstream skill modifications.

The root `README.md` is the single authoritative user entry point. `kit\AGENT365-KIT-README.md` remains a technical kit-only reference. The helper copies one sample plus the full kit (or a blank kit-only workspace) into a **new independent destination**; it is not an existing-project merge or tenant-provisioning tool. `BUNDLE-MANIFEST.json` and `SHA256SUMS.txt` provide bundle metadata and integrity information. Historical v0.1.1/v0.1.2 kit ZIPs remain separate, untouched outputs, not nested archives or additional user prerequisites.

Sample SDKs are declared/pinned dependencies restored from their registries, **not redistributed SDK binaries, runtimes, model binaries or installers**; their respective package licences still apply. No credentials, tenant, model entitlement, administrator authority or service licences are supplied. Node.js/.NET live modes use separately billable OpenAI access; the Python host requires separately configured Azure OpenAI key authentication and real agent identity/consent. Mock demos and local tests do not establish Teams activation, Work IQ resource access, telemetry ingestion or Purview blocking. Verification recorded earlier in this notice remains **prior kit evidence**, not a new bundle validation or live-tenant claim.

### Local/offline bundle verification — 13 September 2026

The following fresh sample-SDK and packaging checks were reported separately from the earlier kit audit. Dependency restores use package registries; the tests below are **local/offline**, not live model or tenant tests.

| Sample | Fresh SDK verification evidence |
|---|---|
| **Node.js** | **Node 24.16.0**, `@openai/agents` **0.17.0**, and `zod` **4.5.4**: **3/3 tests passed** — word counter, actual SDK tools including UTC, and an in-memory model → tool → model turn through the real framework, without external inference. |
| **.NET** | **.NET SDK 8.0.425**, `Microsoft.Agents.AI` **1.6.2**, `Microsoft.Extensions.AI.OpenAI` **10.10.0**, and `DotNetEnv` **3.1.1**: **restore, compilation and the SDK self-test passed**, including `JsonElement` result handling. The self-test uses the same `ChatClientAgent` factory as live mode with an in-memory `IChatClient` from `OfflineChatClient.cs`; **two model steps and a real `AIFunction` result were verified**, without external inference. |
| **Python** | **Python 3.12.10 ARM64**, freshly restored using the exact direct pins in `requirements.txt` and constraint snapshot in `requirements-lock.txt`: **25/25 SDK tests passed in 11.825 seconds**, with **0 network-guard violations**. `pip check` reported **no broken requirements**. Model/tenant traffic was mocked; the suite permits loopback only. |

Additional **local bundle tests** verified:

- Deterministic, **byte-identical repeat ZIP builds**.
- **201 archive files**, including **158 kit files byte-identical** to the corrected distribution.
- One-example workspace isolation and refusal of an existing destination.
- Manifest hashes and rejection of tampered inputs, path traversal and symlink-parent destinations.

**Node entry-point compatibility:** the starter uses `agent.js` with `"type": "commonjs"` so kit source detection and CommonJS `.js` validator hooks work within the project. `sdk-check.mjs` remains ESM and imports the CommonJS starter; npm commands are unchanged. A bundle regression checks that the scanner discovers `agent.js` and a real validator emits its expected not-yet-onboarded JSON rather than an ESM loader error. This starter compatibility change leaves the kit at unmodified **v0.1.2** and the bundle at **201 files**.

The source-only `Build-Kit.ps1` output guard additionally protects the new `examples\` and `tools\` source directories; the corresponding tests passed. This source safety change does not alter the bundled kit payload.

These results are local SDK/packaging evidence only: **no live model invocation, tenant registration/consent, Teams activation, telemetry ingestion, Work IQ resource access or policy enforcement is proved**. They do not assert a final ZIP digest.
