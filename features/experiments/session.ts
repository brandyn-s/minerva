import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
export async function expeditionOwner(){
 if(!process.env.EXPEDITION_DATABASE_URL)return undefined;
 const jar=await cookies();let owner=jar.get('minerva-expedition')?.value;
 if(!owner||! /^[0-9a-f-]{36}$/.test(owner)){owner=randomUUID();jar.set('minerva-expedition',owner,{httpOnly:true,secure:!!process.env.VERCEL,sameSite:'strict',path:'/',maxAge:31536000});}
 return owner;
}
