- update run-details.txt to have stat_groups reference the camelcase properties vs readable values to avoid all the complexity that comes with looking up data
- update file structure
    don't have file type specific dir (ie a hooks or a types dir)
    break up features
        like data-tracking should have sub features for each tab in the charts page
            coins

            cells
            deaths analysis
            tier stats
        and all related code/logic for those sub features shoudl be in the same dir
- add unit tests around parsing game run stats from clipboard
- modify the csv import to not have special hadnling for my specific spreadsheet format
    it shoudl just accept col names that match up to the prop names from the game stats export
    ie instead of "Coins" it should expect a col for "Coins Earned"
    and instead of constructing a Real Time field from horus, min, sec, it should just expect a "Real Time" field with data tha tlooks like 7h 48m 33s which is the output from the game's stat export
- add linting for no unused exports/fields
- have claude run linting/tests
- create a process to sync up ai instructions sets
- extract claude agents/rules whatever into a user dir instead of having it in the proejct    
- address duplicate implemeantion of functions between data-parser and the field utils