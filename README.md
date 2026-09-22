# Agent 365 SDK Onboarding Experience

## What you can ask for

Each stage has a phrase. You do not need to know skill names.

| Say this | What happens |
|---|---|
| *Onboard this agent to Agent 365.* | Detects your stack and guides blueprint, identity and permission setup; review grants and administrator handoffs before applying them |
| *Add observability to this agent.* (highly recommended) | OpenTelemetry instrumentation and the Agent 365 exporter |
| *Add DLP to this agent.* (highly recommended) | Adds Purview prompt/response evaluation; configure a real blocking policy and verify enforcement separately |
| *Add Work IQ tools to this agent.* (highly recommended) | Microsoft 365 data: mail, calendar, Teams, SharePoint, OneDrive |
| *Add an MCP server.* (optional) | Any external MCP server: filesystem, git, GitHub, Postgres, Slack, Playwright |
| *Add lab tools.* (optional) | Local utilities: web fetch, encoders, hashing, text transforms |
| *Make this agent chattable in Teams.* (optional) | HTTP host, dev tunnel, and endpoint registration |
| *Onboard this Java agent.* (optional) | Hosting layer and telemetry for Java, which has no Microsoft SDK |
| *Let me test this agent locally.* (optional) | An explicit loopback-only dev channel where supported; still needs locally usable model access. It does not disable the authenticated Python host |
| *Update the Agent 365 kit.* (optional) | Updates kit-owned paths in the prepared workspace; does not update the whole bundle or sample dependencies |

