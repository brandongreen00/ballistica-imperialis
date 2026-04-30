# Ballistica Imperialis

A Warhammer 40,000: Kill Team shooting calculator. Pick a shooter, a target, a weapon, and the conditions of the engagement, then run a Monte Carlo simulation to see what the firing solution actually looks like.

## What it does

Pick two operatives from any supported faction, choose one of the shooter's ranged weapons, set the engagement conditions (cover, obscured, vantage, Engage/Conceal), and toggle whichever attacker- and defender-side abilities apply. Hit **FIRE WEAPON** and the app rolls tens of thousands of trials and reports:

- mean damage dealt
- probability of incapacitating the target
- probability of dealing any damage at all
- probability of damaging with at least N attack dice
- the full damage distribution as a histogram
- self-damage stats for Hot weapons

## Stack

- React 18 + Vite 6
- Recharts for the damage distribution chart
- Tailwind (CDN) for styling
- Monte Carlo simulation in plain JS (`src/sim/`)
- Faction and operative data in `src/data/factions.js`

## Running locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints. `npm run build` produces a static bundle and `npm run preview` serves it.

## Project layout

- `src/App.jsx` — UI, controls, and results panel
- `src/sim/simulate.js` — Monte Carlo dice resolution
- `src/sim/abilities.js` — attacker and defender effect definitions
- `src/sim/parseRules.js` — weapon special-rule parsing
- `src/data/factions.js` — factions, operatives, and weapon stats
- `src/ui/` — shared primitives and styles
