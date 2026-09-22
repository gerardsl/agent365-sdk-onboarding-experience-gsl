# Local revision: lessons incorporated

This archive is **0.2.3-local.20260922**, with kit
**0.1.5-local.20260922**, based on the verified v0.2.0 release ZIP. It is not an
official upstream/maintainer release. Its base fingerprint is recorded in
`BUNDLE-MANIFEST.json`. The original three examples remain available.
Java, Go, and Rust console tool agents have also been added. Together with the
extended .NET lab, there are seven examples in six languages.
See [the example catalog](AGENT-EXAMPLES.md).

## New in 0.2.3: observability access-package handoff

When setup reports that blueprint consent is required for
`maven-prod [Agent365.Observability.OtelWrite]`, the new
`.a365-kit\run-a365.mjs` runner prints the access-package recovery steps and prevents
a zero CLI exit from being reported as completed setup. Original nonzero exit
codes are preserved. It does not sign in, create packages, grant roles or retry.

The customer README and canonical/discovery skills now direct administrators to
configure **Resource=maven-prod**, **Type=OAuthApplication**, **Sub Type=API**,
**Role=Agent365.Observability.OtelWrite**, create an initial policy, assign the
package to the intended blueprint, and wait until the **assignment** is **Delivered**.
`Approved` or policy creation alone is not sufficient.
See [the recovery guide](../kit/.a365-kit/shared/observability-access-package.md).

All seven example source trees are unchanged from 0.2.2. The added behavior is in
the shared kit and works in prepared workspaces regardless of agent language.
Regression tests exercise colored/chunked output, wrong-resource/scopes,
large output, argument forwarding without a shell, exit status, read-only operation,
and helper availability in all prepared examples. Tenant delivery remains an
administrator verification; no access package was created by this package build.

## Recommended extended .NET path

From the extracted bundle:

```powershell
node .\tools\prepare-workspace.mjs --example dotnet-agent365-lab --destination ..\my-agent-lab
Set-Location ..\my-agent-lab
dotnet restore --locked-mode
dotnet run -- --self-test
dotnet run -- --mock "Hello from Agent 365"
```

Follow that workspace's README before opting into external inference or tenant
features. The new example contains no credentials or tenant/user/tunnel identities.
Initialize local identities from verified CLI/Entra state; don't paste another
deployment's configuration into it.

## What changed

| Area | Reusable correction |
| --- | --- |
| Identity | Separate operator/client/blueprint/child/agent-user/policy-location IDs; verify binding after CLI restamping |
| Authentication | Exact-account token checks, reviewed custom-client fallback for preauthorization errors, prompt device codes, active-role checks |
| Runtime tokens | Encrypted-cache renewal, audience/scope grouping, no account fallback, no plaintext refresh-token export |
| Telemetry | Real child OBO exchange, scope/baggage, flush and ingestion receipt checks |
| Teams | JWT always on; trusted Messaging Bot service vs human identity; single-user test boundary; actual tunnel URL/HTTP port |
| Work IQ | Live catalog, explicit local exclusions, namespaced tools, TLS validation, owned MCP lifetimes and non-sensitive outcome logs |
| Mail | Explicit human vs agent mailbox, verified agent-user token flow, missing-detail questions, actual send/delivery evidence |
| Purview | Two boundary hooks, stateful sequencing, fail-mode consistency, 202/204 and ETags, actual inline policy verification |
| Model providers | Explicit OpenAI/Gemini/Mistral selection with isolated keys/endpoints and mock defaults |
| Packaging | Canonical source, asserted snapshot fixups, generated discovery copies, explicit example allowlist and new checksums |

Canonical operational guidance is `.a365-kit\shared\local-runtime-lessons.md` in a
prepared workspace. Entry skills and consumer Copilot instructions point to it.
The .NET observability static validator now recognizes non-test bootstrap modules
and local settings; missing JSON log categories are no longer treated as proof
that backend telemetry cannot arrive.

## Verification and limits

The extended example contains real SDK offline tests and the local rebuild source
contains packaging/integrity/refusal tests. Recorded live lessons included a
single-user Teams reply, Work IQ discovery, correctly identified agent-mailbox
sending, telemetry sent receipts, and a synthetic Purview prompt block.
The generic example is verified offline; it is not pre-authorized in your tenant.

No bundle can prevent external service outages, changing CLI/catalog behavior,
role/PIM expiry, policy/licensing requirements, recipient Junk/quarantine, or
mistakes in tenant configuration. These changes make those failures explicit and
separate them from model guesses. They do not grant licenses, bypass tenant
policies, or make a single-user lab host production-ready.

The matching original maintainer build/test source was not available. This revision
therefore uses a transparent release-snapshot rebuild and its own tests, not a claim
that the absent maintainer suites ran. The separate local source deliverable records
the rebuild scripts, baseline archive, fixups and allowlists.

Kit updates can replace local changes. Keep the source and original archive backup;
use a reviewed update feed rather than assuming an official update contains this revision.
