# Minerva: product intent

Status: active greenfield product contract. This template contains a runnable
shell and specifications, not the implemented product.

## Purpose

Minerva is a single-user, browser-only prototype with no sign-in for exploring an idea
space with AI. A person can investigate alternatives spatially, understand
their relationships and origins, develop and recombine branches, interpret the
patterns of the explored space, pursue explicit goals, materialize selected
directions, and speak with a collaborator while work continues. The complete
prototype comprises fifteen capabilities, C01-C15 in [SPEC.md](./SPEC.md); a canvas
with a few generation buttons and a chat panel is a different, smaller product.

The hypothesis is that persistent alternatives, visible lineage, and concurrent
spatial/conversational work help people develop useful directions. Neither
model enthusiasm nor the number of generated cards establishes that benefit.
Humans judge idea feasibility and whether the creative experience is useful.
The owner drives those judgments and iteration through milestones and their
chunks. Build feasibility is settled; implementation proceeds without a separate
feasibility study or estimation gate.

## The complete experience

1. Create a workspace with a problem and explicit constraints.
2. Add ideas and start a bounded Wander exploration, or pursue an explicit goal
   with Agent Drive.
3. Inspect, move, edit and zoom while results arrive; trace exact parents,
   descendants and semantic links on the canvas.
4. Discuss a selected idea with the typed or voice collaborator, including
   spoken replies and acknowledged scoped actions.
5. See what the explored space suggests, with evidence and uncertainty, and
   challenge a grouping.
6. Compare two to four distant ideas, choose card-specific contextual moves,
   Weave selected contributions and inspect what each contributed.
7. Keep, revise or set aside proposals without losing their origins; revisit
   history and replay a recipe.
8. Switch between Lineage, Evolution and Constellation over the same ideas,
   and use the creative instruments independently.
9. Materialize a selected direction as a prototype, paired experiment,
   coding handoff or reusable synthesis.
10. Interrupt voice, close the browser, return, and recover saved work and run
    status.

Delivery is staged through six milestones (see `../build-prompts.md`). The
experience proof and working spine come first so the interaction can be judged
early, and every later milestone adds required capability rather than optional
polish.

Ship synthetic, editable demo data for **What to do with a dead shopping mall**,
showing each tool and how it explores that creative space, alongside fully
functional capabilities and an obvious blank-start path. Follow the
[demo contract](./SPEC.md#shipped-demo-and-human-judgment). The example does not
restrict the application's domain or prescribe a winning answer.

## Human and AI roles

Wander can generate exploratory material and manipulate it within an
explicit run scope. It cannot overwrite human-kept work or turn guesses into
confirmed facts. The collaborator may point, discuss, suggest, create proposals
and execute clearly requested bounded commands through the same application
operations as the UI. Voice is not universally read-only.

The person retains control of goals, explicit constraints, acceptance and
deliberate spatial arrangement. Partial speech and incidental proximity do
not authorize mutations. Generated conventions are not user requirements.

## Experience and truth

The identity is **a living atlas of ideas**. Wander names exploration, Weave
is the thematic label for recombination, and the collaborator is reached through
Talk to Minerva. Keep plain action labels alongside metaphor.

Keep title-first cards, warm paper and dark ink, restrained color, direct
contextual actions, and details on demand. Discovery should feel tactile and
curious, but essential functionality must not be hidden in nested menus.
Pointer, keyboard and touch interactions remain useful while AI runs.

Display what an operation actually used, what changed, and what remains
uncertain. Different words or labels do not establish different mechanisms.
Provisional groups are not proven attractors; model review is not proof of
novelty, feasibility or quality. Stagnation and partial failure are real outcomes.

## Foundation

Use one Next.js/TypeScript modular monolith with server-owned Postgres state,
immutable content revisions, explicit commands, and durable Vercel workflows.
The browser owns transient interaction, not canonical product truth or job
lifetime. Code lives in a public GitHub repository generated from this template;
credentials, workspace data and paid operations stay server-side, and the public
deployment is open only for the demonstration window. No data migration is required.

Open the browser URL and work without accounts or a sign-in screen.
Browser-only describes the client, not browser-local storage or a serverless
application. Local development binds to loopback. Live AI/voice still needs
configured providers and network access. Keep local services running while
jobs execute; recover saved state and interrupted work after service restart.
The release target is a public Vercel deployment for a bounded demonstration
window, used by a small judge panel without accounts. Text and realtime voice
models run through Vercel AI Gateway. The window's dates, the configured Vercel
budget and the teardown at its end are the controls, recorded in the application
handoff. Do not create access infrastructure or add steps that slow the judges.

## Exclusions

External REST/MCP APIs, accounts/sign-in, multi-user co-editing,
offline-first synchronization, billing, microservices,
a plugin marketplace, an agent framework, desktop process hosting and a
research platform are outside this contract unless the owner requests them.
Views, instruments, execution outputs and Agent Drive are required
capabilities, delivered in later milestones on the same records and
operations. Responsive interaction is demonstrated in M1; persistent state,
run recovery and voice recovery begin with the M2 working spine and expand with
their owning capabilities. They are not postponed to final hardening.

## Definition of success and falsifiers

The complete journey above works with actual configured capabilities, not
only fixtures. Kept content and lineage survive reload. Voice, exploration,
and canvas interaction do not block unrelated work. Failures leave recoverable
state and specific explanations.

The product hypothesis is weakened if exploration repeatedly proposes the
same mechanism, space readings are not grounded in artifacts, conversation
cannot make useful new links, or the person spends more effort controlling
menus and context than developing ideas. Investigate those failures rather
than counting more output as improvement.
