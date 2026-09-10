import test from 'node:test';
import assert from 'node:assert/strict';
import {loader} from './helpers/load-ts.mjs';
const {suggestionsInput,suggestionsSchema}=loader()('features/experiments/suggestions.ts');
test('suggestions require exactly three concise directions and bounded context',()=>{
 const suggestion={title:'Try a new scale',direction:'Explore the idea at neighborhood scale.'};
 assert.equal(suggestionsSchema.parse({suggestions:[suggestion,{title:'Change ownership',direction:'Explore collective ownership.'},{title:'Make it temporary',direction:'Explore reversible short-lived versions.'}]}).suggestions.length,3);
 assert.throws(()=>suggestionsSchema.parse({suggestions:[suggestion]}));
 assert.throws(()=>suggestionsInput.parse({brief:'x'.repeat(1601),sources:[]}));
});
