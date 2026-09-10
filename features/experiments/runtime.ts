import { ExperimentStore } from "./store";
export function localStore(request?: Request): ExperimentStore {
  if (process.env.VERCEL || !process.env.MINERVA_EXPERIMENT_DB) throw new Error("Durable Expedition is not configured. Start the local store and worker; hosted durability is unavailable.");
  if (request) {
    const url=new URL(request.url),origin=request.headers.get("origin"),host=request.headers.get("host")??url.host;
    if(!["localhost","127.0.0.1","[::1]"].includes(url.hostname)||!["localhost","127.0.0.1","[::1]"].includes(new URL(`http://${host}`).hostname)||(origin&&new URL(origin).host!==host))throw new Error("Local Expedition requires a same-origin loopback request");
  }
  return new ExperimentStore(process.env.MINERVA_EXPERIMENT_DB);
}

export async function experimentStore(request?:Request){
  if(process.env.EXPEDITION_DATABASE_URL){
    if(request){const url=new URL(request.url),origin=request.headers.get('origin'),host=request.headers.get('host')??url.host;if(origin&&new URL(origin).host!==host)throw new Error('Expedition requires a same-origin request');}
    const {PostgresStore}=await import('./postgres-store');return new PostgresStore(process.env.EXPEDITION_DATABASE_URL);
  }
  return localStore(request);
}
export function expeditionSettings(){
  const fixture=process.env.MINERVA_EXPERIMENT_PROVIDER==='fixture'||(!process.env.EXPEDITION_DATABASE_URL&&process.env.MINERVA_EXPERIMENT_LIVE!=='1');
  return {provider:fixture?'fixture' as const:'gateway' as const,maxCalls:12,maxCostMicros:fixture?0:6000000,callReservationMicros:fixture?0:500000};
}
