"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { createPortal } from "react-dom";

/** Shared, unscaled tooltip for controls both on and outside the atlas canvas. */
export default function TooltipButton({ title, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const cancel = () => clearTimeout(timer.current);
  const show = () => { cancel(); setOpen(true); };
  const hide = () => { cancel(); setOpen(false); };
  const leave = () => { cancel(); timer.current = setTimeout(() => setOpen(false), 120); };

  useEffect(() => () => clearTimeout(timer.current), []);
  useLayoutEffect(() => {
    if (!open || !tip.current || !button.current) return;
    const anchor = button.current.getBoundingClientRect();
    const bubble = tip.current;
    // Toolbar hints open into the canvas, leaving the storage controls above reachable.
    const above = !button.current.closest(".field-tools") && anchor.top >= bubble.offsetHeight + 16;
    const left = Math.max(8, Math.min(anchor.left + anchor.width / 2 - bubble.offsetWidth / 2, window.innerWidth - bubble.offsetWidth - 8));
    bubble.style.left = `${left}px`;
    bubble.style.top = `${above ? anchor.top - bubble.offsetHeight - 10 : anchor.bottom + 10}px`;
    bubble.dataset.side = above ? "above" : "below";
    bubble.style.setProperty("--tip-arrow", `${Math.max(12, Math.min(anchor.left + anchor.width / 2 - left, bubble.offsetWidth - 12))}px`);
    const dismiss = () => setOpen(false);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopPropagation(); dismiss(); }
    };
    document.addEventListener("keydown", escape, true);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("keydown", escape, true);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open, title]);

  return <>
    <button {...props} ref={button}
      aria-describedby={[props["aria-describedby"], open && title ? id : undefined].filter(Boolean).join(" ") || undefined}
      onPointerEnter={event => { if (event.pointerType !== "touch") show(); props.onPointerEnter?.(event); }}
      onPointerLeave={event => { leave(); props.onPointerLeave?.(event); }}
      onFocus={event => { show(); props.onFocus?.(event); }}
      onBlur={event => { hide(); props.onBlur?.(event); }}
      onPointerDown={event => { hide(); props.onPointerDown?.(event); }}
      onClick={event => { hide(); props.onClick?.(event); }}
    >{children}</button>
    {open && title && createPortal(<span ref={tip} id={id} role="tooltip" className="minerva-tooltip"
      onPointerEnter={cancel} onPointerLeave={leave}>{title}</span>, document.body)}
  </>;
}
