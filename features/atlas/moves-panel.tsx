"use client";

import { useEffect, useState } from "react";
import { movesSchema, type ContextualMove, type TalkRequest } from "./generation";

export default function MovesPanel({ source, prepared, busy, error, choose, explore, retryGeneration }: {
  source: TalkRequest["cards"][number]; prepared: ContextualMove; busy: boolean;
  explore: () => void; error?: string; choose: (move: ContextualMove) => void; retryGeneration: () => void;
}) {
  const [moves, setMoves] = useState<ContextualMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState("");
  const [attempt, setAttempt] = useState(0);
  const serialized = JSON.stringify(source);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/moves", { method: "POST", headers: { "Content-Type": "application/json" },
          body: serialized, signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not suggest moves.");
        const parsed = movesSchema.parse(result);
        if (active) setMoves(parsed.moves);
      } catch (cause) {
        if (active) setFailure(cause instanceof Error ? cause.message : String(cause));
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [serialized, attempt]);
  return <>
    <h2>Where could {source.title} lead?</h2>
    <p>Choose a suggested next step, or explore freely to generate several new directions.</p>
    <button disabled={busy} onClick={explore}>Explore freely</button>
    <h3>Suggested next steps</h3>
    {loading && <p role="status">Finding next steps…</p>}
    {failure && <><p role="alert">{failure}</p>
      <button disabled={busy} onClick={() => { setFailure(""); setLoading(true); setAttempt((n) => n + 1); }}>Retry</button>
      <p className="small-note">Prepared move available while live suggestions are unavailable.</p></>}
    {(failure ? [prepared] : moves).map((move, index) => <section className="source-preview" key={index}>
      <h3>{move.title}</h3><p>{move.question}</p><p>{move.preview}</p>
      <button className="move-choice" disabled={busy || loading} onClick={() => choose(move)}>Try {move.title} →</button>
    </section>)}
    {busy && <p role="status">Developing this move…</p>}
    {error && <><p role="alert">{error}</p><button disabled={busy} onClick={retryGeneration}>Retry card</button></>}
  </>;
}
