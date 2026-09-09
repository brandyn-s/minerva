"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Atlas from "../atlas/atlas";
import type { AtlasSession, GraphAction, GraphCommand, WorkspaceGraph } from "./graph-domain";

export default function SavedAtlas({ workspaceId }: { workspaceId: string }) {
  const [session, setSession] = useState<AtlasSession | null>(null);
  const [message, setMessage] = useState("Opening saved atlas…");
  const [retry, setRetry] = useState<(() => Promise<void>) | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const listeners = new Set<(graph: WorkspaceGraph) => void>();
    const pending = new Map<string, GraphCommand>();
    let timer: ReturnType<typeof setTimeout>;
    async function read() {
      const result = await fetch(`/internal/graph?workspaceId=${workspaceId}`, { cache: "no-store", signal: controller.signal });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error);
      return data as WorkspaceGraph;
    }
    async function dispatch(command: GraphCommand) {
      const result = await fetch("/internal/graph", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(command) });
      const data = await result.json();
      if (!result.ok) {
        if (result.status < 500) pending.delete(command.commandId);
        throw new Error(data.error);
      }
      const graph = await read();
      listeners.forEach((listener) => listener(graph));
      pending.delete(command.commandId);
      if (!pending.size) setRetry(null);
      setMessage("Saved");
    }
    async function command(action: GraphAction) {
      const input = { ...action, workspaceId, actor: "local-user" as const, commandId: crypto.randomUUID() } as GraphCommand;
      pending.set(input.commandId, input);
      try { await dispatch(input); }
      catch (error) {
        if (pending.size) setRetry(() => async () => {
          for (const command of pending.values()) await dispatch(command).catch((e) => setMessage(e.message));
        });
        setMessage(error instanceof Error ? error.message : "Save interrupted; retry the same command.");
        throw error;
      }
    }
    async function poll() {
      try { const graph = await read(); listeners.forEach((listener) => listener(graph)); }
      catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Refresh unavailable."); }
      if (!controller.signal.aborted) timer = setTimeout(poll, 4000);
    }
    read().then((initial) => {
      if (controller.signal.aborted) return;
      setSession({ initial, subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, command });
      setMessage("Saved workspace · prepared seed and user-authored material");
      timer = setTimeout(poll, 4000);
    }).catch((error) => { if (!controller.signal.aborted) setMessage(error.message); });
    return () => { controller.abort(); clearTimeout(timer); listeners.clear(); };
  }, [workspaceId]);
  return <>
    {session ? <Atlas session={session} /> : <main className="workspace-browser"><h1>Saved atlas</h1><Link href="/workspaces">Workspaces</Link></main>}
    <div className="save-status" role="status">{message}{retry && <button onClick={() => void retry()}>Retry interrupted save</button>}</div>
  </>;
}
