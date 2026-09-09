import { parseGraphCommand } from "@/features/workspaces/graph-domain";
import { executeGraphCommand, readWorkspaceGraph } from "@/features/workspaces/graph-postgres";
import { WorkspaceError } from "@/features/workspaces/domain";
import { permitsWorkspaceRequest, servingOrigins } from "@/features/workspaces/request-policy";

export const runtime = "nodejs";
function response(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store", "Vary": "Origin, Sec-Fetch-Site" } });
}
function authorized(request: Request) {
  return permitsWorkspaceRequest(request, servingOrigins());
}
function failure(error: unknown) {
  return error instanceof WorkspaceError ? response({ error: error.message }, error.status)
    : response({ error: "Graph storage is unavailable. Retry the same command to recover its result." }, 503);
}
export async function GET(request: Request) {
  if (!authorized(request)) return response({ error: "Request origin is not allowed." }, 403);
  const id = new URL(request.url).searchParams.get("workspaceId");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return response({ error: "Invalid workspace ID." }, 400);
  try { return response(await readWorkspaceGraph(id)); } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  if (!authorized(request)) return response({ error: "Request origin is not allowed." }, 403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return response({ error: "Expected JSON." }, 415);
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
    let command: unknown;
    try { command = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { return response({ error: "Invalid JSON." }, 400); }
    return response(await executeGraphCommand(parseGraphCommand(command)));
  } catch (error) { return failure(error); }
}
