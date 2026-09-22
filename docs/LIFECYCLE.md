# From custom agent to chatting in Teams and Copilot — the complete path

This is the end-to-end guide. It covers everything from an agent that nobody in your tenant knows exists, to one that has an Entra identity, appears in the Agent 365 registry, answers in Teams and Microsoft 365 Copilot, and shows up in Defender and Purview.

It is written for someone who has never done this before. Every step says who does it — the skills, you in your own terminal, or an admin in a portal — because that distinction is where first attempts go wrong.

Use the README's [information checklist](../README.md#before-you-start--information-and-access-checklist) and [permissions by step](../README.md#onboarding-steps-and-required-permissions) alongside this guide. They include the current client-selection, consent, administrator-role, licensing and preview boundaries.

If you only want the sequence of phrases to type and the commands between them, **[STEP-BY-STEP.md](STEP-BY-STEP.md)** is that, on one page. This document is the *why* behind each of them.

---

## What "onboarded" actually means

There are two different finish lines, and the kit gets you to the first one automatically:

| Finish line | What it means | How you get there |
|---|---|---|
| **Registered** | The agent has a blueprint and an Entra identity, delegated permissions are granted, telemetry and WorkIQ tools are wired in code. It is in the registry. Security teams can see and govern it. | Phases A and B below — the skills do almost all of it |
| **Reachable** | Users can open Teams or Copilot and talk to it. | Phases C and D — hosting, endpoint, manifest, admin activation |

Many teams stop at *Registered* on purpose: the agent already runs somewhere else and only needs governance. If that is you, Phases A, B and E are the whole job.

## The map — who does what

| Phase | Step | Skills (automatic) | You, in your own terminal | Admin, in a portal |
|---|---|---|---|---|
| A. Prepare | Prerequisites, tenant one-time setup, place the kit | prereq check | install what's missing | `a365 setup requirements` (once per tenant) |
| B. Onboard | Detect stack, ask capabilities, write config and code | ✅ | **`a365 setup all`** | blueprint/resource consent as required, including OBO |
| B. Onboard | Install packages, finish observability | — | `pip install`, re-run skill | — |
| C. Reach | HTTP host on `/api/messages` | AI Teammate path only | otherwise you add it | — |
| C. Reach | Public URL, register endpoint | dev tunnel auto-started | `a365 setup blueprint --update-endpoint … --m365` | verify in Dev Portal |
| D. Publish | Manifest and package | — | **`a365 publish`** | upload, activate, create instance |
| E. Govern | Observability in Defender, Purview DLP | code + grants | grants script | DLP policy, IRM policy |

Two commands are **always yours to run**, never the CLI agent's: `a365 setup all` and `a365 publish`. The first authenticates through the Windows broker, which cannot show a prompt inside an agent's shell; the second block-buffers its output under chat tools and looks hung. Both are one minute in your own terminal and an hour of confusion otherwise.

---

## Phase A — Prepare

### A1. Tools on your machine

Node.js 18+, .NET SDK 8+ (the SDK, not just the runtime), the `a365` CLI, Azure CLI, Git, your coding CLI, and Python or Node.js for your agent. `devtunnel` if you will expose a local agent.

```bash
dotnet tool install -g Microsoft.Agents.A365.DevTools.Cli
winget install Microsoft.devtunnel        # brew install --cask devtunnel on macOS
```

The kit's launcher checks prerequisites and prints install commands for missing tools. Use your normal interactive Windows terminal for onboarding; approve OS elevation only when an installer needs it. Different profiles/PATHs and sign-in contexts can change tool visibility.

### A2. Tenant, once

Validate the installed CLI's client/tenant readiness:

```bash
a365 setup requirements
```

Current documentation prefers Microsoft's managed CLI client. Use a tenant-owned custom client only when needed. Manual custom-client configuration/delegated consent can use Cloud Application Administrator or Application Administrator; the CLI's automatic creation/consent path is Global Administrator-gated. Each developer still needs appropriate Agent ID authority and must satisfy tenant policies. Client readiness does not complete future agent-resource consent or licensing.

Sign in:

```bash
az login --allow-no-subscriptions
```

### A3. Place the kit

Extract the kit zip into the **root of your agent project** and run the launcher. Full detail per CLI in [USING-WITH-YOUR-CLI.md](USING-WITH-YOUR-CLI.md).

```
your-agent/
  .a365-kit/  .claude/skills/  .agents/skills/
  agent365-kit.ps1  agent365-kit.sh
  src/ ...            <- your agent
```

---

## Phase B — Onboard

### B1. Choose the kind of agent

