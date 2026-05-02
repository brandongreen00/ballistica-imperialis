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

function runShoot(target, weapon, env, defEff, atkEff) {
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
  let hit = weapon.hit;
  for (const e of defEff) {
    if (e.type === "worsen_attacker_hit") hit = Math.min(6, hit + e.params.amount);
  }
  if (env.shooterInjured) hit = Math.min(6, hit + 1);
  let crit = 6;
  let preRet = 0;
  for (const r of rules) {
    if (r.name === "Lethal" && r.value < crit) crit = r.value;
    else if (r.name === "Accurate") {
      const k = Math.min(r.value, atkDice); atkDice -= k; preRet += k;
    }
  }
  for (const e of defEff) {
    if (e.type === "force_crit_six") crit = 6;
  }
  for (const e of atkEff) {
    if (e.type === "accurate") {
      const k = Math.min(e.params.count, atkDice); atkDice -= k; preRet += k;
    }
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

  // defender-side downgrade (e.g. Gellerpox Mutant)
  for (const e of defEff) {
    if (e.type === "crit_to_normal_attack") {
      const k = Math.min(e.params.count, atkC);
      atkC -= k; atkN += k;
    }
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
  for (const r of rules) {
    if (r.name === "Piercing") {
      const v = Math.max(0, r.value - piercingReduction);
      defD = Math.max(0, defD - v);
    }
    else if (r.name === "Piercing Crits" && atkC > 0) {
      const v = Math.max(0, r.value - piercingReduction);
      defD = Math.max(0, defD - v);
    }
    else if (r.name === "Saturate" && !ignoreSat) coverOff = true;
  }
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

  let defC = 0, defN = coverSaves;
  for (const v of defRolls) {
    if (soulstrike) {
      if (v === 6) continue;
      else if (v === 1) defC++;
      else if (v <= apl) defN++;
    } else {
      if (v === 6) defC++; else if (v >= saveT) defN++;
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
    atkN, atkC, defN, defC, weapon.normal_dmg, weapon.crit_dmg, brutal
  );
  // per-die damage caps (e.g. Warpcoven All is Dust)
  let normDmgPer = weapon.normal_dmg;
  let critDmgPer = weapon.crit_dmg;
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
        const dmgPer = which === "crit" ? weapon.crit_dmg : weapon.normal_dmg;
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
        const dmgPer = which === "crit" ? weapon.crit_dmg : weapon.normal_dmg;
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
      const dmgPer = e.params.dice_type === "crit" ? weapon.crit_dmg : weapon.normal_dmg;
      const avail = e.params.dice_type === "crit" ? damCritDice : damNormDice;
      const k = Math.min(e.params.count, avail);
      if (k > 0) {
        dmg = Math.max(0, dmg - k * dmgPer);
        if (e.params.dice_type === "crit") damCritDice -= k;
        else damNormDice -= k;
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

  return { damage: dmg, selfDamage: selfDmg, damDice: damNormDice + damCritDice };
}

export function simulate(target, weapon, env, defEff, atkEff, trials, currentHealth) {
  const w = { ...weapon, parsedRules: parseRules(weapon.rules) };
  const health = Math.max(1, Math.min(currentHealth ?? target.wounds, target.wounds));
  // Kill Team: injured while remaining wounds < ceil(W/2)
  const injuredThreshold = Math.ceil(target.wounds / 2) - 1;
  const alreadyInjured = health <= injuredThreshold;

  let sumD = 0, sumSD = 0, nAny = 0, nIncap = 0, nSelf = 0, nInjure = 0;
  const diceCounts = [0, 0, 0, 0, 0, 0];
  const dist = new Map();
  for (let i = 0; i < trials; i++) {
    const r = runShoot(target, w, env, defEff, atkEff);
    sumD += r.damage;
    sumSD += r.selfDamage;
    if (r.damage > 0) nAny++;
    if (r.damage >= health) nIncap++;
    if (r.selfDamage > 0) nSelf++;
    const newHealth = Math.max(0, health - r.damage);
    if (!alreadyInjured && newHealth <= injuredThreshold) nInjure++;
    for (let k = 1; k <= 5; k++) if (r.damDice >= k) diceCounts[k]++;
    dist.set(r.damage, (dist.get(r.damage) || 0) + 1);
  }
  const distArr = [...dist.entries()].sort((a, b) => a[0] - b[0]).map(([d, c]) => ({ dmg: d, p: c / trials }));
  return {
    trials,
    meanDmg: sumD / trials,
    meanSelfDmg: sumSD / trials,
    pAny: nAny / trials,
    pIncap: nIncap / trials,
    pInjure: alreadyInjured ? null : nInjure / trials,
    pSelf: nSelf / trials,
    pNDice: [1, 2, 3, 4, 5].map((k) => ({ n: k, p: diceCounts[k] / trials })),
    dist: distArr,
    maxATK: Math.max(weapon.atk, 5),
    currentHealth: health,
    injuredThreshold,
    alreadyInjured,
  };
}
