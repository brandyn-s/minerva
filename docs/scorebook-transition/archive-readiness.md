# Archive completed — September 10, 2026

GitHub archival is verified at `ed2a81c71ee827dc09271b9d007edb5f20788b95`. Accessible project and run data were recovered; remaining unknown coverage was explicitly disposed under the owner's instruction to investigate and fix or discard. See [Batch 09](batch-09.md) and [final manifest](archive-final-manifest.json).

The following is the original Batch 00 assessment, retained as historical evidence and superseded by that final record.

# Scorebook archive readiness

**Source preservation verified; complete historical-data preservation is not established. Repository remains unarchived.** Batch 01 may proceed from preserved source; no archival or service-retirement authority is exercised by Batch 00.

## Preserved

Private location: `/Users/brandyn.schult/research/private/scorebook-preservation` (owner-only directory). Full advertised Git refs/history are mirrored and bundled. `git bundle verify` succeeds; an isolated clone from the bundle resolves the expected main revision and `git fsck --full --no-reflogs` succeeds. The bundle contains 53 refs. Git hosting metadata snapshots include repository metadata, 29 issue/PR entries, issue comments, PR review comments and zero releases. Counts/checksums and explicit coverage are in evidence-manifest.json. This is not a complete GitHub account backup: Actions artifacts/logs, all review objects, settings, deployment configuration, LFS objects if any, and unadvertised/deleted Git objects are not claimed preserved.

Native Scorebook export/projection tests pass on the restored source using synthetic fixtures. Minerva's synthetic v3 fixture validates and round-trips through its native schema; v2 migrates. These checks do not restore an owner workspace or recover missing external records.

## Missing historical data

No Scorebook API/Redis credentials are available in this process; the known Scorebook checkout has only .env.example. A targeted directory search found no development Scorebook checkout under ~/code. No broad credential, browser-profile or unrelated file search was performed. Access may exist elsewhere, but it is not configured for this task.

- Named projects and immutable snapshots: unexported, count unknown. Use the authorized GET project/snapshot routes documented in Scorebook docs/project-storage.md. Export each accessible project through GET /v1/projects/:id/export?profile=complete with provenance:read scope. Store raw exports privately, hash them and validate project/workspace schemas. A project export alone is not proof all snapshots are included.
- Standalone Searchlight runs/control records: unexported, count unknown. Inspect project-referenced run IDs and supported read routes; preserve run/control data separately. Verify completeness against a supported index or scoped backend export before claiming all runs captured.
- Local raw evaluation receipts: unavailable, count unknown. The C1 audit identifies its frozen run and tracked checksum summary. Obtain the known receipt directory from its custodian, verify those recorded hashes, and keep raw prompts/responses private.
- Browser-only/unsynced Scorebook state: not inspected or exported. Use the application export in the relevant authenticated browser session; do not infer it is absent from Redis exports.

No historical workspace was recovered, so native validation/restore of historical workspace data remains pending. Do not substitute fixture tests for that gate.

## GitHub archival versus service retirement

GitHub archival preserves readable tracked code but makes the repository read-only. It does not preserve Redis data, stop deployed applications, revoke credentials or remove infrastructure charges. No deployments, databases, integrations, domains or credentials were changed. Minerva PR #86 explicitly left old external resources alone; its statement is historical evidence, not a current inventory.

Before archival: reconcile remote HEAD, finish accessible external exports and restore checks, resolve missing-evidence disposition with the owner if needed, verify the successor notice/URL, preserve final source and recheck checksums. No README notice has been published. Service retirement needs a separate explicit inventory and authorization.
