"use client";

import Image from "next/image";
import { ChevronDown, GitFork, Copy, Compass, Shuffle } from "lucide-react";
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
  useNodesInitialized,
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
import { ArrowRight, ArrowClockwise, Crosshair, CaretRight, X } from "@phosphor-icons/react";
import { relationshipsFor } from "./domain";
import { mallFixture } from "./fixture";
import { wanderSchema, weaveSchema, moveCardSchema, type ContextualMove, type GeneratedCard, type LiveFeature } from "./generation";
import { cardHash, validateThemes, type ThemeGroup } from "./themes";
import { atlasSaveSchema, fixtureSave, restoreSave, writeSave, mergeAtlas, interruptSavedRuns, type AtlasSave } from "./local-state";
import TalkPanel from "./talk-panel";
import RegroupPanel from "./regroup-panel";
import { applyRegroup } from "./regroup-layout";
import DownloadButton from "./download-button";
import ThoughtCatalogue from "./thought-catalogue";
import MovesPanel from "./moves-panel";
import ExpeditionPanel from "./expedition-panel";
import GuideContent from "./guide-content";
import TooltipButton from "./tooltip-button";
import { overviewDiameter, overviewLabels, overviewName } from "./overview";
import ExplorationPanel, { ProposalDecisions } from "../exploration/panel";

type CardNode = Node<{ thought: Thought; geometry?: { width: number; height: number; circular: boolean } }, "thought" | "theme">;
// Keep screen-sized overview markers separated at the farthest zoom-out.
const MIN_ZOOM = 0.03;

