import type { ParsedGameRun } from '../../types/game-run.types';

interface RunDetailsProps {
  run: ParsedGameRun;
}

const STAT_GROUPS = {
  "Notes": [
    "notes"
  ],
  "Battle Report": [
    "gameTime", "realTime", "tier", "wave", "killedBy", "coinsEarned", "cashEarned", "interestEarned", 
    "gemBlocksTapped", "cellsEarned", "rerollShardsEarned"
  ],
  "Combat": [
    "damageTaken", "damageTakenWall", "damageTakenWhileBerserked", "damageGainFromBerserk", "deathDefy", 
    "lifesteal", "damageDealt", "projectilesDamage", "projectilesCount", "thornDamage", "orbDamage", 
    "landMineDamage", "landMinesSpawned", "rendArmorDamage", "deathRayDamage", "smartMissileDamage"
  ],
  "Utility": [
    "innerLandMineDamage", "chainLightningDamage", "deathWaveDamage", "swampDamage", "blackHoleDamage", 
    "orbHits", "wavesSkipped", "recoveryPackages"
  ],
  "Enemies Destroyed": [
    "freeAttackUpgrade", "freeDefenseUpgrade", "freeUtilityUpgrade", "hpFromDeathWave", "coinsFromDeathWave", 
    "cashFromGoldenTower", "coinsFromGoldenTower", "coinsFromBlackhole", "coinsFromSpotlight", "coinsFromOrbs", 
    "coinsFromCoinUpgrade", "coinsFromCoinBonuses", "totalEnemies", "basic", "fast", "tank", "ranged", "boss", 
    "protector", "totalElites", "vampires", "rays", "scatters", "saboteurs", "commanders", "overcharges", 
    "destroyedByOrbs", "destroyedByThorns"
  ],
  "BOTS": [
    "destroyedByDeathRay", "destroyedByLandMine", "flameBotDamage", "thunderBotStuns", "goldenBotCoinsEarned"
  ],
  "GUARDIAN": [
    "damage", "coinsStolen", "guardianCatches", "coinsFetched", "gems", "medals", "rerollShards", 
    "cannonShards", "armorShards", "generatorShards", "coreShards", "commonModules", "rareModules"
  ],
  "__SKIP__": [
    "date", "time"
  ]
};


function StatSection({ title, fieldsData }: {
  title: string;
  fieldsData: Array<{ key: string; displayName: string; value: string }>;
}) {
  if (fieldsData.length === 0) return null;

  return (
    <div className="space-y-3">
      <h5 className="font-semibold text-base text-primary border-b border-border pb-1">
        {title}
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
        {fieldsData.map(({ key, displayName, value }) => (
          <div
            key={key}
            className="flex justify-between items-center p-3 bg-muted/15 rounded-md border-border/20 border transition-colors duration-200 hover:bg-muted/25"
          >
            <span className="font-mono text-sm text-muted-foreground">
              {displayName}
            </span>
            <span className="font-mono text-sm font-medium">
              {value}
            </span>
          </div>
        ))}
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
  
  return (
    <div className="space-y-6">
      <h4 className="font-medium text-lg text-primary border-b border-border/30 pb-2">Complete Run Data</h4>
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