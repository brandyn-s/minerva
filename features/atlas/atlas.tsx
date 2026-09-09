"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  BaseEdge,
  getBezierPath,
  useInternalNode,
  type EdgeProps,
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  MarkerType,
  NodeResizer,
  applyNodeChanges,
  useReactFlow,
  useUpdateNodeInternals,
  type Node,
  type NodeProps,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { AtlasFixture, Thought, Relationship } from "./domain";
import type { AtlasSession, LayoutRecord } from "../workspaces/graph-domain";
import { relationshipsFor } from "./domain";
import { mallFixture } from "./fixture";
import { wanderSchema, weaveSchema, moveCardSchema, type ContextualMove, type GeneratedCard, type LiveFeature } from "./generation";
import { cardHash, validateThemes, type ThemeGroup } from "./themes";
import TalkPanel from "./talk-panel";
import DownloadButton from "./download-button";
import MovesPanel from "./moves-panel";
import ExpeditionPanel from "./expedition-panel";
import TooltipButton from "./tooltip-button";
import { overviewDiameter, overviewLabels, overviewName } from "./overview";
import ExplorationPanel, { ProposalDecisions } from "../exploration/panel";

type CardNode = Node<{ thought: Thought; geometry?: { width: number; height: number; circular: boolean } }, "thought" | "theme">;
// Keep screen-sized overview markers separated at the farthest zoom-out.
const MIN_ZOOM = 0.03;

type Panel = "expedition" | "talk" | "inspect" | "compare" | "moves" | "index" | "text" | "explore" | null;
const Interaction = createContext<{
  live?: { sources: Thought[]; feature: LiveFeature; move?: ContextualMove; error?: string };
  busy?: boolean;
  retry?: () => void;
  scalable?: boolean;
  labels?: Set<string>;
  overview: boolean;
  zoom: number;
  compact: boolean;
  selected: string[];
  inspect: (id: string) => void;
  select: (id: string) => void;
  move: (id: string) => void;
  focus: (id: string) => void;
  resize?: (id: string, size: { x: number; y: number; width: number; height: number }) => void;
}>({
  overview: false,
  zoom: 1,
  compact: false,
  selected: [],
  inspect: () => {},
  select: () => {},
  move: () => {},
  focus: () => {},
});
function ThoughtCard({ id, data }: NodeProps<CardNode>) {
  const { thought } = data;
  const ui = useContext(Interaction);
  const surface = useRef<HTMLElement>(null);
  const measuredGeometry = useRef("");
  const { updateNodeData } = useReactFlow<CardNode>();
  useLayoutEffect(() => {
    const element = surface.current;
    if (!element) return;
    const visible = ui.overview
      ? element.querySelector("button")! : element;
    const measure = () => {
      const scale = ui.overview ? ui.zoom : 1;
      const geometry = {
        width: visible.offsetWidth / scale,
        height: visible.offsetHeight / scale,
        circular: ui.overview && (ui.scalable || ui.compact),
      };
      const signature = JSON.stringify(geometry);
      if (measuredGeometry.current !== signature) {
        measuredGeometry.current = signature;
        updateNodeData(id, { geometry });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(visible);
    return () => observer.disconnect();
  }, [id, ui.overview, ui.compact, ui.zoom, ui.scalable, updateNodeData]);
  const pendingOpen = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (pendingOpen.current) clearTimeout(pendingOpen.current);
    },
    [],
  );
  const isCardSurface = (event: ReactMouseEvent) => {
    const button = (event.target as Element).closest("button");
    return !button || button.matches(".card-title,.overview-target");
  };
  function openCard(event: ReactMouseEvent) {
    if (!isCardSurface(event)) return;
    if (pendingOpen.current) clearTimeout(pendingOpen.current);
    if (event.detail === 0) ui.inspect(thought.id);
    else if (event.detail === 1) {
      // Wait briefly so a double-click can focus without an inspection overlay
      // covering the card before its second click arrives.
      pendingOpen.current = setTimeout(() => ui.inspect(thought.id), 250);
    }
  }
  function focusCard(event: ReactMouseEvent) {
    if (!isCardSurface(event)) return;
    if (pendingOpen.current) clearTimeout(pendingOpen.current);
    event.preventDefault();
    ui.focus(thought.id);
  }
  const updateNodeInternals = useUpdateNodeInternals();
  const lastGeometry = useRef({
    zoom: ui.zoom,
    overview: ui.overview,
    compact: ui.compact,
  });
  useEffect(() => {
    const previous = lastGeometry.current;
    if (
      previous.zoom !== ui.zoom ||
      previous.overview !== ui.overview ||
      previous.compact !== ui.compact
    )
      updateNodeInternals(id);
    lastGeometry.current = {
      zoom: ui.zoom,
      overview: ui.overview,
      compact: ui.compact,
    };
  }, [id, ui.zoom, ui.overview, ui.compact, updateNodeInternals]);
  const diameter = ui.scalable ? overviewDiameter(ui.zoom) : ui.compact ? 48 : 170;
  const anchorY = ui.overview ? (ui.scalable ? diameter / 2 : ui.compact ? 24 : 35) / ui.zoom : undefined;
  const marker =
    (
      {
        brief: "Seed",
        retail: "A",
        food: "B",
        tools: "C",
        repair: "B+C",
        rotation: "A.1",
      } as Record<string, string>
    )[thought.id] || thought.title.split(/\s+/).slice(0, 2).map((s) => s[0]).join("");
  const loading = !!ui.busy && !!ui.live?.sources.some((source) => source.id === id);
  return (
    <article
      ref={surface}
      aria-busy={loading}
      className={`thought ${loading ? "thought-generating" : ""} ${ui.overview ? "thought-overview" : ""} ${thought.kind} ${ui.selected.includes(thought.id) ? "chosen" : ""}`}
      onClick={openCard}
      onDoubleClick={focusCard}
      style={ui.resize && !ui.overview ? { width: "100%", minHeight: "100%" } : undefined}
    >
      {ui.resize && !ui.overview && <NodeResizer minWidth={200} minHeight={120} maxWidth={1000} maxHeight={1600}
        isVisible={ui.selected.includes(id)} onResizeEnd={(_, size) => ui.resize?.(id, size)} />}
      <Handle type="target" position={Position.Left} style={{ top: anchorY }} />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          top: anchorY,
          left: ui.overview ? diameter / ui.zoom : undefined,
        }}
      />
      {ui.overview ? (
        <TooltipButton
          aria-label={`Open ${thought.title}`}
          title="Click to open; double-click to focus; drag or use arrow keys to move"
          className={`overview-target card-grip nopan ${ui.scalable ? "scale-target" : ui.compact ? "compact-target" : ""}`}
          style={{ transform: `scale(${1 / ui.zoom})`, ...(ui.scalable ? { width: diameter, height: diameter, minHeight: diameter } : {}) }}
        >
          {ui.scalable ? <><span className="overview-code">{diameter >= 30 ? marker : ""}</span>{ui.labels?.has(id) && <span className="overview-name">{overviewName(thought)}</span>}</> : ui.compact ? marker : thought.title}
        </TooltipButton>
      ) : (
        <>
          <div className="card-top">
            <span>
              {thought.kind === "proposal" ? "Starting proposal" : thought.kind}
            </span>
            <TooltipButton
              className="card-grip"
              aria-label={`Move ${thought.title}`}
              title="Drag to move; arrow keys move the card"
            >
              ⠿
            </TooltipButton>
          </div>
          <button className="card-title nodrag">{thought.title}</button>
          <p className="card-summary">{thought.summary}</p>
          {ui.live?.sources.some((source) => source.id === id) && (
            <div className="generation-status nodrag nopan" aria-live="polite">
              {ui.busy ? <p className="generation-inline"><span className="generation-spinner" aria-hidden="true" />{ui.live.feature === "wander" ? "Wandering…" : "Weaving…"}</p> : ui.live.error && <>
                <p role="alert">{ui.live.error}</p>
                <button onClick={ui.retry}>Retry {ui.live.feature === "wander" ? "Wander" : "Weave"}</button>
              </>}
            </div>
          )}
          <div className="card-state">
            {thought.decision === "unkept draft"
              ? "○ Unkept draft"
              : thought.decision === "kept"
                ? "● Kept example"
                : thought.id === "brief"
                  ? "Shared context"
                  : "Independent starting idea"}
            {thought.evidence === "unknown" && <span>Evidence unknown</span>}
          </div>
          <div className="card-actions">
            <button
              className="nodrag nopan"
              onClick={() => ui.move(thought.id)}
            >
              Consider a move ↗
            </button>
            <button
              className="nodrag nopan select-card"
              aria-pressed={ui.selected.includes(thought.id)}
              aria-label={`Select ${thought.title}`}
              onClick={() => ui.select(thought.id)}
            >
              {ui.selected.includes(thought.id) ? "✓" : "+"}
            </button>
          </div>
        </>
      )}
    </article>
  );
}
function FloatingEdge(props: EdgeProps) {
  const source = useInternalNode<CardNode>(props.source);
  const target = useInternalNode<CardNode>(props.target);
  if (!source?.data.geometry || !target?.data.geometry) return null;
  const bounds = (node: typeof source) => ({
    ...node.data.geometry!,
    x: node.internals.positionAbsolute.x + node.data.geometry!.width / 2,
    y: node.internals.positionAbsolute.y + node.data.geometry!.height / 2,
  });
  const a = bounds(source), b = bounds(target);
  const endpoint = (from: typeof a, to: typeof a) => {
    const dx = to.x - from.x, dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const factor = from.circular
      ? from.width / 2 / length
      : 1 / Math.max(Math.abs(dx) / (from.width / 2), Math.abs(dy) / (from.height / 2), 1e-6);
    const horizontal = from.circular
      ? Math.abs(dx) >= Math.abs(dy)
      : Math.abs(dx) / from.width >= Math.abs(dy) / from.height;
    return {
      x: from.x + dx * factor,
      y: from.y + dy * factor,
      position: horizontal
        ? (dx >= 0 ? Position.Right : Position.Left)
        : (dy >= 0 ? Position.Bottom : Position.Top),
    };
  };
  const start = endpoint(a, b), end = endpoint(b, a);
  const [path, labelX, labelY] = getBezierPath({
    sourceX: start.x,
    sourceY: start.y,
    sourcePosition: start.position,
    targetX: end.x,
    targetY: end.y,
    targetPosition: end.position,
    curvature: 0.25,
  });
  return <BaseEdge id={props.id} style={props.style}
    markerStart={props.markerStart} markerEnd={props.markerEnd}
    label={props.label} labelStyle={props.labelStyle}
    labelShowBg={props.labelShowBg} labelBgStyle={props.labelBgStyle}
    labelBgPadding={props.labelBgPadding} labelBgBorderRadius={props.labelBgBorderRadius}
    interactionWidth={props.interactionWidth}
    path={path}
    labelX={labelX} labelY={labelY} />;
}
const edgeTypes = { floating: FloatingEdge };
function ThemeNode({ data }: NodeProps<CardNode>) {
  return <section className="theme-heading"><Handle type="target" position={Position.Left} /><h2>{data.thought.title}</h2><p>{data.thought.summary}</p><Handle type="source" position={Position.Right} /></section>;
}
const nodeTypes = { thought: ThoughtCard, theme: ThemeNode };
function presentNodes(saved?: AtlasFixture): CardNode[] {
  const fixture = saved ?? mallFixture();
  return fixture.thoughts.map((thought) => ({
    id: thought.id,
    type: "thought",
    data: { thought },
    position: fixture.positions[thought.id],
    dragHandle: ".card-grip",
    style: { pointerEvents: "all" },
    ariaLabel: thought.title,
  }));
}

