# Batch 09: archived

[Scorebook](https://github.com/brandyn-s/scorebook-api) is archived; GitHub `isArchived: true` verified.
Final main revision: `ed2a81c71ee827dc09271b9d007edb5f20788b95`. Only the archival README notice was committed and pushed.
Minerva successor URL was verified from its actual remote.

## Preservation and disposition

Recovered one indexed project (14 branches, 12 operation records), its complete provenance export, and all three referenced Searchlight run views including results and control state. Five documents passed native project/workspace schemas and JSON roundtrip; five export/projection tests passed. Source bundle verification, isolated final restore and fsck passed.

Private evidence: `/Users/brandyn.schult/research/private/scorebook-preservation`.
Final hashes, counts and coverage: [archive-final-manifest.json](archive-final-manifest.json).
The initial evidence-manifest.json remains a historical Batch 00 snapshot.

The user's “investigate and either fix or discard and move on” instruction resolves the remaining archival prerequisite. Unindexed snapshots, orphaned runs, unsynced browser state and raw local evaluation receipts remain unknown, not assumed empty, recovered or deleted. Scoped searches covered known code/research checkouts including ignored evaluation paths. No browser-profile or broad credential scan was used.

The prior lack of local credentials was not proof the deployed API was inaccessible: direct supported GET routes returned data. This was the recoverable part of the blocker.

## Services and recovery

The deployed health endpoint returned HTTP 200 with live Gateway enabled at the research revision; project reads also returned 200. No deployment, Redis, domain, credential or billing setting was removed or disabled. Current charges were not established. GitHub automation may respond to the documentation push; no deployment command was issued.

Recover source by cloning scorebook-api-final.bundle and checking out the final SHA. Restore project data from the private complete export only through an explicitly authorized import into an appropriate environment; validation here did not mutate hosted records. Unarchiving is possible but was not needed.

Minerva implementation changes remain uncommitted in their existing worktree. No more preservation investigation is required to close this batch.