type Panel = "guide" | "expedition" | "talk" | "inspect" | "compare" | "moves" | "index" | "text" | "explore" | null;
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
  focus: (id: string) => void;
  resize?: (id: string, size: { x: number; y: number; width: number; height: number }) => void;
}>({
  overview: false,
  zoom: 1,
  compact: false,
  selected: [],
  inspect: () => {},
  select: () => {},
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
      // Wait briefly so a double-click can select without an inspection overlay
      // covering the card before its second click arrives.
      pendingOpen.current = setTimeout(() => ui.inspect(thought.id), 250);
    }
  }
  function selectCard(event: ReactMouseEvent) {
    if (!isCardSurface(event)) return;
    if (pendingOpen.current) clearTimeout(pendingOpen.current);
    event.preventDefault();
    ui.select(thought.id);
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
  const loading = !!ui.busy && !!ui.live?.sources.some((source) => source.id === id);
  return (
    <article
      ref={surface}
      aria-busy={loading}
      className={`thought ${loading ? "thought-generating" : ""} ${ui.overview ? "thought-overview" : ""} ${thought.kind} ${ui.selected.includes(thought.id) ? "chosen" : ""}`}
      onClick={openCard}
      onDoubleClick={selectCard}
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
          title="Click to open · Double-click to select"
          aria-description="Drag or use arrow keys to move"
          className={`overview-target card-grip nopan ${ui.scalable ? "scale-target" : ui.compact ? "compact-target" : ""}`}
          style={{ transform: `scale(${1 / ui.zoom})`, ...(ui.scalable ? { width: diameter, height: diameter, minHeight: diameter } : {}) }}
        >
          {ui.scalable ? ui.labels?.has(id) && <span className="overview-name">{overviewName(thought)}</span> : ui.compact ? null : thought.title}
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
            <button
              className="nodrag nopan select-card"
              aria-pressed={ui.selected.includes(thought.id)}
              aria-label={`Select ${thought.title}`}
              onClick={() => ui.select(thought.id)}
            >
              {ui.selected.includes(thought.id) ? "✓" : "+"}
            </button>
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

function Studio({ session, initial, restoreNotice = "", saveEnabled = true, replace }: { session?: AtlasSession; initial?: AtlasSave; restoreNotice?: string; saveEnabled?: boolean; replace?: (save: AtlasSave) => void }) {
  const [savedGraph, setSavedGraph] = useState(session?.initial);
  const fixture = useMemo(() => savedGraph ?? (initial ? { thoughts: initial.thoughts, relationships: initial.relationships, positions: initial.positions.Lineage } : mallFixture()), [savedGraph, initial]);
  const [nodes, setNodes] = useState<CardNode[]>(() => presentNodes(session?.initial ?? (initial && { thoughts: initial.thoughts, relationships: initial.relationships, positions: initial.positions.Lineage })).map((node) => session ? {
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
  const [focusedId, setFocusedId] = useState<string | null>(initial?.focusedId ?? null);
  const [connectionKind, setConnectionKind] = useState("parents");
  const [connectionPage, setConnectionPage] = useState(0);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(initial?.selected ?? []);
  const [active, setActive] = useState(initial?.active ?? "repair");
  const [panel, setPanel] = useState<Panel>(null);
  const [moveSources, setMoveSources] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [showRelationshipLabels, setShowRelationshipLabels] = useState(false);
  const [overview, setOverview] = useState((initial?.cameras[initial.perspective]?.zoom ?? 1) < .62);
  const [viewport, setViewport] = useState<Viewport>(initial?.cameras[initial.perspective] ?? { x: 0, y: 0, zoom: 1 });
  const [compact, setCompact] = useState((initial?.cameras[initial.perspective]?.zoom ?? 1) < .45);
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
  const [perspective, setPerspective] = useState<Perspective>(initial?.perspective ?? "Lineage");
  const perspectiveRef = useRef<Perspective>(initial?.perspective ?? "Lineage");
  const fitPerspective = useRef(false);
  const [cameras, setCameras] = useState<Partial<Record<Perspective, Viewport>>>(initial?.cameras ?? {});
  const [positions, setPositions] = useState<Record<string, Record<string, { x: number; y: number }>>>(initial?.positions ?? {});
  const [themeCache, setThemeCache] = useState<{ groups: ThemeGroup[]; hashes: Record<string, string>; time: string } | undefined>(initial?.themeCache);
  const [regroupIds, setRegroupIds] = useState<string[] | null>(null);
  const [regroupedIds, setRegroupedIds] = useState<string[]>([]);
  const [themeUndo, setThemeUndo] = useState<{ cache: typeof themeCache; positions: typeof positions; viewport: Viewport }>();
  const [themeError, setThemeError] = useState("");
  const [themeBusy, setThemeBusy] = useState(false);
  const themePending = useRef(false);
  const themeRetryFull = useRef(false);
  async function groupThemes(full = false) {
    if (themePending.current) return;
    themePending.current = true;
    setThemeBusy(true); setThemeError(""); setThemeUndo(undefined); setRegroupedIds([]); themeRetryFull.current = full;
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
      setThemeCache({ groups: groups.filter(g => g.memberIds.length), hashes, time: new Date().toLocaleString() });
      setPositions(current => ({ ...current, Constellation: {} }));
      if (perspectiveRef.current === "Constellation") fitPerspective.current = true;
    } catch (error) { setThemeError(error instanceof Error ? error.message : String(error)); }
    finally { themePending.current = false; setThemeBusy(false); }
  }
  function switchPerspective(next: Perspective) {
    if (next === perspective) return;
    setRegroupIds(null);
    setCameras(current => ({ ...current, [perspective]: flow.getViewport() }));
    perspectiveRef.current = next;
    setPerspective(next);
    if (cameras[next]) void flow.setViewport(cameras[next]!);
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
  const themeNodes: CardNode[] = perspective === "Constellation" ? groups.map((g, i) => ({ hidden: !g.memberIds.length, id: `theme-${i}`, type: "theme", position: { x: i * 760, y: -70 }, width: 440, height: 140, measured: { width: 440, height: 140 }, style: { width: 440, height: 140 }, draggable: false, data: { thought: { ...thought, title: g.name, summary: g.reason } } })) : [];
  const nodesInitialized = useNodesInitialized();
  useLayoutEffect(() => {
    if (!fitPerspective.current || !nodesInitialized || themeBusy || (perspective === "Constellation" && !themeCache)) return;
    let frame = 0;
    const fitMeasured = () => {
      const all = [...renderedNodes, ...themeNodes].filter(n => !n.hidden);
      // The renderer commits a newly grouped column after this parent layout
      // effect. Wait for that commit and every node's measured dimensions.
      if (all.some(n => !flow.getNode(n.id)?.measured?.height)) {
        frame = requestAnimationFrame(fitMeasured); return;
      }
      fitPerspective.current = false;
      const x = Math.min(...all.map(n => n.position.x)), y = Math.min(...all.map(n => n.position.y));
      void flow.fitBounds({ x, y,
        width: Math.max(...all.map(n => n.position.x + flow.getNode(n.id)!.measured!.width!)) - x,
        height: Math.max(...all.map(n => n.position.y + flow.getNode(n.id)!.measured!.height!)) - y }, { padding: .2 });
    };
    frame = requestAnimationFrame(fitMeasured);
    return () => cancelAnimationFrame(frame);
  });
  const [messages, setMessages] = useState<AtlasSave["messages"]>(initial?.messages ?? []);
  const [expeditions, setExpeditions] = useState<AtlasSave["expeditions"]>(initial?.expeditions ?? []);
  const [activeExpedition, setActiveExpedition] = useState<number | null>(initial?.activeExpedition ?? null);
  const [storageNotice, setStorageNotice] = useState(restoreNotice);
  const storageMenu = useRef<HTMLDetailsElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (storageMenu.current && !storageMenu.current.contains(event.target as HTMLElement)) storageMenu.current.open = false;
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  const [importFile, setImportFile] = useState<AtlasSave>();
  const [importBusy, setImportBusy] = useState(false);
  const [importNotice, setImportNotice] = useState("");
  const savingPaused = useRef(false);
  const snapshot = useMemo<AtlasSave>(() => ({
    version: 1, thoughts: nodes.map(n => n.data.thought), relationships,
    positions: { Lineage: Object.fromEntries(nodes.map(n => [n.id, n.position])), Evolution: positions.Evolution ?? {}, Constellation: positions.Constellation ?? {} },
    cameras: { ...cameras, [perspective]: viewport }, perspective, selected, active, focusedId,
    themeCache, messages, expeditions, activeExpedition,
  // Relationships derive from the fixture and live edges, which are stable dependencies.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [nodes, fixture, liveEdges, positions, cameras, perspective, viewport, selected, active, focusedId, themeCache, messages, expeditions, activeExpedition]);
  const latestSave = useRef(snapshot);
  useLayoutEffect(() => { latestSave.current = snapshot; }, [snapshot]);
  useEffect(() => {
    if (session || !saveEnabled) return;
    const timer = setTimeout(() => {
      if (!savingPaused.current) void writeSave(snapshot).catch(() => setStorageNotice("Changes could not be saved in this browser. Export a backup before leaving."));
    }, 200);
    return () => clearTimeout(timer);
  }, [snapshot, session, saveEnabled]);
  useEffect(() => {
    if (session || !saveEnabled) return;
    const flush = () => { if (!savingPaused.current) void writeSave(latestSave.current).catch(() => {}); };
    const hidden = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush); document.addEventListener("visibilitychange", hidden);
    return () => { window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", hidden); };
  }, [session, saveEnabled]);
  async function resetFixture() {
    if (!window.confirm("Reset to fixture? This discards this browser's current atlas, Talk transcript and expeditions.")) return;
    savingPaused.current = true;
    try { await writeSave(null); replace?.(fixtureSave()); }
    catch { savingPaused.current = false; setStorageNotice("The save could not be cleared. Reset was not applied."); }
  }
  function exportAtlas() {
    let url: string | undefined;
    const anchor = document.createElement("a");
    try {
      const save = atlasSaveSchema.parse(latestSave.current);
      url = URL.createObjectURL(new Blob([JSON.stringify(save, null, 2)], { type: "application/json" }));
      anchor.href = url; anchor.download = "minerva-atlas.json";
      document.body.append(anchor); anchor.click(); setImportNotice("");
    } catch (error) { setImportNotice(`Export failed: ${error instanceof Error ? error.message : String(error)}`); }
    finally { anchor.remove(); if (url) setTimeout(() => URL.revokeObjectURL(url!), 1000); }
  }
  async function importAtlas(merge: boolean) {
    if (!importFile || importBusy) return;
    if (!merge && !window.confirm("Replace this atlas? This discards the current atlas and restores the backup.")) return;
    setImportBusy(true);
    try {
      const current = latestSave.current;
      const result = merge ? await mergeAtlas(current, importFile) : { save: importFile, added: importFile.thoughts.length, skipped: 0 };
      if (merge && latestSave.current !== current) throw new Error("The atlas changed during import. Please try Merge again.");
      savingPaused.current = true;
      await writeSave(result.save);
      replace?.(result.save);
    } catch (error) { savingPaused.current = false; setImportNotice(`Import failed: ${error instanceof Error ? error.message : String(error)}`); }
    finally { setImportBusy(false); }
  }
  const [live, setLive] = useState<{ sources: Thought[]; feature: LiveFeature; move?: ContextualMove; error?: string }>();
  const [busy, setBusy] = useState(false);
  const generating = useRef(false);
  const focusedRelations = focusedId ? relationshipsFor(focusedId, relationships).filter(e => connectionKind === "associations" ? e.kind === "association" : connectionKind === "context" ? e.kind === "context" : e.kind !== "association" && e.kind !== "context" && e.direction === (connectionKind === "parents" ? "incoming" : "outgoing")) : [];
  const relationPage = focusedRelations.slice(connectionPage * 6, connectionPage * 6 + 6);
  const highlighted = new Set(selected.length
    ? relationships.filter(edge => selected.includes(edge.from) || selected.includes(edge.to)).map(edge => edge.id)
    : (branchId ? relationPage.filter(e => e.id === branchId) : relationPage).map(e => e.id));
  const highlighting = selected.length > 0 || focusedId !== null;
  const labels = overviewLabels(renderedNodes, viewport, [...(focusedId ? [focusedId] : []), ...selected]);
  const edges = relationships.filter(edge => perspective !== "Constellation" || (edge.kind === "association" && groupFor.has(edge.from) && groupFor.has(edge.to) && groupFor.get(edge.from) !== groupFor.get(edge.to))).map((edge) => ({
    id: edge.id,
    source: perspective === "Constellation" ? `theme-${groupFor.get(edge.from)}` : edge.from,
    target: perspective === "Constellation" ? `theme-${groupFor.get(edge.to)}` : edge.to,
    type: perspective === "Constellation" ? "default" : "floating",
    label: !showRelationshipLabels || overview || (!session && highlighting && !highlighted.has(edge.id)) ? undefined : edge.label,
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
      opacity: perspective === "Constellation" ? 1 : session ? 1 : highlighting ? (highlighted.has(edge.id) ? 1 : .12) : overview ? .7 : 1,
      stroke:
        edge.kind === "association"
          ? "#755584"
          : edge.kind === "context"
            ? "#645f51"
            : "#28686a",
      strokeWidth:
        (!session && overview ? (highlighted.has(edge.id) ? 2 : 1) : panel === "inspect" && (edge.from === active || edge.to === active)
          ? 3
          : edge.kind === "recombination" || edge.kind === "association"
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
    setRegroupIds(null);
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
    const next = selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id];
    if (!session) { setFocusedId(next.at(-1) ?? null); setConnectionPage(0); setBranchId(null); }
    bringForward(id);
    setSelected(next);
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
        </div>
        <div className="workspace-heading">
          <span className="instrument-label">{session ? `Studio / ${perspective}` : "Saved in this browser"}</span>
          <h1>{session ? "Saved idea atlas" : "The mall, reconsidered"}</h1>
        </div>
        {!session && <nav className="perspective-switch" aria-label="Atlas perspective">{(["Lineage", "Evolution", "Constellation"] as const).map(view => <button key={view} aria-pressed={perspective === view} onClick={() => switchPerspective(view)}>{view}</button>)}</nav>}
      {!session && <div className="atlas-header-actions">
        <button className="guide-launcher" aria-haspopup="dialog" aria-expanded={panel === "guide"} aria-controls="atlas-guide" onClick={event => {
          if (storageMenu.current) storageMenu.current.open = false;
          if (panel === "guide") close();
          else { open("guide"); returnFocus.current = event.currentTarget; }
        }}>Guide</button>
        <details ref={storageMenu} className="atlas-menu" onKeyDown={event => {
          if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); }
        }}>
        <summary>Menu <ChevronDown size={14} aria-hidden="true" /></summary>
        <div className="atlas-menu-options" aria-label="Atlas options">
        <label className="relationship-label-toggle"><input type="checkbox" checked={showRelationshipLabels} onChange={event => setShowRelationshipLabels(event.target.checked)} /> Relationship labels</label>
        <button onClick={() => { exportAtlas(); if (storageMenu.current) storageMenu.current.open = false; }}>Export atlas</button>
        <button onClick={() => importInput.current?.click()}>Import atlas</button>
        <input ref={importInput} hidden aria-label="Import atlas file" type="file" accept=".json,application/json" onChange={async e => {
          const file = e.target.files?.[0]; e.target.value = ""; setImportFile(undefined); setImportNotice("");
          if (!file) return;
          try { setImportFile(interruptSavedRuns(atlasSaveSchema.parse(JSON.parse(await file.text())))); }
          catch (error) { setImportNotice(`Invalid atlas file: ${error instanceof Error ? error.message : String(error)}`); }
        }} />
        <button onClick={() => void resetFixture()}>Reset to fixture</button>
        {importFile && <span>{importFile.thoughts.length} cards ready. <button disabled={importBusy} onClick={() => void importAtlas(false)}>Replace</button> <button disabled={importBusy} onClick={() => void importAtlas(true)}>Merge</button> <button onClick={() => setImportFile(undefined)}>Cancel import</button></span>}
        {importNotice && <p role="alert">{importNotice}</p>}
        {storageNotice && <p role="status">{storageNotice}</p>}
      </div></details></div>}
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
            fitView={session ? !savedGraph?.viewpoint.revision : !initial?.cameras[initial.perspective]}
            defaultViewport={session?.initial.viewpoint ?? initial?.cameras[initial.perspective]}
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
          <TooltipButton className="expedition-control thoughts-control" aria-label={`Thoughts ${nodes.length}`} title="Browse thoughts" aria-haspopup="dialog" aria-expanded={panel === "index"} onClick={() => open("index")}>
            <Image className="thoughts-medallion" src="/images/thoughts-olive.png" width={44} height={44} alt="" />
            <span className="thought-count" aria-hidden="true">{nodes.length}</span>
          </TooltipButton>
          <TooltipButton className="expedition-control" aria-label="Read as text" title="Read as text" aria-haspopup="dialog" aria-expanded={panel === "text"} onClick={() => open("text")}>
            <Image className="scroll-medallion" src="/images/read-scroll.png" width={44} height={44} alt="" />
          </TooltipButton>
          {!session && <TooltipButton className="expedition-control" aria-label="Expedition panel" title="Open expedition panel" aria-haspopup="dialog" aria-expanded={panel === "expedition"} onClick={() => open("expedition")}><Image src="/images/expedition-compass.png" width={44} height={44} alt="" /></TooltipButton>}

          {session && <>
            <label className="relationship-label-toggle"><input type="checkbox" checked={showRelationshipLabels} onChange={event => setShowRelationshipLabels(event.target.checked)} /> Relationship labels</label>
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
          <div className="focus-heading"><strong>{byId.get(focusedId)?.title}</strong><button aria-label="Close focused connections" onClick={() => setFocusedId(null)}><X size={20} aria-hidden="true" /></button></div>
          <p className="focus-summary">{byId.get(focusedId)?.summary}</p>
          <div className="focus-actions">
            <button className="focus-open" onClick={() => inspect(focusedId)}>Open card <ArrowRight size={22} aria-hidden="true" /></button>
            <button className="focus-center" onClick={() => focus(focusedId)}><Crosshair size={24} aria-hidden="true" />Center on canvas</button>
          </div>
          <details className="focus-connections" key={focusedId}>
          <summary>Connections <CaretRight size={20} aria-hidden="true" /></summary>
          <label>Show connections <select value={connectionKind} onChange={e => { setConnectionKind(e.target.value); setConnectionPage(0); setBranchId(null); }}>
            <option value="parents">Parents</option><option value="children">Children</option><option value="associations">Associations</option><option value="context">Shared brief</option>
          </select></label>
          <p className="small-note">{focusedRelations.length ? `${focusedRelations.length} connection${focusedRelations.length === 1 ? "" : "s"}` : `No ${connectionKind === "context" ? "shared brief connections" : connectionKind}.`}</p>
          <ul>{relationPage.map(edge => <li key={edge.id}><button className="relative-link" onClick={() => focus(edge.otherId)}>{byId.get(edge.otherId)?.title} ↗</button><button aria-label={`Highlight only ${byId.get(edge.otherId)?.title}`} aria-pressed={branchId === edge.id} onClick={() => setBranchId(branchId === edge.id ? null : edge.id)}>Trace</button></li>)}</ul>
          {focusedRelations.length > 6 && <div><button disabled={!connectionPage} onClick={() => { setConnectionPage(p => p - 1); setBranchId(null); }}>Previous connections</button><button disabled={(connectionPage + 1) * 6 >= focusedRelations.length} onClick={() => { setConnectionPage(p => p + 1); setBranchId(null); }}>Next connections</button></div>}
        </details>
        </section>}
        {perspective === "Constellation" && !regroupIds && <section className="themes-status" aria-label="Theme grouping">
          <span>{themeCache ? `${nodes.length} ideas · ${themeCache.groups.filter(g => g.memberIds.length).length} themes` : "Group ideas into themes"}</span>
          {themeBusy && <span role="status">Grouping themes…</span>}
          {themeError && <><span role="alert">{themeError}</span><button disabled={themeBusy} onClick={() => void groupThemes(themeRetryFull.current)}>Retry</button></>}
          <button data-regroup-trigger title={selected.length ? `Regroup ${selected.length} selected ideas` : "Regroup all ideas"} disabled={themeBusy || !themeCache} onClick={() => { setPanel(null); setFocusedId(null); setRegroupIds(selected.length ? selected : nodes.map(n => n.id)); }}><ArrowClockwise size={18} aria-hidden="true" />{themeBusy ? "Finding themes…" : "Regroup"}{!themeBusy && selected.length > 0 ? ` ${selected.length} selected` : ""}</button>
          {selected.length > 0 && <button onClick={() => setSelected([])}>Clear selection</button>}
          {regroupedIds.length > 0 && <><span role="status">Regrouped {regroupedIds.length} ideas</span><button onClick={() => void flow.fitView({ nodes: [...regroupedIds, ...themeCache!.groups.flatMap((g, i) => g.memberIds.some(id => regroupedIds.includes(id)) ? [`theme-${i}`] : [])].map(id => ({ id })), padding: .3, maxZoom: 1 })}>View regrouped ideas</button></>}
          {themeUndo && <button onClick={() => { setThemeCache(themeUndo.cache); setPositions(themeUndo.positions); void flow.setViewport(themeUndo.viewport); setThemeUndo(undefined); setRegroupedIds([]); }}>Undo regroup</button>}
        </section>}
        {perspective === "Constellation" && regroupIds && themeCache && <RegroupPanel
          key={regroupIds.join(",")} cards={nodes.map(n => n.data.thought)} ids={regroupIds}
          close={() => setRegroupIds(null)}
          apply={(incoming) => {
            setThemeUndo({ cache: themeCache, positions, viewport: flow.getViewport() });
            setRegroupedIds(regroupIds);
            const { groups: next, layout } = applyRegroup(themeCache.groups, incoming, regroupIds, renderedNodes);
            setPositions(current => ({ ...current, Constellation: layout }));
            setThemeCache({ ...themeCache, groups: next, time: new Date().toLocaleString() });
            setRegroupIds(null);
          }} />}
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
        {selected.length > 0 && !regroupIds && (
          <div className={`selection-bar${session ? "" : " light-selection-dock"}`}>
            <span className="selection-count">{selected.length} selected</span>
            {selected.length === 1 && <button onClick={() => focus(selected[0])}><Crosshair size={22} aria-hidden="true" />Focus on atlas</button>}
            {session ? <><button onClick={() => open("compare")}>Compare</button><button onClick={() => move(selected)}>Weave · preview</button></> : <>
              <button className="wander-action" disabled={busy || selected.length !== 1} onClick={() => move(selected)} aria-busy={busy && live?.feature === "wander"}>{busy && live?.feature === "wander" ? <span className="generation-spinner" aria-hidden="true" /> : <GitFork size={22} aria-hidden="true" />}{busy && live?.feature === "wander" ? "Wandering…" : "Wander"}</button>
              <button onClick={() => open("compare")}><Copy size={22} aria-hidden="true" />Compare</button>
              <button disabled={selected.length !== 1} onClick={() => open("expedition")}><Compass size={24} aria-hidden="true" />Expedition</button>
              <button disabled={busy || selected.length < 2} onClick={() => void generate("weave", selected.map((id) => byId.get(id)!))} aria-busy={busy && live?.feature === "weave"}>{busy && live?.feature === "weave" ? <span className="generation-spinner" aria-hidden="true" /> : <Shuffle size={22} aria-hidden="true" />}{busy && live?.feature === "weave" ? "Weaving…" : "Weave"}</button>
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
              className="selection-close"
              aria-label="Clear selection"
              title="Clear selection"
              onClick={() => { setSelected([]); setFocusedId(null); if (panel === "moves") setPanel(null); }}
            >
              {session ? "×" : <X size={24} aria-hidden="true" />}
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
      {!session && <TalkPanel messages={messages} setMessages={setMessages} open={panel === "talk"} close={close} selectedIds={selected} cards={nodes.map(({ id, data }) => ({ ...data.thought, relationships: relationshipsFor(id, relationships) }))} />}
      {!session && <ExpeditionPanel entries={expeditions} setEntries={setExpeditions} activeEntry={activeExpedition} setActiveEntry={setActiveExpedition} open={panel === "expedition"} close={close} source={selected.length === 1 ? byId.get(selected[0]) : undefined}
        cards={nodes.map(n => n.data.thought)} add={addExpeditionCard} focus={id => { focus(id); setPanel("expedition"); }} />}
      {panel && panel !== "talk" && panel !== "expedition" && (
        <aside
          key={panel === "guide" ? "guide" : "detail"}
          id={panel === "guide" ? "atlas-guide" : undefined}
          ref={panelRef}
          tabIndex={-1}
          className={`detail-panel ${panel === "guide" ? "guide-panel" : ""} ${panel === "index" ? "catalogue-panel" : ""} ${panel === "text" ? "text-reader" : ""} ${panel === "compare" || panel === "text" ? "wide-panel" : ""}`}
          role="dialog"
          aria-modal="false"
          aria-label={
            panel === "guide" ? "Guide to Minerva" : panel === "inspect"
              ? thought.title
              : panel === "moves"
                ? (session ? "Contextual moves" : "Wander")
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
          {panel !== "index" && <div className="panel-heading">
            <span className="instrument-label">
              {panel === "guide" ? "Guide" : panel === "inspect"
                ? "Thought / source material"
                : panel === "moves"
                  ? (session ? "Prepared move / no model call" : "Wander")
                  : panel === "text"
                    ? `Read as text · ${nodes.length} ideas`
                    : "Selected contributions"}
            </span>
            <button aria-label="Close panel" onClick={close}>
              ×
            </button>
          </div>}
          {panel === "guide" && <GuideContent />}
          {panel === "explore" && session && <ExplorationPanel workspaceId={savedGraph!.workspaceId}
            sources={selected.map((id) => byId.get(id)!).filter(Boolean)} inspect={inspect} />}
          {panel === "inspect" && (
            <>
              <h2>{thought.title}</h2>
              {!session && <DownloadButton key={thought.id} card={thought} cards={nodes.map((node) => node.data.thought)} relationships={relationships} />}
              {((thought.decision !== "unkept draft" && thought.decision !== "kept") || thought.evidence !== "unknown") && <div className="status-line">
                {thought.decision !== "unkept draft" && thought.decision !== "kept" && <span>{thought.decision}</span>}
                {thought.evidence !== "unknown" && <span>Evidence: {thought.evidence}</span>}
              </div>}
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
          {panel === "text" && <div className="reader-layout">
            <nav className="reader-contents" aria-label="Ideas">
              {nodes.map(n => <button key={n.id} aria-current={n.id === thought.id ? "true" : undefined} onClick={() => setActive(n.id)}>{n.data.thought.title}</button>)}
            </nav>
            <div className="reader-main">
              <article className="reader-article" key={thought.id}>
                <span className="instrument-label">{thought.kind === "proposal" ? "Starting idea" : thought.kind}</span>
                <h2>{thought.title}</h2>
                <p className="reader-summary">{thought.summary}</p>
                <div className="body-copy">{(thought.body.startsWith(thought.summary) ? thought.body.slice(thought.summary.length).trim() : thought.body).split("\n\n").filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
                <details className="reader-details"><summary>Details</summary>
                  <p>Contribution: {thought.contribution}</p>
                  <p>Evidence: {thought.evidence}</p>
                  <ul>{relationshipsFor(thought.id, relationships).map(e => <li key={e.id}><button onClick={() => setActive(e.otherId)}>{byId.get(e.otherId)?.title}</button> · {e.contribution || e.label}</li>)}</ul>
                </details>
                <div className="reader-actions">
                  <label><input type="checkbox" checked={selected.includes(thought.id)} onChange={() => select(thought.id)} /> Select</label>
                  <button className="reader-open" onClick={() => inspect(thought.id)}>Open card</button>
                  <button className="reader-center" onClick={() => focus(thought.id)}>Center on canvas</button>
                </div>
              </article>
              <nav className="reader-pagination" aria-label="Reading navigation">
                {[-1, 1].map(direction => { const neighbor = nodes[nodes.findIndex(n => n.id === thought.id) + direction]; return <button key={direction} disabled={!neighbor} onClick={() => neighbor && setActive(neighbor.id)}><span className="instrument-label">{direction < 0 ? "Previous" : "Next"}</span><span>{neighbor?.data.thought.title ?? (direction < 0 ? "First idea" : "Last idea")}</span></button>; })}
              </nav>
            </div>
          </div>}
          {panel === "index" && <ThoughtCatalogue cards={nodes.map(n => n.data.thought)} relationships={relationships} selected={selected} select={select} focus={focus} close={close} downloadable={!session} />}
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
                    {byId.get(id)!.decision !== "kept" && <span className="instrument-label">
                      {byId.get(id)!.decision}
                    </span>}
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
            explore={() => void generate("wander", [byId.get(selected[0])!])}
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
function LocalAtlas() {
  const [loaded, setLoaded] = useState<{ save: AtlasSave; notice: string; key: number; saveEnabled: boolean }>();
  useEffect(() => {
    let cancelled = false;
    void restoreSave().then(result => { if (!cancelled) setLoaded({ ...result, key: 0, saveEnabled: true }); }).catch(() => {
      if (!cancelled) setLoaded({ save: fixtureSave(), notice: "The save could not be read. Browser storage is unavailable; the original save has not been changed.", key: 0, saveEnabled: false });
    });
    return () => { cancelled = true; };
  }, []);
  if (!loaded) return <main><p role="status">Loading this browser’s atlas…</p></main>;
  return <ReactFlowProvider key={loaded.key}><Studio initial={loaded.save} restoreNotice={loaded.notice} saveEnabled={loaded.saveEnabled}
    replace={save => setLoaded(current => ({ save, notice: "", saveEnabled: true, key: (current?.key ?? 0) + 1 }))} /></ReactFlowProvider>;
}
export default function Atlas({ session }: { session?: AtlasSession }) {
  return session ? <ReactFlowProvider><Studio session={session} /></ReactFlowProvider> : <LocalAtlas />;
}
