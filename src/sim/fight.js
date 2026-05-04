import { parseRules } from "./parseRules.js";

/* ═══════════════════════════════════════════════════════════════════════════
   FIGHT SIMULATION (KT24 melee resolution)

   Both operatives roll their melee attack dice simultaneously, then alternate
   resolving one of their successes (Strike or Parry), starting with the
   initiator. The loop ends when both pools are exhausted or one operative is
   incapacitated.

   Per-operative priority decides allocator behaviour:
   - "MAX_DMG"  — prioritise Strikes (always strike with highest-damage die)
   - "MIN_RCVD" — prioritise Parries (parry opponent's highest-damage die
                  while opponent has unresolved dice; only strike if the
                  opponent's pool is empty)

   Rules supported in v1:
     Lethal X+, Severe, Rending, Punishing,
     Balanced, Ceaseless, Relentless,
     Brutal (parry restriction), Shock (crit-use side-effect),
     Hot (self-damage), Stun / Silent / Limited / PSYCHIC (no calc effect)

   Not supported (silently ignored): Devastating, Storm, Piercing, Range,
   and all asterisked team-specific rules (Poison*, Repress*, Shield*, etc).
   ═══════════════════════════════════════════════════════════════════════════ */

const d6 = () => ((Math.random() * 6) | 0) + 1;

function ruleNames(weapon) {
  return new Set(weapon.parsedRules.map((r) => r.name));
}

function rollPool(weapon) {
  const rules = weapon.parsedRules;
  const has = (n) => rules.some((r) => r.name === n);

  let atkDice = weapon.atk;
  let crit = 6;
  for (const r of rules) {
    if (r.name === "Lethal" && r.value < crit) crit = r.value;
  }

  const rolls = new Array(atkDice);
  for (let i = 0; i < atkDice; i++) rolls[i] = d6();

  for (const r of rules) {
    if (r.name === "Balanced") {
      let lowI = -1, lowV = 7;
      for (let i = 0; i < rolls.length; i++)
        if (rolls[i] < crit && rolls[i] < lowV) { lowV = rolls[i]; lowI = i; }
      if (lowI !== -1) rolls[lowI] = d6();
    } else if (r.name === "Ceaseless") {
      let lowV = 7;
      for (const v of rolls) if (v < crit && v < lowV) lowV = v;
      if (lowV < 7) for (let i = 0; i < rolls.length; i++) if (rolls[i] === lowV) rolls[i] = d6();
    } else if (r.name === "Relentless") {
      for (let i = 0; i < rolls.length; i++) if (rolls[i] < weapon.hit) rolls[i] = d6();
    }
  }

  let crits = 0, normals = 0, fails = 0;
  for (const v of rolls) {
    if (v >= crit) crits++;
    else if (v >= weapon.hit) normals++;
    else fails++;
  }

  if (has("Severe") && crits === 0 && normals > 0) { normals--; crits++; }
  if (has("Rending") && crits > 0 && normals > 0) { normals--; crits++; }
  if (has("Punishing") && crits > 0 && fails > 0) { fails--; normals++; }

  let selfDmg = 0;
  for (const r of rules) {
    if (r.name === "Hot") {
      const v = d6();
      if (v < weapon.hit) selfDmg += v * 2;
    }
  }

  return { crits, normals, selfDmg };
}

/* ── allocators ─────────────────────────────────────────────────────────── */

// Strike with the highest-damage die available. Crit > Normal regardless of
// the actual damage values — the user-stated semantics ("prioritise strikes
// to deal the most damage possible"). Refining this to compare crit_dmg vs
// 2× normal_dmg is a v2 concern.
function chooseMaxDmg(self) {
  if (self.crits > 0) return { kind: "strike", die: "crit" };
  if (self.normals > 0) return { kind: "strike", die: "normal" };
  return { kind: "pass" };
}

// Parry as long as opponent has unresolved dice. Discard the highest-damage
// opponent die we can with the smallest die we can spare (conserve crits).
// If opponent's weapon has Brutal, opponent normals can only be parried with
// our crits. If we can't parry, fall back to striking.
function chooseMinRcvd(self, opp, oppWeaponRules) {
  const oppBrutal = oppWeaponRules.has("Brutal");

  if (opp.crits > 0) {
    if (self.crits > 0) return { kind: "parry", die: "crit", target: "crit" };
    // can't parry the crit; preserve our normals by striking something
    if (self.normals > 0) return { kind: "strike", die: "normal" };
    return { kind: "pass" };
  }

  if (opp.normals > 0) {
    if (oppBrutal) {
      if (self.crits > 0) return { kind: "parry", die: "crit", target: "normal" };
      // brutal blocks normal-with-normal parry; strike instead
      if (self.normals > 0) return { kind: "strike", die: "normal" };
      return { kind: "pass" };
    }
    if (self.normals > 0) return { kind: "parry", die: "normal", target: "normal" };
    if (self.crits > 0) return { kind: "parry", die: "crit", target: "normal" };
    return { kind: "pass" };
  }

  // opponent pool empty — strike
  if (self.crits > 0) return { kind: "strike", die: "crit" };
  if (self.normals > 0) return { kind: "strike", die: "normal" };
  return { kind: "pass" };
}

