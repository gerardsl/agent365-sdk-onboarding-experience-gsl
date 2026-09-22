# Step by step — what to say, and when to leave your CLI

Every step of onboarding is started by typing one phrase to your coding CLI — Claude Code, GitHub Copilot CLI, Cursor, or any other that reads the kit. This page is the sequence: the phrase, what happens, and the handful of moments where you run one command in your own terminal because the CLI's shell cannot.

Prepare the README's [information checklist](../README.md#before-you-start--information-and-access-checklist) and use its [permissions by step](../README.md#onboarding-steps-and-required-permissions). Copying the kit, client consent, agent-resource access, publishing, and Purview policy administration require different rights.

Three stages, each optional after the first. Stop at whichever finish line you need.

| Stage | Outcome | You say |
|---|---|---|
| **1. Register** | Blueprint, Entra identity, permissions, telemetry code. The agent is in the Agent 365 registry and visible to security. | *Onboard this agent to Agent 365.* |
| **2. Chat** | Users can talk to it in Teams and Microsoft 365 Copilot. | *Make this agent chattable in Teams.* |
| **3. Govern** | Every prompt and response checked by Purview DLP; Insider Risk sees it. | *Add DLP to this agent.* |

The phrases work verbatim in every supported CLI. Type them exactly; the skills match on them.

---

## Before you start (once)

1. Extract the kit into your agent project's root folder.
2. Open a **normal** terminal there (not Administrator on Windows) and run the launcher — it checks every prerequisite and prints install commands for anything missing:
   ```
   .\agent365-kit.ps1          # Windows
   ./agent365-kit.sh           # macOS / Linux
   ```
3. Sign in: `az login --allow-no-subscriptions`.
4. Run `a365 setup requirements` to validate client/tenant readiness. Current documentation prefers Microsoft's managed client; custom-client setup and consent are conditional administrative handoffs. Shared client readiness does not give every developer roles, resource consent, or licences.
5. Start your CLI in the project folder. Confirm it sees the skills — Copilot: `copilot skill list`; Claude Code: ask *What Agent 365 skills do you have?* This build contains fourteen skills.

---

## Stage 1 — Register

**Say:** *Onboard this agent to Agent 365.*

The `a365-setup` skill detects your language and framework, then asks three things. Answer in the chat:

| It asks | Choose |
|---|---|
| Confirm what it detected | `yes`, or correct it |
| Capabilities (1 Register · 2 Observability · 3 WorkIQ · 4 AI Teammate) | `1, 2` for a first run; add `3` for M365 data access; `4` only if the agent should have its own mailbox and UPN |
| Auth mode (not asked for AI Teammate) | **OBO** if the agent must act for the caller; blueprint/resource consent and data access are still required |

> **What this choice decides — and what it doesn't.** An ordinary blueprint route creates an agent identity during setup. An AI Teammate can later receive an associated agent user through approved instance provisioning. Registration alone does not provide Teams/Copilot availability: confirm a supported package/experience, administrator approval, audience policies and licences. The `--aiteammate true` publishing override selects the AI Teammate template branch; it is not a universally supported neutral conversion of an ordinary OBO agent.

It writes config and code, then reaches `a365 setup all`. **This is the first "leave your CLI" moment:**

1. Copy the exact command from the approval prompt.
2. Decline it in the CLI.
3. Paste it into a second normal terminal in the same folder. Answer its prompts and complete the sign-in pop-up.
4. Back in the CLI, say: *`a365 setup all` completed in a separate terminal. Read `a365.generated.config.json` and continue.*

It finishes the code — observability, WorkIQ if chosen — and stops. Two checks before you call Stage 1 done:

- **Install the packages** (the skill lists them but does not install): `pip install -r requirements.txt` / `npm install` / `dotnet restore`, then confirm your agent still imports or builds. Python with WorkIQ: if the import fails on `microsoft_agents_a365.runtime`, add `microsoft-agents-a365-runtime>=1.0.0` and install again.
- **Say:** *Validate A365 code.* — if it reports observability incomplete, **say:** *Add observability to this agent.* and validate again.

**Finish line: Registered.** Your agent exists in the registry with an identity. Many teams stop here.

---

## Stage 2 — Chat in Teams and Copilot

Which phrase depends on the kind you chose in Stage 1.

### Blueprint-based agent (you chose Register / Observability / WorkIQ)

**Say:** *Make this agent chattable in Teams.*

The `add-messaging-endpoint` add-on adds the `/api/messages` host for your language, proves it (health 200, anonymous POST 401), asks whether to start a dev tunnel or use a URL you host, and registers the endpoint on the blueprint — all from the CLI's shell. It then stops at the **second "leave your CLI" moment**, in the same folder:

