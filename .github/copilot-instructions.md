# Agent 365 local onboarding bundle

This directory is a release bundle, not the maintainer source checkout. Read
`docs\LOCAL-REVISION.md` and `README.md`. Do not run onboarding or restore every
example here. Prepare exactly one example into a NEW directory outside this bundle:

```powershell
node .\tools\prepare-workspace.mjs --list
node .\tools\prepare-workspace.mjs --example dotnet-agent365-lab --destination ..\my-agent-lab
```

The extended .NET example contains offline-tested optional hosting/tool/governance
patterns. Its README describes credential/provider selection and initialization.
Keep the three original examples available for smaller starting points.

Preserve manifest integrity, existing-destination/overlap refusal, and canonical
skill/discovery-copy equality. Inventoried changes require a real rebuild, not
editing hashes to bypass verification. This local revision's source is supplied
separately with its baseline fingerprint and build/tests.

In prepared workspaces, read `.a365-kit\shared\local-runtime-lessons.md` before
capability changes. Preserve the consumer `.a365-kit\copilot-instructions.md`;
do not replace it with repository-maintenance guidance.
Use `.a365-kit\run-a365.mjs` for approved setup commands. On the specific
`maven-prod [Agent365.Observability.OtelWrite]` administrator handoff, follow
`.a365-kit\shared\observability-access-package.md`: the access package needs the
specified OAuthApplication/API resource role, an initial policy, and an assignment
to the blueprint that reaches **Delivered** before resuming. Do not confuse
approval/policy creation with delivery or report pending consent as completed.

Never bake the operator's account, tenant, app IDs, mailbox, credentials, tokens,
policy names or tunnel URL into a reusable bundle. Derive and verify identities
in the target tenant. Keep local configuration separate from CLI-generated files.
An agent's mail sender, management client, child identity, human user and Purview
location are distinct values.

Offline checks, discovery, HTTP 200 and assistant claims do not prove a real Teams
reply, email Inbox delivery, telemetry routing or DLP enforcement. Record each
boundary explicitly. Do not bypass policy, auth, TLS, consent or billing failures.
