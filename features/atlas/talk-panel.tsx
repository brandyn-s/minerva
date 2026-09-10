"use client";
import { boundContext } from "./context";

import { Button, Textarea } from "../../components/ui/controls";

import { ArrowUp, ArrowDown, LoaderCircle } from "../../components/ui/icons";
import PanelHeader from "../../components/ui/panel-header";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { TalkRequest } from "./generation";
import VoiceButton from "./voice-button";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MessageContent({ text }: { text: string }) {
  return <div className="body-copy talk-markdown"><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{ table: ({ children }) => <div className="talk-table" tabIndex={0} role="region" aria-label="Table"><table>{children}</table></div> }}>{text}</Markdown></div>;
}

export default function TalkPanel({ focusedId, open, close, cards, selectedIds, messages, setMessages }: {
  messages: TalkRequest["messages"]; setMessages: Dispatch<SetStateAction<TalkRequest["messages"]>>;
  focusedId: string | null; open: boolean; close: () => void; cards: TalkRequest["cards"]; selectedIds: string[];
}) {
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const pending = useRef<TalkRequest | null>(null);
  const running = useRef(false);
  const transcript = useRef<HTMLDivElement>(null);
  const followReply = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
  useEffect(() => { if (transcript.current && followReply.current) transcript.current.scrollTop = transcript.current.scrollHeight; }, [messages, reply]);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (open && !voiceBusy) input.current?.focus(); }, [open, voiceBusy]);

  async function send(retry = false) {
    if (running.current || voiceBusy || (!retry && (error || !draft.trim()))) return;
    const request = retry ? pending.current! : {
      messages: [...messages, { role: "user" as const, content: draft.trim() }], ...boundContext(cards,selectedIds,focusedId),
    };
    followReply.current = true;
    setShowLatest(false);
    pending.current = request;
    running.current = true;
    setMessages(request.messages);
    setDraft(""); setReply(""); setError(""); setBusy(true);
    let text = "", visible = 0;
    let drained: (() => void) | undefined;
    // Pace browser updates independently of provider and network chunk sizes.
    // Catch up faster after bursts so smoothing does not leave a long tail.
    const reveal = setInterval(() => {
      if (visible < text.length) {
        visible = document.hidden ? text.length : Math.min(text.length, visible + Math.max(2, Math.ceil((text.length - visible) / 8)));
        // Never split a UTF-16 surrogate pair while revealing emoji.
        if (visible < text.length && /[\uD800-\uDBFF]/.test(text[visible - 1])) visible++;
        setReply(text.slice(0, visible));
      }
      if (visible === text.length) drained?.();
    }, 24);
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
            if (event.text) { text += event.text; }
            if (event.done) done = true;
          }
        }
        if (!done || !text.trim()) throw new Error("The reply was interrupted. Please retry.");
      } finally { await reader.cancel(); }
      if (visible < text.length) await new Promise<void>(resolve => { drained = resolve; });
      setMessages([...request.messages, { role: "assistant", content: text }]);
      setReply(""); pending.current = null;
    } catch (cause) {
      setReply(text);
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { clearInterval(reveal); running.current = false; setBusy(false); }
  }

  return <aside id="minerva-talk" hidden={!open} className="detail-panel talk-panel" role="dialog" aria-label="Talk to Minerva"
    onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
    <PanelHeader title="Talk to Minerva" image="/images/minerva-engraved-cameo.png" close={close} />
    <div ref={transcript} className="talk-transcript" role="log" aria-live="polite" onScroll={(event) => { const el = event.currentTarget; followReply.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; setShowLatest(!followReply.current); }}>
      {messages.map((message, index) => <section key={index} className={`talk-message talk-message-${message.role}`}>
        <h3>{message.role === "user" ? "You" : "Minerva"}</h3><MessageContent text={message.content} />
      </section>)}
      {(reply || busy) && <section className="talk-message talk-message-assistant"><h3>Minerva</h3><MessageContent text={reply || "Thinking…"} /></section>}
    </div>
    {showLatest && <Button className="talk-latest" onClick={() => { followReply.current = true; setShowLatest(false); if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight; }}>Latest message <ArrowDown /></Button>}
    {error && <div><p role="alert">{error}</p><Button disabled={busy} onClick={() => void send(true)}>Retry</Button></div>}
    <form onSubmit={(event) => { event.preventDefault(); void send(); }}>
      <div className="integrated-composer"><label className="composer-label">Message Minerva<Textarea placeholder="Message Minerva…" disabled={voiceBusy} ref={input} rows={2} value={draft} onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }} /></label>
      <div className="talk-actions">
    {/* Canvas navigation may hide Talk without ending its active voice session. */}
    {(open || voiceBusy) && <VoiceButton focusedId={focusedId} cards={cards} selectedIds={selectedIds} messages={messages} onMessages={setMessages}
      onBusy={setVoiceBusy} disabled={busy || !!error} />}
      <Button iconOnly className="composer-icon composer-send" title="Send message" aria-label={busy ? "Replying…" : "Send"} disabled={busy || voiceBusy || !!error || !draft.trim()} type="submit">{busy ? <LoaderCircle className="composer-spinner" aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}</Button>
      </div></div>
    </form>
  </aside>;
}
