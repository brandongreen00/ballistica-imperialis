import { parseRules } from "./parseRules.js";

/* ═══════════════════════════════════════════════════════════════════════════
   SIMULATION — verified to within ±0.01 of the Python reference

   defEff and atkEff are arrays of resolved effect objects from
   src/sim/abilities.js (not strings).
   ═══════════════════════════════════════════════════════════════════════════ */

function allocateSavesOptimally(atkN, atkC, defN, defC, nDmg, cDmg, brutal) {
  const effDefN = brutal ? 0 : defN;
  let bestRemN = atkN, bestRemC = atkC;
  let bestDmg = atkN * nDmg + atkC * cDmg;
  const maxC2C = Math.min(defC, atkC);
  for (let c2c = 0; c2c <= maxC2C; c2c++) {
    const remCS = defC - c2c;
    for (let c2p = 0; c2p <= remCS; c2p++) {
      if (2 * c2p > atkN) continue;
      const savesLeft = remCS - c2p;
      const afterPairs = atkN - 2 * c2p;
      const maxC2N = Math.min(savesLeft, afterPairs);
      for (let c2n = 0; c2n <= maxC2N; c2n++) {
        const afterCritSolos = afterPairs - c2n;
        const maxN2N = Math.min(effDefN, afterCritSolos);
        for (let n2n = 0; n2n <= maxN2N; n2n++) {
          const remN = afterCritSolos - n2n;
          const remC = atkC - c2c;
          const dmg = remN * nDmg + remC * cDmg;
          if (dmg < bestDmg) { bestDmg = dmg; bestRemN = remN; bestRemC = remC; }
        }
      }
    }
  }
  return [bestRemN, bestRemC];
}

const d6 = () => ((Math.random() * 6) | 0) + 1;

function expandComposite(effs) {
  const out = [];
  for (const e of effs) {
    if (e.type === "composite") out.push(...e.params.effects);
    else out.push(e);
  }
  return out;
}

