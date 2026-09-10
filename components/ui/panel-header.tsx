import Image from "next/image";
import type { ReactNode, Ref } from "react";
import { IconButton } from "./controls";
import { actions as uiActions } from "./actions";

export default function PanelHeader({ title, image, close, actions, titleId, headingRef, closeLabel = uiActions.close.label }: {
  title: string; image?: string; close: () => void; actions?: ReactNode; titleId?: string; headingRef?: Ref<HTMLHeadingElement>; closeLabel?: string;
}) {
  return <header className="panel-heading ui-panel-header">
    <div className="ui-panel-title">
      {image && <Image src={image} alt="" width={32} height={32} />}
      <h2 id={titleId} ref={headingRef} tabIndex={headingRef ? -1 : undefined}>{title}</h2>
    </div>
    <div className="ui-panel-actions">{actions}<IconButton aria-label={closeLabel} onClick={close}><uiActions.close.Icon /></IconButton></div>
  </header>;
}
