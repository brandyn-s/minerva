# Minerva

[![CI](https://github.com/brandyn-s/minerva-template/actions/workflows/ci.yml/badge.svg)](https://github.com/brandyn-s/minerva-template/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A thin runnable starter and product contract for a single-user, browser-only
**spatial creative prototype** with no sign-in. Minerva is a living atlas of
ideas: visible inheritance, three views, contextual creative moves, Weave,
Wander, Agent Drive, concurrent voice and usable outputs.

**Implemented:** the Next.js shell, original identity and CI/document checks.
**To build:** the fifteen capabilities in [SPEC](./docs/product/SPEC.md).
Keep this template content-free; implement the application in its generated
repository.

The application will ship with editable demo data for **What to do with a dead
shopping mall**, demonstrating every tool alongside fully functional capabilities
and a blank-start path. The owner judges idea feasibility and creative usefulness
while steering milestone chunks. See [the demo contract](./docs/product/SPEC.md#shipped-demo-and-human-judgment).

## Run locally

```sh
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm ci
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run dev
```

Open [localhost:3000](http://localhost:3000). Dev/start bind to loopback; the
shell needs no cloud account, provider key or sign-in. Add database, model and
voice configuration when implementing those capabilities.

The browser is the only client, not the only runtime. Keep the Next.js/TypeScript
monolith, internal server endpoints, server-held credentials, Postgres, Vercel
AI Gateway for text and voice models and durable Vercel Workflows. External
REST/MCP APIs and accounts are excluded. Local loopback is the development loop;
the release target is a public Vercel deployment for a bounded demonstration
window used by a small judge panel, still with no sign-in. See
[setup](./docs/setup.md#vercel-demonstration-hosting).

## Build and review

[Build prompts](./docs/build-prompts.md) contain 32 work packages across six
milestones, a Fable review for each milestone and an outside-consultation prompt.
Use one connected user outcome per assignment. Related packages may share a
session; a difficult package may span sessions. All capabilities remain required.

Astra in Codex builds; the operator starts Fable 5.1 in Claude on a separate
checkout of the exact candidate. Both start at medium effort. Use the existing
handoff and capability record, not extra process machinery. See
[AGENTS.md](./AGENTS.md) for working rules and [setup](./docs/setup.md) for
copyable launch instructions and scoped authorization boundaries.

## Documentation

| Concern | Source |
|---|---|
| Global working, authorization and review rules | [AGENTS](./AGENTS.md) |
| Purpose, complete experience and falsifiers | [INTENT](./docs/product/INTENT.md) |
| Required capabilities C01-C15 and acceptance scenarios | [SPEC](./docs/product/SPEC.md) |
| State ownership, boundaries and open implementation choices | [ARCHITECTURE](./docs/product/ARCHITECTURE.md) |
| Living-atlas identity and interaction | [DESIGN](./docs/product/DESIGN.md) |
| Implementation evidence | [CAPABILITIES](./docs/product/CAPABILITIES.md) |
| Work packages and milestone reviews | [Build prompts](./docs/build-prompts.md) |
| Repository identity, sessions and local operation | [Setup](./docs/setup.md) |

Read the relevant source, not every document each session. Packages reference
these contracts and specify outcomes, prerequisites, integration work and
completion evidence. The application's short `docs/HANDOFF.md` names the current
outcome and next step.

## Check and contribute

```sh
npx --yes --package=node@24.20.0 --package=npm@12.0.2 npm run check
```

`check` runs lint, typecheck, tests and build. Portable tests check document
structure, references, matching IDs and actual configuration behavior;
they do not prove semantic consistency or product behavior.
`tests/seed-only.test.mjs` asserts that this repository is still the empty seed.
Package 1 deletes that file and adapts the retained checks for application
development. Review prose against its owning contract and add behavior coverage
as capabilities arrive.
ESLint 9 matches the installed Next.js plugin peer ranges; upgrade them together
when compatible, without suppressing peer errors or removing lint rules.

Use a branch and PR; merge only after required CI. Generated repositories need
their own settings and corrected identity URLs; follow [setup](./docs/setup.md).
Report vulnerabilities privately under [SECURITY.md](./SECURITY.md).
