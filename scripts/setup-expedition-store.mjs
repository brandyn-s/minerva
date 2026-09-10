// Run once with node --env-file=.env.local; never print database credentials.
import { loader } from '../tests/helpers/load-ts.mjs';
const {PostgresStore}=loader()('features/experiments/postgres-store.ts');
if(!process.env.EXPEDITION_DATABASE_URL)throw new Error('EXPedition database connection is missing');
const store=new PostgresStore(process.env.EXPEDITION_DATABASE_URL);
await store.initialize();
console.log('Expedition schema is ready; existing application schemas were left untouched.');
process.exit(0);
