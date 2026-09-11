import type { ReactNode } from "react";

/** The same ring at button size and in every waiting banner. */
export function Spinner() {
  return <span className="ui-spinner" aria-hidden="true" />;
}

export function LoadingStatus({ title, description, className = "", id, children }: {
  title: string; description?: string; className?: string; id?: string; children?: ReactNode;
}) {
  return <div id={id} className={`ui-loading-status ${className}`} role="status" aria-live="polite" aria-atomic="true">
    <Spinner />
    <div className="ui-loading-copy"><strong>{title}</strong>{description && <span>{description}</span>}</div>
    {children}
  </div>;
}
