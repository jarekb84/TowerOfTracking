/**
 * Centralized localStorage keys touched by the V3 migration flow.
 *
 * Kept as string constants (not an enum) so they stringify identically in
 * tests, scripts, and runtime code. Importing from a single source prevents
 * the kind of key-drift bug that the Local Storage Safety review agent
 * flags.
 */

export const DATA_KEY = 'tower-tracking-csv-data';
export const VERSION_KEY = 'tower-tracking-data-version';

/** Pre-migration copy of the raw V2 CSV. Written by the gate before any UI renders. */
export const BACKUP_KEY = 'tower-tracking-csv-data-backup-pre-v3';

/** ISO timestamp set once the user completes the Step 1 "Download Backup" action. */
export const BACKUP_CONFIRMED_KEY = 'tower-tracking-v3-migration-backup-confirmed';

/** ISO timestamp of the most-recent successful download-backup (drives the reminder banner). */
export const LAST_BACKUP_AT_KEY = 'tower-tracking-last-backup-at';

/** Counter of runs added since the last download-backup (drives the reminder banner). */
export const RUNS_SINCE_LAST_BACKUP_KEY = 'tower-tracking-runs-since-last-backup';

/**
 * Column-header prefix that marks game-field columns in the current
 * storage format (PRD §9.1 Option C). Every non-internal CSV header
 * starts with this — including `unrecognizedField_` passthroughs, which
 * become `<prefix>unrecognizedField_<name>`. Bumping data-format version
 * (v3 -> v4) is a single-point change here.
 *
 * Keep trailing underscore in the constant so call sites read
 * `${V3_COLUMN_PREFIX}${fieldName}` without worrying about separators.
 */
export const V3_COLUMN_PREFIX = 'v3_';

/** The major data-format version embedded in V3_COLUMN_PREFIX. Used by
 *  version-detection and commit-v3-migration to stay in lockstep. */
export const V3_COLUMN_PREFIX_VERSION = 3;
