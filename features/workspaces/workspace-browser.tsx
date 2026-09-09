"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Workspace, WorkspaceCommand } from "./domain";

async function fetchWorkspaces(signal?: AbortSignal): Promise<Workspace[]> {
  const result = await fetch("/internal/workspaces", { cache: "no-store", signal });
  const data = await result.json();
  if (!result.ok) throw new Error(data.error);
  return data.workspaces;
}

export default function WorkspaceBrowser() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [current, setCurrent] = useState<Workspace | null>(null);
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [constraints, setConstraints] = useState("");
  const [message, setMessage] = useState("Opening workspace storage…");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<WorkspaceCommand | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const submitting = useRef(false);

  async function refresh(signal?: AbortSignal) {
    setWorkspaces(await fetchWorkspaces(signal));
    setMessage("");
  }
  useEffect(() => {
    const controller = new AbortController();
    fetchWorkspaces(controller.signal).then((items) => {
      if (controller.signal.aborted) return;
      setWorkspaces(items);
      setMessage("");
    }).catch((error) => {
      if (!controller.signal.aborted) setMessage(error.message);
    });
    return () => controller.abort();
  }, []);

  function open(workspace: Workspace | null) {
    setCurrent(workspace);
    setName(workspace?.name ?? "");
    setBrief(workspace?.brief ?? "");
    setConstraints(workspace?.constraints ?? "");
    setMessage("");
    setConfirmation("");
  }
  async function save(event?: FormEvent, action?: WorkspaceCommand) {
    event?.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    const command: WorkspaceCommand = pending ?? action ?? {
      commandId: crypto.randomUUID(), actor: "local-user",
      workspaceId: current?.id ?? crypto.randomUUID(),
      ...(current ? { operation: "revise-workspace", expectedRevision: current.revision } as const
        : { operation: "create-workspace" } as const),
      name, brief, constraints,
    };
    setPending(command);
    try {
      const result = await fetch("/internal/workspaces", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(command),
      });
      const data = await result.json();
      if (!result.ok) {
        // A definite rejection permits editing. An unavailable/uncertain result
        // retains the exact command identity and payload for receipt replay.
        if (result.status < 500) setPending(null);
        throw new Error(data.error);
      }
      const saved: Workspace = data.workspace;
      open(saved);
      setWorkspaces((previous) => [...previous.filter((w) => w.id !== saved.id), saved]);
      setPending(null);
      setMessage(`Saved revision ${saved.revision}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request interrupted. Retry the same save.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  function lifecycle(operation: "delete-workspace" | "restore-workspace" | "duplicate-workspace") {
    if (!current) return;
    const base = { commandId: crypto.randomUUID(), actor: "local-user" as const,
      workspaceId: current.id, expectedRevision: current.revision };
    const command: WorkspaceCommand = operation === "duplicate-workspace"
      ? { ...base, operation, workspaceId: crypto.randomUUID(), sourceWorkspaceId: current.id, name: `${current.name.slice(0, 150)} copy` }
      : operation === "delete-workspace" ? { ...base, operation, confirmation }
      : { ...base, operation };
    void save(undefined, command);
  }
  async function download() {
    if (!current) return;
    try {
      const result = await fetch(`/internal/workspaces?export=${current.id}`, { cache: "no-store" });
      if (!result.ok) throw new Error((await result.json()).error);
      const url = URL.createObjectURL(new Blob([JSON.stringify(await result.json(), null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `minerva-${current.id}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Export failed."); }
  }
  return (
    <main className="workspace-browser">
      <header><Link href="/">Minerva / prepared atlas</Link><h1>Your workspaces</h1></header>
      <p>Create a workspace or reopen its saved brief and constraints.</p>
      <p role="status" aria-live="polite">{message}</p>
      <div className="workspace-columns">
        <nav aria-label="Saved workspaces">
          <button disabled={busy || !!pending} onClick={() => open(null)}>New workspace</button>
          <button disabled={busy || !!pending} onClick={() => refresh().catch((e) => setMessage(e.message))}>Refresh list</button>
          <label><input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />Show deleted workspaces</label>
          <ul>{workspaces.filter((w) => showDeleted || !w.deleted).map((workspace) => <li key={workspace.id}>
            <button disabled={busy || !!pending} aria-current={current?.id === workspace.id ? "page" : undefined}
              onClick={() => open(workspace)}>{workspace.name} · {workspace.deleted ? "deleted" : `revision ${workspace.revision}`}</button>
          </li>)}</ul>
        </nav>
        <form onSubmit={save}>
          <h2>{current ? "Workspace brief" : "New workspace"}</h2>
          <fieldset disabled={busy || !!pending || current?.deleted}>
            <label htmlFor="workspace-name">Name</label><input id="workspace-name" required maxLength={160} value={name} onChange={(e) => setName(e.target.value)} />
            <label htmlFor="workspace-brief">Brief</label><textarea id="workspace-brief" rows={8} maxLength={20000} value={brief} onChange={(e) => setBrief(e.target.value)} />
            <label htmlFor="workspace-constraints">Constraints</label><textarea id="workspace-constraints" rows={5} maxLength={10000} value={constraints} onChange={(e) => setConstraints(e.target.value)} />
          </fieldset>
          <button type="submit" disabled={busy || (current?.deleted && !pending)}>{busy ? "Saving…" : pending ? "Retry same save" : "Save workspace"}</button>
          {pending && !busy && <p>The last save could not be confirmed. Retry it to recover the receipt before making another change.</p>}
          {current && <fieldset disabled={busy || !!pending}>
            <legend>Workspace actions</legend>
            {!current.deleted && <Link href={`/workspaces/${current.id}`}>Open atlas</Link>}
            <button type="button" onClick={download}>Export JSON</button>
            {current.deleted ? <button type="button" onClick={() => lifecycle("restore-workspace")}>Restore workspace</button> : <>
              <button type="button" onClick={() => lifecycle("duplicate-workspace")}>Duplicate workspace</button>
              <p>Delete hides this workspace and retains its history. You can restore it from the deleted list.</p>
              <label>Type {current.name} to confirm deletion<input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label>
              <button type="button" disabled={confirmation !== current.name} onClick={() => lifecycle("delete-workspace")}>Delete workspace</button>
            </>}
          </fieldset>}
        </form>
      </div>
    </main>
  );
}
