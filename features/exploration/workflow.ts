import { executeStage, finishExploration } from "./service";

async function stage(runId: string, slot: number, purpose: "generate" | "assess") {
  "use step";
  return executeStage(runId, slot, purpose);
}
stage.maxRetries = 0;
async function finish(runId: string, error?: string) {
  "use step";
  await finishExploration(runId, error);
}
finish.maxRetries = 0;
export async function explorationWorkflow(runId: string) {
  "use workflow";
  try {
    for (const slot of [0, 1]) {
      if (!await stage(runId, slot, "generate")) return;
      if (!await stage(runId, slot, "assess")) return;
    }
    await finish(runId);
  } catch {
    await finish(runId, "Execution interrupted. Saved results remain; inspect the run before retrying.");
  }
}
