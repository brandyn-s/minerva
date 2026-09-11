// Additive deployment prerequisite; does not alter existing run records.
// Run with the existing Expedition connection before publishing lens selection.
import { loader } from '../tests/helpers/load-ts.mjs';
const { PostgresStore } = loader()('features/experiments/postgres-store.ts');
if (!process.env.EXPEDITION_DATABASE_URL) throw new Error('Expedition database connection is required');
const store = new PostgresStore(process.env.EXPEDITION_DATABASE_URL);
await store.installSelectionGuard();
console.log('Selection writer guard installed. Runs without an applied lens retain their existing behavior.');
process.exit(0);
