# Project Overview

## What We're Building

**TowerOfTracking** is a web application for tracking and analyzing statistics for The Tower game. Users can import game run data via tab-delimited clipboard content, view runs in a sortable table, and analyze performance metrics over time.

The application focuses on:
- **Data Import**: Easy clipboard-based data import with live preview and validation
- **Data Visualization**: Interactive charts and tables for performance analysis
- **Trend Analysis**: Time-series charts supporting multiple periods (run, daily, weekly, monthly, yearly)
- **Performance Metrics**: Detailed statistics by tier, run type, and other game dimensions

## Development Commands

**Primary validation command:**
```bash
npm run integration-precheck
```
This runs linting, type checking, unit tests, and E2E tests in sequence. **Use this for a complete gut-check before committing.**

**Individual commands** (when you need to run just one):
- `npm run dev` - Development server
- `npm run build` - Build for production
- `npm run test` - Unit tests (Vitest)
- `npm run e2e` - E2E tests (Playwright)
- `npm run lint` - ESLint
- `npm run type-check` - TypeScript compilation check

## Game Context

The application tracks statistics from a tower defense game where:
- Players progress through **tiers** (difficulty levels)
- Each run consists of multiple **waves** of enemies
- Players earn **coins** and **cells** (in-game currencies) during runs
- Runs can be categorized as **farm** (regular) or **tournament** modes
- Performance metrics include duration, earnings, death causes, and progression stats
