# Bugs
- fix issues with warning about invalid values in notes filed and then not doing anything about it

# Periodic 
- Ask the architecture-review or the frontend-design-reviewer to
    Make one area of the code more beautiful without changing functionality

# Features

## For v0.1.0
- Mobile designs
    charts list of charts segmented control
    make import/export modals not as wide in tablet
    reduce nesting of indentations from cards
    fix console warnings
- Add discord link
- Add versioning

## For v0.2.0
- Add google drive api integration
- Make app a PWA so that it can be installed to native devices
- Make runs table paginated or virtualized    

## Backlog
- support different aggregations in coins/cell analytics (sum, avg, min, max)
- Add grouping/something of types of fields in the tier trends type (economy, combat, util?)
- Tier trends screen
    add ability to only show certain categories of stats
        ie economic or combat or ... need to come up with names for these categories cause the stuff the game spits out doesn't make sense
- Extract the data import/export into a single page (bulk?)
    - rename import/export modals to use term bulk
    - add ability to click a button to clear local storage            
- make fields editable
    tournament placement
    notes
- Add filter to select minimum wave threshold to tier analysis 
    lets you filter out runs that ended prematurely (for whatever reason)
    so that you can more easily compare similar runs
    ie if you have 5 runs that are 5900-6100 waves, and one that's 4500 cause you had bad perk order
    filter out the 4500 one
- Remove the hover over effect that causes the cards to like pop out and grow in size slightly. Though I do like the effect of the border/background color like a highlight, keep that
- Add support for importing data from the tower tools site

- Create a dynamic query builder page
    filter any property we store
    add group by
    support different chart types

# Tech Debt
- Add agent focused on testing implementation
- Add agent to browse codebase and identify patterns which can be extracted
- update usage of colors (in css and js) to used defined values so that we have consistent color usage across the app
- update file structure
    don't have file type specific dir (ie a hooks or a types dir)
    break up features
        like data-tracking should have sub features for each tab in the charts page
            coins
            cells
            deaths analysis
            tier stats
        and all related code/logic for those sub features should be in the same dir
- address duplicate implementation of functions between data-parser and the field utils
- remove use of index.ts files
- add some notes about creating common components and using them everywhere
    ie we have <button> usage all over while we have a Button component
    also keep noticing that secondary buttons don't handle inverted color scheme well
    so you frequently have issues with light text on light background
- Add E2E which uploads dataset and verifies stuff renders
