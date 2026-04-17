# Drive Manager Test Matrix

## Migration

- Migrate remote state from `version:2` to `version:3` and verify `logicalFolders[].items` is not persisted remotely.
- Validate local cache still keeps logical entries for active session after migration.
- Confirm reconnect/hydration preserves `backendId`, packing settings, and listing settings.

## URL Path Navigation

- Open with `?path=Logical/Folder` and verify case-sensitive folder resolution.
- Open with stale logical drive path and verify fallback to logical drive root or all drives.
- Sign out and sign back in with `?path=` present; verify path restore from session storage.

## Delete Logical Drive

- Forget mode removes logical drive from UI and remote manifest without deleting provider root folders.
- Delete-all mode removes backend roots recursively and then removes logical drive manifest entry.
- Missing backend root (`404`) is treated as success.
- Partial backend deletion failure leaves logical drive in `partially_deleted` status with retry/forget options.

## Live Listing and Cache

- First load fetches from provider and writes cache; repeated load hits cache within TTL.
- Cache invalidation after write operations refreshes parent listing.
- Drive priority merge mode only surfaces the highest-priority backend page.
- Combined merge mode merges backend pages and applies configured sorting.

## Corruption and Duplicate Rules

- Completely deleted non-split file disappears from listing.
- Partial chunk deletion marks file as `corrupted`.
- Same path entries without chunk manifest linkage are marked `duplicateCandidate`.

## Quota and Packing

- `100%` configured drive limit enforces effective write cap at `99%`.
- Container mode prefers non-split placement with max fit.
- Form mode fills by drive priority.
- Water vertical/horizontal chunking respects chunk bounds (`100 MB`-`1 GB`).

## Resumability

- Task checkpoints persist locally and restore microtask status after refresh.
- Upload tasks with missing file handles require re-selection and skip already-completed microtasks.
- Non-upload tasks resume from checkpoints on same machine.

## Performance and Memory

- Large folder listing paginates (load more) without freezing UI.
- Large upload planning runs via worker-backed planner for non-blocking interaction.
- Verify no full-file buffering in custom planner/executor paths.
