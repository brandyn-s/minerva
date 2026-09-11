"use client";
import { LoadingStatus } from "../../components/ui/loading-status";
import { useState, type ReactNode } from "react";
import { Button, Field, Input, Select, Summary, Textarea } from "../../components/ui/controls";
import { currentLens, type Lens, type LensEdit, type LensMember } from "./domain";

type Props = { actions?: ReactNode; lenses: Lens[]; activeId: string | null; members: LensMember[]; choose: (id: string) => void; create: (name: string, seeded: boolean) => Promise<void> | void; edit: (edit: LensEdit) => Promise<void> | void; inspect: (member: LensMember) => Promise<string> | string; seededLabel: string; busy?: boolean };
export default function LensWorkspace(props: Props) {
  const [creating, setCreating] = useState(false), [name, setName] = useState(""), [seeded, setSeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creationError, setCreationError] = useState("");
  const lens = props.lenses.find(l => l.id === props.activeId);
  return <div className="lens-workspace">
    <div className="lens-actions">{props.lenses.length > 0 && <Field label="Lens"><Select aria-label="Lens" value={props.activeId ?? ""} disabled={props.busy} onChange={e => props.choose(e.target.value)}><option value="" disabled>Choose a lens</option>{props.lenses.map(l => <option key={l.id} value={l.id}>{currentLens(l).name}</option>)}</Select></Field>}<Button onClick={() => setCreating(v => !v)}>New lens</Button></div>
    {(creating || !props.lenses.length) && <form className="lens-create" onSubmit={async e => { e.preventDefault(); if (saving) return; setSaving(true); setCreationError(""); try { await props.create(name, seeded); setName(""); setCreating(false); } catch (error) { setCreationError(error instanceof Error ? error.message : String(error)); } finally { setSaving(false); } }}>
      <Field label="New lens name"><Input aria-label="New lens name" maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="How resources are shared" /></Field>
      <Field label="Starting grouping"><Select aria-label="Starting grouping" value={seeded ? "seeded" : "manual"} onChange={e => setSeeded(e.target.value === "seeded")}><option value="manual">All ideas unassigned</option><option value="seeded">{props.seededLabel}</option></Select></Field>
      <Button type="submit" variant="primary" busy={saving} disabled={!name.trim() || props.busy}>Create lens</Button>
      {saving && !props.busy && <LoadingStatus title="Creating lens…" />}
      {creationError && <p role="alert">{creationError}</p>}
    </form>}
    {lens && <LensEditor key={lens.id} lens={lens} members={props.members} edit={props.edit} inspect={props.inspect} busy={props.busy} actions={props.actions} />}
  </div>;
}
function LensEditor({ lens, members, edit, inspect, busy, actions }: Pick<Props, "members" | "edit" | "inspect" | "busy" | "actions"> & { lens: Lens }) {
  const r = currentLens(lens), byKey = new Map(lens.members.map(m => [m.key, m]));
  const [selected, setSelected] = useState<string[]>([]), [groupIds, setGroupIds] = useState<string[]>([]), [target, setTarget] = useState(""), [label, setLabel] = useState(""), [query, setQuery] = useState("");
  const [reading, setReading] = useState(0);
  const [detail, setDetail] = useState<{ member: LensMember; body: string }>(), [error, setError] = useState("");
  const additions = members.filter(m => !r.members.includes(m.key));
  const currentKeys = new Set(members.map(m => m.key)), historical = r.members.filter(k => !currentKeys.has(k)).length;
  const chosen = selected.filter(k => r.members.includes(k));
  async function apply(value: LensEdit) { setError(""); try { await edit(value); setSelected([]); setGroupIds([]); setLabel(""); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } }
  function toggle(key: string) { setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]); }
  return <section className="lens-editor" aria-label="Lens editor">
    <h2>{r.name}</h2>{r.description && <p>{r.description}</p>}
    <p className="small-note" role="status">{r.members.length} revisions · {r.members.length - r.unassigned.length} assigned · {r.unassigned.length} unassigned{historical ? ` · ${historical} historical` : ""}</p>
    <p className="small-note">{lens.scope.kind === "atlas" ? "This atlas" : "This expedition"} · revision {r.number} · {r.status}. {lens.origin === "constellation-themes" ? "Started from Constellation themes." : lens.origin === "assessor-mechanisms" ? "Started from normalized assessor mechanisms." : "Started without a grouping."}</p>
    {actions}
    <div className="lens-actions"><Button disabled={!r.undoTo || busy} onClick={() => void apply({ kind: "undo" })}>Undo lens edit</Button>{r.status === "proposed" && <Button disabled={busy} onClick={() => void apply({ kind: "review" })}>Mark reviewed</Button>}</div>
    {!!additions.length && <p className="small-note">{additions.length} new or updated revisions await classification. <Button disabled={busy} onClick={() => void apply({ kind: "include", members: additions })}>Include {additions.length} revisions</Button></p>}
    <details><Summary>Edit name and description</Summary><form key={`description-${r.number}`} onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void apply({ kind: "describe", name: String(data.get("name")), description: String(data.get("description")) }); }}><Field label="Lens name"><Input aria-label="Lens name" name="name" required maxLength={120} defaultValue={r.name} /></Field><Field label="Lens description"><Textarea aria-label="Lens description" name="description" maxLength={2000} defaultValue={r.description} /></Field><Button type="submit" disabled={busy}>Save description</Button></form></details>
    <Field label="Find a member"><Input aria-label="Find a member" value={query} onChange={e => setQuery(e.target.value)} /></Field>
    <fieldset disabled={busy} className="lens-fields"><legend className="sr-only">Edit membership</legend>
    {[...r.groups.map(g => ({ ...g, unassigned: false })), { id: "unassigned", label: "Unassigned", members: r.unassigned, representative: null, unassigned: true }].map(g => <section className="lens-group" key={g.id} aria-label={`Group: ${g.label}`}>
      <details open={g.unassigned || !!query}>
        <Summary>{g.label} · {g.members.length}</Summary>
        {!g.unassigned && <><label className="lens-check"><Input type="checkbox" aria-label={`Merge group ${g.label}`} checked={groupIds.includes(g.id)} onChange={() => setGroupIds(ids => ids.includes(g.id) ? ids.filter(id => id !== g.id) : [...ids, g.id])} />Select group to merge</label>
          <form key={`rename-${g.id}-${r.number}`} className="lens-actions" onSubmit={e => { e.preventDefault(); void apply({ kind: "rename", groupId: g.id, label: String(new FormData(e.currentTarget).get("label")) }); }}><Input aria-label={`Group name: ${g.label}`} name="label" required maxLength={120} defaultValue={g.label} /><Button type="submit">Rename group</Button></form>
          {!!g.members.length && <Field label={`Representative: ${g.label}`}><Select aria-label={`Representative: ${g.label}`} value={g.representative ?? ""} onChange={e => void apply({ kind: "representative", groupId: g.id, member: e.target.value })}>{g.members.map(k => <option key={k} value={k}>{byKey.get(k)!.title} · r{byKey.get(k)!.revision}</option>)}</Select></Field>}
        </>}
        {!!g.members.length && <Button onClick={() => setSelected(s => [...new Set([...s, ...g.members])])}>Select all {g.members.length} in {g.label}</Button>}
        <MemberList keys={g.members} byKey={byKey} query={query} selected={chosen} toggle={toggle} inspect={async m => { setReading(n => n + 1); try { const body = await inspect(m); setDetail({ member: m, body }); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setReading(n => n - 1); } }} />
      </details>
    </section>)}
    {(chosen.length > 0 || groupIds.length > 1) && <section aria-label="Membership actions">
      <p>{chosen.length} members selected · {groupIds.length} groups selected</p>
      {!!chosen.length && <><Field label="Move to group"><Select aria-label="Move to group" value={target} onChange={e => setTarget(e.target.value)}><option value="">Unassigned</option>{r.groups.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}</Select></Field><Button onClick={() => void apply({ kind: "move", members: chosen, groupId: r.groups.some(g => g.id === target) ? target : null })}>Move selected members</Button></>}
      <Field label="New group name"><Input aria-label="New group name" maxLength={120} value={label} onChange={e => setLabel(e.target.value)} /></Field>
      {!!chosen.length && <Button disabled={!label.trim()} onClick={() => void apply({ kind: "split", members: chosen, label })}>Create group from selected</Button>}
      {groupIds.length > 1 && <Button disabled={!label.trim()} onClick={() => void apply({ kind: "merge", groupIds, label })}>Merge {groupIds.length} complete groups</Button>}
      <Button onClick={() => { setSelected([]); setGroupIds([]); }}>Clear lens selection</Button>
    </section>}
    </fieldset>
    {reading > 0 && <LoadingStatus title="Loading member…" />}
    {detail && <section aria-label="Frozen member"><h3>{detail.member.title}</h3><p className="small-note">Source revision {detail.member.revision}{detail.member.assessmentId ? " · assessment frozen at lens creation" : ""}</p><p>{detail.member.summary}</p><div className="lens-member-body">{detail.body}</div><Button onClick={() => setDetail(undefined)}>Close member</Button></section>}
    {error && <p role="alert">{error}</p>}
    <details><Summary>Lens history</Summary><ol>{lens.revisions.map(entry => <li key={entry.number}>Revision {entry.number}: {entry.change} · {entry.members.length} members</li>)}</ol></details>
  </section>;
}
function MemberList({ keys, byKey, query, selected, toggle, inspect }: { keys: string[]; byKey: Map<string, LensMember>; query: string; selected: string[]; toggle: (key: string) => void; inspect: (member: LensMember) => void }) {
  const [limit, setLimit] = useState(20);
  const filtered = keys.filter(k => byKey.get(k)!.title.toLowerCase().includes(query.toLowerCase()));
  return <><ul className="lens-members">{filtered.slice(0, limit).map(k => { const m = byKey.get(k)!; return <li key={k}><label className="lens-member-select"><Input type="checkbox" aria-label={`Select ${m.title} revision ${m.revision}`} checked={selected.includes(k)} onChange={() => toggle(k)} /></label><Button variant="quiet" onClick={() => inspect(m)}>{m.title} · r{m.revision}</Button></li>; })}</ul>{filtered.length > limit && <Button onClick={() => setLimit(n => n + 20)}>Show more members ({filtered.length - limit} remaining)</Button>}</>;
}
