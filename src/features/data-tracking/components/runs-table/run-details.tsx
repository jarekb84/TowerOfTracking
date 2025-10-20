import type { ParsedGameRun } from '../../types/game-run.types';

interface RunDetailsProps {
  run: ParsedGameRun;
}

const STAT_GROUPS = {
  "Notes": [
    "notes"
  ],
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
    "_date", "_time","_runType", "battleDate"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
        {fieldsData.map(({ key, displayName, value }) => (
          <div
            key={key}
            className="flex justify-between items-center p-3 bg-muted/15 rounded-md border border-border/20 transition-all duration-200 hover:bg-muted/25 hover:border-accent/30 hover:shadow-sm"
          >
            <span className="font-mono text-sm text-muted-foreground truncate flex-1 mr-3">
              {displayName}
            </span>
            <span className="font-mono text-sm font-medium text-foreground shrink-0">
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
      <div className="border-b border-border/40 pb-3 mb-6">
        <h4 className="font-semibold text-lg text-primary">Complete Run Data</h4>
        <p className="text-sm text-muted-foreground mt-1">Detailed statistics and information for this run</p>
      </div>
      
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