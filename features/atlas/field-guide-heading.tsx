import Image from "next/image";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/** Shared Expedition-style heading for atlas instruments. */
export default function FieldGuideHeading({ title, image, close, actions }: {
  title: string; image: string; close: () => void; actions?: ReactNode;
}) {
  return <header className="panel-heading field-guide-heading">
    <div className="field-guide-brand">
      <Image src={image} alt="" width={56} height={56} />
      <h2 className="instrument-label">{title}</h2>
    </div>
    <div className="field-guide-heading-actions">
      {actions}
      <button type="button" aria-label="Close panel" onClick={close}><X size={22} aria-hidden="true" /></button>
    </div>
  </header>;
}