The first real question the skill asks. It decides identity, hosting and what the manifest looks like, so choose deliberately:

| Kind | Identity | Needs a hosted endpoint? | Appears in Teams / Copilot? | Pick it when |
|---|---|---|---|---|
| **Blueprint-only** (Register / Observability / WorkIQ) | `a365 setup all` auto-creates an identity service principal at setup | No | No | The agent runs elsewhere and you want governance, telemetry and M365 data access |
| **Custom Engine Agent** (blueprint-only + `--m365`) | Same as above | Yes | Yes, as a bot and a Copilot custom engine agent | Your existing agent should be chattable in Teams and Copilot, keeping its own identity model |
| **AI Teammate** | Agent identity plus an associated agent user, with UPN/mailbox resources provisioned for the approved experience | Yes | Subject to Frontier availability, licences and app policies | The agent should act as a member of the organisation, receive email, be @mentioned |

Choose OBO when the agent must act for the caller, or S2S when an API supports application access. **OBO still needs consented blueprint/resource permissions and the user's data access.** S2S app-role grants are separate; the current CLI may hand either consent workflow to a Global Administrator. Underlying manual consent authority depends on the permission type, as detailed in the README.

### B2. Run the onboarding

From your project root, in your CLI:

> **Onboard this agent to Agent 365.**

`a365-setup` detects your stack, asks the questions above, checks prerequisites, then delegates to `make-a365-agent` or `make-ai-teammate`. That skill edits your code — hosting layer for AI Teammates, observability and WorkIQ wiring for everyone — and writes `a365.config.json`, `.env`, and your dependency file.

### B3. The command you run yourself

When the skill reaches `a365 setup all`, it **cannot** authenticate from inside the CLI's shell. You will see `Authentication timed out after 120 seconds` or `MSAL authentication failed: Unknown Status: 17`, and re-authenticating elsewhere does not help — different token cache.

1. Copy the exact command from the approval prompt (the flags depend on your answers).
2. Decline it in the CLI.
3. Paste it into a second, normal terminal in the same folder. Answer its prompts, including the broker pop-up.
4. Tell the CLI: *"`a365 setup all` completed in a separate terminal. Read `a365.generated.config.json` and continue."*

What it creates, per kind:

| | Blueprint / CEA | AI Teammate |
|---|---|---|
| Blueprint app registration + service principal | ✅ | ✅ |
| Delegated grants for everything you selected | ✅ | ✅ |
| Agent identity | ✅ **created now** | later, at instance creation |
| Messaging endpoint registered | only with `--m365` | if you gave a URL |
| `completed` in the generated config | `false` until hosting is configured — this is not a consent problem | same |

If you took the local dev-tunnel option, the skill has already started a tunnel and passed its URL; **leave that session open**, the tunnel dies with it.

### B4. Post-run checks — do these before calling it done

Verified on real runs: the skills get the tenant and the code right and leave two things.

**Install the packages.** The skill edits `requirements.txt` (or `pyproject.toml`) but does not run the install:

```bash
python -m pip install -r requirements.txt
python -c "import src.agent"          # your agent module
```

Python with WorkIQ: if that import fails with `No module named 'microsoft_agents_a365.runtime'`, add `microsoft-agents-a365-runtime>=1.0.0` and install again. The tooling wheel imports it but does not declare it.

**Check observability is complete.**

```bash
node .a365-kit/hooks/stop/validate-instrument-observability.js
```

If it reports the exporter present but no `InvokeAgentScope`, ask your CLI to *"Add observability to this agent"* — idempotent, adds only what is missing — then re-run the validator and the import.

Claude Code runs these validators automatically at the end of a session. Every other CLI does not, so run them yourself.

**Registered.** At this point the agent has a blueprint, an identity (blueprint-only and CEA kinds), granted permissions, and instrumented code. Stop here if reachability is not your goal — skip to Phase E.

---

## Phase C — Make it reachable

### C1. An HTTP host on `/api/messages`

Teams and Copilot deliver messages by HTTPS POST to `/api/messages` on your agent. `make-ai-teammate` scaffolds this host (`host_agent_server.py` / Express / ASP.NET Core). The non-AI-Teammate skill does **not** — it assumes your agent already listens on port 3978 — so for a CEA built from a CLI or library agent, you add it.

**The kit's `add-messaging-endpoint` add-on does C1 through C4 for you.** In your CLI: *"Make this agent chattable in Teams."* It adds the host for your language, proves it (health 200, anonymous POST 401), starts a dev tunnel or takes your URL, registers the endpoint with `--m365`, and stops at the one step that needs the broker. The rest of this phase documents what it does, so you can do it by hand or check its work.

