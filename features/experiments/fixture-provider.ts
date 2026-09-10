import type { Provider } from "./operators";
// Explicit synthetic provider for integration checks and replay, never a live fallback.
export function fixtureProvider(seed = 1): Provider {
  let calls = 0;
  return { name: `synthetic-fixture-v1/seed-${seed}`, async call(plan) {
    calls++;
    const input = JSON.parse(plan.prompt);
    if (input.artifact) {
      const body: string = input.artifact.body;
      const mechanism = body.split(".")[0];
      return { behavior:{actor:mechanism.includes("Central")?"institution":"group",medium:"physical",timescale:"session",unit:"rule",collaboration:mechanism.includes("negotiate")?"negotiation":"coordination",evidence:"trace"}, mechanism, evidence: mechanism, constraints: body.includes("BREAK-CONSTRAINT") ? "violated" : "preserved", changed: input.sources.some((s: {body: string}) => s.body.split(".")[0] === mechanism) ? "no" : "yes", actionability: "supported", explanation: "Synthetic known-truth assessment; no real-world validation." };
    }
    const alternatives = ["Central coordinator allocates resources", "Peers negotiate resource exchanges", "A shared rule automatically limits allocations", "Local actors reserve resources independently"];
    const mechanism = alternatives[(seed + calls + (input.step ?? 0)) % alternatives.length];
    const count = Number(plan.system.match(/exactly (\d)/)?.[1] ?? 1);
    return { cards: Array.from({length: count}, (_, i) => ({ title: `Synthetic proposal ${seed}-${calls}-${i}`, summary: mechanism, body: `${mechanism}. Test a small reversible trial and record allocations.`, contribution: "Synthetic fixture contribution" })), note: "Synthetic proposal; not a discovery claim", contributions: (input.sources ?? []).map((s: {title: string}) => `Synthetic use of ${s.title}`) };
  } };
}
