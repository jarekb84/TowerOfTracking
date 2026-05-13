# 3d. Discoverability — "where is `coins_goldenTower` used?"

> Part of the Field Graph Architecture spec.
> [< Prev: 3c. Adding a new UI view](./03c-adding-a-new-ui-view.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3e. Silent-break modes >](./03e-silent-break-modes.md)

---

_Part of §3 (Evaluation). See [3a](./03a-adding-a-new-v29-field.md) for the parent intro._

One query:

```typescript
graph.describe('coins_goldenTower');
// {
//   displayName: 'Golden Tower',
//   color: '#fbbf24',
//   section: 'section:coins',
//   category: 'category:economic',
//   isSourceOf: ['battleReport_coinsEarned'],
//   derivedFrom: [],
//   renamedFrom: ['coinsFromGoldenTower'],
//   appearsInViews: [
//     'view:run-details.coins-earned',
//     'view:source-analysis.coins',
//     'view:field-analytics',
//   ],
//   sharesLabelWith: ['damage_goldenTower', 'killedWithEffectActive_goldenTower'],
//   correlatedWith: [],
//   participatesInCompositeKey: [],
// }
```

This replaces the current discovery workflow — grep the repo, open seven files, build the mental model yourself — with a single function call. A dev command `npm run graph:describe coins_goldenTower` prints the same thing to the terminal.

---

> [< Prev: 3c. Adding a new UI view](./03c-adding-a-new-ui-view.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3e. Silent-break modes >](./03e-silent-break-modes.md)