> **SDK version matters here (verified on a real run).** Some references — including the
> Python hosting layer `make-ai-teammate` generates — use `CloudAdapter.on_activity`,
> `adapter.authorization` and `MsalConnectionManager.from_environment()`. None of those
> exist in `microsoft-agents` 1.6.x, which is what `pip` installs today; the host crashes
> on startup. The working 1.6 pattern is `AgentApplication[TurnState]` with
> `@app.activity(...)` handlers, `MsalConnectionManager(**load_configuration_from_env(os.environ))`,
> `start_agent_process(request, app, adapter)`, and `jwt_authorization_middleware` with
> `web_app["agent_configuration"] = connection_manager.get_default_connection_configuration()`.
> If your generated host dies with `AttributeError ... from_environment`, that is why.

Confirm locally before exposing anything:

```bash
python -u host_agent_server.py          # -u: unbuffered logs; or npm start / dotnet run
curl http://localhost:3978/api/health
```

Expect `/api/health` → 200 and an anonymous `POST /api/messages` → **401** — the JWT middleware rejecting it is the proof the pipeline is wired. If 3978 is taken by another agent on the machine, set `PORT` in `.env` and use that port for the tunnel below.

### C2. A public HTTPS URL

**Local, for development** — a dev tunnel. Free, anonymous access, disappears when you close it:

```bash
devtunnel user login
devtunnel create <agent-name>-tunnel --allow-anonymous
devtunnel port create <agent-name>-tunnel -p 3978 --protocol http
devtunnel host <agent-name>-tunnel
```

Use the URL from the `Connect via browser:` line `devtunnel host` prints — `https://<id>-3978.<cluster>.devtunnels.ms`. Don't derive it from the tunnel name: the cluster is assigned per tunnel at creation, and a tunnel that is deleted and recreated can land in another cluster, at which point any URL you wrote down earlier — and the endpoint registered from it — silently stops resolving. Recreated the tunnel? Re-run C3. `--protocol http` matters too: without it the relay attempts TLS to your plain-HTTP server and Teams gets `502`.

**Production** — anywhere that serves HTTPS: Azure App Service, Container Apps, a Cloudflare tunnel to a VM, your own cluster. The only contract is `POST https://<host>/api/messages` reaching your process.

### C3. Register the endpoint on the blueprint

```bash
a365 setup blueprint --update-endpoint https://<your-host>/api/messages --m365
```

Keep `--m365` explicit for intent and compatibility with older flows. Current CLI documentation infers M365 for endpoint-only/update operations; full setup has its own selection. Re-register when the actual URL changes, verify `messagingEndpoint` and the live host, and inspect any remaining setup/consent warnings separately. A copied configuration value is not proof of a reachable endpoint.

> **Verified: this one runs fine from inside a coding-agent's shell.** Unlike `a365 setup all`, endpoint registration authenticates with the cached Azure CLI context and never touches the Windows broker. The broker boundary is precise: **creating OAuth2 grants and admin consent** need it; **endpoint registration and inheritable-permission configuration** do not.

Blueprint-based / Custom Engine Agents need one more command, which upstream's skill requires after setup:

```bash
a365 setup permissions bot
```

It configures inheritable permissions (works from anywhere), then creates the Messaging Bot API grant (`AgentData.ReadWrite`) and asks `[y/N]` before an application permission — **those two parts need the broker and a keyboard, so run it in your own terminal.** From an agent's shell it half-completes: inheritable permissions land, the grant fails with `MSAL … Status: 17`, and the prompt gets EOF.

### C4. Verify in the Teams Developer Portal

Usually a look, not a change. Open:

```
https://dev.teams.microsoft.com/tools/agent-blueprint/<agentBlueprintId>/configuration
```

with the ID from `a365.generated.config.json`. Confirm **Agent Type = API Based** and **Notification URL** equals your `messagingEndpoint`. If the CLI printed "automated messaging endpoint registration is not available for this tenant yet", set those two fields here by hand and save.

---

## Phase D — Publish and activate

### D0. Every path that wants Teams or Copilot goes through the package

Registration and endpoint configuration alone do not make an agent available in Teams/Copilot. Confirm a supported package and publishing experience, then obtain approval for its audience, permissions and licences.

**Previously observed workaround, not a general compatibility guarantee:** an earlier tenant run used `a365 publish --aiteammate true` after plain publishing refused a `useBlueprint: true` configuration. Current source shows that the flag selects the **AI Teammate/agentic-user-template branch**. Do not assume it is a semantically neutral conversion of any OBO/S2S agent; confirm the intended experience and Frontier requirements with the publishing administrator.

