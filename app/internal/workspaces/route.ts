import { parseCommand, WorkspaceError } from "@/features/workspaces/domain";
import { executeWorkspaceCommand, exportWorkspace, listWorkspaces } from "@/features/workspaces/postgres";
import { permitsWorkspaceRequest, servingOrigins } from "@/features/workspaces/request-policy";

export const runtime = "nodejs";
function response(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store", "Vary": "Origin, Sec-Fetch-Site" } });
}
function authorized(request: Request) {
  return permitsWorkspaceRequest(request, servingOrigins());
}
function failure(error: unknown) {
  if (error instanceof WorkspaceError) return response({ error: error.message }, error.status);
  return response({ error: "Workspace storage is unavailable. Your edits have not been discarded; retry the same request." }, 503);
}
export async function GET(request: Request) {
  if (!authorized(request)) return response({ error: "Request origin is not allowed." }, 403);
  try {
    const id = new URL(request.url).searchParams.get("export");
    if (id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return response({ error: "Invalid workspace ID." }, 400);
      return response(await exportWorkspace(id));
    }
    return response({ workspaces: await listWorkspaces() });
  }
  catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  if (!authorized(request)) return response({ error: "Request origin is not allowed." }, 403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json")
    return response({ error: "Expected JSON." }, 415);
  try {
    const reader = request.body?.getReader();
    if (!reader) return response({ error: "Expected a command." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 150000) { await reader.cancel(); return response({ error: "Command is too large." }, 413); }
      chunks.push(value);
    }
    let input: unknown;
    try { input = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { return response({ error: "Invalid JSON." }, 400); }
    return response({ workspace: await executeWorkspaceCommand(parseCommand(input)) });
  } catch (error) { return failure(error); }
}
