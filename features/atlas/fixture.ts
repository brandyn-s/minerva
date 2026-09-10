import type { AtlasFixture, Thought } from "./domain";

function thought(
  id: string,
  title: string,
  summary: string,
  contribution: string,
  extra: Partial<Thought> = {},
): Thought {
  const card = {
    id,
    title,
    summary,
    contribution,
    revision: 1,
    kind: "proposal",
    body:
      summary +
      "\n\nThis is synthetic starting material for exploring the mall brief. No site survey, demand study or financial assessment has been performed.",
    move: {
      title: "Challenge the everyday use",
      question: "What would bring someone here on an ordinary Tuesday?",
      preview:
        "Prepare a small weekday trial with one invitation, one activity and an observation of who returns. Demand remains unknown.",
    },
    ...extra,
  };
  return { ...card, kind: card.kind as Thought["kind"], revisions: [{ number: 1, time: "2026-09-09T00:00:00.000Z", cause: "starting material", title: card.title, summary: card.summary, body: card.body }] };
}
export function mallFixture(): AtlasFixture {
  const thoughts = [
    thought(
      "brief",
      "What to do with a dead shopping mall",
      "A familiar building. An open question. What else could this place become?",
      "The shared question; not a parent idea.",
      { kind: "brief" },
    ),
    thought(
      "retail",
      "Independent retail shops",
      "A collection of small shops, each with its own reason to visit.",
      "Small independent operators and flexible shopfronts.",
      {
        move: {
          title: "Rethink the lease",
          question: "Could someone test a shop before committing to it?",
          preview:
            "A rotating six-week shopfront gives independent sellers a small experiment. Example assumption: a vacant unit can be subdivided; suitability and costs are unknown.",
        },
      },
    ),
    thought(
      "food",
      "A food hall",
      "Shared tables bring different kitchens into the same daily rhythm.",
      "Shared tables, independent kitchens and repeat visits.",
      {
        move: {
          title: "Explore the quiet hours",
          question: "What happens between lunch and dinner?",
          preview:
            "Try a communal preparation class between services, using shared tables. Staffing and food safety feasibility remain unassessed.",
        },
      },
    ),
    thought(
      "tools",
      "A shared tool library",
      "Borrow what you need. Learn how to use it. Bring it back.",
      "A lending collection and practical peer learning.",
      {
        move: {
          title: "Follow the first borrower",
          question:
            "What happens when someone has the tool but not the confidence?",
          preview:
            "Pair a first loan with a short repair lesson. Observe whether the borrower can complete one task; safety and staffing remain unknown.",
        },
      },
    ),
    thought(
      "repair",
      "Repair, then stay for supper",
      "A repair table beside the food hall turns waiting into a shared meal.",
      "Tool lending becomes a hosted repair session; shared tables connect the visit to food.",
      {
        kind: "recombination",
        body: "Bring a broken household object to a staffed repair table, then share a meal while the work continues.\n\nInherited from the food hall: shared tables and independent kitchens. Inherited from the tool library: tools and practical peer learning. Changed: borrowing becomes a hosted repair session. New: an evening repair-and-meal format.\n\nUnknown: whether repair work can safely coexist with food service, who would staff it, and whether anyone would attend. This prepared draft is not endorsed or assessed.",
        move: {
          title: "Separate the risky activities",
          question: "Can the social connection survive a physical separation?",
          preview:
            "Place repair work in a separate unit while sharing a booking time and a meal invitation. The food and tool contributions remain explicit; safe separation is still an untested assumption.",
        },
      },
    ),
    thought(
      "rotation",
      "A shopfront for six weeks",
      "Let a small maker test an idea before taking on a permanent shop.",
      "Retains independent operators; changes the commitment to a short trial.",
      { kind: "exploration" },
    ),
  ];
  const relationships: AtlasFixture["relationships"] = [
    ...["retail", "food", "tools"].map((to) => ({
      id: "context-" + to,
      from: "brief",
      to,
      kind: "context" as const,
      label: "shared brief",
      sourceRevision: 1,
    })),
    {
      id: "food-repair",
      from: "food",
      to: "repair",
      kind: "recombination",
      label: "shared tables",
      sourceRevision: 1,
      contribution:
        "Shared tables and independent kitchens. Changed from routine dining to a meal alongside repair.",
    },
    {
      id: "tools-repair",
      from: "tools",
      to: "repair",
      kind: "recombination",
      label: "tools + learning",
      sourceRevision: 1,
      contribution:
        "Lending collection and peer learning. Changed from taking tools home to a hosted repair session.",
    },
    {
      id: "retail-rotation",
      from: "retail",
      to: "rotation",
      kind: "derivation",
      label: "shorter commitment",
      sourceRevision: 1,
      contribution:
        "Independent operators and flexible shopfronts. Changed to a six-week trial.",
    },
    {
      id: "rotation-tools",
      from: "rotation",
      to: "tools",
      kind: "association",
      label: "could share makers",
      sourceRevision: 1,
    },
  ];
  const positions = {
    brief: { x: 0, y: 290 },
    retail: { x: 390, y: 0 },
    food: { x: 390, y: 290 },
    tools: { x: 390, y: 580 },
    rotation: { x: 800, y: 0 },
    repair: { x: 850, y: 425 },
  };
  const fixture: AtlasFixture = { thoughts, relationships, positions };
  return fixture;
}
