Bugs
- fix issues with warning about invalid values in notes filed and then not doing anything about it

Features
- Mobile designs
- add support for milestone run types (not just the runType field, but a new table as well)
- split up Game runs by types, ie 3 tables with different cols shown which would be relevant to each type
    farming runs focus on econ related data
    tournament runs focus on combat focused stuff
    milestone runs...figure it out
- Add support for importing data from the tower tools site    
- Make runs table paginated or virtualized
- Add feature to compare multiple runs, where all the fields of game stats are rows, and the cols are results from past X runs
- Create a dynamic query builder page
    filter any property we store
    add group by
    support different chart types
- add ability to click a button to clear local storage
- Extract the data import/export into a single page (bulk?)
    - rename import/export modals to use term bulk
- make fields editable
- Tier trends screen
    add ability to only show certain categories of stats
        ie economic or combat or ... need to come up with names for these categories cause the stuff the game spits out doesn't make sense

Tech Debt
- Add versioning
- setup TS config to
    - Avoid `any` type - use proper typing or `unknown` with type guards
    - Enable strict mode in TypeScript configuration
    - Prefer explicit return types for functions
    - add linting for no unused exports/fields
- update file structure
    don't have file type specific dir (ie a hooks or a types dir)
    break up features
        like data-tracking should have sub features for each tab in the charts page
            coins
            cells
            deaths analysis
            tier stats
        and all related code/logic for those sub features should be in the same dir
- have claude run linting/tests
- address duplicate implementation of functions between data-parser and the field utils
- remove use of index.ts files
- add some notes about creating common components and using them everywhere
    ie we have <button> usage all over while we have a Button component
    also keep noticing that secondary buttons don't handle inverted color scheme well
    so you frequently have issues with light text on light background
- Add E2E which uploads dataset and verifies stuff renders
