import { z } from "zod";
import type { Experimental_RealtimeSessionConfig } from "ai";

export const VOICE_MODEL = "openai/gpt-realtime-2.1";
export const voiceOptions = ["marin", "cedar", "alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"] as const;
export const voiceSettingsSchema = z.object({
  voice: z.enum(voiceOptions).default("marin"),
  style: z.enum(["Thoughtful", "Warm", "Direct", "Playful", "Formal"]).default("Thoughtful"),
  approach: z.enum(["Thinking partner", "Brainstorm", "Socratic coach", "Constructive critic", "Practical planner"]).default("Thinking partner"),
  length: z.enum(["Brief", "Balanced", "Detailed"]).default("Balanced"),
  pace: z.enum(["Slow", "Natural", "Brisk"]).default("Natural"),
  expertise: z.enum(["Plain language", "Adapt to me", "Technical"]).default("Adapt to me"),
  questions: z.enum(["When useful", "Ask before advising", "Minimize questions"]).default("When useful"),
  language: z.string().max(80).default("Match my language"),
  accent: z.string().max(80).default(""),
  custom: z.string().max(3000).default(""),
  detection: z.enum(["server-vad", "semantic-vad"]).default("server-vad"),
  silence: z.number().int().min(200).max(2000).default(700),
  threshold: z.number().min(.1).max(.9).default(.5),
  prefix: z.number().int().min(0).max(1000).default(300),
  transcriptionLanguage: z.string().regex(/^[a-z]{0,2}$/).default(""),
  vocabulary: z.string().max(1000).default(""),
  echoCancellation: z.boolean().default(true),
  noiseSuppression: z.boolean().default(true),
  autoGainControl: z.boolean().default(true),
});
export type VoiceSettings = z.infer<typeof voiceSettingsSchema>;
export const defaultVoiceSettings = voiceSettingsSchema.parse({});
export function parseVoiceSettings(raw: unknown): VoiceSettings {
  const result = voiceSettingsSchema.safeParse(raw);
  return result.success ? result.data : { ...defaultVoiceSettings };
}
export function voicePreferences(s: VoiceSettings) {
  const lengths = { Brief: "Usually reply in one or two sentences.", Balanced: "Give a focused answer with enough explanation to be useful.", Detailed: "Give a thorough answer when useful, in digestible spoken sections." };
  return `User voice preferences: tone ${s.style}; role ${s.approach}; speaking pace ${s.pace}; explanation level ${s.expertise}; questions ${s.questions}. ${lengths[s.length]} Language: ${s.language || "Match my language"}. ${s.accent ? `Requested accent: ${s.accent}.` : ""} Additional user preferences: ${JSON.stringify(s.custom)}. Apply these preferences within your existing capabilities and context rules.`;
}
export function voiceSessionSettings(s: VoiceSettings, continuous: boolean): Partial<Experimental_RealtimeSessionConfig> {
  return {
    voice: s.voice, outputModalities: ["audio"],
    inputAudioTranscription: { ...(s.transcriptionLanguage.length === 2 ? { language: s.transcriptionLanguage } : {}), ...(s.vocabulary ? { prompt: s.vocabulary } : {}) },
    turnDetection: !continuous ? null : s.detection === "semantic-vad" ? { type: "semantic-vad" } : {
      type: "server-vad", threshold: s.threshold, silenceDurationMs: s.silence, prefixPaddingMs: s.prefix,
    },
    providerOptions: { gateway: { tags: ["feature:voice"] } },
  };
}
