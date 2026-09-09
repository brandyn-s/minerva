# Security policy

Minerva is pre-alpha software. It is not yet suitable for production data,
sensitive source material, or unattended use.

## Supported versions

| Version | Supported |
|---|---|
| Current `main` | Yes |
| Old commits, forks, and unreleased prototypes | No |

## Report a vulnerability

Do not disclose a vulnerability in a public issue, discussion, pull request, or
commit.

Use
[GitHub's private security-advisory form](https://github.com/brandyn-s/minerva-template/security/advisories/new).
If it is unavailable, do not send vulnerability details through a public
channel; wait for the maintainer to restore private reporting or publish a
verified private contact method.

Include only what is necessary to reproduce and assess the issue:

- the affected revision and surface;
- impact and required preconditions;
- minimal reproduction steps or a proof of concept;
- whether credentials, user content, or external services are involved; and
- any known mitigation.

Reports are handled on a best-effort basis. The maintainer will validate the
finding, coordinate a fix and disclosure when appropriate, and credit reporters
who want attribution. This project does not currently operate a bug bounty.

## Security boundaries

This single-user prototype has no sign-in. Local development binds to loopback.
The release target is a public Vercel deployment for a bounded demonstration
window used by a small judge panel; anyone with the URL can use it during that
window. The controls are the window itself, the Vercel budget and the teardown
at the end, not access infrastructure. Internal endpoints must still reject
unexpected Host/Origin and cross-origin mutations; no sign-in is not permission
for arbitrary websites to use server-held credentials or paid operations. The
deployment authenticates to AI Gateway with its Vercel OIDC token, held on the
server; realtime voice clients receive only single-use short-lived session
tokens. External REST/MCP APIs are out of scope.

Especially relevant reports include:

- credentials or private content reaching the browser, logs, Git, or evidence;
- AI context containing material outside the user's explicit selection;
- untrusted model output bypassing validation or durable-state boundaries;
- admission, spend, cancellation, or retry controls failing open;
- dependency, build, or GitHub Actions supply-chain compromise;
- a deployment, credential or database left live after the demonstration window
  closed; and
- a simulation or partial failure being represented as live, durable, or safe.

The repository's checks reduce risk; they are not a security certification.