function runShoot(target, weapon, env, defEff, atkEff) {
  atkEff = expandComposite(atkEff);
  defEff = expandComposite(defEff);
  const rules = [...weapon.parsedRules];
  for (const e of atkEff) {
    if (e.type === "add_rules") {
      for (const r of e.params.rules) rules.push({ name: r.name, value: r.value ?? null, raw: r.name });
    }
  }
  // Killzone: Gallowdark close quarters — Blast / Torrent / x" Devastating
  // gain Lethal 5+. Our weapon data only carries the damage-value form of
  // Devastating, so only Blast / Torrent qualify here.
  if (env.closeQuarters && rules.some((r) => r.name === "Blast" || r.name === "Torrent")) {
    rules.push({ name: "Lethal", value: 5, raw: "Lethal 5+" });
  }
  const has = (n) => rules.some((r) => r.name === n);
  const val = (n) => { const r = rules.find((r) => r.name === n); return r ? r.value : null; };

  // modify_attack_stats
  let atkDice = weapon.atk;
  for (const e of atkEff) {
    if (e.type === "modify_atk_dice") atkDice += e.params.amount;
  }
  for (const e of defEff) {
    if (e.type === "modify_atk_dice") atkDice += e.params.amount;
  }
  atkDice = Math.max(0, atkDice);
  // Atk characteristic after stat-modifying effects (e.g. Distend Dorsal Sac
  // +1, Denunciation +1, Sanctification −1), before Accurate/obscured/vantage
  // reservations — this is the "attack dice" the weapon actually rolls.
  const effAtk = atkDice;

  // modify_dmg: attacker effects that change the weapon's Dmg characteristic
  // (e.g. Insidiant Warrior Inspired Strikes — +1 Critical Dmg while INSPIRING).
  // With no such effect active these equal the printed stats, so the damage
  // maths below is byte-for-byte unchanged for every other shooter.
  let normalDmg = weapon.normal_dmg;
  let critDmg = weapon.crit_dmg;
  for (const e of atkEff) {
    if (e.type === "modify_dmg") {
      normalDmg = Math.max(0, normalDmg + (e.params.normal ?? 0));
      critDmg = Math.max(0, critDmg + (e.params.crit ?? 0));
    }
  }
  let hit = weapon.hit;
  for (const e of defEff) {
    if (e.type === "worsen_attacker_hit") hit = Math.min(6, hit + e.params.amount);
  }
  if (env.shooterInjured) hit = Math.min(6, hit + 1);
  let crit = 6;
  let preRet = 0;
  // Accurate x: retain up to x attack dice as normal successes without rolling
  // them. Instances of Accurate do not simply stack — per the weapon rule, a
  // weapon with two or more instances of Accurate may be treated as a single
  // Accurate 2 instead. We gather every source (printed rules, injected
  // add_rules, and accurate-type effects such as the XV26 Kauyon faction rule)
  // and resolve to the better of the highest single instance or — when 2+
  // instances are present — Accurate 2.
  const accurateVals = [];
  for (const r of rules) {
    if (r.name === "Lethal" && r.value < crit) crit = r.value;
    else if (r.name === "Accurate") accurateVals.push(r.value);
  }
  for (const e of defEff) {
    if (e.type === "force_crit_six") crit = 6;
  }
  for (const e of atkEff) {
    if (e.type === "accurate") accurateVals.push(e.params.count);
  }
  if (accurateVals.length > 0) {
    const highest = Math.max(...accurateVals);
    const accurateX = accurateVals.length >= 2 ? Math.max(highest, 2) : highest;
    const k = Math.min(accurateX, atkDice); atkDice -= k; preRet += k;
  }
  if (env.obscured) atkDice = Math.max(0, atkDice - 1);
  const vAcc = !env.targetEngaged ? 0
             : env.vantageHeight >= 4 ? 2
             : env.vantageHeight >= 2 ? 1 : 0;
  if (vAcc > 0) {
    const k = Math.min(vAcc, atkDice); atkDice -= k; preRet += k;
  }

  // roll attack dice
  const rolls = new Array(atkDice);
  for (let i = 0; i < atkDice; i++) rolls[i] = d6();

  // attack_reroll
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
      for (let i = 0; i < rolls.length; i++) if (rolls[i] < hit) rolls[i] = d6();
    }
  }

  // categorise
  let atkC = 0, atkN = preRet, atkF = 0;
  for (const v of rolls) {
    if (v >= crit) atkC++; else if (v >= hit) atkN++; else atkF++;
  }

  // modify_attack_results
  for (const r of rules) {
    if (r.name === "Severe"   && atkC === 0 && atkN > 0) { atkN--; atkC++; }
    else if (r.name === "Rending"   && atkC > 0 && atkN > 0) { atkN--; atkC++; }
    else if (r.name === "Punishing" && atkC > 0 && atkF > 0) { atkF--; atkN++; }
  }

  // attacker-side upgrade (e.g. Hearthkyn Salvagers Grudge)
  for (const e of atkEff) {
    if (e.type === "normal_to_crit_attack") {
      const k = Math.min(e.params.count, atkN);
      atkN -= k; atkC += k;
    }
  }

  // defender-side downgrade (e.g. Gellerpox Mutant)
  for (const e of defEff) {
    if (e.type === "crit_to_normal_attack") {
      const k = Math.min(e.params.count, atkC);
      atkC -= k; atkN += k;
    }
  }

  // Wrecka points: count natural 6s rolled (not Lethal-promoted crits),
  // then spend up to the player's chosen amount to convert fails into
  // normal hits. If banked is already 6, you can only spend (no gen).
  let wrekaGen = 0, wrekaSpent = 0, wrekaEndBank = 0;
  const wrk = env.wreka;
  if (wrk && wrk.enabled) {
    let naturalSixes = 0;
    for (const v of rolls) if (v === 6) naturalSixes++;
    const banked = Math.min(6, Math.max(0, wrk.banked || 0));
    wrekaGen = banked === 6 ? 0 : naturalSixes;
    const wantSpend = wrk.isBombSquig ? 0 : Math.max(0, Math.min(3, wrk.spend || 0));
    wrekaSpent = Math.min(wantSpend, atkF, banked + wrekaGen);
    atkF -= wrekaSpent;
    atkN += wrekaSpent;
    wrekaEndBank = Math.min(6, banked + wrekaGen - wrekaSpent);
  }

  // pre_save_damage
  let dmg = 0, damCritDice = 0;
  const devV = val("Devastating");
  if (devV != null && atkC > 0) { dmg += atkC * devV; damCritDice = atkC; }

  // modify_defence_stats
  let defD = 3;
  let coverOff = false;
  const ignoreSat = defEff.some(
    (e) => e.type === "ignore_weapon_rule" && e.params.rule === "Saturate"
  );
  let piercingReduction = 0;
  for (const e of defEff) {
    if (e.type === "reduce_piercing") piercingReduction += e.params.amount;
  }
  let coverSaves = 0;
  // Piercing X and Piercing Crits X are the same rule with a variant; per
  // the KT24 appendix, when a weapon has multiple instances of an x-valued
  // rule the attacker selects one x — they do not stack.
  let pierceX = 0;
  for (const r of rules) {
    if (r.name === "Piercing" || (r.name === "Piercing Crits" && atkC > 0)) {
      const v = Math.max(0, r.value - piercingReduction);
      if (v > pierceX) pierceX = v;
    }
    else if (r.name === "Saturate" && !ignoreSat) coverOff = true;
  }
  defD = Math.max(0, defD - pierceX);
  if (env.cover && !coverOff && defD > 0) { defD -= 1; coverSaves += 1; }

  // save target with defender modifiers
  let saveT = target.save;
  for (const e of defEff) {
    if (e.type === "improve_save_in_cover" && env.cover) {
      saveT = Math.max(2, saveT - e.params.amount);
    }
  }

  // Soulstrike: defence dice are resolved against the target's APL instead of
  // its Save — 1 always crits, 2..APL are normal saves, anything else fails,
  // and 6 always fails. (Mandrakes, per Wahapedia.)
  const soulstrike = has("Soulstrike");
  const apl = target.apl ?? 0;
  const isFail = (v) => soulstrike
    ? (v === 6 || v > apl)
    : (v !== 6 && v < saveT);

  // roll defence dice
  const defRolls = new Array(defD);
  for (let i = 0; i < defD; i++) defRolls[i] = d6();

  // defender reroll (Zealot, Long Vigil)
  for (const e of defEff) {
    if (e.type === "defence_reroll" && e.params.fails) {
      let budget = e.params.count ?? Infinity;
      for (let i = 0; i < defRolls.length && budget > 0; i++) {
        if (isFail(defRolls[i])) {
          defRolls[i] = d6();
          budget -= 1;
        }
      }
    }
  }

  // A defence die normally crits only on a natural 6. Rules like the Angels of
  // Death Hardy chapter tactic make defence dice results of 5+ critical saves.
  let defCritT = 6;
  for (const e of defEff) {
    if (e.type === "crit_save_on") defCritT = Math.min(defCritT, e.params.threshold);
  }
  let defC = 0, defN = coverSaves;
  for (const v of defRolls) {
    if (soulstrike) {
      if (v === 6) continue;
      else if (v === 1) defC++;
      else if (v <= apl) defN++;
    } else {
      if (v >= defCritT) defC++; else if (v >= saveT) defN++;
    }
  }

  // modify_defence_results
  for (const e of defEff) {
    if (e.type === "discard_fail_for_save") {
      const fails = defD - defC - defN;
      if (fails >= e.params.min_fails) defN += e.params.count;
    }
  }
  for (const e of defEff) {
    if (e.type === "upgrade_save_to_crit") {
      const k = Math.min(e.params.count, defN);
      defN -= k; defC += k;
    }
  }

  // resolve saves
  const brutal = has("Brutal");
  const [remN, remC] = allocateSavesOptimally(
    atkN, atkC, defN, defC, normalDmg, critDmg, brutal
  );
  // per-die damage caps (e.g. Warpcoven All is Dust)
  let normDmgPer = normalDmg;
  let critDmgPer = critDmg;
  for (const e of defEff) {
    if (e.type === "cap_die_damage") {
      if (e.params.dice_type === "normal" || e.params.dice_type === "all") {
        normDmgPer = Math.min(normDmgPer, e.params.max);
      }
      if (e.params.dice_type === "crit" || e.params.dice_type === "all") {
        critDmgPer = Math.min(critDmgPer, e.params.max);
      }
    }
  }
  dmg += remN * normDmgPer + remC * critDmgPer;
  let damNormDice = remN;
  if (!has("Devastating")) damCritDice = remC;

  // per-die damage reduction (e.g. Death Korps Veteran, Aggressive Force)
  for (const e of defEff) {
    if (e.type === "damage_reduction_per_die") {
      const apply = (which) => {
        const dmgPer = which === "crit" ? critDmg : normalDmg;
        const dice = which === "crit" ? damCritDice : damNormDice;
        if (dmgPer >= e.params.threshold && dice > 0) {
          dmg = Math.max(0, dmg - dice * e.params.reduce_by);
        }
      };
      if (e.params.dice_type === "all") { apply("normal"); apply("crit"); }
      else apply(e.params.dice_type);
    }
  }

  // per-die damage reduction with D6 (e.g. Plague Marines Disgustingly Resilient)
  for (const e of defEff) {
    if (e.type === "damage_reduction_per_die_d6") {
      const apply = (which) => {
        const dmgPer = which === "crit" ? critDmg : normalDmg;
        const dice = which === "crit" ? damCritDice : damNormDice;
        if (dmgPer >= e.params.dmg_threshold) {
          for (let i = 0; i < dice; i++) {
            if (d6() >= e.params.d6_threshold) {
              dmg = Math.max(0, dmg - e.params.reduce_by);
            }
          }
        }
      };
      if (e.params.dice_type === "all") { apply("normal"); apply("crit"); }
      else apply(e.params.dice_type);
    }
  }

  // post_damage: ignore_damage_dice
  for (const e of defEff) {
    if (e.type === "ignore_damage_dice") {
      const dmgPer = e.params.dice_type === "crit" ? critDmg : normalDmg;
      const avail = e.params.dice_type === "crit" ? damCritDice : damNormDice;
      const k = Math.min(e.params.count, avail);
      if (k > 0) {
        dmg = Math.max(0, dmg - k * dmgPer);
        if (e.params.dice_type === "crit") damCritDice -= k;
        else damNormDice -= k;
      }
    }
  }

  // halve one damaging die's damage (Starstrider Undaunted Explorers).
  // Defender uses the ploy on the first damaging die; the attacker resolves
  // dice in their preferred order, so they pick the lowest-damage die first
  // to minimise the ploy. We halve that lowest-damage die (round up, min set
  // by params.min — 2 for Undaunted).
  for (const e of defEff) {
    if (e.type === "halve_one_die_damage") {
      const candidates = [];
      if (damNormDice > 0) candidates.push(normalDmg);
      if (damCritDice > 0) candidates.push(critDmg);
      if (candidates.length > 0) {
        const lowest = Math.min(...candidates);
        const halved = Math.max(e.params.min, Math.ceil(lowest / 2));
        const reduction = Math.max(0, lowest - halved);
        dmg = Math.max(0, dmg - reduction);
      }
    }
  }

  // post_damage: fnp (per-wound D6, threshold+ ignores that wound)
  for (const e of defEff) {
    if (e.type === "fnp") {
      let prevented = 0;
      for (let i = 0; i < dmg; i++) {
        if (d6() >= e.params.threshold) prevented++;
      }
      dmg -= prevented;
    }
  }

  // self damage: Hot
  let selfDmg = 0;
  for (const r of rules) {
    if (r.name === "Hot") {
      const v = d6();
      if (v < hit) selfDmg += v * 2;
    }
  }

  return {
    damage: dmg,
    selfDamage: selfDmg,
    damDice: damNormDice + damCritDice,
    // Critical successes that actually inflicted damage (after saves and any
    // crit-die ignores). >0 means an on-crit effect such as Poison triggers.
    critDmgDice: damCritDice,
    effAtk,
    wrekaGen,
    wrekaSpent,
    wrekaEndBank,
  };
}

