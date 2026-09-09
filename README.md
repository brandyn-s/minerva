# Minerva

[![CI](https://github.com/brandyn-s/minerva/actions/workflows/ci.yml/badge.svg)](https://github.com/brandyn-s/minerva/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

An application under development for a single-user, browser-only
**spatial creative prototype** with no sign-in. Minerva is a living atlas of
ideas: visible inheritance, three views, contextual creative moves, Weave,
Wander, Agent Drive, concurrent voice and usable outputs.

**Implemented locally:** the M1 prepared atlas with pan/zoom, movable cards,
source inspection, comparison selection and contextual previews. A text reference
and denser scene support experience review. Changes reset on reload.
**Still open:** persistence, generation, voice and the complete capabilities in
[SPEC](./docs/product/SPEC.md). M1 review and owner acceptance are pending.
Initialized from [minerva-template](https://github.com/brandyn-s/minerva-template)
at `248665c116fb0655e2b70f732ca1b9bffb5b5dcb`. Package 1 establishes application
identity and portable checks. See [the handoff](./docs/HANDOFF.md) for the next outcome.

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
prepared atlas needs no cloud account, provider key or sign-in. Add database, model and
voice configuration when implementing those capabilities.

The browser is the only client, not the only runtime. Keep the Next.js/TypeScript
monolith, internal server endpoints, server-held credentials, Postgres, Vercel
AI Gateway for text and voice models and durable Vercel Workflows. External
REST/MCP APIs and accounts are excluded. Local loopback is the development loop;
the release target is a public Vercel deployment for a bounded demonstration
window used by a small judge panel, still with no sign-in. See
[setup](./docs/setup.md#vercel-demonstration-hosting).

## Build and review

The default target is a hosted demonstration, defined in
[AGENTS.md](./AGENTS.md#current-direction) and opened one task message at a
time. [Build prompts](./docs/build-prompts.md) is a backlog catalog of 32
packages toward the complete product; a package applies only when the owner's
task message names it.

Astra in Codex builds; the operator starts Fable 5.1 in Claude on a separate
checkout of the exact candidate, using the
[review rubric](./docs/review/judge-fable-5-1.system.md). Both start at low
effort. Use the existing handoff and capability record, not extra process
machinery. See [setup](./docs/setup.md) for copyable launch instructions.

## Documentation

| Concern | Source |
|---|---|
| Global working, authorization and review rules | [AGENTS](./AGENTS.md) |
| Purpose, complete experience and falsifiers | [INTENT](./docs/product/INTENT.md) |
| Required capabilities C01-C15 and acceptance scenarios | [SPEC](./docs/product/SPEC.md) |
| State ownership, boundaries and open implementation choices | [ARCHITECTURE](./docs/product/ARCHITECTURE.md) |
| Living-atlas identity and interaction | [DESIGN](./docs/product/DESIGN.md) |
| Implementation evidence | [CAPABILITIES](./docs/product/CAPABILITIES.md) |
| Backlog catalog of packages and milestone reviews | [Build prompts](./docs/build-prompts.md) |
| Reviewer system prompt and harness notes | [Review rubric](./docs/review/judge-fable-5-1.system.md) |
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
links, matching capability IDs and actual configuration behavior; they do not
prove semantic consistency or product behavior.
Package 1 removed the empty-seed restrictions. The retained checks allow
application dependencies, files and capability progress. Review prose against
its owning contract and add behavior coverage
as capabilities arrive.
ESLint 9 matches the installed Next.js plugin peer ranges; upgrade them together
when compatible, without suppressing peer errors or removing lint rules.

Use a branch and PR; merge only after required CI. Repository setup and operating
instructions are in [setup](./docs/setup.md).
Report vulnerabilities privately under [SECURITY.md](./SECURITY.md).
