import type { TalkRequest } from "./generation";
function clip(text:string,bytes:number){let used=0,result="";for(const char of text){const n=new TextEncoder().encode(char).length;if(used+n>bytes)break;used+=n;result+=char;}return result;}
export function boundContext(cards:TalkRequest["cards"],selectedIds:string[],focusedId:string|null,maxCards=12){
 const prioritized=cards.length<=maxCards?cards:[...cards.filter(c=>c.id===focusedId),...cards.filter(c=>selectedIds.includes(c.id)&&c.id!==focusedId),...cards.filter(c=>!selectedIds.includes(c.id)&&c.id!==focusedId)];
 let chosen=prioritized.slice(0,maxCards).map(c=>({...c,title:clip(c.title,500),summary:clip(c.summary,1200),body:clip(c.body,4000),relationships:c.relationships.slice(0,12).map(e=>({...e,label:clip(e.label,160),contribution:e.contribution&&clip(e.contribution,160)}))}));
 while(chosen.length&&new TextEncoder().encode(JSON.stringify(chosen)).length>120000)chosen=chosen.slice(0,-1);
 const ids=new Set(chosen.map(c=>c.id));
 return {cards:chosen.map(c=>({...c,relationships:c.relationships.filter(e=>ids.has(e.from)&&ids.has(e.to))})),selectedIds:selectedIds.filter(id=>ids.has(id)),focusedId:focusedId&&ids.has(focusedId)?focusedId:null,contextCoverage:{totalCards:cards.length,includedCards:chosen.length,omittedCards:cards.length-chosen.length,truncatedCardIds:chosen.filter(c=>{const original=cards.find(o=>o.id===c.id)!;return c.body!==original.body||c.title!==original.title||c.summary!==original.summary||JSON.stringify(c.relationships)!==JSON.stringify(original.relationships);}).map(c=>c.id)}};
}
export function boundMessages(messages:TalkRequest["messages"]){return messages.slice(-12).map(m=>({...m,content:clip(m.content,2000)}));}
