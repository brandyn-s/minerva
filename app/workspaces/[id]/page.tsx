import SavedAtlas from "@/features/workspaces/saved-atlas";
import { notFound } from "next/navigation";

export default async function WorkspaceAtlasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  return <SavedAtlas workspaceId={id} />;
}