For the blueprint messaging path, review `a365 setup permissions bot` with the authorized consent administrator. It includes Messaging Bot API `AgentData.ReadWrite`, observability write, and Power Platform connectivity permissions. A URL or ZIP does not grant them.

If registration/governance is the intended finish line, no Teams app package is needed.

### D1. Manifest and package — `a365 publish`

The manifest is the Teams app definition — the JSON that makes the agent an installable app, a bot, and (via `copilotAgents.customEngineAgents`) a **Microsoft 365 Copilot custom engine agent**. **The CLI owns it.** Do not hand-write it.

Run in your own terminal, not through the CLI agent — it block-buffers under chat tools and appears hung:

```bash
a365 publish --dry-run     # preview the ID substitutions
a365 publish
```

What it does, in CLI 1.1+:

1. Generates or updates `manifest/manifest.json` — `$schema` (Teams v1.22+), `bots[0].botId`, `webApplicationInfo.id`, `copilotAgents.customEngineAgents`, `validDomains` — from `a365.generated.config.json`.
2. Packages manifest plus icons into **`manifest.zip`**.

It does **not** upload anything, and it does **not** touch the messaging endpoint. Those are Phase C and D2.

Two warnings you may see:

| Output | Meaning |
|---|---|
| `name.short ... EXCEEDS 30 chars` | The CLI derives the app's short name from `<agent name> Blueprint`; long agent names overflow. Edit `agentBlueprintDisplayName` in `a365.generated.config.json` to ≤ 30 chars and re-run, or set `name.short` in the manifest and re-zip the `manifest/` folder. |
| `Manifest validation failed` | Re-run `a365 setup all` (idempotent) so the CLI regenerates the fields, then publish again. |

For a blueprint-only configuration, confirm the supported publishing route described in D0 rather than blindly setting the AI Teammate override. Configure the endpoint and bot permissions before testing a messaging experience.

### D2. Upload and activate — admin centre

This guide uses the admin center; `a365 publish` does not upload the package. Two routes may be available, subject to tenant policy and the chosen experience:

**Admin-driven** (current general agent roles: **AI Administrator or Global Administrator**; the older developer publish walkthrough still specifies Global Administrator):

1. **Microsoft 365 admin center → Agents → All agents → Upload custom agent** — upload `manifest.zip`.
2. Open the uploaded template → **Activate** — scope the audience (yourself, a group, everyone) and grant the requested permissions.
3. **Instances → Create** — name, alias, domain. For an AI Teammate this is the moment its Entra Agent ID and mailbox are minted.

**User-driven** (only where custom-app/request policies permit; an authorized administrator approves):

1. Sideload: **Teams → Apps → Manage your apps → Upload an app → Upload a custom app** with the same `manifest.zip`.
2. Teams → Apps → find the agent → **Request Instance**.
3. Admin approves at `https://admin.cloud.microsoft/#/agents/all/requested`.

Provisioning is asynchronous. A disabled **Request Instance** can indicate Frontier availability, licensing, activation/audience, or policy restrictions. Agent ID administration, Microsoft 365 agent administration, Teams app controls and user-service licensing are separate.

### D3. Smoke test

**Before admin approval — AgentsPlayground.** Tests a compatible local host directly; it does not prove publishing, consent or tenant readiness. The npm package is **`@microsoft/m365agentsplayground`**, while its executable is `agentsplayground`. The build corrects upstream's obsolete package spelling:

```bash
npm install -g @microsoft/m365agentsplayground
agentsplayground
```

Connect to `http://localhost:3978/api/messages` (or the tunnel URL), send *Hello*. The `test-local` skill does the same with prerequisite checks.

**After approval — Teams.** Chat → search the agent by name → *Hello*. Response within seconds; your terminal shows `process_user_message called` (Python) or the equivalent.

**Copilot.** With `copilotAgents.customEngineAgents` in the manifest and the app activated, the agent appears in the Microsoft 365 Copilot agent picker as a custom engine agent. Same endpoint, same code.

| No response? | Check |
|---|---|
| Nothing reaches your host | Dev Portal Notification URL ≠ `messagingEndpoint`. Re-run C3 with `--m365`, then C4. |
| `502` from the tunnel | Port created without `--protocol http`. Delete and recreate the port. |
| `401` in your logs | `.env` client ID / secret don't match the blueprint. |
| `404` on `/api/messages` | Host not running. |
| In Teams search, but no instance after approval | Frontier not enabled. |
| No first message from an AI Teammate | Blueprint lacks `Chat.Create` inheritable permission. |

---

### D4. If you added Work IQ tools, three things will bite you

