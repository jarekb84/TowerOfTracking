import type { ParsedGameRun } from '../../types/game-run.types';
import { findField } from '../../utils/field-utils';

interface RunDetailsProps {
  run: ParsedGameRun;
}

const STAT_GROUPS = {
  'Battle Report': [
    'Game Time', 'Real Time', 'Tier', 'Wave', 'Killed By', 'Coins Earned', 
    'Cash Earned', 'Interest Earned', 'Gem Blocks Tapped', 'Cells Earned', 
    'Reroll Shards Earned'
  ],
  'Combat': [
    'Damage Taken', 'Damage Taken Wall', 'Damage Taken While Berserked', 
    'Damage Gain From Berserk', 'Death Defy', 'Lifesteal', 'Damage Dealt', 
    'Projectiles Damage', 'Projectiles Count', 'Thorn Damage', 'Orb Damage', 
    'Land Mine Damage', 'Land Mines Spawned', 'Rend Armor Damage', 'Death Ray Damage', 
    'Smart Missile Damage'
  ],
  'Utility': [
    'Inner Land Mine Damage', 'Chain Lightning Damage', 'Death Wave Damage', 
    'Swamp Damage', 'Black Hole Damage', 'Orb Hits', 'Waves Skipped', 
    'Recovery Packages'
  ],
  'Enemies Destroyed': [
    'Free Attack Upgrade', 'Free Defense Upgrade', 'Free Utility Upgrade', 
    'HP From Death Wave', 'Coins from Death Wave', 'Cash from Golden Tower', 
    'Coins from Golden Tower', 'Coins from Blackhole', 'Coins from Spotlight', 
    'Coins from Orbs', 'Coins from Coin Upgrade', 'Coins from Coin Bonuses', 
    'Total Enemies', 'Basic', 'Fast', 'Tank', 'Ranged', 'Boss', 'Protector', 
    'Total Elites', 'Vampires', 'Rays', 'Scatters', 'Saboteurs', 'Commanders', 
    'Overcharges', 'Destroyed by Orbs', 'Destroyed by Thorns'
  ],
  'BOTS': [
    'Destroyed by Death ray', 'Destroyed by Land Mine', 'Flame bot damage', 
    'Thunder bot stuns', 'Golden bot coins earned'
  ],
  'GUARDIAN': [
    'Damage', 'Coins Stolen', 'Guardian catches', 'Coins Fetched', 'Gems', 
    'Medals', 'Reroll Shards', 'Cannon Shards', 'Armor Shards', 'Generator Shards', 
    'Core Shards', 'Common Modules', 'Rare Modules'
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {fieldsData.map(({ key, displayName, value }) => (
          <div
            key={key}
            className="flex justify-between items-center p-2 bg-background rounded border"
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
      const field = findField(run, fieldName);
      if (field) {
        return {
          key: field.originalKey,
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
    Object.values(STAT_GROUPS).flat().map(field => field.toLowerCase())
  );
  
  // Find unmatched fields
  const unmatchedFields = Object.keys(run.fields)
    .filter(camelKey => {
      const field = run.fields[camelKey];
      return !categorizedFields.has(field.originalKey.toLowerCase());
    })
    .map(camelKey => ({
      key: run.fields[camelKey].originalKey,
      displayName: run.fields[camelKey].originalKey,
      value: run.fields[camelKey].displayValue
    }));

  // Get notes from field structure
  const notes = run.fields?.notes?.displayValue || '';

  return (
    <div className="space-y-6">
      <h4 className="font-medium text-lg">Complete Run Data</h4>
      
      {notes && notes.trim() !== '' && (
        <div className="space-y-3">
          <h5 className="font-semibold text-base text-primary border-b border-border pb-1">
            Notes
          </h5>
          <div className="p-3 bg-background rounded border">
            <p className="text-sm whitespace-pre-wrap">{notes.trim()}</p>
          </div>
        </div>
      )}
      
      {Object.entries(STAT_GROUPS).map(([groupTitle, fields]) => (
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