The [standalone sample demos](#example-agents) need neither a dev channel nor a tunnel. The Python host's unsigned-request **401** is expected; a compatible explicit development adapter is required for local chat, not an authentication bypass.

### Example

A TypeScript agent using the OpenAI Agents SDK, with no Agent 365 anything:

```
> Onboard this agent to Agent 365.

  Stack:      OpenAI Agents SDK
  Language:   NodeJS
  Agent type: Agent (Non AI Teammate)
  Blueprint:  none found - will create new

  Which capabilities should I configure?
    1. Register        2. Observability
    3. Work IQ         4. AI Teammate

> 1 and 2

  How will your agent authenticate when calling downstream APIs?
    1. On-behalf-of (OBO)    2. Service-to-service (S2S)

> 1
```

From there, review the `a365 setup all --dry-run` preview and actual proposed grants. Approve tenant creation/consent only after the intended operator, scopes and target tenant have been checked.

## Repository overview

**Agent 365 SDK Onboarding Experience** (`agent365-sdk-onboarding-experience`) provides runnable agent examples and guided Agent 365 onboarding in one repository.

> Read [Implementation and revision notes](docs/LOCAL-REVISION.md) for provenance and integration boundaries.
> For the extended, offline-tested .NET local workflow, prepare
> `dotnet-agent365-lab`; all seven choices are listed below.
> This is a reproducible local revision of the verified release snapshot, not an
> official maintainer release. It contains no operator credentials or tenant-specific identities.

There are now **seven examples across six languages**: C# (basic and extended),
JavaScript/Node.js, Python, Java, Go, and Rust. See
[the complete example catalog](docs/AGENT-EXAMPLES.md) for commands and support boundaries.

```powershell
node .\tools\prepare-workspace.mjs --example dotnet-agent365-lab --destination ..\my-agent-lab
```

**Start here.** This GitHub repository contains the **unpacked onboarding bundle**: onboarding skills, seven example agents across six languages, a workspace-preparation helper, and all authored instructions. Clone or download this repository; there is no separate bundle ZIP to find or extract inside it. This root **README.md is the authoritative user guide**; the other documents are supporting references.

**This repository includes 14 skills: seven upstream skills and seven kit add-ons.** Internal bundle and kit versions are recorded in `BUNDLE-MANIFEST.json` for provenance; they are not the repository name. You do not need the separate maintainer source package or a historical kit release. Obtain this repository in its **own directory**, choose **one** example, and prepare a **new, independent agent workspace outside that directory**. Never onboard the repository root or `kit\` directly.

This repository is the developer onboarding kit, **not the agent package uploaded to Microsoft 365**. After configuring your agent in its own workspace, follow the publishing steps to generate and upload that agent's package.

## Before you start — information and access checklist

Gather the items below **before starting onboarding**. Items marked conditional are only needed for the capabilities you choose. The bundle does not supply a model, a tenant, licences, administrator rights, or hosting. You can try the deterministic offline demos without tenant access; they are not onboarding or live AI inference.

### Needed for every onboarding

| Information or access | What to have ready |
|---|---|
| **Agent project** | The source-directory path, programming language/framework, dependency file, and the command that starts your agent. Choose one bundled example, or bring an existing project into a separate workspace. Decide whether to modify an existing agent or scaffold a new one; do not use the multi-example bundle as the agent project. |
| **Tenant and sign-in account** | Your Microsoft Entra tenant ID, tenant domain, and work/school account UPN. Confirm you are signing into the intended tenant, not a personal account or a different directory. |
| **Tenant readiness and administrator contact** | Confirmation that Agent 365 is available for your tenant and that the required licences/features and policies are enabled. Identify the administrator who will perform bootstrap, consent, and publishing actions you cannot perform yourself. |
| **Agent 365 CLI client selection** | Confirm whether the Microsoft-managed CLI enterprise application is available in your tenant. Current documentation prefers it; otherwise collect the approved tenant-owned client application's ID, owner, and consent status. The interactive CLI client does **not** require you to supply a client secret. This client ID is not the agent's blueprint ID or runtime identity. |
| **Agent details and ownership** | Display name and description, owner(s), and at least one accountable sponsor for the blueprint/identity; have their Entra object IDs or resolvable UPNs ready. Decide whether to reuse an existing blueprint; if so, collect its IDs and ownership/access information. Sponsorship alone does not grant administration rights. |
| **Capabilities and identity mode** | Registration only, observability, Work IQ, Teams/Copilot reachability, and/or DLP. Choose non-Teammate **OBO** or **S2S**, or an **AI Teammate** with its agentic-user identity. This kit's Work IQ flow requires a delegated user token and is not wired for S2S. |
| **Model configuration** | The provider and model name; its API key **or** configured workload identity. For Azure-hosted models, also collect the endpoint, deployment name, and API version if your framework requires one. Confirm that the identity/key can actually invoke that model and has quota. |
| **Local tools and access** | The tools in [Prerequisites](#prerequisites), a usable AI coding CLI account/subscription, write access to the agent folder, and network access to GitHub, package registries, Microsoft sign-in/service endpoints, and your model provider. Use an interactive, non-elevated terminal on Windows. |

### Additional information for optional capabilities

| Capability | Additional information/access to prepare |
|---|---|
| **Work IQ** | The exact MCP servers/capabilities you want from the `a365` catalog, their audience IDs/scopes, the acting principal's Microsoft 365 Copilot entitlement, and the mailboxes/sites/teams/files that principal can access. A tool grant does not grant access to every resource; agent-user files may need explicit sharing and sensitivity-label usage rights. |
| **External MCP servers** | Approved server URLs or local executable commands and arguments, transport type, required credentials, and the external service's own permissions. These are separate from Agent 365/Work IQ consent. |
| **Local lab tools** | The tool groups you want enabled and any network/egress restrictions for web-fetch tools. |
| **Teams/Copilot messaging** | A public HTTPS messaging endpoint, or a dev-tunnel sign-in account and an available local host port (default `3978`). Keep `/api/messages` authenticated even when the tunnel permits anonymous transport access. |
| **Azure hosting, model access, or billing** | Subscription ID, resource group, region, resource names, deployment/billing owner, and the runtime identity's model/data access where applicable. Azure hosting is optional; an Azure model or Purview pay-as-you-go integration can need a subscription even when hosting is elsewhere. |
| **Publishing** | Agent/package name and description, publisher information, website/privacy/terms URLs and valid icons where required by the manifest. Identify the Microsoft 365/Teams administrator who can upload, approve, and make the app available to your test users. |
| **AI Teammate instance** | Instance name, agent-user alias/UPN domain and usage location, owner/sponsor details, Frontier availability/capacity, and the applicable user/mailbox/service licences. The agent user is associated with an agent identity; it does not replace that identity. |
| **Observability entitlement** | Confirm at least one user has Microsoft Agent 365 or Microsoft 365 E7 **assigned** in the tenant. Merely purchasing an unassigned subscription is insufficient for the documented observability path. |
| **Purview DLP** | Policy and billing owners, supported licences/PAYG, targeted users and application, sensitive-information types, and expected blocking behavior. Record the Entra application ID actually targeted by the policy as `PURVIEW_APP_LOCATION_ID`; do not invent a GUID or assume it is the token's user/object ID. |
| **Local development channel** | A free loopback port and a locally usable model configuration. Keep `A365_DEV_CHANNEL` off in saved configuration; enable it only for an intentional local test session. |

**Generated later — do not invent these values:** an optional new custom CLI client ID, blueprint IDs/credentials, agent-identity application and service-principal object IDs, agent-user object ID, consent/role-assignment records, tooling/package manifests, and the actual tunnel URL. Save them from CLI/portal output and `a365.generated.config.json`; application IDs and object IDs are not interchangeable. In particular, Graph's `oauth2PermissionGrants.clientId` is a **service-principal object ID**, not an application/client ID.

**Keep secrets out of this checklist and out of Git.** Put model keys, client secrets, and external-service tokens in the local environment or an approved secret store. Do not paste real credentials into the README, an issue, or a support transcript.

---

## Contents

- [What you can ask for](#what-you-can-ask-for)
- [Repository overview](#repository-overview)
- [Information and access checklist](#before-you-start--information-and-access-checklist)
- [Quick start — choose one workspace](#quick-start)
- [Example agents and exact commands](#example-agents)
- [Prerequisites and SDKs](#prerequisites)
- [Onboarding steps and required permissions](#onboarding-steps-and-required-permissions)
- [maven-prod observability consent recovery](#maven-prod-observability-consent-recovery)
- [Capability boundaries and tenant verification](#capability-boundaries-and-tenant-verification)
- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [What is included](#what-is-included)
- [Supported CLIs](#supported-clis)
- [Language support](#language-support)
- [Relationship to Microsoft's skills](#relationship-to-microsofts-skills)
- [Building and self-hosting — maintainers only](#building-and-self-hosting)
- [Maintainer source layout — separate checkout](#maintainer-source-layout)
- [Verification](#verification)
- [Licence](#licence)

---

## Quick start

### 1. Clone or download this repository

**Recommended: clone the repository** into a new directory. If it is private, use a GitHub account that has been granted access.

Run from the directory where you keep your projects:

```powershell
git clone https://github.com/gerardsl/agent365-sdk-onboarding-experience.git
Set-Location .\agent365-sdk-onboarding-experience
```

**Alternative without Git:** on this repository's GitHub page, choose **Code > Download ZIP**, extract it into a new directory, and open the downloaded repository folder (normally `agent365-sdk-onboarding-experience-main` for the `main` branch). GitHub adds that outer folder; enter it before running commands. On macOS/Linux, use your archive tool and terminal.

In either case, the current directory must contain `README.md`, `BUNDLE-MANIFEST.json`, `kit\`, `examples\`, and `tools\`. These are the ready-to-use bundle contents, not the separate maintainer build checkout. Do not clone or extract over an existing agent project.

Keep the included `.gitattributes` when publishing these files to GitHub: it preserves their exact bytes instead of converting line endings, which would invalidate the manifest hashes. Publish all contents, including dot-files and hidden kit directories; do not edit the inventoried kit/example files or hashes in the repository to bypass integrity checks.

### 2. Choose ONE example and create a NEW workspace

The helper needs Node.js; **Node 24 LTS is recommended**. From the cloned or downloaded repository root:

```powershell
node .\tools\prepare-workspace.mjs --list
```

Run **one** preparation command from this table:

| Example | What you get | Prepare a new sibling workspace |
|---|---|---|
| **[Node.js tool agent](#nodejs-tool-agent)** | OpenAI Agents SDK console starter; exact whitespace word count and UTC clock. Simplest tool-agent starting point; not a Teams host. | `node .\tools\prepare-workspace.mjs --example nodejs-tool-agent --destination ..\my-node-agent` |
| **[.NET tool agent](#net-tool-agent)** | Microsoft Agent Framework console starter targeting `net8.0`; word-count tool. Not a Teams host. | `node .\tools\prepare-workspace.mjs --example dotnet-tool-agent --destination ..\my-dotnet-agent` |
| **[.NET Agent 365 local lab](#net-agent-365-local-lab)** | Extended C# starter with opt-in Teams hosting, Work IQ, telemetry, agent-mailbox and Purview patterns. Widest executable integration coverage; single-user development host. | `node .\tools\prepare-workspace.mjs --example dotnet-agent365-lab --destination ..\my-agent-lab` |
| **[Python AI Teammate](#python-ai-teammate-host)** | Authenticated aiohttp Agents host, Microsoft Agent Framework/Azure OpenAI agent, telemetry/token-cache and optional Work IQ plumbing. Requires the most tenant configuration. | `node .\tools\prepare-workspace.mjs --example python-teammate --destination ..\my-python-teammate` |
| **[Java tool agent](#java-tool-agent)** | JDK 21/Gson/HttpClient console agent with word-count and text-reversal tools. Java hosting guidance requires deliberate adaptation. | `node .\tools\prepare-workspace.mjs --example java-tool-agent --destination ..\my-java-agent` |
| **[Go tool agent](#go-tool-agent)** | Standard-library console agent with word-count and text-reversal tools. Agent 365 integration is manual. | `node .\tools\prepare-workspace.mjs --example go-tool-agent --destination ..\my-go-agent` |
| **[Rust tool agent](#rust-tool-agent)** | Locked native-TLS/serde_json console agent with word-count and text-reversal tools. Agent 365 integration is manual. | `node .\tools\prepare-workspace.mjs --example rust-tool-agent --destination ..\my-rust-agent` |

The helper copies the **chosen sample plus the full kit**, including dot-folders such as `.a365-kit`, `.agents`, and `.claude`. It refuses an existing destination file/directory and any destination overlapping the repository's bundle root. It does **not** merge projects, install dependencies, sign in, grant permissions, or configure cloud services.

Keep the workspaces outside the bundle. Multiple language manifests in one project can confuse stack detection; never run onboarding against the bundle root, `examples\`, or `kit\`.

### 3. Enter that workspace, try the sample, then launch onboarding

For the Node.js choice:

```powershell
Set-Location ..\my-node-agent
```

For any other choice, enter the destination directory from its preparation command. Run the matching [sample commands](#example-agents) below. Install the [full onboarding prerequisites](#prerequisites) when you are ready to register the agent, then run:

```powershell
.\agent365-kit.ps1
```

For a Bash terminal, run `bash agent365-kit.sh` from the prepared workspace. The launcher checks the kit's prerequisites and reports available coding CLIs; it is not a model installer or tenant setup wizard.

Open **one** skill-aware coding CLI in this same workspace:

```powershell
copilot
```

Or use `claude` instead. Ask:

```text
Onboard this agent to Agent 365.
```

Choose the capabilities you actually need. Review the actual `a365` grant preview, target tenant and identity mode; use the [per-step permissions and administrator handoffs](#onboarding-steps-and-required-permissions) before applying anything. Starting the CLI or running a demo does not authorize cloud changes. Complete the [tenant acceptance checks](#capability-boundaries-and-tenant-verification) before calling the agent onboarded.

### Bringing an existing project, or starting without a sample

Prefer a fresh **kit-only** workspace. Run this from the cloned or downloaded repository root, using a destination that does not exist:

```powershell
node .\tools\prepare-workspace.mjs --example blank --destination ..\my-existing-agent
```

Then copy/merge your existing project into that new workspace, or ask the skills to scaffold there. Reconcile overlapping `.claude`, `.agents`, `.github`, and configuration files carefully; preserve your project's settings, instructions, own skills, and `.env`. Do not combine multiple examples in one agent workspace. Enter the new workspace before running the launcher.

If you must install directly into an existing project, back it up and follow the established **kit-only** installation/configuration-preservation guidance in this repository's `kit\AGENT365-KIT-README.md` (`dist\AGENT365-KIT-README.md` in the separate maintainer checkout) and [`docs/USING-WITH-YOUR-CLI.md`](docs/USING-WITH-YOUR-CLI.md). Their historical kit-only download/extraction instructions do not mean you should copy this entire repository into your agent. **The helper never merges into an existing directory.**

## Prerequisites

**One repository contains the authored instructions, skills, and sample source — not a prerequisite-free, offline software installation.** No SDK/CLI installers, runtimes, licences, tenant, credentials, or model binaries are bundled. Initial SDK/package restores need network access; thereafter the documented mock demos/tests do not make model or tenant calls.

| Your goal | What is needed |
|---|---|
| **Try the deterministic Node.js or Python demo only** | The respective runtime (Node includes npm); no model account, coding CLI or tenant. The workspace helper additionally needs Node. For Python without the helper, `py -3.12 .\examples\python-teammate\demo.py` from this repository root runs the demo only — it does not onboard that directory. |
| **Run any example's tests or mock mode** | Its runtime/compiler and any restored dependencies. Java needs Maven; Rust needs Cargo and a platform linker; Go uses only its standard library. Package restores contact registries; tests/mock runs are not external model inference. |
| **Run a live example** | The selected runtime and dependencies plus separately authorized, billable model access. Basic Node.js/.NET use OpenAI; Python uses Azure OpenAI **API-key authentication**; the extended .NET lab, Java, Go and Rust offer explicit OpenAI/Gemini/Mistral provider selection. |
| **Onboard to Agent 365** | The common kit tools below, one coding CLI with usable account/subscription, the selected agent runtime, and the tenant information, permissions and entitlements in this README. |

### Software and services — what each one does

| Software/service | Version or scope | Why / when needed |
|---|---|---|
| **Node.js / npm** | Kit baseline **Node 18+**; **Node 24 LTS recommended**, sample tested with **24.16.0** | Runs the workspace helper, kit validators, and Node example. npm restores Node packages and can install the coding CLI. |
| **.NET SDK** | **8+** for kit tooling; both C# examples target **`net8.0`** | Installs/runs the `a365` global tool; restores/builds the basic .NET agent and extended .NET lab. If using a newer SDK, also install the **.NET 8 runtime** for these samples. A runtime alone is not an SDK. |
| **Agent 365 CLI (`a365`)** | .NET global tool **`Microsoft.Agents.A365.DevTools.Cli`**; previously audited package **1.1.221** | Tenant/client readiness, reviewed blueprint/identity setup, permissions, endpoint registration and packaging. Not an agent model runtime. Check installed help and tenant rollout as described below. |
| **Azure CLI (`az`)** | Required for Agent 365 onboarding | Signs the operator into the intended tenant and supports setup operations. Its sign-in is separate from `a365` and `devtunnel`; Azure hosting is not mandatory. |
| **Git** | Required for cloning and the kit's scaffolding/update workflows | Retrieves the repository and supports project workflows. GitHub's Download ZIP is an alternative for obtaining the files; Git is not needed merely to run a standalone deterministic demo. |
| **ONE skill-aware coding CLI** | For example **GitHub Copilot CLI** (`@github/copilot`) **or Claude Code** (`@anthropic-ai/claude-code`), with usable account/subscription | Reads the project skills and guides code/configuration changes. Its subscription does **not** provide the sample agent's model API entitlement. See [Supported CLIs](#supported-clis). |
| **Python** | **Exactly 3.12** for the bundled Python profile | Needed only for the Python example, its venv, host and tests. `pip` is supported; `uv` is optional, not required. |
| **PowerShell** | **7 recommended on Windows; 7+ required to rebuild distributions** | Runs the Windows launcher and maintainer build scripts. A Bash launcher is supplied for macOS/Linux. |
| **Model service/account** | The provider selected by your example: OpenAI, Azure OpenAI, Gemini or Mistral | Supplies live inference and quota. API charges are separate from Microsoft tenant licences and coding-assistant subscriptions. Use only the selected provider's credentials; this bundle supplies no model access. |
| **`devtunnel`** | Optional; public development messaging only | Exposes an authenticated local messaging host over public HTTPS. Real HTTPS hosting is an alternative. It is unnecessary for deterministic demos and never replaces `/api/messages` authentication. |
| **VS Code** | Optional | An editor; not required to use the bundle from a terminal. |
| **GitHub CLI (`gh`)** | Optional | GitHub/repository operations; **not a substitute for GitHub Copilot CLI**. No `gh skill` installation is required for this bundle. |
| **JDK and Maven** | **JDK 21**, **Maven 3.9+** for `java-tool-agent` | Compiles the Java console agent and runs JUnit/loopback HTTP tests. Java hosting remains a separate integration. |
| **Go** | **1.24+** for `go-tool-agent` | Builds and tests the standard-library Go console agent. |
| **Rust and Cargo** | **1.88+**, plus a working platform linker, for `rust-tool-agent` | Restores the locked crates and builds/tests the Rust console agent. Native TLS uses SChannel on Windows; Linux may need OpenSSL development libraries and pkg-config. |

**Not required by this bundle:** Docker, Azure Developer CLI (`azd`), or the Foundry-hosted-agent extension. These instructions do not perform a Foundry hosted-agent deployment.

Install the tools you need through your organisation's approved software process. Common Windows onboarding installs, after installing the appropriate Node version:

```powershell
winget install --id Microsoft.DotNet.SDK.8 -e
dotnet tool install -g Microsoft.Agents.A365.DevTools.Cli --version 1.1.221
winget install --id Microsoft.AzureCLI -e
```

The CLI version above is the previously audited package, not a promise that newer source and this binary are identical. If already installed, check `a365 --version` before deciding whether to change it. On macOS, `brew install --cask dotnet-sdk` and `brew install azure-cli` are alternatives; ensure the .NET 8 runtime is also present for the .NET sample.

Install **one** coding CLI, not both unless you want both:

```powershell
npm install -g @github/copilot
```

Or:

```powershell
npm install -g @anthropic-ai/claude-code
```

Before onboarding:

- **Validate tenant/client readiness.** Run `a365 setup requirements` and follow the installed CLI's documented client-selection flow. A working shared CLI client does not give every developer a role, agent-resource consent, or a licence.
- **Configure the agent's model authentication.** Supply the provider's API key or supported identity-based access, plus the endpoint/model/deployment settings. The general kit supports identity-based configurations, but the bundled Python example specifically uses an Azure OpenAI key. Your coding-assistant subscription is not the running agent's model entitlement.
- **Use a normal interactive terminal on Windows.** Some software installers need OS elevation; ordinary onboarding should use your intended user profile, PATH and sign-in context. OS administrator, Entra administrator, and Azure subscription roles are different permissions.

### SDKs and libraries restored for the examples

These are dependency declarations, **not bundled SDK binaries**. Lock files record the wider dependency set; the commands below restore it from package registries.

| Example | Package(s) and pinned version | What they do |
|---|---|---|
| Node.js | `@openai/agents` **0.17.0** | Agent runner and SDK function-tool execution; live mode calls OpenAI. |
| Node.js | `zod` **4.5.4** | Validates tool input schemas. `package-lock.json` is included; use `npm ci`. |
| .NET | `Microsoft.Agents.AI` **1.6.2** | Microsoft Agent Framework agent/tool orchestration. |
| .NET | `Microsoft.Extensions.AI.OpenAI` **10.10.0** | OpenAI integration for the .NET AI abstractions. |
| .NET | `DotNetEnv` **3.1.1** | Loads local `.env` settings. `packages.lock.json` is included; use locked restore. |
| Extended .NET lab | The C# packages above, plus pinned Agents hosting/authentication, Work IQ, Microsoft OpenTelemetry, MSAL and Azure Identity dependencies in `ToolAgent.csproj` / `packages.lock.json` | Adds opt-in authenticated hosting, tools, token flows and telemetry. Its source and offline tests do not supply tenant setup, consent or licences. |
| Python | `microsoft-agents-hosting-aiohttp`, `microsoft-agents-hosting-core`, `microsoft-agents-authentication-msal`, `microsoft-agents-activity` — **1.6.0** each | aiohttp HTTP host, Agents application/turn handling, MSAL authentication and activity types. |
| Python | `microsoft-agents-a365-notifications`, `microsoft-agents-a365-runtime`, `microsoft-agents-a365-tooling` — **1.0.0** each | Agent 365 notifications, runtime/agentic token support and optional Work IQ tool integration. |
| Python | `agent-framework-core` **1.17.0**, `agent-framework-openai` **1.14.2** | Microsoft Agent Framework orchestration and Azure OpenAI model integration. |
| Python | `microsoft-opentelemetry` **1.2.0** | Telemetry instrumentation/export support; adding code does not supply ingestion permission or entitlement. |
| Python | `openai` **3.8.0**, `mcp` **1.29.1** | Model-service client and MCP protocol/tool client support. |
| Python | `python-dotenv` **1.2.3** | Loads local environment configuration. |
| Python | `aiohttp` **3.14.3**, `httpx` **0.28.1**, `cryptography` **46.0.3** | HTTP hosting/client plumbing and cryptographic support used by authentication dependencies. |
| Java | Gson **2.13.2**, JUnit Jupiter **5.13.4**; build plugins pinned in `pom.xml` | JSON protocol handling and offline/loopback tests; HTTP uses the JDK client. |
| Go | Standard library only; minimum Go version in `go.mod` | HTTP, JSON, local tools and tests without third-party Go modules. |
| Rust | `serde_json` **1.0.145**, `ureq` **2.12.1**, `native-tls` **0.2.14**, with `Cargo.lock` | JSON and bounded HTTPS transport using native certificate validation; restore/build with `--locked`. |

The Python sample has a root `pyproject.toml`, direct pins in `requirements.txt`, and a fully pinned constraint snapshot in `requirements-lock.txt`. Use **both** requirements files in the restore command; do not substitute an unpinned “latest” install. Additional Agent 365 SDKs for the basic Node.js/.NET console starters are added through the selected onboarding skills. The extended .NET lab already includes its optional integration dependencies; Java, Go and Rust have separate integration boundaries.

## Example agents

There are **seven examples across six languages**. All commands below run in the **prepared sample workspace**, not in the onboarding repository root. Local tests/mock modes and live model modes are deliberately separate.

Node.js, both .NET examples and Python support local `.env` configuration: copy `.env.example` **once**, and merge rather than overwrite an existing `.env`. Java, Go and Rust read **process environment variables**; their `.env.example` files are references, not automatically loaded configuration.

### Node.js tool agent

Use Node **24 LTS** (tested **24.16.0**). Restore the locked SDK dependencies, run the three local tests (word counter, actual SDK tools including UTC, and an in-memory model → tool → model turn), and try the deterministic demo:

```powershell
npm ci
npm test
npm run demo
```

**Intentional CommonJS compatibility:** the starter entry point is `agent.js`, and `package.json` sets `"type": "commonjs"`. Kit validators discover `.js`/`.ts` source and execute CommonJS `.js` hooks within the project; switching this starter to `"type": "module"` would break those hooks. `sdk-check.mjs` remains ESM and imports the CommonJS starter. The npm commands are unchanged, and the bundled kit remains unmodified v0.1.2.

The tools perform **exact whitespace word counting** and report the **UTC clock**. `npm run demo` and the default `npm start` are mock demonstrations: **no model or tenant calls, and no AI inference**. Package restoration itself needs network access.

For live inference:

```powershell
Copy-Item .env.example .env
```

Set these values in the local `.env`:

```dotenv
OPENAI_API_KEY=<your-openai-project-api-key>
OPENAI_MODEL=gpt-4.1-mini
```

`OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`; confirm your OpenAI project can invoke the selected model. Then:

```powershell
npm run live -- 'Count the words in Hello Agent 365'
```

**Live mode sends the prompt to OpenAI and can incur charges.** It needs its own OpenAI account/project/model entitlement, separate from your coding CLI and Microsoft tenant. Provider SDK tracing is disabled in this starter; Agent 365 telemetry is added through the skills after registration and consent.

This is a **console starter, not a pre-hosted Teams agent**. Use `add-messaging-endpoint` / *“Make this agent chattable in Teams”* to add the HTTP host and authentication, then complete endpoint registration, publishing and administrator activation.

### .NET tool agent

Use the **.NET 8 SDK**, or a newer SDK with the **.NET 8 runtime** installed. The project targets `net8.0`.

```powershell
dotnet restore --locked-mode
dotnet run -- --self-test
dotnet run -- --mock
```

The self-test uses the same `ChatClientAgent` factory as live mode with an in-memory `IChatClient`; it verifies two model steps and a real `AIFunction` result **without external inference**. Mock mode makes **no AI/model/tenant calls**; the first dependency restore is online.

For live inference:

```powershell
Copy-Item .env.example .env
```

Set `OPENAI_API_KEY` to your own OpenAI project key and optionally `OPENAI_MODEL` (default `gpt-4.1-mini`), then run:

```powershell
dotnet run -- --live 'Count the words in Hello Agent 365'
```

**Live mode sends the prompt to OpenAI and can incur charges.** OpenAI model access is separate from your coding-assistant subscription and Microsoft tenant. This is also a **console starter, not a pre-hosted Teams agent**; the skills add Agent 365 hosting/authentication and telemetry later, subject to reviewed grants.

### .NET Agent 365 local lab

Choose **`dotnet-agent365-lab`** for the widest executable Agent 365 integration coverage in this bundle. It uses the **.NET 8 SDK** and preserves the small console agent while adding optional JWT-protected Teams hosting, Work IQ, telemetry, agent-mailbox authentication, Purview hooks and local lab tools.

Start offline:

```powershell
dotnet restore --locked-mode
dotnet run -- --self-test
dotnet run -- --mock "Hello from Agent 365"
.\Test-Agent365TokenPlan.ps1
```

For model-only live inference, configure `.env` with `MODEL_PROVIDER=mistral`, `openai` or `gemini` and that provider's API key/model, then run:

```powershell
dotnet run -- --live "Count the words in Hello Agent 365"
```

**No tenant identities, tokens or credentials are preconfigured.** Before using `--a365`, `--a365-check`, `--teams`, or enabled Purview checks, follow the [extended example README](examples/dotnet-agent365-lab/README.md) to register the agent and initialize verified local identities. Its Teams host is deliberately a **single-user development host**, not a production multi-user deployment. Optional integration code and passing offline tests do not prove consent, hosting, tool access or policy enforcement.

### Python AI Teammate host

Use **Python exactly 3.12**. This sample includes the authenticated aiohttp Agents host in `app\host_agent_server.py` and `MyAgent` in `app\agent.py`, using Microsoft Agent Framework and Azure OpenAI. It also includes telemetry/token-cache wiring, notifications and optional per-turn Work IQ plumbing. It is **not fully onboarded out of the box**.

**Deterministic demo — no installed packages, model or tenant needed:**

```powershell
py -3.12 .\demo.py
```

This is only a mock tool demonstration, not the HTTP host or a live AI conversation.

**Restore the actual SDK environment and run the 25-test offline suite:**

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt -c requirements-lock.txt
.\.venv\Scripts\python.exe -I -S .\run_offline.py --deps .\.venv\Lib\site-packages
```

The isolated suite mocks model and tenant traffic and permits **loopback only**. Its test count describes the suite, not a new bundle pass claim. On macOS/Linux, create the venv with Python 3.12, use that venv's Python executable, and pass its matching `site-packages` directory to `--deps`; do not use the Windows directory above.

**Configure live model and identity inputs:**

```powershell
Copy-Item .env.example .env
```

Fill the following keys in `.env`. Get identity values from the **reviewed `a365` setup output / `a365.generated.config.json`**, after the required registration and administrator consent. Do not invent IDs or reuse the interactive CLI client's identity.

| Environment key | Value / meaning |
|---|---|
| `AZURE_OPENAI_API_KEY` | Key authorized to invoke your Azure OpenAI deployment. This sample uses **key authentication**, not a credential-free or managed-identity model flow. |
| `AZURE_OPENAI_ENDPOINT` | `https://<resource>.openai.azure.com/` for your resource. |
| `AZURE_OPENAI_DEPLOYMENT` | Your actual model deployment name, with available quota. |
| `AZURE_OPENAI_API_VERSION` | An API version actually supported by that deployment; do not guess one from a model name. |
| `AUTH_HANDLER_NAME` | `AGENTIC` |
| `AGENTAPPLICATION__USERAUTHORIZATION__HANDLERS__AGENTIC__SETTINGS__TYPE` | `AgenticUserAuthorization` |
| `AGENTAPPLICATION__USERAUTHORIZATION__HANDLERS__AGENTIC__SETTINGS__SCOPES` | `https://graph.microsoft.com/.default` — requests already consented permissions; it grants nothing. |
| `CONNECTIONS__SERVICE_CONNECTION__SETTINGS__CLIENTID` | **Blueprint application ID**, not the interactive CLI client ID or a service-principal object ID. |
| `CONNECTIONS__SERVICE_CONNECTION__SETTINGS__CLIENTSECRET` | **Blueprint secret**, not a secret for the public interactive CLI client (which does not require one). Keep it local/in an approved secret store. |
| `CONNECTIONS__SERVICE_CONNECTION__SETTINGS__TENANTID` | Intended Entra tenant ID. |
| `CONNECTIONSMAP__0__SERVICEURL` | `*` — the connection-map selector; this does not disable inbound authentication. |
| `CONNECTIONSMAP__0__CONNECTION` | `SERVICE_CONNECTION` |

Keep the starter's safety defaults until you deliberately configure the corresponding capability:

```dotenv
HOST=127.0.0.1
PORT=3978
PYTHON_ENVIRONMENT=Production
ENABLE_WORKIQ=false
ENABLE_A365_OBSERVABILITY_EXPORTER=false
MICROSOFT_OTEL_SDKSTATS_DISABLED=true
```

Work IQ requires approval for the installed catalog's exact servers, audiences and scopes, a tooling manifest generated/configured through the skills, the acting principal's entitlement, and resource ACLs. **Setting `ENABLE_WORKIQ=true` does not grant any of these.** Enable the Agent 365 exporter only after its runtime permission and tenant entitlement are ready. Local console telemetry can include sensitive test content; use synthetic inputs and protect logs.

**Start the real host only after `.env` is configured:**

```powershell
.\.venv\Scripts\python.exe .\app\host_agent_server.py
```

In another terminal, while the host is running:

```powershell
curl.exe -i http://127.0.0.1:3978/api/health
curl.exe -i -X POST -H "Content-Type: application/json" -d "{}" http://127.0.0.1:3978/api/messages
```

Expected results: **GET `/api/health` → 200** and **unsigned POST `/api/messages` → 401**, including when the environment is Development. Keep the host authenticated: there is no unsigned playground/tunnel workaround. A health response proves neither model access nor onboarding.

Real use still requires **registration, consent, licences, model credentials, messaging deployment/endpoint registration, publishing and activation**. Azure OpenAI calls can be billed. Complete the [tenant checks](#capability-boundaries-and-tenant-verification) with authorized identities; do not treat the demo, local tests or a healthy process as a Teams/Work IQ/telemetry success.

### Java tool agent

Choose **`java-tool-agent`** with **JDK 21** and **Maven 3.9+**. It uses Gson and the JDK HTTP client for a bounded model/tool/model loop with `count_words` and `reverse_text`.

```powershell
mvn test
mvn "-Dtest=AgentTest#wordCount" test
mvn exec:java "-Dexec.args=--mock Hello Agent 365"
```

The second command runs one test; the demo uses an in-memory model, not external inference. After setting the [provider environment variables](#live-configuration-for-java-go-and-rust), live mode is:

```powershell
mvn exec:java "-Dexec.args=--live Count the words in Hello Agent 365"
```

This is a **console agent, not a Teams host**. The kit has Java hosting/telemetry guidance, but this example is not LangChain4j; adapt the integration deliberately rather than replacing its architecture. See the [Java example README](examples/java-tool-agent/README.md).

### Go tool agent

Choose **`go-tool-agent`** with **Go 1.24+**. It uses only Go's standard library for HTTP, JSON, word counting, Unicode text reversal and the model/tool loop.

```powershell
go test
go test -run TestWordCount
go run . --mock "Hello Agent 365"
```

The second command selects the word-count test. Tests use in-memory models and loopback HTTP. After setting the [provider environment variables](#live-configuration-for-java-go-and-rust):

```powershell
go run . --live "Count the words in Hello Agent 365"
```

Agent 365 registration/hosting/tooling integration for this Go starter is **manual**; the kit's unknown-language validator result is not onboarding evidence. See the [Go example README](examples/go-tool-agent/README.md).

### Rust tool agent

Choose **`rust-tool-agent`** with **Rust/Cargo 1.88+** and a working platform linker. It uses `serde_json`, `ureq` and native TLS with the included `Cargo.lock`.

```powershell
cargo test --locked
cargo test --locked word_count
cargo run --locked -- --mock "Hello Agent 365"
```

The second command selects the word-count test. The default mock exercises the actual local tool loop without a provider call. After setting the [provider environment variables](#live-configuration-for-java-go-and-rust):

```powershell
cargo run --locked -- --live "Count the words in Hello Agent 365"
```

This is a standalone console agent; Agent 365 integration is **manual**, not established by a passing static validator. See the [Rust example README](examples/rust-tool-agent/README.md) for linker/TLS prerequisites.

### Live configuration for Java, Go and Rust

These three examples read **process environment variables**, not `.env` automatically. In the terminal where you run the example, set `MODEL_PROVIDER` and the matching variables:

| `MODEL_PROVIDER` | Required key variable | Optional model variable | Default model |
| --- | --- | --- | --- |
| `mistral` | `MISTRAL_API_KEY` | `MISTRAL_MODEL` | `ministral-3b-2512` |
| `openai` | `OPENAI_API_KEY` | `OPENAI_MODEL` | `gpt-4.1-mini` |
| `gemini` | `GEMINI_API_KEY` | `GEMINI_MODEL` | `gemini-2.5-flash-lite` |

For example, in PowerShell:

```powershell
$env:MODEL_PROVIDER = "mistral"
$env:MISTRAL_API_KEY = "<your key, kept local>"
$env:MISTRAL_MODEL = "ministral-3b-2512"
```

Keys are never reused across providers. Live calls send content to the selected provider and may incur charges. Defaults do not guarantee model availability or quota. Start with synthetic content; these console examples do not include tenant configuration, automatic Work IQ, telemetry export or Purview enforcement.

## Onboarding steps and required permissions

The step numbers match [`GUIDE.md`](GUIDE.md), an optional deeper walkthrough. For this repository, use the workspace preparation above for Step 1; older kit-only installation examples in supporting references are not instructions to copy the whole repository into an agent project. **Do not assign every role or grant every permission listed here.** Choose your capabilities, review the CLI's proposed grants, and have the appropriate operator complete each privileged action.

There are four independent permission layers:

1. **Human roles** authorize the person operating Entra, Microsoft 365, Purview, or Azure.
2. **CLI-client OAuth permissions** let the interactive `a365` client call APIs as that person. They do not elevate the person.
3. **Runtime grants and resource access** authorize the agent/user to invoke telemetry, tools, mail, files, and models.
4. **Licences, policies and rollout availability** enable the service or experience; a permission grant cannot replace them.

**Version boundary:** this guidance was checked against Microsoft documentation on **12 September 2026**. The published CLI package was `1.1.221`; some implementation details were checked against the newer [DevTools source snapshot](https://github.com/microsoft/Agent365-devTools/commit/08e48a963dd879c6938d032e97e87ccbb03613de), not a proven identical binary. Check `a365 --version`, the installed command help, and the actual grant preview. Managed-client rollout and preview features can differ by tenant.

### Tenant prerequisite — validate the CLI client and arrange consent

**Command:** `a365 setup requirements`.

- **Validating an existing client:** use a permitted tenant account that satisfies MFA/Conditional Access and any enterprise-app assignment policy. No Azure subscription role is needed merely to validate client readiness.
- **Client choice:** current documentation prefers Microsoft's managed Agent 365 CLI application. If it is unavailable or your organisation requires a custom client, use the [custom-client registration procedure](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/custom-client-app-registration).
- **Manual custom-client setup/consent:** the documented roles are **Cloud Application Administrator** or **Application Administrator**. Cloud Application Administrator is narrower because it excludes Application Proxy management. App creation itself can also be allowed to ordinary users by tenant policy; that does not authorize admin consent.
- **CLI automation versus platform authority:** the current automatic create/configure and OAuth-consent paths are **Global Administrator-gated**. A developer with **Agent ID Developer** can create owned blueprints and hand consent to an administrator. Do not give developers permanent Global Administrator merely to avoid the handoff.
- **Microsoft Graph application permissions:** Application Administrator/Cloud Application Administrator cannot consent to these. A **Privileged Role Administrator**, Global Administrator, or another specifically authorized administrator must handle that consent. A manual grant-management client also needs its own appropriate API permissions.

For the **custom interactive CLI client**, the documented Microsoft Graph permission bundle is **delegated**, with tenant-wide admin consent:

```text
AgentIdentityBlueprint.ReadWrite.All
AgentIdentityBlueprintPrincipal.Create
AgentIdentity.Read.All
AgentIdentity.DeleteRestore.All
AgentRegistration.ReadWrite.All
Application.Read.All
User.Read
```

Follow the official procedure for its public-client redirects and `wids` role claim. Do not replace this bundle with application permissions, add a client secret to a public client, or assume the same bundle is the agent's runtime grant set. The managed Microsoft client is validated rather than repaired by creating a tenant-owned registration.

Sources: [CLI setup/role table](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/reference/cli/setup), [CLI authentication](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/agent-365-cli), [Entra consent authority](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent).

### Step 1 — place the kit

**Permissions:** access to clone/download the GitHub repository, local read access to its files, and write access to a new, independent agent workspace. Preparing the chosen sample plus kit needs no Entra role, Graph grant, or Azure RBAC role. Use the [workspace helper](#quick-start), not a whole-repository copy over an existing project. Preserve existing project configuration when manually installing or updating the kit.

### Step 2 — check prerequisites and start the CLI

**Permissions:** local execute rights, project write access, and the chosen coding CLI's account entitlement. Installing a machine-wide SDK may need local OS administrator approval; a normal kit launch does not.

Sign into the intended tenant with `az login --allow-no-subscriptions`. Azure CLI, `a365`, and `devtunnel` use separate authentication contexts. Sign-in must satisfy tenant policy and does not itself grant Contributor or agent-management rights. A runtime model needs its own inference-authorized credential/identity.

### Step 3 — register the blueprint and agent identity

**Action:** ask for onboarding; run the reviewed `a365 setup all` command in your own interactive terminal when authentication requires it.

**Who:** **Agent ID Developer** can create an owned blueprint; **Agent ID Administrator** supports wider agent-identity lifecycle administration. Existing objects also require appropriate ownership/access. The CLI's consent phase may need the Global Administrator handoff described above.

- **OBO:** the agent acts for a user. It still needs consented blueprint/resource permissions and that user's underlying data access. **OBO is not an admin-consent-free onboarding route.**
- **S2S:** the agent acts as its identity. Application-role assignments are separate from delegated grants, and each target API must support application access. `/.default` requests permissions already granted; it does not grant them.
- **AI Teammate:** setup creates/configures the blueprint; later activation and instance/user provisioning are separate. Do not combine unsupported S2S/`both` flags with the kit's AI Teammate flow.

**Review the real scope set.** Current CLI source includes Graph defaults such as `Mail.ReadWrite`, `Mail.Send`, `Chat.ReadWrite`, `User.Read.All`, `Sites.Read.All`, `Files.ReadWrite.All`, `ChannelMessage.Read.All`, and `ChannelMessage.Send`, plus selected resource/tool permissions. Selecting only “Register” or “Observability” is not proof that the CLI requested a minimal scope set. Obtain approval for the actual read/write/send access before applying it.

Sources: [Agent identity and consent](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/identity), [setup reference](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/reference/cli/setup).

### Step 4 — add observability

**Code editing:** local project write access. **Service access:** consent/assignment of `Agent365.Observability.OtelWrite` on the Observability API, separate from the CLI's Graph permissions.

The runtime resolver must obtain the appropriate token for `api://9b975845-388f-4429-889e-eab1ef63949c/.default`, with the right tenant/agent identity and OBO, agent-user, or S2S flow. The exporter must be enabled. A token-resolver function is not a permission grant.

**Entitlement:** the documented ingestion path requires at least one user with **Microsoft Agent 365 or Microsoft 365 E7 assigned** in the tenant. Missing entitlement can result in dropped telemetry even after HTTP 200. Azure Monitor/App Insights or an Azure-hosted agent is not mandatory.

Sources: [Observability](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/observability), [developer prerequisites](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/get-started).

#### maven-prod observability consent recovery

If setup prints:

```text
Custom permission configuration requires tenant admin action.
An administrator must grant the blueprint consent for maven-prod [Agent365.Observability.OtelWrite] via the Entra portal.
```

**Pause the affected setup step and have the tenant administrator create an access
package.** This is not a reason to recreate the blueprint or change authentication mode.

1. In [Microsoft Entra admin center](https://entra.microsoft.com), open **ID Governance >
   Entitlement management > Access packages > New access package** and choose the
   appropriate catalog. An administrator may reuse an existing package only after
   verifying it has the required resource role and assignment policy.
2. Configure the access-package resource role exactly as follows:

   | Field | Value |
   | --- | --- |
   | Resource | `maven-prod` |
   | Type | `OAuthApplication` |
   | Sub Type | `API` |
   | Role | `Agent365.Observability.OtelWrite` |

3. **Create an initial policy** that permits assignment to the intended blueprint,
   with the tenant's required approvals and lifecycle settings.
4. **Assign the access package to the blueprint** under that policy. Verify the
   blueprint against `agentBlueprintId` in `a365.generated.config.json`; do not
   select the human user or interactive CLI application.
5. **Wait until the blueprint's assignment status is `Delivered`.** Refresh its
   Requests/Assignments details after a short wait. Creating the policy or seeing
   `Approved`, `Pending`, or `Delivering` is not sufficient; delivery is asynchronous
   and there is no fixed wait that proves completion. If it stalls, have the
   administrator inspect the delivery error.
6. Only after `Delivered`, resume the affected step and verify effective permissions,
   fresh runtime tokens and actual telemetry ingestion. Do not hand-edit generated
   configuration or mark setup complete while the assignment is still pending.

This workflow requires an authorized administrator and an eligible catalog. The
current Microsoft guidance requires Global Administrator/resource-owner authorization
for OAuth API resource roles; activate the appropriate role if PIM is in use.
If `maven-prod` or the requested role is missing, ask the catalog administrator rather
than creating a substitute resource.

**Code support:** in a prepared workspace, replace the `a365` executable in approved
setup commands with the bundled runner, leaving their arguments unchanged:

```powershell
node .\.a365-kit\run-a365.mjs setup all --agent-name <your-agent-name> --dry-run
```

The runner prints the recovery above when it recognizes the specific message.
It forwards the CLI output, preserves nonzero failures and returns **exit code 2**
if the CLI exits zero but still requires this administrator action. It does not
create an access package, poll delivery, or apply consent. Direct `a365` invocations
are not patched. To show the steps after a direct CLI call without rerunning setup:

```powershell
node .\.a365-kit\run-a365.mjs --explain-observability-consent
```

For Bash, use `node ./.a365-kit/run-a365.mjs`. The full prepared-workspace guide is
[observability-access-package.md](kit/.a365-kit/shared/observability-access-package.md).
See Microsoft's [agent access-package guide](https://learn.microsoft.com/en-us/entra/agent-id/agent-access-packages)
and [assignment delivery documentation](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-assignments).

### Step 5 — add tools

| Tool path | Who approves/configures it | Runtime permissions and access |
|---|---|---|
| **Work IQ / Microsoft-hosted MCP** | **AI Administrator or Global Administrator** handles tenant tool approval/control. The current CLI permission-grant workflow uses the admin handoff. Adding a server to `ToolingManifest.json` is **not** consent. | Delegated OBO/agent-user context, an approved server, the acting principal's applicable **Microsoft 365 Copilot** entitlement, and underlying mailbox/site/file/team access. V2 servers use per-server audiences with `Tools.ListInvoke.All` and metadata permission `McpServersMetadata.Read.All`; legacy V1 uses shared-audience `McpServers.*.All` scopes. Use the installed catalog's exact audience/scope rather than mixing versions. |
| **Direct external MCP** | Local execution rights and the external service's own account/OAuth/API-key approval; review allowed filesystem/database/network access. | Provider-specific scopes and resource permissions. This kit's direct connection does not register the server with Agent 365. Separately registering an approved custom remote MCP server in the governed tool workflow is a different administrative process. |
| **Local lab tools** | Permission to execute the selected utilities and make their network/file operations. | No automatic Graph grant. Web-fetch tools still need approved outbound access. Prompt/response DLP does not authorize or control every tool side effect. |

Sources: [Tooling and consent](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/tooling), [Work IQ licensing](https://learn.microsoft.com/en-us/microsoft-agent-365/tooling-servers-overview), [tool approval/custom remote MCP](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/manage-tools-for-agent).

### Step 6 — host the agent and register its messaging endpoint

- **Local host:** project write/execute rights and permission to bind the chosen port. Keep inbound JWT validation on `/api/messages`.
- **Dev tunnel:** a permitted tunnel-owner account and a separate `devtunnel user login`; no general Entra administrator or Azure subscription role is required simply to own a tunnel. `--allow-anonymous` exposes the transport publicly, not an authorization bypass in the agent. Never tunnel the local dev-chat port.
- **Endpoint update:** appropriate blueprint ownership/**Agent ID Developer** authority, or broader Agent ID administration. Use `a365 setup blueprint --update-endpoint https://<host>/api/messages --m365`. Current CLI documentation infers M365 for endpoint-only updates; keeping the explicit flag expresses intent and supports older flows. Full `setup all` has its own M365 selection.
- **Bot grants:** `a365 setup permissions bot` has a documented **Global Administrator** consent workflow. It includes Messaging Bot API `AgentData.ReadWrite`; current shared setup also handles observability and Power Platform `Connectivity.Connections.Read`. A registered URL alone grants none of these permissions.
- **Azure hosting, if chosen:** deployment generally needs **Contributor** at the appropriate scope. Assigning runtime roles additionally requires `Microsoft.Authorization/roleAssignments/write`, for example via **Role Based Access Control Administrator** or **User Access Administrator**. Grant the runtime identity only its required data-plane access; Azure OpenAI inference can use **Cognitive Services OpenAI User**.

Sources: [Dev-tunnel access](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/cli-commands), [setup/permissions reference](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/reference/cli/setup), [optional Azure deployment](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/deploy-agent-azure), [Azure role assignment](https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments-portal).

### Step 7 — confirm the agent/AI Teammate experience

Choosing a route needs no extra permission by itself. An ordinary agent identity does not automatically have a mailbox or Teams presence. An AI Teammate can have an **associated agent user**, with its own service entitlements, after approval/provisioning.

**Availability:** agent-user/AI Teammate experiences remain Frontier preview. The current [Frontier onboarding guide](https://learn.microsoft.com/en-us/microsoft-agent-365/onboard) calls for the **Microsoft Agent 365 Frontier 25-seat subscription**. Confirm your tenant's eligibility and the agent user's required Microsoft 365 service licences before selecting that route.

### Step 8 — create the package

**Permissions:** local package-file write access and existing configuration; producing a ZIP is not admin-center upload, consent, or deployment.

Run the appropriate `a365 publish` command for the chosen experience. If `useBlueprint: true` produces “Nothing to publish,” do not blindly toggle `--aiteammate true`: that flag selects the **AI Teammate/agentic-user-template branch**. The kit's previously observed OBO packaging workaround is not a first-party guarantee that every ordinary agent can be published through that branch. Confirm the supported package/tenant experience with the publishing administrator.

Sources: [Publish reference](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/reference/cli/publish), [publishing walkthrough](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/publish).

### Step 9 — upload, approve, make available, and create an instance

**Microsoft 365 admin center:** the current agent-role matrix authorizes **AI Administrator or Global Administrator** to install, approve, modify, and manage agents. Teams Administrator controls Teams-specific settings but is not the general substitute for this role. The older developer publishing walkthrough still specifies Global Administrator; if that specific flow rejects AI Administrator, use the documented administrative handoff rather than broadening the developer account.

Review package permissions, the publish/deploy audience, custom-app policies, and end-user Teams/Copilot entitlements separately. Where the approved experience supports it, an allowed requester can create an instance after activation; administrators manage the associated licences/policies. **Agent ID Administrator** lifecycle authority in Entra is not the same as the Microsoft 365 admin-center role.

Provisioning an agent identity/user/mailbox is asynchronous. Wait for completion, grant access to the actual test resources, keep the host running, and test with an authorized user.

Sources: [Agent administrator roles](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/agent-roles-perms), [upload/registry](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/agent-registry#upload-custom-agent), [instance creation](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/create-instance).

### Step 10 — configure and verify Purview DLP

There are **three separate approvals/configurations**:

1. **Runtime API consent:** Microsoft Graph `ProtectionScopes.Compute.User` and `Content.Process.User`. Both delegated and application forms require administrator consent. An authorized Cloud Application Administrator/Application Administrator can handle appropriate delegated consent; Microsoft Graph **application** consent needs a suitably privileged administrator such as Privileged Role Administrator. A client that creates grants also needs authorized grant-management scopes.
2. **Purview policy administration:** use **DLP Compliance Management** or an appropriate documented Purview role group, such as Compliance administrator, Compliance data administrator, Information Protection, Information Protection Admin, or Security administrator. Entra app-management rights do not supply these policy permissions.
3. **Feature/billing readiness:** the custom Entra-registered AI application integration has a documented **pay-as-you-go** requirement. Confirm coverage with the Purview/Azure billing owner; do not assume an Agent 365 or E5 licence covers every custom API integration.

For the custom Entra-app integration, current documentation requires an actual **app-scoped DLP policy/rule**, created through the documented PowerShell workflow with the **`Application` enforcement plane**. Audit enablement, collection policies, and a “Risky AI usage” Insider Risk policy are not substitutes for blocking DLP.

The application must enforce returned actions. `/me` is delegated-only; `/users/{id}` must address a real human/agent-user context, not an app-only token's service-principal `oid`. The kit evaluates prompts and responses, but a successful Graph call does not prove either is blocked. Current custom-app documentation specifically describes supported sensitive-information **prompt blocking**; verify response behavior and your exact policy in the target tenant.

Sources: [Protection-scope API](https://learn.microsoft.com/en-us/graph/api/userprotectionscopecontainer-compute), [processContent API](https://learn.microsoft.com/en-us/graph/api/userdatasecurityandgovernance-processcontent), [DLP roles](https://learn.microsoft.com/en-us/purview/dlp-create-deploy-policy#permissions), [custom-app policy configuration](https://learn.microsoft.com/en-us/purview/developer/configurepurview), [custom-app billing](https://learn.microsoft.com/en-us/purview/ai-entra-registered).

**Optional Defender:** its documented onboarding requires **Security Administrator or higher**, plus the applicable Defender connectors/entitlements. Observability alone does not prove every Defender protection is configured. [Defender prerequisites](https://learn.microsoft.com/en-us/defender-xdr/security-for-ai/get-started-defender-security-for-ai).

## Capability boundaries and tenant verification

The bundle supplies source and guided workflows, **not a pre-provisioned Microsoft 365 agent**:

| What you have locally | What it does not prove |
|---|---|
| A deterministic demo or passing SDK tool self-test | That a model was invoked, that a model account has quota, or that any Microsoft tenant has been configured. |
| Basic Node.js/.NET, Java, Go and Rust console starters | A deployed HTTP host, Teams reachability, Agent 365 identity, consent, or telemetry. Add capabilities using the supported skill or deliberate/manual integration path. |
| Extended .NET lab with optional host, tools and governance code | A configured tenant, production multi-user authentication, mailbox provisioning, permissions, remote delivery or policy coverage. Initialize and verify each enabled capability. |
| The Python authenticated host, token-cache/telemetry, notifications and optional Work IQ wiring | Registration, consent, ingestion entitlement, resource ACLs, model access, public hosting or Teams activation. Default remote export and Work IQ are off. |
| A manifest, a registered endpoint or an HTTP 200 | Administrator approval, correct runtime grants, an authorized Teams reply, or telemetry actually visible in the service. |
| DLP evaluation code or successful Graph API calls | That the target application has an app-scoped blocking policy or enforces its returned actions. Response blocking is not guaranteed by the prompt-blocking documentation. |

### Verify your tenant before declaring success

Use approved test identities, resources and **synthetic content**. Record evidence without keys, tokens or sensitive payloads.

- [ ] **Tenant and IDs:** the intended tenant, operator, blueprint, agent identity and (where applicable) agent user are confirmed from actual setup output. Application IDs, service-principal object IDs and user IDs are not confused.
- [ ] **Administrator approval:** the responsible administrators reviewed the **actual** requested Graph/resource scopes, consent, assignment records, package audience and policies. “Register only” was not taken as proof of minimal scope. Required human roles, interactive-client permissions and runtime grants were checked separately; privileged work used the documented handoff.
- [ ] **Model access:** the sample's real model credential can invoke the chosen model/deployment with available quota. API billing is approved separately from coding-CLI and Microsoft 365 subscriptions.
- [ ] **Entitlements and provisioning:** required tenant/user licences are **assigned**, relevant Frontier features are available, and asynchronous agent-user/mailbox/instance provisioning has completed. Owners/sponsors know who operates the deployed host.
- [ ] **Authenticated messaging and Teams:** the real HTTPS `/api/messages` endpoint rejects unsigned/invalid requests; the package is approved and activated for the intended audience; an **authorized user receives a real agent reply in Teams**. A health check, tunnel URL or uploaded ZIP alone is insufficient. Basic Node.js/.NET and Java/Go/Rust need hosting/authentication added first; the extended .NET and Python hosts still need identity and deployment configuration.
- [ ] **Telemetry:** after exporter enablement and runtime consent, a real authorized turn produces spans **visible for the intended agent/tenant**, not just an exporter HTTP 200. Confirm the assigned Agent 365/E7 entitlement and the correct token flow/audience.
- [ ] **Work IQ positive and negative ACL tests:** the approved catalog server/audience/scope works on an intentionally permitted mailbox/site/file/team and **denies an intentionally inaccessible resource**. Check the acting principal's Copilot entitlement and actual sharing/label rights. Do not mix V1/V2 grants, infer consent from a flag/manifest, or use this kit's delegated Work IQ flow as S2S.
- [ ] **Purview actual enforcement:** the policy targets the real `PURVIEW_APP_LOCATION_ID`, uses the documented `Application` enforcement plane, and has approved billing/roles. A synthetic sensitive prompt is **actually blocked by the application**, while a safe control is allowed. Verify response handling against your policy rather than assuming support; audit/collection/Insider Risk policies alone are not blocking DLP.
- [ ] **Development exposure:** any local dev channel is deliberate, loopback-only and off in saved configuration. Never tunnel it or disable the Python host's inbound authentication to make a playground request work.
- [ ] **Optional Defender:** if claimed, independently verify its required connectors, entitlements and protections; Agent 365 observability is not proof of Defender onboarding.

These are tenant acceptance checks, not claims that this bundle has performed them. The Microsoft documentation citations below/above retain their **12 September 2026** check date; rollout and installed CLI behavior must be confirmed in your tenant.

## What it does

Microsoft publishes [`agent365-skills`](https://github.com/microsoft/agent365-skills) as a Claude Code plugin. The kit repackages those skills into directories that skill-aware coding CLIs already discover. The bundle adds examples and a helper so you can prepare **one coherent agent project** without installing a plugin or mixing language manifests.

Onboarding covers the blueprint and identity, optional agentic user, observability, tools, messaging host/endpoint, package creation, administrator activation and DLP. The skills guide and automate selected work; they do not remove grant review, administrator handoffs, licensing or live-service verification.

For context, upstream installation paths include `/plugin marketplace add` (a compatible Claude Code plugin host), `claude --plugin-dir ...` (a valid absolute plugin path and normal shell), and `gh skill add` (the corresponding GitHub CLI extension). **None is needed for the prepared bundle workspace.** The 14 skills already travel with that project.

## How it works

A skill is a Markdown file with front matter. CLIs discover skills by looking in known directories, so the kit ships the same content in the directories each one reads. After preparation, your **independent agent workspace**, not the bundle root, contains:

```
your-agent-project\
  .a365-kit\            canonical: skills, shared docs, validators, prerequisite checker
  .claude\skills\       discovery copy - Claude Code
  .agents\skills\       discovery copy - Copilot, Cursor, Codex, Gemini CLI, and others
  agent365-kit.ps1      launcher: prerequisite check and per-CLI activation (Windows)
  agent365-kit.sh       the same, macOS and Linux
  AGENT365-KIT-README.md technical kit-only reference, not the bundle's user entry point
  ...                  one chosen example, or your own agent source
```

The discovery copies are **byte-identical**, because every internal reference points at `.a365-kit/`. That single indirection is what lets one copy serve every CLI, and the build verifies the copies match. [`docs/HOW-IT-WORKS.md`](docs/HOW-IT-WORKS.md) covers the design.

## What is included

The repository publishes the **unpacked bundle files directly at its root**. You do not need another ZIP or a maintainer build:

```text
agent365-sdk-onboarding-experience\
  README.md
  .gitattributes                  preserves manifest-inventoried file bytes in Git
  .github\
    copilot-instructions.md       guidance for working with this distribution
  kit\
    AGENT365-KIT-README.md
    .a365-kit\
    .agents\
    .claude\
    agent365-kit.ps1
    agent365-kit.sh
    ...                           canonical kit and generated discovery copies
  examples\
    nodejs-tool-agent\
    dotnet-tool-agent\
    dotnet-agent365-lab\           extended runtime and offline regression checks
    python-teammate\               includes its own offline tests
    java-tool-agent\               Maven project and JUnit tests
    go-tool-agent\                 standard-library module and Go tests
    rust-tool-agent\               Cargo project, lockfile and tests
  tools\
    prepare-workspace.mjs
  docs\                           all current deeper references
  GUIDE.md
  CONTRIBUTING.md
  LICENSE
  NOTICE.md
  SECURITY.md
  BUNDLE-MANIFEST.json
  SHA256SUMS.txt
```

`BUNDLE-MANIFEST.json` records internal versions, provenance and the complete seven-example catalog; `SHA256SUMS.txt` supports integrity checking. The `kit\` payload is derived from the verified baseline with the local corrections described in [`NOTICE.md`](NOTICE.md). Its `AGENT365-KIT-README.md` is a **technical kit-only reference**, not a competing starting point.

The bundle's maintainer build/regression-test trees are **not user payload**; each example's own tests and dependency manifests/lockfiles are included as applicable. Historical `agent365-onboarding-kit-v0.1.1.zip` and `agent365-onboarding-kit-v0.1.2.zip` are **not needed in addition to this bundle**.

Supporting documents are optional deep references: [`GUIDE.md`](GUIDE.md) for stage detail, [`docs/HOW-IT-WORKS.md`](docs/HOW-IT-WORKS.md) for design, [`docs/USING-WITH-YOUR-CLI.md`](docs/USING-WITH-YOUR-CLI.md) for CLI differences, [`SECURITY.md`](SECURITY.md) for security reporting, and [`CONTRIBUTING.md`](CONTRIBUTING.md) for maintainers. Use this README's versions, workspace instructions and permission boundaries if older kit-only examples differ.

### The 14 skills inside the kit

**Microsoft's seven skills**, unchanged except for the modifications recorded in [`NOTICE.md`](NOTICE.md): `a365-setup`, `make-a365-agent`, `make-ai-teammate`, `instrument-observability`, `add-workiq-tools`, `a365-code-validator`, `test-local`.

**Seven add-ons written for this kit**, discovered the same way and clearly separated in `NOTICE.md`:

| Add-on | Fills this gap |
|---|---|
| `add-messaging-endpoint` | Upstream registers a blueprint agent but never hosts it, leaving it reachable by nothing. Adds the `/api/messages` host, the tunnel, and the endpoint registration. |
| `add-purview-dlp` | Upstream has no Purview coverage. Evaluates every prompt and response against tenant DLP through two Graph calls. |
| `add-mcp-server` | Adds direct external MCP connections without automatically registering them in Agent 365. The external service's own authentication/permissions still apply. |
| `add-lab-tools` | Local in-process utilities an agent otherwise lacks: web fetch, encoders, hashing, text transforms. Opt-in and dual-use. |
| `add-java-agent` | Java has no Agent 365 SDK. Adds the HTTP host, inbound token validation, and a direct OTLP exporter. |
| `a365-kit` | Kit maintenance from inside your CLI: prerequisites, versions, in-place update, update source. |
| `test-local-channel` | Microsoft's `test-local` targets AI Teammates only, so a blueprint agent had no local test path: its host rejects every unauthenticated request. Adds a loopback-only dev channel on its own port, off unless `A365_DEV_CHANNEL=true`. |

An agent gets tools three ways and the kit covers all three: Work IQ MCP servers, local function tools, and direct external MCP connections. The kit's direct external/local paths do not automatically register or govern those tools in Agent 365. Microsoft also supports a separate administrator-approved registration path for custom remote MCP servers; see [tool management](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/manage-tools-for-agent).

## Supported CLIs

Support follows from where each CLI looks for skills, not from anything kit-specific:

| Directory the kit ships | CLIs that read it | Validator hooks |
|---|---|---|
| `.claude/skills/` | Claude Code | yes |
| `.agents/skills/` | GitHub Copilot (CLI, VS Code agent mode, coding agent), Cursor, Codex, Gemini CLI, Amp, Cline, OpenCode, Warp, Antigravity | no |
| `.github/copilot-instructions.md` *(opt-in)* | GitHub Copilot, as extra grounding — not required | no |
| — | anything else: point it at `.a365-kit/skills/a365-setup/SKILL.md` | no |

`.agents/skills/` follows the [Agent Skills specification](https://agentskills.io/specification).

The skills themselves are plain Markdown. Only the validator hooks are Claude Code specific, and they are optional: everything works without them, just without the end-of-session correctness check. [`docs/USING-WITH-YOUR-CLI.md`](docs/USING-WITH-YOUR-CLI.md) covers per-CLI differences.

## Language support

Agent 365 ships SDKs for **Python, Node.js / TypeScript and .NET**. Framework support depends on the language **and** capability; detecting a framework does not mean every hosting or Work IQ combination is supported.

**New Python AI Teammate generation:** the repaired, tested profile uses **Python 3.12**, Agents SDK **1.6.0**, Agent Framework core **1.17.0**, its OpenAI integration **1.14.2**, and Microsoft OpenTelemetry **1.2.0**, with pinned dependencies. Existing applications are preserved; alternative Python framework recipes are migration references, not verified scaffolds for this matrix. Do not silently switch an existing agent's framework. Python Claude Work IQ remains unsupported by this skill.

The Python profile keeps `/api/messages` authenticated, including in Development. An unsigned AgentsPlayground request therefore receives **401**; local-only chat needs an explicit compatible development adapter, not disabled production authentication.

The bundle contains runnable examples in **C#, JavaScript, Python, Java, Go and Rust**, but their Agent 365 integration coverage is not identical. The basic .NET and Node.js starters are console-only; the extended .NET lab and Python profile include optional integration/hosting code that still requires tenant configuration.

The standalone Java sample uses **JDK 21 and Maven 3.9+**. Adapt `add-java-agent` hosting/telemetry guidance to its HttpClient-based agent deliberately; do not assume a LangChain4j integration. Go and Rust require **manual Agent 365 integration**. Blueprint and publishing operations can be language-independent, but a working authenticated host, tools and telemetry must be implemented and verified for the chosen language. An unknown-language validator returning `ok` does not establish readiness. See [the full catalog and boundaries](docs/AGENT-EXAMPLES.md); [`GUIDE.md`](GUIDE.md#which-languages-this-covers) provides additional wire-contract context.

## Relationship to Microsoft's skills

The kit is a repackage, not a fork. A **kit rebuild** clones upstream fresh (or uses the specified local upstream checkout) and re-applies a fixed set of edits, each of which asserts the upstream text it expects to find. If Microsoft reword a patched passage, the build fails and names the file rather than silently emitting something broken. The separate **bundle build packages the current corrected distribution**; it does not rebuild or repatch those skills.

Changes fall into two groups, both itemised in [`NOTICE.md`](NOTICE.md):

- **Packaging.** Path tokens, hook commands, the plugin command namespace, and a guard that would otherwise disable itself outside a plugin install. Mechanical, no behaviour change.
- **Correctness fixes.** These include failures observed while onboarding real agents and defects reproduced with local regression fixtures. `NOTICE.md` records the failure prevented and the evidence for each fix; local tests do not imply live-tenant verification.

Problems with what the skills *do* belong upstream at [microsoft/agent365-skills](https://github.com/microsoft/agent365-skills/issues). Problems with the packaging, launchers, prerequisite checker or build belong here.

## Building and self-hosting

**Maintainers only — not an onboarding prerequisite.** These commands refer to the **separate maintainer source checkout**, not this customer GitHub repository or a prepared agent workspace. This repository publishes the ready-to-use bundle contents, without the maintainer build/test trees. Requires PowerShell 7+, Git and Node.js.

Package the current corrected `dist\` and the bundle's authored examples/docs/helper:

```powershell
.\build\Build-Bundle.ps1
```

The customer-facing GitHub repository is **`agent365-sdk-onboarding-experience`**, containing the unpacked onboarding kit and seven examples. Internal release versions remain in `BUNDLE-MANIFEST.json`. The packaging build may still produce a ZIP for internal handoff; publish its contents at the GitHub repository root, including `.gitattributes`, hidden directories, manifest and checksums. Customers do not need that build ZIP or the maintenance/source archive. This local revision uses the separately supplied release-snapshot source and its README; the `dist`/`Build-Kit.ps1` commands here describe the original maintainer workflow.

**Rebuilding the kit is separate**, and is only necessary when changing its source/fix-ups:

```powershell
.\build\Build-Kit.ps1 -UpstreamPath C:\src\agent365-skills
.\build\Build-Kit.ps1 -Zip
```

The first kit command builds from a local clone of upstream; the second clones upstream itself and produces a kit-only release archive. Output lands in `dist\`, and `-Zip` also writes the kit archive at the repository root.

**Publishing a revision:** rebuild and validate the bundle from maintainer source, then publish the complete generated contents to this customer repository without modifying their inventoried bytes. From a fresh clone/download, prepare a new agent workspace with the helper. The upstream kit's public “latest” download is a separate release stream and does not automatically include this repository's local fixes.

**Build/test permissions:** local filesystem access and read access to the upstream repository/package sources. No Entra administrator role or Azure subscription is needed. Publishing a GitHub release separately needs write access to the GitHub repository; the refresh workflow declares `contents: write` and `issues: write`.

Run the existing **kit regression suite** after rebuilding the kit:

```powershell
node --test
node --test --test-name-pattern="quoted exporter" .\tests\validators.test.js
```

The second command selects one matching family of cases. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for isolated build outputs and test prerequisites. `-OutDir` is recreated on a build; source-directory overlaps are rejected, but always choose a disposable output directory.

The kit build refuses to emit output it cannot prove coherent. It verifies that no `${CLAUDE_PLUGIN_ROOT}` path tokens or `/agent365:` command references survive, that every path a skill references exists, that every bundled JS file parses, that the discovery copies match, and that every hook command was repointed.

**Staying current (kit).** `.github/workflows/refresh-upstream.yml` runs daily, compares upstream `main` against the recorded commit, and when it moves it rebuilds, commits `dist/` and cuts a release. If a fix-up assertion fails it opens an issue instead. This describes the kit workflow, not proof that bundle v0.2.0 has been published.

**Updating the kit in a prepared workspace.** `.\agent365-kit.ps1 -Update`, or *"update the Agent 365 kit"* from inside your CLI. Only the kit's own paths are replaced, never your agent, `.env`, config, or skills you added. This does **not** update example dependencies, the bundle README or the bundle helper. Review the source/version before updating: the public latest kit can differ from the corrected copy bundled here.

**Using your own kit mirror.** The public kit release is only the default. Point updates at a URL or a filesystem path supplying a **kit-only update archive**, not the all-in-one bundle:

| Scope | How |
|---|---|
| One call | `-UpdateFrom <zip-or-url>` |
| One shell or CI job | `A365_KIT_UPDATE_SOURCE=<zip-or-url>` |
| One project, whole team | `-SetUpdateSource <zip-or-url>` writes `a365-kit.config.json`; share only credential-free, approved configuration (ignored by this repository by default) |
| Your own build | `.\build\Build-Kit.ps1 -UpdateSource <zip-or-url> -Zip` |

A network share holding `agent365-onboarding-kit-latest.zip` works with no web server at all.

## Maintainer source layout

**Separate source-checkout reference for maintainers.** This is not the layout of this customer GitHub repository and is not a list of files customers must obtain separately. The published repository layout is shown in [What is included](#what-is-included).

| Path | Purpose |
|---|---|
| `README.md` | the single authoritative user guide, also placed at the bundle root |
| `build/Build-Bundle.ps1` | packages current `dist\`, examples, helper, docs, manifest and checksums into the one user ZIP |
| `build/Build-Kit.ps1` | the build — derives `dist/` from upstream |
| `build/upstream-fixups.json` | SDK/playbook repairs, exact match counts, and verification evidence |
| `build/kit.version` | this kit's packaging version |
| `payload/` | files authored here and copied into every build: add-ons, validators, launchers, prerequisite checker |
| `dist/` | generated corrected kit output; packaged unchanged under `kit\` in the bundle |
| `examples/` | seven independent sample trees: basic .NET, extended .NET lab, Node.js, Python, Java, Go and Rust |
| `tools/prepare-workspace.mjs` | copies one selected example plus kit, or a blank kit-only workspace, into a new destination |
| `GUIDE.md` | supporting end-to-end stage walkthrough |
| `NOTICE.md` | attribution and every modification made to upstream |
| `docs/` | deeper references: per-CLI setup, lifecycle, design |

`dist/` is generated. Changes to Microsoft's skills go in the build's asserted fix-ups (`Build-Kit.ps1` or `upstream-fixups.json`); changes to the kit's own content go in `payload/`.

## Verification

**Prior kit v0.1.2 audit result — 13 September 2026:** **281/281 local regression tests passed**, with no failures or skips. The separate pinned Python SDK suite passed **25/25** offline tests; all five generated Java classes compiled successfully. The corrected distribution and `agent365-onboarding-kit-v0.1.2.zip` were rebuilt locally in that audit. **The historical v0.2.0 baseline contained kit v0.1.2 rather than v0.1.1**, including the late Node console-option and .NET exporter-precedence corrections. The current internal versions are recorded in `BUNDLE-MANIFEST.json`. SDK evidence, supported profiles and limitations are recorded in [`NOTICE.md`](NOTICE.md). These are **prior kit results, not newly asserted bundle test results**.

**Bundle validation scope (not a pass report):** archive contents/root entry point, versioned kit payload and all 14 skills, checksum/manifest consistency, one-example workspace isolation and dot-folder preservation, refusal of existing/overlapping destinations, sample dependency restores and local SDK/tool-loop tests, Python authenticated-host/offline checks, and documentation links. Recorded Java/Go/Rust and extended .NET checks use prepared workspaces from the ZIP; evidence and limits are recorded separately in [`NOTICE.md`](NOTICE.md). Do not infer bundle results from the prior kit audit.

**Local regression coverage:** build/fix-up assertions, CommonJS compilation, byte-identical discovery copies, validator fixtures, path-guard boundaries, build failure cleanup, and mocked Git/GitHub workflow behavior are covered by `node --test`. Launcher and generated-example checks are described in `CONTRIBUTING.md` and `NOTICE.md`.

**Live-service boundary:** the prior audit and local bundle checks do not verify your tenant's actual roles, consent, licences, resource ACLs, policy enforcement, deployed endpoint, or model access. A green local test suite is not proof that Teams, Work IQ, telemetry ingestion or Purview blocking works in your tenant. Validate those with authorized test identities/resources and the [tenant acceptance checklist](#capability-boundaries-and-tenant-verification).

**Previously reported maintainer verification** against upstream `agent365-skills` v1.0.2 on Windows 11 — historical kit evidence, not an end-to-end claim for these new examples:

- **Discovery.** Claude Code and GitHub Copilot CLI both list all fourteen skills from the extracted folder with no install step. Copilot loads referenced files by relative path, which is what confirms the path-rewrite strategy works outside Claude Code.
- **Onboarding.** Driven end to end through Copilot CLI against a live tenant on a Python agent: blueprint, agent identity, eleven delegated permission grants, observability instrumentation, Work IQ tool wiring, messaging endpoint, published package, and an agent answering in Teams.
- **Java.** The `add-java-agent` output compiles on JDK 21 and runs: health check returns 200, an anonymous request returns 401, a forged bearer returns 401. Its OTLP encoder was matched field by field against the Python SDK's output.
- **Guard behaviour.** The patched path guard blocks writes into the kit and outside the project, and allows writes to agent source.

Not yet exercised: the `.agents/skills/` path under Cursor, Codex, Gemini CLI, Amp, Cline, OpenCode, Warp and Antigravity, and a Java agent taken all the way to a live tenant.

## Licence

This packaging is MIT licensed — see [`LICENSE`](LICENSE). The bundled skills are © Microsoft Corporation, also MIT. [`NOTICE.md`](NOTICE.md) carries the attribution, the full list of kit modifications and the bundle additions. Restored third-party dependencies retain their own package licences; they are not bundled SDK binaries or a grant of service access.