/* ── single fight ───────────────────────────────────────────────────────── */

function applyAction(self, opp, action, weapon) {
  let dmg = 0;
  if (action.kind === "strike") {
    if (action.die === "crit") {
      dmg = weapon.crit_dmg;
      self.crits--;
    } else {
      dmg = weapon.normal_dmg;
      self.normals--;
    }
  } else if (action.kind === "parry") {
    if (action.die === "crit") self.crits--;
    else self.normals--;
    if (action.target === "crit") opp.crits--;
    else opp.normals--;
  }
  // Shock: spending a crit (strike OR parry) also discards 1 opponent normal
  const isCritSpend = (action.kind === "strike" || action.kind === "parry") && action.die === "crit";
  if (isCritSpend && weapon.parsedRulesNames.has("Shock") && opp.normals > 0) {
    opp.normals--;
  }
  return dmg;
}

function fightOnce(weaponA, weaponB, hpA, hpB, priorityA, priorityB, initiator) {
  const poolA = rollPool(weaponA);
  const poolB = rollPool(weaponB);

  let dmgToA = poolA.selfDmg;
  let dmgToB = poolB.selfDmg;

  const choosers = {
    A: priorityA === "MAX_DMG" ? chooseMaxDmg : chooseMinRcvd,
    B: priorityB === "MAX_DMG" ? chooseMaxDmg : chooseMinRcvd,
  };

  let active = initiator;

  // safety: bound iteration to total dice rolled to avoid infinite loops on
  // mutual-pass conditions
  const maxIter = poolA.crits + poolA.normals + poolB.crits + poolB.normals + 4;
  let iter = 0;

  while (iter++ < maxIter) {
    if (hpA - dmgToA <= 0 || hpB - dmgToB <= 0) break;
    const left = poolA.crits + poolA.normals + poolB.crits + poolB.normals;
    if (left === 0) break;

    const isA = active === "A";
    const self = isA ? poolA : poolB;
    const opp = isA ? poolB : poolA;
    const weapon = isA ? weaponA : weaponB;
    const oppRules = isA ? weaponB.parsedRulesNames : weaponA.parsedRulesNames;
    const chooser = choosers[active];

    if (self.crits + self.normals === 0) {
      active = isA ? "B" : "A";
      continue;
    }

    const action = chooser === chooseMaxDmg
      ? chooseMaxDmg(self)
      : chooseMinRcvd(self, opp, oppRules);

    if (action.kind === "pass") {
      active = isA ? "B" : "A";
      continue;
    }

    const dmg = applyAction(self, opp, action, weapon);
    if (isA) dmgToB += dmg;
    else dmgToA += dmg;

    active = isA ? "B" : "A";
  }

  return {
    dmgToA: Math.min(dmgToA, hpA),
    dmgToB: Math.min(dmgToB, hpB),
    incapA: hpA - dmgToA <= 0,
    incapB: hpB - dmgToB <= 0,
  };
}

/* ── public API ─────────────────────────────────────────────────────────── */

function prepareWeapon(w) {
  const parsedRules = parseRules(w.rules);
  return {
    ...w,
    parsedRules,
    parsedRulesNames: new Set(parsedRules.map((r) => r.name)),
  };
}

export function fightSimulate(params, trials) {
  const wA = prepareWeapon(params.weaponA);
  const wB = prepareWeapon(params.weaponB);
  const hpA = Math.max(1, params.hpA);
  const hpB = Math.max(1, params.hpB);

  let sumA = 0, sumB = 0, nIncapA = 0, nIncapB = 0, nBoth = 0, nNeither = 0;
  const distA = new Map();
  const distB = new Map();

  for (let i = 0; i < trials; i++) {
    const r = fightOnce(
      wA, wB, hpA, hpB,
      params.priorityA, params.priorityB,
      params.initiator,
    );
    sumA += r.dmgToA;
    sumB += r.dmgToB;
    if (r.incapA) nIncapA++;
    if (r.incapB) nIncapB++;
    if (r.incapA && r.incapB) nBoth++;
    if (!r.incapA && !r.incapB) nNeither++;
    distA.set(r.dmgToA, (distA.get(r.dmgToA) || 0) + 1);
    distB.set(r.dmgToB, (distB.get(r.dmgToB) || 0) + 1);
  }

  const distArr = (m) => [...m.entries()].sort((a, b) => a[0] - b[0]).map(([d, c]) => ({ dmg: d, p: c / trials }));

  return {
    trials,
    meanDmgToA: sumA / trials,
    meanDmgToB: sumB / trials,
    pIncapA: nIncapA / trials,
    pIncapB: nIncapB / trials,
    pBothIncap: nBoth / trials,
    pNeitherIncap: nNeither / trials,
    pOnlyAIncap: (nIncapA - nBoth) / trials,
    pOnlyBIncap: (nIncapB - nBoth) / trials,
    distA: distArr(distA),
    distB: distArr(distB),
    meanRemainingA: hpA - sumA / trials,
    meanRemainingB: hpB - sumB / trials,
  };
}
