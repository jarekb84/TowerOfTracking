# Bugs
- fix issues with warning about invalid values in notes filed and then not doing anything about it
- runtype import has issues, default paste has type set to Farm, when you select run type button it changes type to Farming

# Periodic 
- Ask the architecture-review or the frontend-design-reviewer to
    Make one area of the code more beautiful without changing functionality

# Features

## For v0.1.0
- Mobile designs
    charts list of charts segmented control
    make import/export modals not as wide in tablet
    reduce nesting of indentations from cards
    turn tier stats table into card layout on mobile        
    add back the icons for chart links (ie skull for deaths analysis)
- find and clean out dead code    
- Add discord link
- Add versioning

## For v0.2.0
- Add google drive api integration
- Make app a PWA so that it can be installed to native devices
- Revisit layout of the settings page
- Add note icon to per run headings in tier trends
- make fields editable
    tournament placement
    notes

## Backlog
- click row to expand
- click card to expand
- click to expand/collapse sidenav when clicking on empty space between links
- support different aggregations in coins/cell analytics (sum, avg, min, max)
- Add grouping/something of types of fields in the tier trends type (economy, combat, util?)
- make theme config actually work
- Tier trends screen
    add ability to only show certain categories of stats
        ie economic or combat or ... need to come up with names for these categories cause the stuff the game spits out doesn't make sense
- Extract the data import/export into a single page (bulk?)
    - rename import/export modals to use term bulk
    - add ability to click a button to clear local storage            
- Add filter to select minimum wave threshold to tier analysis 
    lets you filter out runs that ended prematurely (for whatever reason)
    so that you can more easily compare similar runs
    ie if you have 5 runs that are 5900-6100 waves, and one that's 4500 cause you had bad perk order
    filter out the 4500 one
- Add support for importing data from the tower tools site
- Create a dynamic query builder page
    filter any property we store
    add group by
    support different chart types

# Tech Debt
- figure out way to stop agents from spawning instances of vite dev server over and over
- Add agent focused on testing implementation
- Add agent to browse codebase and identify patterns which can be extracted
- Add performance testing/tracking/something to ensure a good rendering exp
- update usage of colors (in css and js) to used defined values so that we have consistent color usage across the app
- Add E2E which uploads dataset and verifies stuff renders
