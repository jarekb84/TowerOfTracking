import { Button } from '@/components/ui/button';
import { useMigrationTakeover, type TakeoverState } from './use-migration-takeover';

const DISCORD_BUG_REPORTS_URL = 'https://discord.gg/towertracking';

interface MigrationTakeoverProps {
  onMigrationCommitted: () => void;
}

export function MigrationTakeover({ onMigrationCommitted }: MigrationTakeoverProps) {
  const { state, downloadBackup, runMigration, retry } = useMigrationTakeover(onMigrationCommitted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-xl rounded-lg border border-orange-500/40 bg-neutral-900 p-6 text-neutral-100 shadow-2xl">
        <h1 className="mb-3 text-2xl font-semibold text-orange-400">
          Your run history needs a quick update
        </h1>
        <p className="mb-4 text-sm leading-relaxed text-neutral-300">
          The Tower v28 changed how run data is exported. Tower of Tracking needs
          to reorganize your saved history to match the new format. This is a
          one-time step.
        </p>
        <p className="mb-6 text-sm text-neutral-400">
          Questions?{' '}
          <a
            href={DISCORD_BUG_REPORTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 underline hover:text-orange-300"
          >
            Ask in #bug-reports on Discord
          </a>
          .
        </p>

        <TakeoverBody
          state={state}
          onDownload={downloadBackup}
          onRun={runMigration}
          onRetry={retry}
        />
      </div>
    </div>
  );
}

interface TakeoverBodyProps {
  state: TakeoverState;
  onDownload: () => void;
  onRun: () => void;
  onRetry: () => void;
}

function SuccessPanel({ state }: { state: TakeoverState }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-emerald-300">
        {state.runCount} runs migrated successfully.
      </p>
      {state.unrecognizedFields && state.unrecognizedFields.length > 0 && (
        <p className="text-xs text-neutral-400">
          Preserved under unrecognizedField_ prefix:{' '}
          {state.unrecognizedFields.join(', ')}
        </p>
      )}
      {state.droppedFields && state.droppedFields.length > 0 && (
        <p className="text-xs text-neutral-500">
          Dropped (removed-feature columns): {state.droppedFields.join(', ')}
        </p>
      )}
      <Button onClick={() => window.location.reload()} className="w-full">
        Refresh to continue
      </Button>
    </div>
  );
}

function FailurePanel({ state, onRetry }: { state: TakeoverState; onRetry: () => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-red-400">
        {state.failingRowIndex !== undefined
          ? `Row ${state.failingRowIndex + 1} couldn't be migrated.`
          : 'Migration failed.'}
      </p>
      {state.failureMessage && (
        <p className="text-xs text-neutral-400">{state.failureMessage}</p>
      )}
      <p className="text-xs text-neutral-400">
        Share the downloaded backup in{' '}
        <a
          href={DISCORD_BUG_REPORTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-400 underline hover:text-orange-300"
        >
          #bug-reports on Discord
        </a>
        .
      </p>
      <Button onClick={onRetry} className="w-full">
        Try Again
      </Button>
    </div>
  );
}

function TakeoverBody({ state, onDownload, onRun, onRetry }: TakeoverBodyProps) {
  if (state.phase === 'succeeded') return <SuccessPanel state={state} />;
  if (state.phase === 'failed') return <FailurePanel state={state} onRetry={onRetry} />;

  const step2Disabled =
    state.phase === 'awaiting-backup' || state.phase === 'migrating';

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
          Step 1
        </div>
        <Button onClick={onDownload} className="w-full">
          Download Backup
        </Button>
      </div>

      <div>
        <div className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
          Step 2
        </div>
        <Button
          onClick={onRun}
          disabled={step2Disabled}
          className="w-full"
          variant="default"
        >
          {state.phase === 'migrating' ? 'Running migration…' : 'Run Migration'}
        </Button>
      </div>
    </div>
  );
}
