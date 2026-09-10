"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle } from "./icons";

type Variant = "header" | "primary" | "secondary" | "quiet" | "danger" | "content" | "medallion" | "card-title" | "canvas";
type Appearance = { variant?: Variant; iconOnly?: boolean; busy?: boolean };
function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/** One tooltip behavior for buttons and native disclosure triggers. */
function useHint(text?: string) {
  const id = useId();
  const anchor = useRef<HTMLElement | null>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = () => { clearTimeout(timer.current); setOpen(true); };
  const hide = () => { clearTimeout(timer.current); setOpen(false); };
  const leave = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(false), 120); };
  useEffect(() => () => clearTimeout(timer.current), []);
  useLayoutEffect(() => {
    if (!open || !anchor.current || !bubble.current) return;
    const rect = anchor.current.getBoundingClientRect(), tip = bubble.current;
    const above = !anchor.current.closest(".field-tools") && rect.top >= tip.offsetHeight + 16;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - tip.offsetWidth / 2, window.innerWidth - tip.offsetWidth - 8));
    tip.style.left = `${left}px`;
    tip.style.top = `${above ? rect.top - tip.offsetHeight - 8 : rect.bottom + 8}px`;
    const hide = () => setOpen(false);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { hide(); } };
    document.addEventListener("keydown", escape, true);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => { document.removeEventListener("keydown", escape, true); window.removeEventListener("scroll", hide, true); window.removeEventListener("resize", hide); };
  }, [open, text]);
  return { id, setAnchor: (node: HTMLElement | null) => { anchor.current = node; }, open: open && !!text, show, hide, leave,
    tooltip: open && text ? createPortal(<span id={id} ref={bubble} className="ui-tooltip" role="tooltip" onPointerEnter={show} onPointerLeave={leave}>{text}</span>, document.body) : null };
}

export type ButtonProps = ComponentPropsWithRef<"button"> & Appearance;
export function Button({ variant = "secondary", iconOnly = false, busy = false, className = "", title, ref, children, type = "button", ...props }: ButtonProps) {
  const hint = useHint(title ?? (iconOnly ? props["aria-label"] : undefined));
  return <><button {...props} type={type} ref={node => { hint.setAnchor(node); assignRef(ref, node); }}
    className={`ui-button ${className}`} data-variant={variant} data-icon-only={iconOnly || undefined}
    aria-busy={busy || props["aria-busy"]} disabled={busy || props.disabled}
    aria-describedby={[props["aria-describedby"], hint.open ? hint.id : null].filter(Boolean).join(" ") || undefined}
    onPointerEnter={e => { if (e.pointerType !== "touch") hint.show(); props.onPointerEnter?.(e); }}
    onPointerLeave={e => { hint.leave(); props.onPointerLeave?.(e); }}
    onFocus={e => { hint.show(); props.onFocus?.(e); }} onBlur={e => { hint.hide(); props.onBlur?.(e); }}
    onPointerDown={e => { hint.hide(); props.onPointerDown?.(e); }} onClick={e => { hint.hide(); props.onClick?.(e); }}>
    {busy && <LoaderCircle className="ui-spin" aria-hidden="true" />}{children}
  </button>{hint.tooltip}</>;
}
export function IconButton(props: Omit<ButtonProps, "iconOnly"> & { "aria-label": string }) { return <Button {...props} iconOnly />; }
export function Summary({ className = "", title, ref, variant = "quiet", iconOnly = false, ...props }: ComponentPropsWithRef<"summary"> & Appearance) {
  const hint = useHint(title ?? props["aria-label"]);
  return <><summary {...props} ref={node => { hint.setAnchor(node); assignRef(ref, node); }} className={`ui-summary ${className}`} data-variant={variant} data-icon-only={iconOnly || undefined}
    aria-describedby={[props["aria-describedby"], hint.open ? hint.id : null].filter(Boolean).join(" ") || undefined}
    onPointerEnter={e => { if (e.pointerType !== "touch") hint.show(); props.onPointerEnter?.(e); }}
    onPointerLeave={e => { hint.leave(); props.onPointerLeave?.(e); }}
    onFocus={e => { hint.show(); props.onFocus?.(e); }} onBlur={e => { hint.hide(); props.onBlur?.(e); }}
    onClick={e => { hint.hide(); props.onClick?.(e); }} />{hint.tooltip}</>;
}
export function Input({className = "", ...props}: ComponentPropsWithRef<"input">) { return <input {...props} className={`ui-input ${className}`} />; }
export function Textarea({className = "", ...props}: ComponentPropsWithRef<"textarea">) { return <textarea {...props} className={`ui-input ${className}`} />; }
export function Select({className = "", ...props}: ComponentPropsWithRef<"select">) { return <select {...props} className={`ui-input ${className}`} />; }
export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="ui-field">{label}{children}</label>; }
export function MenuItem(props: ButtonProps) { return <Button {...props} variant="quiet" className={`ui-menu-item ${props.className ?? ""}`} />; }
export function SegmentedControl<T extends string | number>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T; onChange: (value: T) => void }) {
  const name = useId();
  return <fieldset className="ui-segments"><legend>{label}</legend><div>{options.map(option => <label key={option}><Input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} /><span>{option}</span></label>)}</div></fieldset>;
}