```
a365 setup permissions bot        # authorized administrator reviews each proposed permission
```

Then verify in the Teams Developer Portal (it gives you the link) that **Agent Type = API Based** and **Notification URL** matches. Tell the CLI you are done.

**Then confirm the supported publishing route with the administrator.** For a configured publishing experience:

```
a365 publish                        # run in your own terminal
```

If a blueprint-only configuration reports “Nothing to publish,” review [README Step 8](../README.md#step-8--create-the-package) before using an AI Teammate override. Use the output path reported by the CLI. An **AI Administrator or Global Administrator** handles the supported Microsoft 365 admin-center upload/approval; the older developer walkthrough still specifies Global Administrator for its flow. Publishing an audience and creating/licensing an instance are separate actions.

**Test:** *Test this agent locally.* opens AgentsPlayground against your host (works before the upload). In Teams, search for the agent by name and say hello (after the upload).

### AI Teammate (you chose capability 4)

**Say:** *Make this agent an AI Teammate.*

`make-ai-teammate` adds the hosting layer, the notification handlers and the deploy pipeline itself, asking for a run target (local or prod) and hosting. Two "leave your CLI" moments follow, both in your own terminal:

```
a365 setup all --aiteammate --m365 ...     # the command it shows you
a365 publish                               # produces manifest.zip
```

Then an admin uploads `manifest.zip` at **Microsoft 365 admin center → Agents → All agents → Upload custom agent**, activates it, and creates the instance (or you sideload it in Teams and click **Request Instance** for the admin to approve). Search for it in Teams; it also appears in the Copilot agent picker.

**Finish line: Reachable.**

---

## Stage 3 — Govern with Purview DLP

**Say:** *Add DLP to this agent.*

The add-on wires prompt/response evaluation for Python, Node.js or .NET. Do not treat code generation or a Graph 200 response as proof of protection. Follow [README Step 10](../README.md#step-10--configure-and-verify-purview-dlp):

1. An authorized administrator consents `ProtectionScopes.Compute.User` and `Content.Process.User` for the intended delegated/application flow.
2. Confirm the real user context, targeted application location, required Purview entitlement and any custom-app PAYG billing.
3. A Purview DLP administrator creates an app-scoped blocking policy/rule using the documented PowerShell workflow and enforcement plane `Application`.
4. Configure audit/collection and optional **Risky AI usage** Insider Risk/Defender sharing separately. These do not substitute for a blocking DLP rule.

**Verify:** test both allowed and policy-matching prompts and confirm returned blocking actions are enforced. Verify supported response-policy behavior separately; collection or nonempty protection scopes alone do not prove blocking.

**Finish line: Governed.**

---

## Whenever

| You say | What happens |
|---|---|
| *Validate A365 code.* | Read-only diagnosis of telemetry, identity binding and live grants; offers fixes |
| *Add WorkIQ tools to this agent.* | Mail, calendar, Teams, SharePoint MCP servers; needs OBO |
| *Test this agent locally.* | Starts the agent and AgentsPlayground — AI Teammate path |
| *Let me test this agent locally.* | Loopback-only dev channel for a blueprint agent: no tunnel, no tenant, no Teams. Off unless `A365_DEV_CHANNEL=true` |
| *Update the Agent 365 kit.* | Replaces only the kit's files with the latest release, or your organisation's mirror |
| *Check the kit prerequisites.* | The launcher's doctor, from the CLI |
| *Set the kit update source to …* | Pin updates to your own server or share, for the whole team |

Every skill is idempotent. Saying a phrase again on a half-done project finishes it rather than redoing it.

---

## The "leave your CLI" moments, all in one place

| When | Command | Why the CLI can't |
|---|---|---|
| Stage 1, registration | `a365 setup all …` (copy from the prompt) | Signs in through the Windows broker, which needs a real window |
| Stage 2, blueprint path | `a365 setup permissions bot` | Same broker, for the OAuth2 grant, plus a `y/N` prompt |
| Stage 2 | `a365 publish` for the supported experience | Keep interactive prompts/output visible; an AI Teammate override is not a generic conversion |
| Stage 2 and 3 | Admin center, Dev Portal, Purview/Compliance PowerShell | Appropriate administrator approval, policy and licensing handoffs |

Endpoint registration, tunnel management and kit updates can be driven by a coding CLI when authorized. Consent and policy steps may require an administrator's own authenticated session; never assume the developer's existing `az login` authorizes them.
