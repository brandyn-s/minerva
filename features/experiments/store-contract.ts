import type { ExperimentStore } from "./store";
import type { PostgresStore } from "./postgres-store";
export type Store = ExperimentStore | PostgresStore;
