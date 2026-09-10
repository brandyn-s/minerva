import { X, Crosshair, DownloadSimple, GitFork, Copy, Shuffle } from "./icons";
/** Shared names and symbols for repeated actions. Domain-specific copy stays with its feature. */
export const actions = {
  close: { label: "Close panel", Icon: X },
  focus: { label: "Focus", Icon: Crosshair },
  download: { label: "Download", Icon: DownloadSimple },
  wander: { label: "Wander", Icon: GitFork },
  compare: { label: "Compare", Icon: Copy },
  weave: { label: "Weave", Icon: Shuffle },
} as const;
