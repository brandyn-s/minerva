"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import { Settings2 } from "lucide-react";
import { defaultVoiceSettings, parseVoiceSettings, voiceOptions, type VoiceSettings } from "./voice-settings";

const key = "minerva-voice-settings-v1";
let fallback = "";
function snapshot() { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener); window.addEventListener("minerva-voice-settings", listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener("minerva-voice-settings", listener); };
}
export function useVoiceSettings() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  const settings = useMemo(() => { try { return parseVoiceSettings(JSON.parse(raw)); } catch { return { ...defaultVoiceSettings }; } }, [raw]);
  function update(next: VoiceSettings) {
    fallback = JSON.stringify(parseVoiceSettings(next));
    try { localStorage.setItem(key, fallback); } catch { /* Keep preferences for this page if browser storage is unavailable. */ }
    window.dispatchEvent(new Event("minerva-voice-settings"));
  }
  return { settings, update };
}
export default function VoiceSettingsPanel({ settings, update, busy, preview, stop, error }: {
  settings: VoiceSettings; update: (s: VoiceSettings) => void; busy: boolean; preview: () => void; stop: () => void; error: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  function set<K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) { update({ ...settings, [key]: value }); }
  const select = (key: keyof VoiceSettings, label: string, options: readonly string[]) => <label>{label}<select value={String(settings[key])} onChange={e => set(key, e.target.value as never)}>{options.map(v => <option key={v} value={v}>{v === "server-vad" ? "Silence detection" : v === "semantic-vad" ? "Completed-thought detection" : v}</option>)}</select></label>;
  const text = (key: "language" | "accent" | "transcriptionLanguage", label: string, maxLength: number) => <label>{label}<input value={settings[key]} maxLength={maxLength} pattern={key === "transcriptionLanguage" ? "[a-z]{2}|" : undefined} onChange={e => set(key, key === "transcriptionLanguage" ? e.target.value.toLowerCase().replace(/[^a-z]/g, "") : e.target.value)} /></label>;
  return <>
    <button type="button" className="composer-icon" aria-label="Voice settings" onClick={() => dialog.current?.showModal()}><Settings2 size={20} aria-hidden="true" /></button>
    <dialog ref={dialog} className="voice-settings-dialog" aria-labelledby="voice-settings-heading">
      <header><div><h2 id="voice-settings-heading">Minerva’s voice</h2><p>Realtime 2.1 · Make the conversation yours</p></div><button type="button" aria-label="Close voice settings" onClick={() => dialog.current?.close()}>×</button></header>
      {error && <p role="alert">{error}</p>}
      {busy && <p role="status">End the current voice session before changing settings. <button type="button" onClick={stop}>Stop voice</button></p>}
      <fieldset disabled={busy}><legend>Voice and conversation</legend>
        <div className="voice-settings-grid">
          {select("voice", "Voice", voiceOptions)}
          {select("style", "Tone", ["Thoughtful", "Warm", "Direct", "Playful", "Formal"])}
          {select("approach", "Thinking approach", ["Thinking partner", "Brainstorm", "Socratic coach", "Constructive critic", "Practical planner"])}
          {select("length", "Response length", ["Brief", "Balanced", "Detailed"])}
          {select("pace", "Speaking pace", ["Slow", "Natural", "Brisk"])}
          {select("expertise", "Explanation level", ["Plain language", "Adapt to me", "Technical"])}
          {select("questions", "Follow-up questions", ["When useful", "Ask before advising", "Minimize questions"])}
          {text("language", "Spoken language", 80)}{text("accent", "Accent preference (optional)", 80)}
        </div>
        <p className="voice-settings-note">Tone, pace, accent, and conversational style guide the model; delivery can vary.</p>
        <label>Custom instructions<textarea rows={4} maxLength={3000} value={settings.custom} placeholder="For example: Challenge my assumptions, use concrete examples, and give me time to think." onChange={e => set("custom", e.target.value)} /></label>
        <button type="button" onClick={preview}>Preview voice</button>
        <p className="voice-settings-note">Preview plays a short generated sample without opening your microphone.</p>
      </fieldset>
      <fieldset disabled={busy}><legend>Listening</legend>
        {select("detection", "End-of-turn detection", ["server-vad", "semantic-vad"])}
        <p className="voice-settings-note">Server detection uses silence. Semantic detection listens for a completed thought. Hold-to-talk always waits for release.</p>
        <fieldset disabled={settings.detection !== "server-vad"}><legend>Silence detection tuning</legend>
          <label>Pause before replying: {settings.silence} ms<input type="range" min={200} max={2000} step={100} value={settings.silence} onChange={e => set("silence", Number(e.target.value))} /></label>
          <label>Speech threshold: {settings.threshold.toFixed(1)}<input type="range" min={.1} max={.9} step={.1} value={settings.threshold} onChange={e => set("threshold", Number(e.target.value))} /></label>
          <p className="voice-settings-note">Higher thresholds require louder speech.</p>
          <label>Audio before speech: {settings.prefix} ms<input type="range" min={0} max={1000} step={100} value={settings.prefix} onChange={e => set("prefix", Number(e.target.value))} /></label>
        </fieldset>
        {text("transcriptionLanguage", "Transcription language (two-letter code, or blank for automatic)", 2)}
        <label>Names and vocabulary<textarea rows={2} maxLength={1000} value={settings.vocabulary} onChange={e => set("vocabulary", e.target.value)} placeholder="Names or specialist terms to recognize" /></label>
        {(["echoCancellation", "noiseSuppression", "autoGainControl"] as const).map((key, i) => <label className="voice-settings-check" key={key}><input type="checkbox" checked={settings[key]} onChange={e => set(key, e.target.checked)} />{["Reduce speaker echo", "Suppress background noise", "Automatically adjust microphone gain"][i]}</label>)}
        <p className="voice-settings-note">Microphone processing depends on your browser and device.</p>
      </fieldset>
      <footer><button type="button" disabled={busy} onClick={() => update({ ...defaultVoiceSettings })}>Reset defaults</button><button type="button" onClick={() => dialog.current?.close()}>Done</button></footer>
      <p className="voice-settings-note">Preferences apply to your next voice session and are saved in this browser when storage is available.</p>
    </dialog>
  </>;
}
