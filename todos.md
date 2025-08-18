Features
- add support for milestone run types (not just the runType field, but a new table as well)
- split up Game runs by types, ie 3 tables with different cols shown which would be relevant to each type
    farming runs focus on econ related data
    tournament runs focus on combat focused stuff
    milestone runs...figure it out
- Add support for importing data from the tower tools site    
- Make runs table paginated or virtualized
- Create a dynamic query builder page
    filter any property we store
    add group by
    support different chart types

Tech Debt
- update file structure
    don't have file type specific dir (ie a hooks or a types dir)
    break up features
        like data-tracking should have sub features for each tab in the charts page
            coins
            cells
            deaths analysis
            tier stats
        and all related code/logic for those sub features should be in the same dir
- add unit tests around parsing game run stats from clipboard
- add linting for no unused exports/fields
- have claude run linting/tests
- create a process to sync up ai instructions sets
- extract claude agents/rules whatever into a user dir instead of having it in the proejct    
- address duplicate implementation of functions between data-parser and the field utils
- remove use of index.ts files
- add some notes about creating common components and using them everywhere
    ie we have <button> usage all over while we have a Button component
    also keep noticing that secondary buttons don't handle inverted color scheme well
    so you frequently have issues with light text on light background