export function simulate(target, weapon, env, defEff, atkEff, trials, currentHealth) {
  const w = { ...weapon, parsedRules: parseRules(weapon.rules) };
  const health = Math.max(1, Math.min(currentHealth ?? target.wounds, target.wounds));
  // Kill Team: injured while remaining wounds < ceil(W/2)
  const injuredThreshold = Math.ceil(target.wounds / 2) - 1;
  const alreadyInjured = health <= injuredThreshold;

  let sumD = 0, sumSD = 0, nAny = 0, nIncap = 0, nSelf = 0, nInjure = 0;
  let sumWGen = 0, sumWSpent = 0, sumWEnd = 0;
  let nCritDmg = 0;
  let effAtk = weapon.atk;
  const diceCounts = [0, 0, 0, 0, 0, 0];
  const dist = new Map();
  for (let i = 0; i < trials; i++) {
    const r = runShoot(target, w, env, defEff, atkEff);
    effAtk = r.effAtk; // constant across trials (deterministic stat modifiers)
    sumD += r.damage;
    sumSD += r.selfDamage;
    if (r.damage > 0) nAny++;
    if (r.damage >= health) nIncap++;
    if (r.critDmgDice > 0) nCritDmg++;
    if (r.selfDamage > 0) nSelf++;
    const newHealth = Math.max(0, health - r.damage);
    if (!alreadyInjured && newHealth <= injuredThreshold) nInjure++;
    for (let k = 1; k <= 5; k++) if (r.damDice >= k) diceCounts[k]++;
    dist.set(r.damage, (dist.get(r.damage) || 0) + 1);
    sumWGen += r.wrekaGen;
    sumWSpent += r.wrekaSpent;
    sumWEnd += r.wrekaEndBank;
  }
  const distArr = [...dist.entries()].sort((a, b) => a[0] - b[0]).map(([d, c]) => ({ dmg: d, p: c / trials }));
  const wrekaEnabled = !!(env.wreka && env.wreka.enabled);
  return {
    trials,
    meanDmg: sumD / trials,
    meanSelfDmg: sumSD / trials,
    pAny: nAny / trials,
    pIncap: nIncap / trials,
    // P(at least one critical success inflicts damage) — the trigger condition
    // for on-crit effects like Poison, defence-aware (saves can stop crits on
    // non-Devastating weapons; Devastating crits always get through).
    pCritDamage: nCritDmg / trials,
    pInjure: alreadyInjured ? null : nInjure / trials,
    pSelf: nSelf / trials,
    pNDice: [1, 2, 3, 4, 5].map((k) => ({ n: k, p: diceCounts[k] / trials })),
    dist: distArr,
    effAtk,
    maxATK: Math.max(weapon.atk, 5),
    currentHealth: health,
    injuredThreshold,
    alreadyInjured,
    wreka: wrekaEnabled ? {
      meanGen: sumWGen / trials,
      meanSpent: sumWSpent / trials,
      meanEndBank: sumWEnd / trials,
      banked: env.wreka.banked,
      requestedSpend: env.wreka.spend,
      isBombSquig: env.wreka.isBombSquig,
    } : null,
  };
}
