"use client";

import { useEffect, useRef, useState } from "react";
import type { TalkRequest } from "./generation";

export default function TalkPanel({ open, close, cards }: {
  open: boolean; close: () => void; cards: TalkRequest["cards"];
}) {
  const [messages, setMessages] = useState<TalkRequest["messages"]>([]);
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef<TalkRequest | null>(null);
  const running = useRef(false);
  const transcript = useRef<HTMLDivElement>(null);
  useEffect(() => { if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight; }, [messages, reply]);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);

  async function send(retry = false) {
    if (running.current || (!retry && !draft.trim())) return;
    const request = retry ? pending.current! : {
      messages: [...messages, { role: "user" as const, content: draft.trim() }], cards,
    };
    pending.current = request;
    running.current = true;
    setMessages(request.messages);
    setDraft(""); setReply(""); setError(""); setBusy(true);
    let text = "";
    try {
      const response = await fetch("/api/talk", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Minerva could not reply.");
      if (!response.body) throw new Error("No reply stream arrived.");
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "", done = false;
      try {
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += chunk.value;
          let end;
          while ((end = buffer.indexOf("\n")) >= 0) {
            const event = JSON.parse(buffer.slice(0, end));
            buffer = buffer.slice(end + 1);
            if (event.error) throw new Error(event.error);
            if (event.text) { text += event.text; setReply(text); }
            if (event.done) done = true;
          }
        }
        if (!done || !text.trim()) throw new Error("The reply was interrupted. Please retry.");
      } finally { await reader.cancel(); }
      setMessages([...request.messages, { role: "assistant", content: text }]);
      setReply(""); pending.current = null;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { running.current = false; setBusy(false); }
  }

  return <aside hidden={!open} className="detail-panel talk-panel" role="dialog" aria-label="Talk to Minerva"
    onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
    <div className="panel-heading"><span className="instrument-label">Think together</span>
      <button aria-label="Close panel" onClick={close}>×</button></div>
    <h2>Talk to Minerva</h2>
    <p className="small-note">{cards.length ? `Using ${cards.length} selected card${cards.length === 1 ? "" : "s"}.` : "Select cards to include them in your next turn."} Conversation resets on reload.</p>
    <div ref={transcript} className="talk-transcript" role="log" aria-live="polite">
      {messages.map((message, index) => <section key={index}>
        <h3>{message.role === "user" ? "You" : "Minerva"}</h3><p className="body-copy">{message.content}</p>
      </section>)}
      {(reply || busy) && <section><h3>Minerva</h3><p className="body-copy">{reply || "Thinking…"}</p></section>}
    </div>
    {error && <div><p role="alert">{error}</p><button disabled={busy} onClick={() => void send(true)}>Retry</button></div>}
    <form onSubmit={(event) => { event.preventDefault(); void send(); }}>
      <label>Message Minerva<textarea ref={input} rows={4} value={draft} onChange={(event) => setDraft(event.target.value)} /></label>
      <button disabled={busy || !!error || !draft.trim()} type="submit">{busy ? "Replying…" : "Send"}</button>
    </form>
  </aside>;
}
