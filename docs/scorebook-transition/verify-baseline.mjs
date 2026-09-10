// Read-only, deterministic checks of the pinned Batch 00 implementation.
// Writes only to an explicitly supplied private output directory.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve,dirname,relative} from 'node:path';
import ts from 'typescript';
const req=createRequire(import.meta.url), cache=new Map();
function load(path){
 path=resolve(path); if(cache.has(path))return cache.get(path);
 const out={};cache.set(path,out);
 const code=ts.transpileModule(execFileSync('git',['show','6f148242c93f2cd44868c6374178ef12a8876586:'+relative(root,path)],{cwd:root,encoding:'utf8'}),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('exports','require',code)(out,name=>name.startsWith('.')?load(resolve(dirname(path),name.endsWith('.ts')?name:name+'.ts')):req(name));
 return out;
}
const root=resolve(import.meta.dirname,'../..');
const {fixtureSave,atlasSaveSchema,mergeAtlas}=load(root+'/features/atlas/local-state.ts');
const {cardEdit,reviseCard,revertCard}=load(root+'/features/atlas/card-revisions.ts');
const initial=fixtureSave(), card=initial.thoughts[1];
const changed=reviseCard(card,{...cardEdit(card),contribution:'Synthetic contribution-only edit'});
assert.equal(changed.revision,card.revision+1);
assert.deepEqual(['title','summary','body'].map(k=>changed[k]),['title','summary','body'].map(k=>card[k]));
assert.equal('contribution' in changed.revisions.at(-1),false);
const edited=structuredClone(initial);edited.thoughts[1]=reviseCard(card,{...cardEdit(card),title:card.title+' revised'});
const merged=await mergeAtlas(edited,initial);assert.equal(merged.added,1);
const again=await mergeAtlas(merged.save,initial);assert.equal(again.added,0);
const reverted=revertCard(edited.thoughts[1],1);assert.equal(reverted.revision,3);assert.equal(reverted.title,card.title);
assert.deepEqual(atlasSaveSchema.parse(JSON.parse(JSON.stringify(initial))),initial);
const legacy=structuredClone(initial);legacy.version=2;delete legacy.intents;for(const c of legacy.thoughts)delete c.revisions;
const migrated=atlasSaveSchema.parse(legacy);assert.equal(migrated.version,3);assert.ok(migrated.thoughts.every(c=>c.revisions[0].cause==='imported current content'));
const results={kind:'synthetic native-function checks, not recovered owner workspace',revision:'6f148242c93f2cd44868c6374178ef12a8876586',contributionOnlyMissingFromHistory:true,editedExportAddsDuplicate:merged.added,repeatedSameImportAdds:again.added,revertAppends:true,v3RoundTrip:true,v2Migration:true,fixtureTimestamp:card.revisions[0].time,fixtureChicagoDisplay:new Date(card.revisions[0].time).toLocaleString('en-US',{timeZone:'America/Chicago'})};
if(process.argv[2]){const out=resolve(process.argv[2]);writeFileSync(out+'/minerva-synthetic-v3.json',JSON.stringify(initial,null,2));writeFileSync(out+'/baseline-checks.json',JSON.stringify(results,null,2));}
console.log(JSON.stringify(results,null,2));
