import { ExperimentStore } from "./store";
export function localStore(request?: Request): ExperimentStore {
  if (process.env.VERCEL || !process.env.MINERVA_EXPERIMENT_DB) throw new Error("Durable Expedition is not configured. Start the local store and worker; hosted durability is unavailable.");
  if (request) {
    const url=new URL(request.url),origin=request.headers.get("origin"),host=request.headers.get("host")??url.host;
    if(!["localhost","127.0.0.1","[::1]"].includes(url.hostname)||!["localhost","127.0.0.1","[::1]"].includes(new URL(`http://${host}`).hostname)||(origin&&new URL(origin).host!==host))throw new Error("Local Expedition requires a same-origin loopback request");
  }
  return new ExperimentStore(process.env.MINERVA_EXPERIMENT_DB);
}
