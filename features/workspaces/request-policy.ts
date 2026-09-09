// Transport policy stays outside the application-owned workspace domain.
export function servingOrigins(): string[] {
  const configured = process.env.MINERVA_ORIGINS?.split(",").map((s) => s.trim()) ??
    (process.env.NODE_ENV === "production" ? [] : ["http://127.0.0.1:3000", "http://localhost:3000"]);
  // Deployment identity comes from Vercel, never from request headers.
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL)
    configured.push(`https://${process.env.VERCEL_URL}`);
  return configured;
}
export function permitsWorkspaceRequest(request: Request, configuredOrigins: string[]): boolean {
  const host = request.headers.get("host");
  const allowed = configuredOrigins.some((origin) => {
    try { return new URL(origin).host === host; } catch { return false; }
  });
  if (!allowed) return false;
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = request.headers.get("origin");
  const matchingOrigin = configuredOrigins.some((allowedOrigin) => {
    try { return allowedOrigin === origin && new URL(allowedOrigin).host === host; }
    catch { return false; }
  });
  if (origin !== null && !matchingOrigin) return false;
  return request.method === "GET" || request.method === "HEAD" || matchingOrigin;
}
