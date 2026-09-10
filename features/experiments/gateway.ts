import { generateObject } from "ai";
import type { Provider } from "./operators";
export const gatewayProvider: Provider = {
  name: "gateway/anthropic/claude-sonnet-5",
  async call(plan, schema, signal, onUsage) {
    const { object, usage } = await generateObject({ model: plan.model, schema, system: plan.system, prompt: plan.prompt,
      maxOutputTokens: plan.maxOutputTokens, maxRetries: 0, abortSignal: signal,
      providerOptions: { gateway: { tags: ["feature:expedition-operations"] } },
    });
    onUsage?.({inputTokens:usage.inputTokens,outputTokens:usage.outputTokens,totalTokens:usage.totalTokens});
    return object;
  },
};