Verified on a live tenant. None is set by the CLI or the skills, and all three look like permission problems when they are not.

| Symptom | Cause | Fix |
|---|---|---|
| Every MCP server returns `401`; the agent says it has no tools | The tooling SDK defaults to a **development** environment when `PYTHON_ENVIRONMENT` and friends are unset, so it reads `BEARER_TOKEN_*` env vars instead of exchanging tokens. Its sibling runtime module defaults to *Production* — the two disagree. | `PYTHON_ENVIRONMENT=Production` in `.env` |
| `UserError: Duplicate tool names found across MCP servers` | SharePoint and OneDrive both publish `getFileOrFolderMetadataByUrl` and `getSensitivityLabels` | set `include_server_in_tool_names` on the agent, **after** the servers attach |
| Tools attach, agent still says "I'm only set up to…" | Its system prompt never mentions the tools | say in the instructions that Work IQ tools exist and that using them is expected |

Tell-tales for the first: `Listing MCP tool servers for agent ` with an **empty** id, and `Loading MCP servers from: ToolingManifest.json` — production loads from the gateway, not the manifest. Judge success by `Attached N WorkIQ MCP server(s)`; `400` and `405` responses are part of the normal handshake, and individual servers can legitimately be `403`/`404` where the tenant hasn't provisioned them.

---

## Phase E — Govern

This is what the whole exercise is for. Everything here is visible to security and compliance teams without touching the agent again.

### E1. Observability → Defender

Already wired in Phase B. Every message, model call and tool call emits spans to Agent 365; they appear in the admin centre's agent activity and in Microsoft Defender. If Activity stays empty after real traffic, ask your CLI to *"Validate A365 code"* — the `a365-code-validator` skill checks exporter activation, identity binding, token shape and live grants read-only, and offers fixes.

### E2. Purview DLP on prompts and responses

The kit's `add-purview-dlp` add-on adds evaluation calls for Python, Node.js and .NET. Ask *"Add DLP to this agent"* after reviewing [README Step 10](../README.md#step-10--configure-and-verify-purview-dlp). Evaluation code, API consent and policy enforcement are separate:

**Grants.** `ProtectionScopes.Compute.User` and `Content.Process.User` require administrator consent. Both delegated and application forms exist; use the supported flow deliberately. A grant-management client needs its own authorized Graph permissions, and Microsoft Graph application consent needs a suitably privileged administrator. `az login` alone does not authorize a grants POST.

**Code.** Call `protectionScopes/compute` and `processContent` with the actual targeted application location and a real human/agent-user context. An app-only token's `oid` is a service-principal ID, not a user ID. Enforce the returned action; successful HTTP responses alone do not prove protection.

**Policy and billing.** A Purview DLP administrator must create an actual app-scoped DLP policy/rule through the current PowerShell workflow, using enforcement plane `Application`. Confirm custom Entra-app PAYG and feature entitlement. Audit/collection policies and optional **Risky AI usage** Insider Risk/Defender sharing are additional controls, not blocking DLP. Test allowed and policy-matching prompts; verify response-policy support rather than assuming it. See [configuration](https://learn.microsoft.com/en-us/purview/developer/configurepurview) and [licensing](https://learn.microsoft.com/en-us/purview/ai-entra-registered).

### E3. The registry

With the above done, an admin can answer the question the customer conversation always starts with — *how many agents do we have, who owns them, what can they reach, what did they do last week* — from the admin centre and Defender, for this agent, without asking the developer.

---

## Starting over

The CLI tears down what it created:

```bash
a365 cleanup --agent-name <name> --dry-run      # see what would go
a365 cleanup --agent-name <name>                # blueprint, instance, Azure resources
```

Granular: `a365 cleanup blueprint`, `a365 cleanup instance`, `a365 cleanup azure`. Deleted Entra apps sit in a 30-day soft-delete bin and can be restored from `directory/deletedItems`. Locally, `.a365-workspace-detection.local.json` and `a365.generated.config.json` are safe to delete — the next run rebuilds them.

The skills are additive and idempotent. Re-running onboarding on a project that is already partly done is the normal way to finish it, not a risk.

---

## Where the kit stops and you continue

| The kit and skills do | You do | An admin does |
|---|---|---|
| Detect the stack, ask the right questions, write config, edit code, start a dev tunnel, validate the wiring | Run `a365 setup all` and `a365 publish` in your own terminal, install packages, host the agent, register the endpoint | Tenant one-time setup, upload and activate the app, create or approve the instance, Purview policies |

The right column identifies administrative handoffs, not an assertion that no administration APIs exist. In particular, custom Entra-app blocking DLP uses the documented Compliance PowerShell workflow.
