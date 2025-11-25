import type { ParsedGameRun, RunTypeValue } from '@/shared/types/game-run.types';
import { getFieldDisplayConfig } from '../fields/field-display-config';
import { buildContainerClassName, buildValueClassName } from '../fields/field-rendering-utils';
import { EditableUserFields } from '../editing/editable-user-fields';
import { useData } from '@/shared/domain/use-data';
import {
  createUpdatedNotesFields,
  createUpdatedRunTypeFields,
  createUpdatedRankFields,
  extractNotesValue,
  extractRunTypeValue,
  extractRankValue,
  type RankValue,
} from '../editing/field-update-logic';

interface RunDetailsProps {
  run: ParsedGameRun;
}

const STAT_GROUPS = {
  "Battle Report": [
    "gameTime", "realTime", "tier", "wave", "killedBy", 
    "coinsEarned", "coinsPerHour", "cashEarned", "interestEarned", 
    "gemBlocksTapped", "cellsEarned", "rerollShardsEarned"
  ],
  "Combat": [
    "damageDealt","damageTaken", "damageTakenWall", "damageTakenWhileBerserked", "damageGainFromBerserk", "deathDefy", 
    "lifesteal", "projectilesDamage", "projectilesCount", "thornDamage",
    "orbHits","orbDamage", "enemiesHitByOrbs", 
    "landMineDamage", "landMinesSpawned", "rendArmorDamage", "deathRayDamage", 
    "smartMissileDamage", "innerLandMineDamage", "chainLightningDamage", 
    "deathWaveDamage", "taggedByDeathwave" ,"swampDamage", "blackHoleDamage", 
  ],
  "Utility": [     
    "wavesSkipped", "recoveryPackages", 
    "freeAttackUpgrade", "freeDefenseUpgrade", "freeUtilityUpgrade", 
    "hpFromDeathWave", "coinsFromDeathWave", 
    "cashFromGoldenTower", "coinsFromGoldenTower", 
    "coinsFromBlackHole", "coinsFromBlackhole", 
    "coinsFromSpotlight", 
    "coinsFromOrbs", "coinsFromOrb", 
    "coinsFromCoinUpgrade", "coinsFromCoinBonuses",
  ],
  "Enemies Destroyed": [
    "totalEnemies", "basic", "fast", "tank", "ranged", "boss", "protector", 
    "totalElites", "vampires", "rays", "scatters", "saboteurs", "saboteur", 
    "commanders","commander", "overcharges", "overcharge", 
    "destroyedByOrbs", "destroyedByThorns", "destroyedByDeathRay", "destroyedByLandMine", "destroyedInSpotlight"
  ],
  "BOTS": [
    "flameBotDamage", "thunderBotStuns", "goldenBotCoinsEarned", "destroyedInGoldenBot"
  ],
  "GUARDIAN": [
    "damage","summonedEnemies", 
    "guardianCoinsStolen", "guardianCatches", 
    "coinsStolen", "coinsFetched", 
    "gems", "medals", 
    "rerollShards", "cannonShards", "armorShards", "generatorShards", "coreShards", 
    "commonModules", "rareModules"
  ],
  "__SKIP__": [
    "_date", "_time", "_runType", "_notes", "_rank", "battleDate"
  ]
};


function StatSection({ title, fieldsData }: {
  title: string;
  fieldsData: Array<{ key: string; displayName: string; value: string }>;
}) {
  if (fieldsData.length === 0) return null;

  return (
    <div className="space-y-4">
      <h5 className="font-semibold text-base text-primary border-b border-border/40 pb-2 flex items-center gap-2">
        {title}
        <span className="text-xs text-muted-foreground font-normal">({fieldsData.length} items)</span>
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fieldsData.map(({ key, displayName, value }) => {
          const config = getFieldDisplayConfig(key);
          const isEmpty = !value || value.trim() === '';

          return (
            <div key={key} className={buildContainerClassName(config)}>
              {!config.hideLabel && (
                <span className="font-mono text-sm text-muted-foreground truncate flex-1 mr-3">
                  {displayName}
                </span>
              )}
              <span className={buildValueClassName(config)}>
                {isEmpty && config.fullWidth ? (
                  <span className="text-muted-foreground/50 italic text-xs">No value</span>
                ) : (
                  value
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatGroup({ title, fields, run }: {
  title: string;
  fields: string[];
  run: ParsedGameRun;
}) {
  const availableFields = fields
    .map(fieldName => {
      const field = run.fields[fieldName];
      if (field) {
        return {
          key: fieldName,
          displayName: field.originalKey,
          value: field.displayValue
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{ key: string; displayName: string; value: string }>;

  return <StatSection title={title} fieldsData={availableFields} />;
}

export function RunDetails({ run }: RunDetailsProps) {
  const { updateRun } = useData();

  const handleUserFieldsUpdate = (newNotes: string, newRunType: RunTypeValue, newRank: RankValue) => {
    let updatedFields = { ...run.fields };

    // Apply notes update if changed
    if (newNotes !== extractNotesValue(run.fields)) {
      updatedFields = createUpdatedNotesFields(updatedFields, newNotes);
    }

    // Apply run type update if changed
    const currentRunType = extractRunTypeValue(run);
    if (newRunType !== currentRunType) {
      updatedFields = createUpdatedRunTypeFields(updatedFields, newRunType);
    }

    // Apply rank update if changed
    const currentRank = extractRankValue(run.fields);
    if (newRank !== currentRank) {
      updatedFields = createUpdatedRankFields(updatedFields, newRank);
    }

    // Single update with all changes
    updateRun(run.id, {
      fields: updatedFields,
      runType: newRunType  // Update cached property
    });
  };

  // Get all fields that are already categorized
  const categorizedFields = new Set(
    Object.values(STAT_GROUPS).flat().map(field => field)
  );

  // Find unmatched fields
  const unmatchedFields = Object.keys(run.fields)
    .filter(camelKey => {
      return !categorizedFields.has(camelKey);
    })
    .map(camelKey => ({
      key: run.fields[camelKey].originalKey,
      displayName: run.fields[camelKey].originalKey,
      value: run.fields[camelKey].displayValue
    }));

  const notes = extractNotesValue(run.fields);
  const runType = extractRunTypeValue(run);
  const rank = extractRankValue(run.fields);

  return (
    <div className="space-y-6">
      <EditableUserFields
        notes={notes}
        runType={runType}
        rank={rank}
        onSave={handleUserFieldsUpdate}
      />

      {Object.entries(STAT_GROUPS).filter(([groupTitle]) => groupTitle !== "__SKIP__").map(([groupTitle, fields]) => (
        <StatGroup
          key={groupTitle}
          title={groupTitle}
          fields={fields}
          run={run}
        />
      ))}

      <StatSection
        title="Misc"
        fieldsData={unmatchedFields}
      />
    </div>
  );
}