"use client";
import { LoadingStatus } from "../../components/ui/loading-status";

import { Button } from "../../components/ui/controls";

import { useEffect, useId, useState } from "react";
import { ArrowRight } from "../../components/ui/icons";
import { movesSchema, type ContextualMove, type TalkRequest } from "./generation";

export default function MovesPanel({ source, prepared, busy, error, choose, explore, retryGeneration }: {
  source: TalkRequest["cards"][number]; prepared: ContextualMove; busy: boolean;
  explore: () => void; error?: string; choose: (move: ContextualMove) => void; retryGeneration: () => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const suggestionsId = useId();
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
  return <div className="wander-content">
    <div className="wander-source"><h3>{source.title}</h3></div>
    <section className="wander-primary" aria-labelledby={`${suggestionsId}-title`}>
      <p id={`${suggestionsId}-title`}>Explore new directions from this idea.</p>
      <Button variant="primary" className="wander-explore" disabled={busy} onClick={explore}>Explore freely <ArrowRight aria-hidden="true" /></Button>
    </section>
    <section className="wander-suggestions" aria-labelledby={`${suggestionsId}-heading`}>
      <div className="wander-suggestions-heading"><h3 id={`${suggestionsId}-heading`}>Suggested moves</h3>
        <Button variant="quiet" className="wander-toggle" aria-expanded={showSuggestions} aria-controls={suggestionsId} onClick={() => setShowSuggestions(show => !show)}>{showSuggestions ? "Hide suggestions" : "Show suggestions"}</Button>
      </div>
      <div id={suggestionsId} hidden={!showSuggestions} aria-busy={loading}>
        {loading && <LoadingStatus title="Finding tailored next steps…" />}
        {failure && <><p role="alert">{failure}</p>
          <Button disabled={busy} onClick={() => { setFailure(""); setLoading(true); setAttempt(n => n + 1); }}>Retry</Button>
          <p className="small-note">Try this starting move, or explore freely.</p></>}
        {!loading && (failure ? [prepared] : moves).map((move, index) => <section className="wander-move" key={index}>
          <h4>{move.title}</h4><p>{move.question}</p><p className="wander-hint">{move.preview}</p>
          <Button variant="secondary" className="move-choice" aria-label={`Try ${move.title}`} disabled={busy} onClick={() => choose(move)}>Try move <ArrowRight aria-hidden="true" /></Button>
        </section>)}
      </div>
    </section>
    {busy && <LoadingStatus title="Developing new directions…" />}
    {error && <><p role="alert">{error}</p><Button disabled={busy} onClick={retryGeneration}>Retry card</Button></>}
  </div>;
}
