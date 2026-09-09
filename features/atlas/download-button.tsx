"use client";

import { useState } from "react";
import { relationshipsFor, type Thought, type Relationship } from "./domain";

function cardMarkdown(card: Thought, allCards: Thought[], edges: Relationship[], level: number) {
  const heading = "#".repeat(level);
  const title = (value: string) => value.replace(/[\r\n]+/g, " ");
  const relationships = relationshipsFor(card.id, edges).map((edge) => {
    const other = allCards.find((item) => item.id === edge.otherId);
    return `- ${edge.direction} / ${edge.kind}: ${title(other?.title ?? edge.otherId)}\n  Label: ${edge.label}\n  Contribution: ${edge.contribution || "Not specified"}`;
  }).join("\n\n");
  return `${heading} ${title(card.title)}\n\n${heading}# Summary\n\n${card.summary}\n\n${heading}# Body\n\n${card.body}\n\n${heading}# Decision\n\n${card.decision}\n\n${heading}# Evidence\n\n${card.evidence}\n\n${heading}# Contribution\n\n${card.contribution}\n\n${heading}# Relationships\n\n${relationships || "None"}\n`;
}

export default function DownloadButton({ cards, relationships, card }: {
  cards: Thought[]; relationships: Relationship[]; card?: Thought;
}) {
  const [error, setError] = useState(false);
  function download() {
    let url: string | undefined;
    const anchor = document.createElement("a");
    try {
      const markdown = card ? cardMarkdown(card, cards, relationships, 1) :
        `# Minerva atlas\n\n${cards.map((item) => cardMarkdown(item, cards, relationships, 2)).join("\n---\n\n")}`;
      const filename = card ? (card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "thought") : "minerva-atlas";
      url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
      anchor.href = url; anchor.download = `${filename}.md`;
      document.body.append(anchor); anchor.click(); setError(false);
    } catch { setError(true); }
    finally {
      anchor.remove();
      // Let the browser acquire the download before revoking its object URL.
      if (url) setTimeout(() => URL.revokeObjectURL(url!), 1000);
    }
  }
  return <div>
    {error && <p role="alert">The download could not start. Please retry.</p>}
    <button onClick={download}>{error ? "Retry" : "Download"}</button>
  </div>;
}