function Studio({ session }: { session?: AtlasSession }) {
  const [savedGraph, setSavedGraph] = useState(session?.initial);
  const fixture = useMemo(() => savedGraph ?? mallFixture(), [savedGraph]);
  const [nodes, setNodes] = useState<CardNode[]>(() => presentNodes(session?.initial).map((node) => session ? {
    ...node, style: { ...node.style, width: session.initial.layouts[node.id].width, height: session.initial.layouts[node.id].height },
  } : node));
  const dirtyText = useRef(new Set<string>());
  const dirtyLayout = useRef(new Set<string>());
  const graphRef = useRef(savedGraph);
  const [layoutUndo, setLayoutUndo] = useState<{ id: string; before: LayoutRecord; after: LayoutRecord }[]>([]);
  const [layoutRedo, setLayoutRedo] = useState<typeof layoutUndo>([]);
  const [relationshipKind, setRelationshipKind] = useState<"association" | "derivation" | "recombination">("association");
  const [relationshipLabel, setRelationshipLabel] = useState("Related idea");
  const [layoutNotice, setLayoutNotice] = useState("");
  useEffect(() => session?.subscribe((graph) => {
    graphRef.current = graph;
    setSavedGraph(graph);
    setNodes((current) => {
      const byId = new Map(current.map((node) => [node.id, node]));
      return presentNodes(graph).map((node) => {
        const previous = byId.get(node.id);
        return { ...node, ...previous,
          data: dirtyText.current.has(node.id) && previous ? previous.data : node.data,
          position: (previous?.dragging || dirtyLayout.current.has(node.id)) && previous ? previous.position : node.position,
          style: { ...previous?.style, width: graph.layouts[node.id].width, height: graph.layouts[node.id].height } };
      });
    });
  }), [session]);
  async function saveLayout(id: string, position: { x: number; y: number }, size?: { width: number; height: number }, remember = true) {
    if (!session || !graphRef.current) return;
    const previous = graphRef.current.layouts[id];
    dirtyLayout.current.add(id);
    await session.command({ operation: "set-layout", ideaId: id, expectedRevision: previous.revision,
      ...position, width: size?.width ?? previous.width, height: size?.height ?? previous.height });
    dirtyLayout.current.delete(id);
    if (remember) {
      setLayoutUndo((history) => [...history.slice(-49), { id, before: previous, after: graphRef.current!.layouts[id] }]);
      setLayoutRedo([]);
    }
  }
  async function restoreLayout(redo: boolean) {
    const history = redo ? layoutRedo : layoutUndo;
    const entry = history.at(-1);
    if (!entry || !graphRef.current) return;
    const expected = redo ? entry.before : entry.after;
    const current = graphRef.current.layouts[entry.id];
    if (["x", "y", "width", "height"].some((key) => current[key as keyof LayoutRecord] !== expected[key as keyof LayoutRecord])) {
      setLayoutNotice("That card changed elsewhere. Undo will not overwrite its newer layout."); return;
    }
    const target = redo ? entry.after : entry.before;
    await saveLayout(entry.id, target, target, false);
    setNodes((nodes) => nodes.map((node) => node.id === entry.id ? { ...node, position: { x: target.x, y: target.y } } : node));
    if (redo) { setLayoutRedo(history.slice(0, -1)); setLayoutUndo((h) => [...h, entry]); }
    else { setLayoutUndo(history.slice(0, -1)); setLayoutRedo((h) => [...h, entry]); }
  }
  const stackingOrder = useRef(0);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [connectionKind, setConnectionKind] = useState("parents");
  const [connectionPage, setConnectionPage] = useState(0);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] = useState("repair");
  const [panel, setPanel] = useState<Panel>(null);
  const [moveSources, setMoveSources] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [overview, setOverview] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [query, setQuery] = useState("");
  const [compact, setCompact] = useState(false);
  const [pinching, setPinching] = useState(false);
  const field = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const restoringFocus = useRef(false);
  const flow = useReactFlow<CardNode>();
  const byId = new Map(nodes.map((n) => [n.id, n.data.thought]));
  const thought = byId.get(active)!;
  const [liveEdges, setLiveEdges] = useState<Relationship[]>([]);
  const relationships = [...fixture.relationships, ...liveEdges];
  type Perspective = "Lineage" | "Evolution" | "Constellation";
  const [perspective, setPerspective] = useState<Perspective>("Lineage");
  const perspectiveRef = useRef<Perspective>("Lineage");
  const fitPerspective = useRef(false);
  const cameras = useRef<Partial<Record<Perspective, Viewport>>>({});
  const [positions, setPositions] = useState<Record<string, Record<string, { x: number; y: number }>>>({});
  const [themeCache, setThemeCache] = useState<{ groups: ThemeGroup[]; hashes: Record<string, string>; time: string }>();
  const [themeError, setThemeError] = useState("");
  const [themeBusy, setThemeBusy] = useState(false);
  const themePending = useRef(false);
  const themeRetryFull = useRef(false);
  async function groupThemes(full = false) {
    if (themePending.current) return;
    themePending.current = true;
    setThemeBusy(true); setThemeError(""); themeRetryFull.current = full;
    try {
      const cards = nodes.map(n => n.data.thought);
      const hashes = Object.fromEntries(await Promise.all(cards.map(async c => [c.id, await cardHash(c)])));
      const missing = cards.filter(c => full || hashes[c.id] !== themeCache?.hashes[c.id]);
      if (!missing.length) return;
      const existingGroups = full ? [] : themeCache?.groups.map(g => g.name) ?? [];
      const response = await fetch("/api/themes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cards: missing.map(({ id, title, body }) => ({ id, title, body })), existingGroups }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || response.statusText);
      const incoming = validateThemes(result, missing.map(c => c.id), existingGroups);
      const changed = new Set(missing.map(c => c.id));
      const groups = full ? [] : (themeCache?.groups ?? []).map(g => ({ ...g, memberIds: g.memberIds.filter(id => hashes[id] && !changed.has(id)) }));
      for (const group of incoming) {
        const previous = groups.find(g => g.name === group.name);
        if (previous) previous.memberIds.push(...group.memberIds);
        else groups.push(group);
      }
      setThemeCache({ groups: groups.filter(g => g.memberIds.length), hashes, time: new Date().toLocaleTimeString() });
      setPositions(current => ({ ...current, Constellation: {} }));
      if (perspectiveRef.current === "Constellation") fitPerspective.current = true;
    } catch (error) { setThemeError(error instanceof Error ? error.message : String(error)); }
    finally { themePending.current = false; setThemeBusy(false); }
  }
  function switchPerspective(next: Perspective) {
    if (next === perspective) return;
    cameras.current[perspective] = flow.getViewport();
    perspectiveRef.current = next;
    setPerspective(next);
    if (cameras.current[next]) void flow.setViewport(cameras.current[next]!);
    else fitPerspective.current = true;
    if (next === "Constellation") void groupThemes();
  }
  const depths = new Map<string, number>();
  function depth(id: string, visiting = new Set<string>()): number {
    if (depths.has(id)) return depths.get(id)!;
    if (visiting.has(id)) return 0;
    const card = byId.get(id);
    const parents = relationships.filter(e => e.to === id && (e.kind === "derivation" || e.kind === "recombination"));
    const result = card?.kind === "brief" ? 0 : parents.length ? 1 + Math.max(...parents.map(e => depth(e.from, new Set([...visiting, id])))) : 1;
    depths.set(id, result); return result;
  }
  const rows = new Map<number, number>();
  const groups = themeCache?.groups ?? [];
  const groupFor = new Map(groups.flatMap((g, i) => g.memberIds.map(id => [id, i] as const)));
  let ungrouped = 0;
  const renderedNodes = nodes.map<CardNode>((n) => {
    let position = n.position;
    if (perspective === "Evolution") {
      const column = depth(n.id), row = rows.get(column) ?? 0;
      rows.set(column, row + 1); position = { x: column * 440, y: row * 480 };
    } else if (perspective === "Constellation") {
      const group = groupFor.get(n.id);
      const row = group === undefined ? ungrouped++ : groups[group].memberIds.indexOf(n.id);
      position = { x: (group ?? groups.length) * 760, y: 160 + row * 480 };
    }
    return { ...n, position: perspective === "Lineage" ? position : positions[perspective]?.[n.id] ?? position, style: { ...n.style, pointerEvents: overview ? "none" : "all" } };
  });
  const themeNodes: CardNode[] = perspective === "Constellation" ? groups.map((g, i) => ({ id: `theme-${i}`, type: "theme", position: { x: i * 760, y: -70 }, width: 440, height: 140, measured: { width: 440, height: 140 }, style: { width: 440, height: 140 }, draggable: false, data: { thought: { ...thought, title: g.name, summary: g.reason } } })) : [];
  useLayoutEffect(() => {
    if (!fitPerspective.current || (perspective === "Constellation" && !themeCache)) return;
    fitPerspective.current = false;
    const all = [...renderedNodes, ...themeNodes];
    const x = Math.min(...all.map(n => n.position.x)), y = Math.min(...all.map(n => n.position.y));
    void flow.fitBounds({ x, y, width: Math.max(...all.map(n => n.position.x + 440)) - x, height: Math.max(...all.map(n => n.position.y + 300)) - y }, { padding: .2 });
  });
  const [live, setLive] = useState<{ sources: Thought[]; feature: LiveFeature; move?: ContextualMove; error?: string }>();
  const [busy, setBusy] = useState(false);
  const generating = useRef(false);
  const focusedRelations = focusedId ? relationshipsFor(focusedId, relationships).filter(e => connectionKind === "associations" ? e.kind === "association" : connectionKind === "context" ? e.kind === "context" : e.kind !== "association" && e.kind !== "context" && e.direction === (connectionKind === "parents" ? "incoming" : "outgoing")) : [];
  const relationPage = focusedRelations.slice(connectionPage * 6, connectionPage * 6 + 6);
  const highlighted = new Set((branchId ? relationPage.filter(e => e.id === branchId) : relationPage).map(e => e.id));
  const labels = overviewLabels(renderedNodes, viewport, [...(focusedId ? [focusedId] : []), ...selected]);
  const edges = relationships.filter(edge => perspective !== "Constellation" || (edge.kind === "association" && groupFor.has(edge.from) && groupFor.has(edge.to) && groupFor.get(edge.from) !== groupFor.get(edge.to))).map((edge) => ({
    id: edge.id,
    source: perspective === "Constellation" ? `theme-${groupFor.get(edge.from)}` : edge.from,
    target: perspective === "Constellation" ? `theme-${groupFor.get(edge.to)}` : edge.to,
    type: perspective === "Constellation" ? "default" : "floating",
    label: overview || (!session && focusedId && !highlighted.has(edge.id)) ? undefined : edge.label,
    markerEnd:
      edge.kind === "association" || edge.kind === "context"
        ? undefined
        : {
            type: MarkerType.ArrowClosed,
            color: "#28686a",
            markerUnits: "userSpaceOnUse",
            width: (overview && !session ? 10 : 16) / viewport.zoom,
            height: (overview && !session ? 10 : 16) / viewport.zoom,
          },
    className: `thread ${edge.kind} ${panel === "inspect" && (edge.from === active || edge.to === active) ? "emphasized" : ""}`,
    style: {
      opacity: perspective === "Constellation" ? 1 : session ? 1 : edge.kind === "association" && !highlighted.has(edge.id) ? .08 : focusedId ? (highlighted.has(edge.id) ? 1 : .12) : overview ? .7 : 1,
      stroke:
        edge.kind === "association"
          ? "#755584"
          : edge.kind === "context"
            ? "#645f51"
            : "#28686a",
      strokeWidth:
        (!session && overview ? (highlighted.has(edge.id) ? 2 : 1) : panel === "inspect" && (edge.from === active || edge.to === active)
          ? 3
          : edge.kind === "recombination"
            ? 2.5
            : 2) / viewport.zoom,
      strokeDasharray:
        edge.kind === "association"
          ? `${7 / viewport.zoom} ${5 / viewport.zoom}`
          : edge.kind === "context"
            ? `${3 / viewport.zoom} ${5 / viewport.zoom}`
            : undefined,
    },
  }));
  async function generate(feature: LiveFeature, sources: Thought[], contextualMove?: ContextualMove) {
    if (session || generating.current || (feature === "wander" ? sources.length !== 1 : sources.length < 2)) return;
    generating.current = true;
    setBusy(true);
    setLive({ feature, sources, move: contextualMove });
    if (!contextualMove) focus(sources[0].id);
    try {
      const response = await fetch(`/api/${feature}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feature === "wander" ? { id: sources[0].id, title: sources[0].title, summary: sources[0].summary, body: sources[0].body, intent: contextualMove ? "move" : "wander", move: contextualMove } : sources),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || response.statusText);
      let cards: GeneratedCard[];
      let contributions: string[] = [];
      if (feature === "wander") cards = (contextualMove ? moveCardSchema : wanderSchema).parse(result).cards;
      else {
        const parsed = weaveSchema(sources.length).parse(result);
        cards = [parsed.card];
        contributions = parsed.contributions;
      }
      const existing = nodes;
      const parentNodes = existing.filter((node) => sources.some((source) => source.id === node.id));
      let x = Math.max(...parentNodes.map((node) => node.position.x + (node.measured?.width ?? 290))) + 90;
      const y = Math.min(...parentNodes.map((node) => node.position.y)) - (cards.length - 1) * 190;
      // Use the next free column beside the parents, including earlier results.
      const height = cards.length * 380;
      while (existing.some((node) => node.position.x < x + 290 && node.position.x + (node.measured?.width ?? 290) > x &&
        node.position.y < y + height && node.position.y + (node.measured?.height ?? 300) > y)) x += 380;
      const added = cards.map<CardNode>((card, index) => {
        const id = crypto.randomUUID();
        return {
          id, type: "thought", position: { x, y: y + index * 380 }, dragHandle: ".card-grip", ariaLabel: card.title,
          data: { thought: { ...card, id, revision: 1,
            kind: feature === "wander" ? "exploration" : "recombination",
            decision: "unkept draft", evidence: "unknown",
            provenance: { feature: contextualMove?.title ?? (feature === "wander" ? "Wander" : "Weave"), tag: `feature:${feature}`, sourceTitles: sources.map(s => s.title), moveTitle: contextualMove?.title },
            contribution: feature === "wander" ? `Derived from ${sources[0].title}.` : contributions.join(" "),
            move: { title: "Explore this direction", question: "Where could this idea lead?", preview: card.summary },
          } },
        };
      });
      setNodes((current) => [...current, ...added]);
      setLiveEdges((current) => [...current, ...added.flatMap((node) => sources.map((source, index) => ({
        id: `${source.id}-${node.id}`, from: source.id, to: node.id,
        kind: feature === "wander" ? "derivation" as const : "recombination" as const,
        label: contextualMove?.title ?? (feature === "wander" ? "Wander" : "Weave"), sourceRevision: source.revision,
        contribution: feature === "weave" ? contributions[index] : `Derived from ${source.title}.`,
      })))]);
      setLive(undefined);
      setPanel(null);
      setSelected(added.map((node) => node.id));
      requestAnimationFrame(() => requestAnimationFrame(() => {
        void flow.fitView({ nodes: [...parentNodes, ...added], padding: 0.2, minZoom: 0.73, maxZoom: 1 });
      }));
    } catch (error) {
      setLive({ feature, sources, move: contextualMove, error: error instanceof Error ? error.message : String(error) });
      if (!contextualMove) focus(sources[0].id);
    } finally {
      generating.current = false;
      setBusy(false);
    }
  }
  function addExpeditionCard(card: GeneratedCard, parent: Thought, step: number, rationale: string): Thought {
    const id = crypto.randomUUID();
    const thought: Thought = { ...card, id, revision: 1, kind: "exploration", decision: "unkept draft", evidence: "unknown",
      contribution: rationale, provenance: { feature: `Expedition · step ${step}`, tag: "feature:expedition", sourceTitles: [parent.title] },
      move: { title: "Explore this direction", question: "Where could this idea lead?", preview: card.summary } };
    setNodes(current => {
      const origin = current.find(n => n.id === parent.id)!;
      let x = origin.position.x + 530;
      const y = origin.position.y;
      while (current.some(n => n.position.x < x + 440 && n.position.x + (n.measured?.width ?? 440) > x && n.position.y < y + 380 && n.position.y + (n.measured?.height ?? 380) > y)) x += 530;
      return [...current, { id, type: "thought", position: { x, y }, dragHandle: ".card-grip", ariaLabel: card.title, data: { thought } }];
    });
    setLiveEdges(current => [...current, { id: `${parent.id}-${id}`, from: parent.id, to: id, kind: "derivation", label: `Expedition · step ${step}`, sourceRevision: parent.revision, contribution: rationale }]);
    return thought;
  }
  function fit() {
    void flow.fitView({
      padding: 0.18,
      maxZoom: 1,
      nodes: [...renderedNodes, ...themeNodes].filter((n) => !n.hidden).map((n) => ({ id: n.id })),
    });
  }
  function open(next: Panel) {
    if (!panel) returnFocus.current = document.activeElement as HTMLElement;
    setPanel(next);
    setPreview(false);
  }
  function close() {
    setPanel(null);
    restoringFocus.current = true;
    returnFocus.current?.focus({ preventScroll: true });
    restoringFocus.current = false;
  }
  function bringForward(id: string) {
    const zIndex = ++stackingOrder.current;
    setNodes((current) =>
      current.map((n) => (n.id === id ? { ...n, zIndex } : n)),
    );
  }
  function inspect(id: string) {
    if (!byId.has(id)) return;
    bringForward(id);
    setActive(id);
    open("inspect");
  }
  function select(id: string) {
    if (!session) { setFocusedId(id); setConnectionPage(0); setBranchId(null); }
    bringForward(id);
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
  }
  function focus(id: string) {
    if (!session) { setFocusedId(id); setConnectionPage(0); setBranchId(null); }
    bringForward(id);
    const node = flow.getNode(id);
    if (node) {
      const bounds = field.current?.getBoundingClientRect();
      // Reserve space below the readable card for mobile connection navigation.
      const offsetY = !session && bounds && bounds.width <= 600 ? Math.max(0, bounds.height / 2 - 220) : 0;
      void flow.setCenter(node.position.x + 145, node.position.y + 130 + offsetY, { zoom: 1 });
    }
    setActive(id);
    setPanel(null);
    requestAnimationFrame(() =>
      field.current
        ?.querySelector<HTMLButtonElement>(`[data-id="${id}"] .card-title`)
        ?.focus(),
    );
  }
  function move(ids: string[]) {
    if (!session) setSelected(ids);
    setMoveSources(ids);
    open("moves");
  }
  useEffect(() => {
    if (panel) panelRef.current?.focus();
  }, [panel]);

  // Capture multi-touch before node controls or the renderer can interpret it as a drag/tap.
  // A fresh pointer contact or keyboard activation always remains usable after a gesture.
  useEffect(() => {
    const element = field.current;
    if (!element) return;
    let pinch: {
      distance: number;
      x: number;
      y: number;
      viewport: Viewport;
    } | null = null;
    let gestured = false;
    let suppressClick = false;
    let pan: {
      x: number;
      y: number;
      viewport: Viewport;
      moved: boolean;
    } | null = null;
    const canPanCard = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest(".thought") &&
      (!target.closest("button") || !!target.closest(".card-title"));
    const panTo = (x: number, y: number) => {
      if (!pan) return;
      const dx = x - pan.x,
        dy = y - pan.y;
      if (Math.hypot(dx, dy) > 5) pan.moved = true;
      if (pan.moved)
        void flow.setViewport({
          ...pan.viewport,
          x: pan.viewport.x + dx,
          y: pan.viewport.y + dy,
        });
    };
    const mouseStart = (event: MouseEvent) => {
      if (event.button !== 0 || !canPanCard(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      pan = {
        x: event.clientX,
        y: event.clientY,
        viewport: flow.getViewport(),
        moved: false,
      };
    };
    const mouseMove = (event: MouseEvent) => {
      if (pan) {
        event.preventDefault();
        panTo(event.clientX, event.clientY);
      }
    };
    const mouseEnd = () => {
      if (pan?.moved) suppressClick = true;
      pan = null;
    };
    const point = (touches: TouchList) => {
      const rect = element.getBoundingClientRect();
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
        y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
        distance: Math.hypot(
          touches[0].clientX - touches[1].clientX,
          touches[0].clientY - touches[1].clientY,
        ),
      };
    };
    const start = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        suppressClick = false;
        gestured = false;
        if (canPanCard(event.target)) {
          pan = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
            viewport: flow.getViewport(),
            moved: false,
          };
          event.stopPropagation();
        }
      }
      if (event.touches.length >= 2) {
        pan = null;
        const p = point(event.touches);
        pinch = { ...p, viewport: flow.getViewport() };
        gestured = true;
        suppressClick = true;
        setPinching(true);
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const moving = (event: TouchEvent) => {
      if (!gestured) {
        if (pan && event.touches.length === 1) {
          panTo(event.touches[0].clientX, event.touches[0].clientY);
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (pinch && event.touches.length >= 2) {
        const p = point(event.touches);
        const z = Math.max(
          session ? .24 : MIN_ZOOM,
          Math.min(
            1.6,
            (pinch.viewport.zoom * p.distance) / Math.max(1, pinch.distance),
          ),
        );
        void flow.setViewport({
          zoom: z,
          x: p.x - ((pinch.x - pinch.viewport.x) * z) / pinch.viewport.zoom,
          y: p.y - ((pinch.y - pinch.viewport.y) * z) / pinch.viewport.zoom,
        });
      }
    };
    const end = (event: TouchEvent) => {
      if (gestured || pan?.moved) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick = true;
      }
      pan = null;
      if (event.touches.length === 0) {
        pinch = null;
        gestured = false;
        setPinching(false);
      }
    };
    const click = (event: MouseEvent) => {
      if (suppressClick && event.detail !== 0) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
      }
    };
    const down = () => {
      suppressClick = false;
    };
    element.addEventListener("mousedown", mouseStart, true);
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", mouseEnd);
    element.addEventListener("touchstart", start, {
      capture: true,
      passive: false,
    });
    element.addEventListener("touchmove", moving, {
      capture: true,
      passive: false,
    });
    element.addEventListener("touchend", end, {
      capture: true,
      passive: false,
    });
    element.addEventListener("touchcancel", end, {
      capture: true,
      passive: false,
    });
    element.addEventListener("click", click, true);
    element.addEventListener("pointerdown", down, true);
    return () => {
      element.removeEventListener("mousedown", mouseStart, true);
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", mouseEnd);
      element.removeEventListener("touchstart", start, true);
      element.removeEventListener("touchmove", moving, true);
      element.removeEventListener("touchend", end, true);
      element.removeEventListener("touchcancel", end, true);
      element.removeEventListener("click", click, true);
      element.removeEventListener("pointerdown", down, true);
    };
  }, [flow, session]);
  return (
    <main className={`studio ${session ? "" : "scalable-atlas"}`}>
      <a className="skip-link" href="#atlas-tools">
        Skip to atlas controls
      </a>
      <header className="masthead">
        <div className="brand">
          <Image className="brand-owl" src="/images/owl-engraved.png" alt="" width={35} height={35} sizes="35px" />
          <span>Minerva</span>
          <Link href="/workspaces">Workspaces</Link>
        </div>
        <div className="workspace-heading">
          <span className="instrument-label">Studio / {perspective}</span>
          <h1>{session ? "Saved idea atlas" : "The mall, reconsidered"}</h1>
        </div>
        {!session && <nav className="perspective-switch" aria-label="Atlas perspective">{(["Lineage", "Evolution", "Constellation"] as const).map(view => <button key={view} aria-pressed={perspective === view} onClick={() => switchPerspective(view)}>{view}</button>)}</nav>}
      </header>
      <div
        className="field"
        ref={field}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "0") fit();
          else if (event.key === "+" || event.key === "=") void flow.zoomIn();
          else if (event.key === "-") void flow.zoomOut();
          else return;
          event.preventDefault();
        }}
        role="region"
        aria-label="Idea atlas"
        onPointerDownCapture={(event) => {
          const id = (event.target as Element)
            .closest(".react-flow__node")
            ?.getAttribute("data-id");
          if (id) bringForward(id);
        }}
        onFocusCapture={(event) => {
          if (restoringFocus.current) return;
          const id = (event.target as Element)
            .closest(".react-flow__node")
            ?.getAttribute("data-id");
          if (id) bringForward(id);
        }}
      >
        <Interaction.Provider
          value={{
            live,
            busy,
            retry: () => { if (live) void generate(live.feature, live.sources, live.move); },
            scalable: !session,
            labels,
            overview,
            compact,
            zoom: viewport.zoom,
            selected,
            inspect,
            select,
            move: (id) => move([id]),
            focus,
            resize: session ? (id, size) => { void saveLayout(id, size, size).catch(() => {}); } : undefined,
          }}
        >
          <ReactFlow<CardNode>
            nodes={[...renderedNodes, ...themeNodes]}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={(changes) => {
              if (perspective !== "Lineage") setPositions(current => ({ ...current, [perspective]: { ...current[perspective], ...Object.fromEntries(changes.filter(c => c.type === "position" && c.position).map(c => ["id" in c ? c.id : "", c.type === "position" ? c.position! : { x: 0, y: 0 }])) } }));
              // React Flow's geometry updates replace the rendered node, whose position
              // belongs to this view. Keep those updates from overwriting Lineage.
              setNodes((current) => applyNodeChanges(changes.filter(c => (!("id" in c) || !c.id.startsWith("theme-")) && (perspective === "Lineage" || c.type !== "position")).map(c => c.type === "replace" ? { ...c, item: { ...c.item, position: current.find(n => n.id === c.id)?.position ?? c.item.position } } : c), current));
            }}
            onNodeDragStop={(_, node) => { void saveLayout(node.id, node.position).catch(() => {}); }}
            fitView={!savedGraph?.viewpoint.revision}
            defaultViewport={session?.initial.viewpoint}
            fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
            minZoom={session ? .24 : MIN_ZOOM}
            maxZoom={1.6}
            nodesConnectable={false}
            nodesFocusable={false}
            nodesDraggable={!pinching}
            nodeDragThreshold={5}
            autoPanOnNodeDrag={false}
            elementsSelectable={false}
            noPanClassName="nopan"
            zoomOnDoubleClick={false}
            onMove={(_, next) => {
              setViewport(next);
              setOverview((current) =>
                current ? next.zoom < 0.72 : next.zoom < 0.62,
              );
              setCompact((current) =>
                current ? next.zoom < 0.5 : next.zoom < 0.45,
              );
            }}
            onKeyDown={(event) => {
              if (
                (event.target as HTMLElement).closest("button,input,textarea")
              ) {
                if (
                  (event.target as HTMLElement).classList.contains(
                    "card-grip",
                  ) &&
                  event.key.startsWith("Arrow")
                ) {
                  event.preventDefault();
                  const id = (event.target as HTMLElement)
                    .closest("[data-id]")
                    ?.getAttribute("data-id");
                  if (perspective !== "Lineage") {
                    const node = renderedNodes.find(n => n.id === id);
                    if (node) setPositions(current => ({ ...current, [perspective]: { ...current[perspective], [node.id]: { x: node.position.x + (event.key === "ArrowRight" ? 25 : event.key === "ArrowLeft" ? -25 : 0), y: node.position.y + (event.key === "ArrowDown" ? 25 : event.key === "ArrowUp" ? -25 : 0) } } }));
                    return;
                  }
                  const moved = nodes.find((n) => n.id === id);
                  if (moved) void saveLayout(moved.id, {
                    x: moved.position.x + (event.key === "ArrowRight" ? 25 : event.key === "ArrowLeft" ? -25 : 0),
                    y: moved.position.y + (event.key === "ArrowDown" ? 25 : event.key === "ArrowUp" ? -25 : 0),
                  }).catch(() => {});
                  setNodes((current) =>
                    current.map((n) =>
                      n.id === id
                        ? {
                            ...n,
                            position: {
                              x:
                                n.position.x +
                                (event.key === "ArrowRight"
                                  ? 25
                                  : event.key === "ArrowLeft"
                                    ? -25
                                    : 0),
                              y:
                                n.position.y +
                                (event.key === "ArrowDown"
                                  ? 25
                                  : event.key === "ArrowUp"
                                    ? -25
                                    : 0),
                            },
                          }
                        : n,
                    ),
                  );
                }
                return;
              }
              if (event.key.startsWith("Arrow")) {
                event.preventDefault();
                void flow.setViewport({
                  ...viewport,
                  x:
                    viewport.x +
                    (event.key === "ArrowRight"
                      ? -80
                      : event.key === "ArrowLeft"
                        ? 80
                        : 0),
                  y:
                    viewport.y +
                    (event.key === "ArrowDown"
                      ? -80
                      : event.key === "ArrowUp"
                        ? 80
                        : 0),
                });
              }
            }}
          />
        </Interaction.Provider>
        <nav
          className="field-tools"
          id="atlas-tools"
          aria-label="Atlas controls"
        >
          <button onClick={() => open("index")}>
            Thoughts <span>{nodes.length}</span>
          </button>
          <button onClick={() => open("text")}>Read as text</button>
          {!session && <TooltipButton className="expedition-control" aria-label="Expedition panel" title="Open expedition panel" aria-haspopup="dialog" aria-expanded={panel === "expedition"} onClick={() => open("expedition")}><Image src="/images/expedition-compass.png" width={44} height={44} alt="" /></TooltipButton>}

          {session && <>
            <button onClick={() => { void session.command({ operation: "seed-mall" }).catch(() => {}); }} disabled={nodes.length > 0}>Load prepared mall</button>
            <button onClick={() => { void session.command({ operation: "create-idea", ideaId: crypto.randomUUID(), title: "New idea", body: "Write your idea here." }).catch(() => {}); }}>New idea</button>
            <button onClick={() => { void session.command({ operation: "set-viewpoint", expectedRevision: savedGraph!.viewpoint.revision, ...viewport }).catch(() => {}); }}>Save view</button>
            <button onClick={() => open("explore")}>Develop alternatives</button>
            <details className="layout-menu"><summary>Layout</summary>
              <p>Undo/redo covers the last 50 card positions and sizes in this session, one card at a time.</p>
              <button disabled={!layoutUndo.length} onClick={() => { void restoreLayout(false).catch(() => {}); }}>Undo layout</button>
              <button disabled={!layoutRedo.length} onClick={() => { void restoreLayout(true).catch(() => {}); }}>Redo layout</button>
              <button onClick={() => { void (async () => {
                for (const [index, node] of nodes.entries()) await saveLayout(node.id, { x: (index % 3) * 440, y: Math.floor(index / 3) * 380 });
              })().catch(() => {}); }}>Arrange grid</button>
              <button onClick={() => { void (async () => {
                for (const node of nodes) if (session.initial.layouts[node.id]) await saveLayout(node.id, session.initial.layouts[node.id], session.initial.layouts[node.id]);
              })().catch(() => {}); }}>Reset to opened layout</button>
              {layoutNotice && <p role="status">{layoutNotice}</p>}
            </details>
          </>}
        </nav>
        {!session && focusedId && <section className="focus-navigation" aria-label="Focused card connections">
          <div className="focus-heading"><strong>{byId.get(focusedId)?.title}</strong><button aria-label="Close focused connections" onClick={() => setFocusedId(null)}>×</button></div>
          <button onClick={() => focus(focusedId)}>Focus card</button>
          <label>Show connections <select value={connectionKind} onChange={e => { setConnectionKind(e.target.value); setConnectionPage(0); setBranchId(null); }}>
            <option value="parents">Parents</option><option value="children">Children</option><option value="associations">Associations</option><option value="context">Shared brief</option>
          </select></label>
          <p className="small-note">{focusedRelations.length} connections · up to 6 shown at a time. Follow a link to bring that card into view.</p>
          <ul>{relationPage.map(edge => <li key={edge.id}><button className="relative-link" onClick={() => focus(edge.otherId)}>{byId.get(edge.otherId)?.title} ↗</button><button aria-label={`Highlight only ${byId.get(edge.otherId)?.title}`} aria-pressed={branchId === edge.id} onClick={() => setBranchId(branchId === edge.id ? null : edge.id)}>Trace</button></li>)}</ul>
          {focusedRelations.length > 6 && <div><button disabled={!connectionPage} onClick={() => { setConnectionPage(p => p - 1); setBranchId(null); }}>Previous connections</button><button disabled={(connectionPage + 1) * 6 >= focusedRelations.length} onClick={() => { setConnectionPage(p => p + 1); setBranchId(null); }}>Next connections</button></div>}
        </section>}
        {perspective === "Constellation" && <section className="themes-status" aria-label="Theme grouping">
          <p>{themeCache ? `Grouped into themes by Minerva · grouped at ${themeCache.time}` : "Group cards into themes by Minerva"}</p>
          {themeBusy && <p role="status">Grouping themes…</p>}
          {themeError && <><p role="alert">{themeError}</p><button disabled={themeBusy} onClick={() => void groupThemes(themeRetryFull.current)}>Retry</button></>}
          <button disabled={themeBusy} onClick={() => void groupThemes(true)}>Regroup</button>
        </section>}
        <div className="legend" hidden={perspective === "Constellation"}>
          <span>
            <i className="legend-line inheritance" aria-hidden="true" />
            Inheritance
          </span>
          <span>
            <i className="legend-line context" aria-hidden="true" />
            Shared brief
          </span>
          <span>
            <i className="legend-line association" aria-hidden="true" />
            Association
          </span>
        </div>
        <div role="status" aria-live="polite" aria-atomic="true">
          {busy && live && <div className="generation-progress">
            <span className="generation-spinner" aria-hidden="true" />
            <div>
              <strong>{live.feature === "wander" ? "Wander is generating new cards…" : "Weave is combining your cards…"}</strong>
              <span>You can keep exploring the atlas.</span>
            </div>
          </div>}
        </div>
        {selected.length > 0 && (
          <div className="selection-bar">
            <span>{selected.length} selected</span>
            <button onClick={() => open("compare")}>Compare</button>
            {session ? <button onClick={() => move(selected)}>Weave · preview</button> : <>
              <button disabled={busy || selected.length !== 1} onClick={() => void generate("wander", selected.map((id) => byId.get(id)!))} aria-busy={busy && live?.feature === "wander"}>{busy && live?.feature === "wander" && <span className="generation-spinner" aria-hidden="true" />}{busy && live?.feature === "wander" ? "Wandering…" : "Wander"}</button>
              <button disabled={selected.length !== 1} onClick={() => open("expedition")}>Expedition</button>
              <button disabled={busy || selected.length < 2} onClick={() => void generate("weave", selected.map((id) => byId.get(id)!))} aria-busy={busy && live?.feature === "weave"}>{busy && live?.feature === "weave" && <span className="generation-spinner" aria-hidden="true" />}{busy && live?.feature === "weave" ? "Weaving…" : "Weave"}</button>
            </>}
            {session && selected.length === 2 && <details className="layout-menu"><summary>Connect selected</summary>
              <p>From {byId.get(selected[0])?.title} to {byId.get(selected[1])?.title}</p>
              <label>Relationship<select value={relationshipKind} onChange={(e) => setRelationshipKind(e.target.value as typeof relationshipKind)}>
                <option value="association">Semantic association</option><option value="derivation">Derivation</option><option value="recombination">Recombination parent</option>
              </select></label>
              <label>Contribution or link label<input maxLength={200} value={relationshipLabel} onChange={(e) => setRelationshipLabel(e.target.value)} /></label>
              <button onClick={() => { void session.command({ operation: "connect-ideas", edgeId: crypto.randomUUID(), from: selected[0], to: selected[1],
                sourceRevision: byId.get(selected[0])!.revision, targetRevision: byId.get(selected[1])!.revision,
                kind: relationshipKind, label: relationshipLabel, contribution: relationshipLabel }).catch(() => {}); }}>Save relationship</button>
            </details>}
            <button
              aria-label="Clear selection"
              onClick={() => { setSelected([]); setFocusedId(null); }}
            >
              ×
            </button>
          </div>
        )}
        <div className="field-footer">
          <div className="zoom-controls">
            <button aria-label="Zoom out" onClick={() => void flow.zoomOut()}>
              −
            </button>
            <output aria-label="Zoom level">
              {Math.round(viewport.zoom * 100)}%
            </output>
            <button aria-label="Zoom in" onClick={() => void flow.zoomIn()}>
              +
            </button>
            <button onClick={fit}>Fit</button>
          </div>
        </div>
      </div>
      {!session && <button className={`minerva-launcher${selected.length ? " has-selection" : ""}`} aria-label="Talk to Minerva" aria-haspopup="dialog" aria-expanded={panel === "talk"} aria-controls="minerva-talk" onClick={() => open("talk")}>
        <Image src="/images/minerva-engraved-cameo.png" alt="" width={64} height={64} sizes="64px" />
        <span className="minerva-launcher-label" aria-hidden="true">Talk to Minerva</span>
      </button>}
      {!session && <TalkPanel open={panel === "talk"} close={close} selectedIds={selected} cards={nodes.map(({ id, data }) => ({ ...data.thought, relationships: relationshipsFor(id, relationships) }))} />}
      {!session && <ExpeditionPanel open={panel === "expedition"} close={close} source={selected.length === 1 ? byId.get(selected[0]) : undefined}
        cards={nodes.map(n => n.data.thought)} add={addExpeditionCard} focus={id => { focus(id); setPanel("expedition"); }} />}
      {panel && panel !== "talk" && panel !== "expedition" && (
        <aside
          ref={panelRef}
          tabIndex={-1}
          className={`detail-panel ${panel === "compare" || panel === "text" ? "wide-panel" : ""}`}
          role="dialog"
          aria-modal="false"
          aria-label={
            panel === "inspect"
              ? thought.title
              : panel === "moves"
                ? "Contextual moves"
                : panel === "index"
                  ? "Thought index"
                  : panel === "compare"
                    ? "Compare selected thoughts"
                    : "Prepared study as text"
          }
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
        >
          <div className="panel-heading">
            <span className="instrument-label">
              {panel === "inspect"
                ? "Thought / source material"
                : panel === "moves"
                  ? (session ? "Prepared move / no model call" : "Consider a move")
                  : panel === "text"
                    ? "Same material / text reference"
                    : panel === "index"
                      ? "Find your place"
                      : "Selected contributions"}
            </span>
            <button aria-label="Close panel" onClick={close}>
              ×
            </button>
          </div>
          {panel === "explore" && session && <ExplorationPanel workspaceId={savedGraph!.workspaceId}
            sources={selected.map((id) => byId.get(id)!).filter(Boolean)} inspect={inspect} />}
          {panel === "inspect" && (
            <>
              <h2>{thought.title}</h2>
              {!session && <DownloadButton key={thought.id} card={thought} cards={nodes.map((node) => node.data.thought)} relationships={relationships} />}
              <div className="status-line">
                <span>{thought.decision}</span>
                <span>Evidence: {thought.evidence}</span>
              </div>
              <p className="body-copy">{thought.body}</p>
              {thought.generation && <details><summary>Generation context and mechanism</summary>
                <p>{thought.generation.mechanism}</p>
                <p>Prerequisites: {thought.generation.prerequisites.join("; ")}</p>
                <p>Uncertainties: {thought.generation.uncertainties.join("; ")}</p>
                <p>Requested: {thought.generation.requestedChange}</p>
                <p>Observed: {thought.generation.observedChange}</p>
                <p className="small-note">Original generation · {thought.generation.model} · input {thought.generation.manifestId}</p>
              </details>}
              {thought.assessment && <details><summary>Assessment of this revision</summary>
                <p>{thought.assessment.goalFidelity}</p><p>{thought.assessment.constraints}</p>
                <p>{thought.assessment.causalDependencies}</p><p>{thought.assessment.transformation}</p>
                <p>Model assessment; real-world feasibility remains unverified.</p>
              </details>}
              {!session && relationships.some(e => e.to === active && (e.kind === "derivation" || e.kind === "recombination")) && <section aria-label="Inheritance"><h3>Inheritance</h3>{relationships.filter(e => e.to === active && (e.kind === "derivation" || e.kind === "recombination")).map(e => <div key={e.id}><h4>{byId.get(e.from)?.title ?? e.from}</h4><p>{e.contribution || "Not specified"}</p>{thought.provenance?.moveTitle && <p>Move: {thought.provenance.moveTitle}</p>}</div>)}</section>}
              {!session && thought.provenance && <section aria-label="Provenance"><h3>Provenance</h3><p>{thought.provenance.feature} · {thought.provenance.tag}</p><p>Sources at generation: {thought.provenance.sourceTitles.join("; ")}</p></section>}
              <h3>Contribution</h3>
              <p>{thought.contribution}</p>
              {session && thought.kind !== "brief" && <ProposalDecisions key={`${thought.id}-${thought.revision}`} workspaceId={savedGraph!.workspaceId} thought={thought} />}
              <div className="panel-actions">
                <button
                  onClick={() => select(active)}
                  aria-pressed={selected.includes(active)}
                >
                  {selected.includes(active)
                    ? "Remove from selection"
                    : "Select for comparison"}
                </button>
                <button onClick={() => move([active])}>Consider a move</button>
                <button onClick={() => focus(active)}>Focus on atlas ↗</button>
              </div>
              <h3>Relationships</h3>
              <p className="small-note">
                Shared brief is context, not parentage. Associations do not
                establish inheritance.
              </p>
              <ul className="relationship-list">
                {relationshipsFor(active, relationships).map((edge) => (
                  <li key={edge.id}>
                    <span className="instrument-label">
                      {edge.direction} / {edge.kind}
                    </span>
                    <button onClick={() => inspect(edge.otherId)}>
                      {byId.get(edge.otherId)?.title}{" "}
                      {edge.direction === "incoming" ? "←" : "→"}
                    </button>
                    <p>
                      {edge.label}
                      {edge.kind !== "association" && edge.kind !== "context"
                        ? ` · source revision ${edge.sourceRevision}`
                        : ""}
                    </p>
                    {edge.contribution && (
                      <blockquote>{edge.contribution}</blockquote>
                    )}
                    {savedGraph && <details><summary>Exact source revision {edge.sourceRevision}</summary>
                      <p>{savedGraph.revisions.find((r) => r.id === edge.from && r.revision === edge.sourceRevision)?.body ?? "Source revision unavailable"}</p>
                    </details>}
                  </li>
                ))}
              </ul>
              <details>
                <summary>{session ? "Edit idea" : "Edit prepared text"}</summary>
                <label>
                  Title
                  <input
                    value={thought.title}
                    onChange={(e) => {
                      dirtyText.current.add(active);
                      setNodes((current) =>
                        current.map((n) =>
                          n.id === active
                            ? {
                                ...n,
                                data: {
                                  thought: {
                                    ...n.data.thought,
                                    title: e.target.value,
                                  },
                                },
                              }
                            : n,
                        ),
                      );
                    }}
                  />
                </label>
                <label>
                  Body
                  <textarea
                    rows={6}
                    value={thought.body}
                    onChange={(e) => {
                      dirtyText.current.add(active);
                      setNodes((current) =>
                        current.map((n) =>
                          n.id === active
                            ? {
                                ...n,
                                data: {
                                  thought: {
                                    ...n.data.thought,
                                    body: e.target.value,
                                  },
                                },
                              }
                            : n,
                        ),
                      );
                    }}
                  />
                </label>
                <p className="small-note">
                  {session ? "Save a new revision; earlier source revisions remain available." : "Local text rehearsal. Prepared source excerpts stay fixed; revision history and persistence arrive later."}
                </p>
                {session && <button onClick={() => {
                  void session.command({ operation: "revise-idea", ideaId: active, expectedRevision: thought.revision,
                    title: thought.title, body: thought.body }).then(() => {
                      dirtyText.current.delete(active);
                      setNodes((current) => current.map((n) => n.id === active ? { ...n, data: { ...n.data, thought: { ...n.data.thought, revision: thought.revision + 1 } } } : n));
                    }).catch(() => {});
                }}>Save idea revision</button>}
              </details>
            </>
          )}
          {(panel === "index" || panel === "text") && (
            <>
              <h2>
                {panel === "index"
                  ? "Every thought has a place."
                  : "What to do with a dead shopping mall"}
              </h2>
              {panel === "index" && (
                <>
                {!session && <DownloadButton cards={nodes.map((node) => node.data.thought)} relationships={relationships} />}
                <label>
                  Find a thought
                  <input
                    autoComplete="off"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search titles"
                  />
                </label>
                </>
              )}
              <div className="reference-list">
                {nodes
                  .filter(
                    (n) =>
                      panel === "text" ||
                      n.data.thought.title.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((n) => (
                    <section key={n.id}>
                      <span className="instrument-label">
                        {n.data.thought.kind} · {n.data.thought.decision}
                      </span>
                      <h3>{n.data.thought.title}</h3>
                      {panel === "text" && (
                        <>
                          <p className="body-copy">{n.data.thought.body}</p>
                          <p>Contribution: {n.data.thought.contribution}</p>
                          <p>Evidence: {n.data.thought.evidence}</p>
                          <ul>
                            {relationshipsFor(n.id, relationships).map(
                              (e) => (
                                <li key={e.id}>
                                  {e.direction} {e.kind}:{" "}
                                  {byId.get(e.otherId)?.title} ·{" "}
                                  {e.contribution || e.label}
                                </li>
                              ),
                            )}
                          </ul>
                        </>
                      )}
                      <div className="panel-actions">
                        <button onClick={() => focus(n.id)}>Focus ↗</button>
                        <button onClick={() => inspect(n.id)}>Inspect</button>
                        <button
                          aria-pressed={selected.includes(n.id)}
                          onClick={() => select(n.id)}
                        >
                          {selected.includes(n.id) ? "Selected ✓" : "Select"}
                        </button>
                      </div>
                    </section>
                  ))}
              </div>
            </>
          )}
          {panel === "compare" && (
            <>
              <h2>Hold the differences in view.</h2>
              <p>
                Your selection and viewpoint remain in place when you close this
                panel.
              </p>
              <div className="comparison-grid">
                {selected.map((id) => (
                  <section key={id}>
                    <span className="instrument-label">
                      {byId.get(id)!.decision}
                    </span>
                    <h3>{byId.get(id)!.title}</h3>
                    <p>{byId.get(id)!.contribution}</p>
                    <p className="body-copy">{byId.get(id)!.body}</p>
                    <p>Evidence: {byId.get(id)!.evidence}</p>
                    <button onClick={() => inspect(id)}>Inspect sources</button>
                  </section>
                ))}
              </div>
              <button onClick={() => move(selected)}>
                Weave selected contributions · preview
              </button>
            </>
          )}
          {panel === "moves" && !session && selected.length === 1 && <MovesPanel
            key={selected[0]} source={{ ...byId.get(selected[0])!, relationships: relationshipsFor(selected[0], relationships) }}
            prepared={byId.get(selected[0])!.move} busy={busy} error={live?.move ? live.error : undefined}
            choose={(move) => void generate("wander", [byId.get(selected[0])!], move)}
            retryGeneration={() => { if (live) void generate(live.feature, live.sources, live.move); }} />}
          {panel === "moves" && (session || selected.length !== 1) && (
            <>
              <h2>
                {moveSources.length > 1
                  ? "What could these contribute together?"
                  : byId.get(moveSources[0])!.move.question}
              </h2>
              <p className="small-note">
                Prepared suggestions illustrate the interaction. They do not
                generate or save an idea.
              </p>
              <h3>
                {moveSources.length === 1 && moveSources[0] === "brief"
                  ? "Brief only"
                  : "Affected sources"}
              </h3>
              {moveSources.map((id) => (
                <section className="source-preview" key={id}>
                  <h3>{byId.get(id)!.title}</h3>
                  <p>{byId.get(id)!.contribution}</p>
                  <span className="instrument-label">
                    Prepared revision {byId.get(id)!.revision}
                  </span>
                </section>
              ))}
              <button className="move-choice" onClick={() => setPreview(true)}>
                {moveSources.length > 1
                  ? "Preview a shared occasion"
                  : byId.get(moveSources[0])!.move.title}{" "}
                →
              </button>
              {preview && (
                <div className="prepared-result" aria-live="polite">
                  <h3>Prepared direction</h3>
                  <p>
                    {moveSources.length > 1
                      ? `Try a single shared event that preserves each selected contribution: ${moveSources.map((id) => byId.get(id)!.contribution).join(" ")} Ask which activities can safely share a time or a place, and which need separation. Feasibility is unknown.`
                      : byId.get(moveSources[0])!.move.preview}
                  </p>
                  <p className="small-note">
                    No new card, assessment or saved result has been created.
                  </p>
                </div>
              )}
            </>
          )}
        </aside>
      )}
    </main>
  );
}
export default function Atlas({ session }: { session?: AtlasSession }) {
  return (
    <ReactFlowProvider>
      <Studio session={session} />
    </ReactFlowProvider>
  );
}
