import type { Operation, OperationReceipt } from "../experiments/contracts";
export type CardRevision = {
  number: number; time: string; cause: string;
  title: string; summary: string; body: string;
  contribution?: string; // Absent on legacy revisions: unknown, never inferred.
  prepared?: boolean;
  receipt?: OperationReceipt;
  experiment?: { candidateId: string; operation: Operation };
  note?: string;
  branch?: { intent: string; step: number; runId: string };
};
export type DevelopmentIntent = { id: string; text: string };
export type Thought = {
  id: string;
  importedFromId?: string;
  revision: number;
  revisions: CardRevision[];
  title: string;
  summary: string;
  body: string;
  kind: "brief" | "proposal" | "recombination" | "exploration";
  contribution: string;
  provenance?: { feature: string; tag: string; sourceTitles: string[]; moveTitle?: string };
  generation?: { model: string; manifestId: string; mechanism: string; prerequisites: string[]; uncertainties: string[]; requestedChange: string; observedChange: string };
  assessment?: { goalFidelity: string; constraints: string; causalDependencies: string; transformation: string };
  move: { title: string; question: string; preview: string };
};
export type Relationship = {
  id: string;
  from: string;
  to: string;
  kind: "context" | "derivation" | "recombination" | "association";
  label: string;
  sourceRevision: number;
  contribution?: string;
};
export type AtlasFixture = {
  thoughts: Thought[];
  relationships: Relationship[];
  positions: Record<string, { x: number; y: number }>;
};
export function relationshipsFor(id: string, relationships: Relationship[]) {
  return relationships
    .filter((edge) => edge.from === id || edge.to === id)
    .map((edge) => ({
      ...edge,
      direction:
        edge.from === id ? ("outgoing" as const) : ("incoming" as const),
      otherId: edge.from === id ? edge.to : edge.from,
    }));
}
