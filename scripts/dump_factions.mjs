// Dumps the FACTIONS array from src/data/factions.js as JSON to stdout.
// Used by scrape_melee.py to read the canonical operative list without a JS parser.
import { FACTIONS } from "../src/data/factions.js";
process.stdout.write(JSON.stringify(FACTIONS, null, 2));
