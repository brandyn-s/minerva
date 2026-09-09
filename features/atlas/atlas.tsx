"use client";

import Image from "next/image";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  MarkerType,
  applyNodeChanges,
  useReactFlow,
  useUpdateNodeInternals,
  type Node,
  type NodeProps,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Thought } from "./domain";
import { relationshipsFor } from "./domain";
import { mallFixture } from "./fixture";

type CardNode = Node<{ thought: Thought; members?: string[] }, "thought">;
type Panel = "inspect" | "compare" | "moves" | "index" | "text" | null;
const Interaction = createContext<{
  overview: boolean;
  zoom: number;
  compact: boolean;
  selected: string[];
  inspect: (id: string) => void;
  select: (id: string) => void;
  move: (id: string) => void;
  focus: (id: string) => void;
  showGroup: (ids: string[]) => void;
}>({
  overview: false,
  zoom: 1,
  compact: false,
  selected: [],
  inspect: () => {},
  select: () => {},
  move: () => {},
  focus: () => {},
  showGroup: () => {},
});
function ThoughtCard({ id, data }: NodeProps<CardNode>) {
  const { thought } = data;
  const ui = useContext(Interaction);
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
  const isGroup = Boolean(data.members);
  const lastGeometry = useRef({
    zoom: ui.zoom,
    overview: ui.overview,
    compact: ui.compact,
  });
  useEffect(() => {
    const previous = lastGeometry.current;
    if (
      isGroup ||
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
  }, [id, ui.zoom, ui.overview, ui.compact, isGroup, updateNodeInternals]);
  const anchorY = ui.overview ? (ui.compact ? 24 : 35) / ui.zoom : undefined;
  if (data.members)
    return (
      <article className="thought-group">
        <Handle
          type="target"
          position={Position.Left}
          style={{ top: 40 / ui.zoom }}
        />
        <button
          className="nodrag nopan"
          style={{ transform: `scale(${1 / ui.zoom})` }}
          onClick={() => ui.showGroup(data.members!)}
        >
          <strong>{thought.title}</strong>
          <span>{data.members.length} prepared variations · open list ↗</span>
        </button>
      </article>
    );
  const marker =
    (
      {
        brief: "?",
        retail: "A",
        food: "B",
        tools: "C",
        repair: "B+C",
        rotation: "A.1",
      } as Record<string, string>
    )[thought.id] || thought.id.replace("study-", "");
  return (
    <article
      className={`thought ${ui.overview ? "thought-overview" : ""} ${thought.kind} ${ui.selected.includes(thought.id) ? "chosen" : ""}`}
      onClick={openCard}
      onDoubleClick={focusCard}
    >
      <Handle type="target" position={Position.Left} style={{ top: anchorY }} />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          top: anchorY,
          left: ui.overview ? (ui.compact ? 48 : 170) / ui.zoom : undefined,
        }}
      />
      {ui.overview ? (
        <button
          aria-label={`Open ${thought.title}`}
          title="Click to open; double-click to focus; drag or use arrow keys to move"
          className={`overview-target card-grip nopan ${ui.compact ? "compact-target" : ""}`}
          style={{ transform: `scale(${1 / ui.zoom})` }}
        >
          {ui.compact ? marker : thought.title}
        </button>
      ) : (
        <>
          <div className="card-top">
            <span>
              {thought.kind === "proposal" ? "Starting proposal" : thought.kind}
            </span>
            <button
              className="card-grip"
              aria-label={`Move ${thought.title}`}
              title="Drag to move; arrow keys move the card"
            >
              ⠿
            </button>
          </div>
          <button className="card-title nodrag">{thought.title}</button>
          <p className="card-summary">{thought.summary}</p>
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
const nodeTypes = { thought: ThoughtCard };
function presentNodes(dense: boolean): CardNode[] {
  const fixture = mallFixture(dense);
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

function Studio() {
  const [dense, setDense] = useState(false);
  const fixture = useMemo(() => mallFixture(dense), [dense]);
  const [nodes, setNodes] = useState<CardNode[]>(() => presentNodes(false));
  const stackingOrder = useRef(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] = useState("repair");
  const [panel, setPanel] = useState<Panel>(null);
  const [moveSources, setMoveSources] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [overview, setOverview] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string[] | null>(null);
  const [compact, setCompact] = useState(false);
  const [pinching, setPinching] = useState(false);
  const field = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const restoringFocus = useRef(false);
  const flow = useReactFlow<CardNode>();
  const byId = new Map(nodes.map((n) => [n.id, n.data.thought]));
  const thought = byId.get(active)!;
  const aggregated = dense && compact;
  const groupedIds = aggregated
    ? nodes
        .filter((n) => n.id.startsWith("study-") && !selected.includes(n.id))
        .map((n) => n.id)
    : [];
  const groups: CardNode[] = aggregated
    ? ["retail", "food", "tools"]
        .map<CardNode>((id, index) => ({
          id: "group-" + id,
          type: "thought",
          width: 290,
          height: 200,
          measured: { width: 290, height: 200 },
          position: { x: 1600, y: index * 580 },
          style: { pointerEvents: "all" },
          data: {
            thought: {
              ...byId.get(id)!,
              title: ["Shop studies", "Kitchen studies", "Tool studies"][index],
            },
            members: fixture.relationships
              .filter((e) => e.from === id && groupedIds.includes(e.to))
              .map((e) => e.to),
          },
          draggable: false,
        }))
        .filter((n) => n.data.members!.length > 0)
    : [];
  const renderedNodes = [
    ...nodes.map<CardNode>((n) => ({
      ...n,
      hidden: groupedIds.includes(n.id),
      style: { ...n.style, pointerEvents: overview ? "none" : "all" },
    })),
    ...groups,
  ];
  const edges = fixture.relationships.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    hidden: groupedIds.includes(edge.to),
    label: overview ? undefined : edge.label,
    markerEnd:
      edge.kind === "association" || edge.kind === "context"
        ? undefined
        : { type: MarkerType.ArrowClosed, color: "#28686a" },
    className: `thread ${edge.kind} ${panel === "inspect" && (edge.from === active || edge.to === active) ? "emphasized" : ""}`,
    style: {
      stroke:
        edge.kind === "association"
          ? "#755584"
          : edge.kind === "context"
            ? "#827962"
            : "#28686a",
      strokeWidth: edge.kind === "recombination" ? 2 : 1.5,
      strokeDasharray:
        edge.kind === "association"
          ? "7 5"
          : edge.kind === "context"
            ? "3 5"
            : undefined,
    },
  }));
  const renderedEdges = [
    ...edges,
    ...groups.map((n) => ({
      id: n.id + "-edge",
      source: n.id.replace("group-", ""),
      target: n.id,
      label: `${n.data.members!.length} derivations`,
      style: { stroke: "#28686a", strokeWidth: 2 },
    })),
  ];
  function fit() {
    void flow.fitView({
      padding: 0.18,
      maxZoom: 1,
      includeHiddenNodes: true,
      nodes: nodes.map((n) => ({ id: n.id })),
    });
  }
  function open(next: Panel) {
    if (next === "index") setGroup(null);
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
    bringForward(id);
    setActive(id);
    open("inspect");
  }
  function select(id: string) {
    bringForward(id);
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
  }
  function focus(id: string) {
    bringForward(id);
    const node = flow.getNode(id);
    if (node)
      void flow.setCenter(node.position.x + 145, node.position.y + 130, {
        zoom: 1,
      });
    setActive(id);
    setPanel(null);
    requestAnimationFrame(() =>
      field.current
        ?.querySelector<HTMLButtonElement>(`[data-id="${id}"] .card-title`)
        ?.focus(),
    );
  }
  function move(ids: string[]) {
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
          0.12,
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
  }, [flow]);
  function changeScene() {
    setDense(!dense);
    setNodes(presentNodes(!dense));
    setSelected([]);
    setPanel(null);
    setActive("repair");
    requestAnimationFrame(() => {
      void flow.fitView({ padding: 0.12 });
    });
  }
  return (
    <main className="studio">
      <a className="skip-link" href="#atlas-tools">
        Skip to atlas controls
      </a>
      <header className="masthead">
        <div className="brand">
          <Image src="/icon.svg" alt="" width={35} height={35} unoptimized />
          <span>Minerva</span>
        </div>
        <div className="workspace-heading">
          <span className="instrument-label">Studio / Lineage</span>
          <h1>The mall, reconsidered</h1>
        </div>
        <span className="fixture-label">
          Prepared local study <span>Changes reset on reload</span>
        </span>
      </header>
      <div
        className="field"
        ref={field}
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
            overview,
            compact,
            zoom: viewport.zoom,
            selected,
            inspect,
            select,
            move: (id) => move([id]),
            focus,
            showGroup: (ids) => {
              open("index");
              setGroup(ids);
              setQuery("");
            },
          }}
        >
          <ReactFlow<CardNode>
            nodes={renderedNodes}
            edges={renderedEdges}
            nodeTypes={nodeTypes}
            onNodesChange={(changes) => {
              const contentChanges = changes.filter(
                (change) =>
                  !("id" in change) || !change.id.startsWith("group-"),
              );
              if (contentChanges.length)
                setNodes((current) =>
                  applyNodeChanges(contentChanges, current),
                );
            }}
            fitView
            fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
            minZoom={0.12}
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
          <button onClick={changeScene}>
            {dense ? "Mall demo" : "Denser study"}
          </button>
        </nav>
        {compact && (
          <div className="overview-note">
            {aggregated
              ? `${groupedIds.length} variations grouped by source. `
              : "Markers: A shops · B food · C tools. "}
            <button onClick={() => open("index")}>
              Browse all {nodes.length} thoughts ↗
            </button>
          </div>
        )}
        <div className="legend">
          <span>─ Inheritance</span>
          <span>┄ Shared brief</span>
          <span className="violet">┄ Association</span>
        </div>
        {selected.length > 0 && (
          <div className="selection-bar">
            <span>{selected.length} selected</span>
            <button onClick={() => open("compare")}>Compare</button>
            <button onClick={() => move(selected)}>Weave · preview</button>
            <button
              aria-label="Clear selection"
              onClick={() => setSelected([])}
            >
              ×
            </button>
          </div>
        )}
        <div className="field-footer">
          <p>
            {overview
              ? "Drag to move · click to open · double-click to focus."
              : "Pan across the field · drag ⠿ to move a thought"}
          </p>
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
      {panel && (
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
                ? "Prepared contextual moves"
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
                  ? "Prepared move / no model call"
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
          {panel === "inspect" && (
            <>
              <h2>{thought.title}</h2>
              <div className="status-line">
                <span>{thought.decision}</span>
                <span>Evidence: {thought.evidence}</span>
              </div>
              <p className="body-copy">{thought.body}</p>
              <h3>Contribution</h3>
              <p>{thought.contribution}</p>
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
                {relationshipsFor(active, fixture.relationships).map((edge) => (
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
                  </li>
                ))}
              </ul>
              <details>
                <summary>Edit prepared text</summary>
                <label>
                  Title
                  <input
                    value={thought.title}
                    onChange={(e) =>
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
                      )
                    }
                  />
                </label>
                <label>
                  Body
                  <textarea
                    rows={6}
                    value={thought.body}
                    onChange={(e) =>
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
                      )
                    }
                  />
                </label>
                <p className="small-note">
                  Local text rehearsal. Prepared source excerpts stay fixed;
                  revision history and persistence arrive later.
                </p>
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
                <label>
                  Find a thought
                  <input
                    autoComplete="off"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search titles"
                  />
                </label>
              )}
              {group && (
                <button onClick={() => setGroup(null)}>
                  Show all {nodes.length} thoughts
                </button>
              )}
              <div className="reference-list">
                {nodes
                  .filter(
                    (n) =>
                      panel === "text" ||
                      ((!group || group.includes(n.id)) &&
                        n.data.thought.title
                          .toLowerCase()
                          .includes(query.toLowerCase())),
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
                            {relationshipsFor(n.id, fixture.relationships).map(
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
          {panel === "moves" && (
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
export default function Atlas() {
  return (
    <ReactFlowProvider>
      <Studio />
    </ReactFlowProvider>
  );
}
