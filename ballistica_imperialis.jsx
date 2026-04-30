import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA — extracted from project JSONs, pistols flagged, melee filtered out
   ═══════════════════════════════════════════════════════════════════════════ */

const DATA = {"factions":[{"faction":"KASRKIN","operatives":[{"name":"Sergeant","full_name":"KASRKIN SERGEANT","save":4,"wounds":9,"apl":3,"move":"6\"","defender_abilities":[],"is_aod":false,"is_kasrkin":true,"weapons":[{"name":"Bolt pistol","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Range 8\""],"is_pistol":true},{"name":"Hot-shot lasgun","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":[],"is_pistol":false},{"name":"Hot-shot laspistol","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Range 8\""],"is_pistol":true},{"name":"Plasma pistol (standard)","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":5,"rules":["Range 8\"","Piercing 1"],"is_pistol":true},{"name":"Plasma pistol (supercharge)","atk":4,"hit":3,"normal_dmg":4,"crit_dmg":5,"rules":["Range 8\"","Hot","Lethal 5+","Piercing 1"],"is_pistol":true}]},{"name":"Combat Medic","full_name":"KASRKIN COMBAT MEDIC","save":4,"wounds":8,"apl":2,"move":"6\"","defender_abilities":[],"is_aod":false,"is_kasrkin":true,"weapons":[{"name":"Hot-shot lasgun","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":[],"is_pistol":false}]},{"name":"Demo-Trooper","full_name":"KASRKIN DEMO-TROOPER","save":4,"wounds":8,"apl":2,"move":"6\"","defender_abilities":[],"is_aod":false,"is_kasrkin":true,"weapons":[{"name":"Hot-shot laspistol","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Range 8\""],"is_pistol":true}]},{"name":"Gunner","full_name":"KASRKIN GUNNER","save":4,"wounds":8,"apl":2,"move":"6\"","defender_abilities":[],"is_aod":false,"is_kasrkin":true,"weapons":[{"name":"Flamer","atk":4,"hit":2,"normal_dmg":3,"crit_dmg":3,"rules":["Range 8\"","Saturate","Torrent 2\""],"is_pistol":false},{"name":"Grenade launcher (frag)","atk":4,"hit":3,"normal_dmg":2,"crit_dmg":4,"rules":["Blast 2\""],"is_pistol":false},{"name":"Grenade launcher (krak)","atk":4,"hit":3,"normal_dmg":4,"crit_dmg":5,"rules":["Piercing 1"],"is_pistol":false},{"name":"Hot-shot volley gun (focused)","atk":5,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Piercing Crits 1"],"is_pistol":false},{"name":"Hot-shot volley gun (sweeping)","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Piercing Crits 1","Torrent 1\""],"is_pistol":false},{"name":"Meltagun","atk":4,"hit":3,"normal_dmg":6,"crit_dmg":3,"rules":["Range 6\"","Devastating 4","Piercing 2"],"is_pistol":false},{"name":"Plasma gun (standard)","atk":4,"hit":3,"normal_dmg":4,"crit_dmg":6,"rules":["Piercing 1"],"is_pistol":false},{"name":"Plasma gun (supercharge)","atk":4,"hit":3,"normal_dmg":5,"crit_dmg":6,"rules":["Hot","Lethal 5+","Piercing 1"],"is_pistol":false}]},{"name":"Recon-Trooper","full_name":"KASRKIN RECON-TROOPER","save":4,"wounds":8,"apl":2,"move":"6\"","defender_abilities":[],"is_aod":false,"is_kasrkin":true,"weapons":[{"name":"Hot-shot lasgun","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":[],"is_pistol":false}]},{"name":"Sharpshooter","full_name":"KASRKIN SHARPSHOOTER","save":4,"wounds":8,"apl":2,"move":"6\"","defender_abilities":["Camo Cloak"],"is_aod":false,"is_kasrkin":true,"weapons":[{"name":"Hot-shot marksman rifle (concealed)","atk":4,"hit":2,"normal_dmg":3,"crit_dmg":3,"rules":["Devastating 3","Heavy","Silent","Concealed Position*"],"is_pistol":false},{"name":"Hot-shot marksman rifle (mobile)","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":[],"is_pistol":false},{"name":"Hot-shot marksman rifle (stationary)","atk":4,"hit":2,"normal_dmg":3,"crit_dmg":3,"rules":["Devastating 3","Heavy"],"is_pistol":false}]},{"name":"Trooper","full_name":"KASRKIN TROOPER","save":4,"wounds":8,"apl":2,"move":"6\"","defender_abilities":[],"is_aod":false,"is_kasrkin":true,"weapons":[{"name":"Hot-shot lasgun","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":[],"is_pistol":false}]},{"name":"Vox-Trooper","full_name":"KASRKIN VOX-TROOPER","save":4,"wounds":8,"apl":2,"move":"6\"","defender_abilities":[],"is_aod":false,"is_kasrkin":true,"weapons":[{"name":"Hot-shot lasgun","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":[],"is_pistol":false}]}]},{"faction":"ANGELS OF DEATH","operatives":[{"name":"Captain","full_name":"SPACE MARINE CAPTAIN","save":3,"wounds":15,"apl":3,"move":"6\"","defender_abilities":["Iron Halo"],"is_aod":true,"is_kasrkin":false,"weapons":[{"name":"Plasma pistol (standard)","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":5,"rules":["Range 8\"","Piercing 1"],"is_pistol":true},{"name":"Plasma pistol (supercharge)","atk":4,"hit":3,"normal_dmg":4,"crit_dmg":5,"rules":["Range 8\"","Hot","Lethal 5+","Piercing 1"],"is_pistol":true}]},{"name":"Sergeant","full_name":"ASSAULT INTERCESSOR SERGEANT","save":3,"wounds":15,"apl":3,"move":"6\"","defender_abilities":[],"is_aod":true,"is_kasrkin":false,"weapons":[{"name":"Hand flamer","atk":4,"hit":2,"normal_dmg":3,"crit_dmg":3,"rules":["Range 6\"","Saturate","Torrent 1\""],"is_pistol":false},{"name":"Heavy bolt pistol","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Range 8\"","Piercing Crits 1"],"is_pistol":true},{"name":"Plasma pistol (standard)","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":5,"rules":["Range 8\"","Piercing 1"],"is_pistol":true},{"name":"Plasma pistol (supercharge)","atk":4,"hit":3,"normal_dmg":4,"crit_dmg":5,"rules":["Range 8\"","Hot","Lethal 5+","Piercing 1"],"is_pistol":true}]},{"name":"Sergeant","full_name":"INTERCESSOR SERGEANT","save":3,"wounds":15,"apl":3,"move":"6\"","defender_abilities":[],"is_aod":true,"is_kasrkin":false,"weapons":[{"name":"Auto bolt rifle","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Torrent 1\""],"is_pistol":false},{"name":"Bolt rifle","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Piercing Crits 1"],"is_pistol":false},{"name":"Stalker bolt rifle (heavy)","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":5,"rules":["Heavy (Dash only)","Lethal 5+","Piercing Crits 1"],"is_pistol":false},{"name":"Stalker bolt rifle (mobile)","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":[],"is_pistol":false}]},{"name":"Grenadier","full_name":"ASSAULT INTERCESSOR GRENADIER","save":3,"wounds":14,"apl":3,"move":"6\"","defender_abilities":[],"is_aod":true,"is_kasrkin":false,"weapons":[{"name":"Heavy bolt pistol","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Range 8\"","Piercing Crits 1"],"is_pistol":true}]},{"name":"Warrior","full_name":"ASSAULT INTERCESSOR WARRIOR","save":3,"wounds":14,"apl":3,"move":"6\"","defender_abilities":[],"is_aod":true,"is_kasrkin":false,"weapons":[{"name":"Heavy bolt pistol","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Range 8\"","Piercing Crits 1"],"is_pistol":true}]},{"name":"Gunner","full_name":"HEAVY INTERCESSOR GUNNER","save":3,"wounds":18,"apl":3,"move":"5\"","defender_abilities":[],"is_aod":true,"is_kasrkin":false,"weapons":[{"name":"Bolt pistol","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Range 8\""],"is_pistol":true},{"name":"Heavy bolter (focused)","atk":5,"hit":3,"normal_dmg":4,"crit_dmg":5,"rules":["Piercing Crits 1"],"is_pistol":false},{"name":"Heavy bolter (sweeping)","atk":4,"hit":3,"normal_dmg":4,"crit_dmg":5,"rules":["Piercing Crits 1","Torrent 1\""],"is_pistol":false}]},{"name":"Gunner","full_name":"INTERCESSOR GUNNER","save":3,"wounds":14,"apl":3,"move":"6\"","defender_abilities":[],"is_aod":true,"is_kasrkin":false,"weapons":[{"name":"Auto bolt rifle","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Torrent 1\""],"is_pistol":false},{"name":"Auxiliary grenade launcher (frag)","atk":4,"hit":3,"normal_dmg":2,"crit_dmg":4,"rules":["Blast 2\""],"is_pistol":false},{"name":"Auxiliary grenade launcher (krak)","atk":4,"hit":3,"normal_dmg":4,"crit_dmg":5,"rules":["Piercing 1"],"is_pistol":false},{"name":"Bolt rifle","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Piercing Crits 1"],"is_pistol":false},{"name":"Stalker bolt rifle (heavy)","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":5,"rules":["Heavy (Dash only)","Lethal 5+","Piercing Crits 1"],"is_pistol":false},{"name":"Stalker bolt rifle (mobile)","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":[],"is_pistol":false}]},{"name":"Warrior","full_name":"INTERCESSOR WARRIOR","save":3,"wounds":14,"apl":3,"move":"6\"","defender_abilities":[],"is_aod":true,"is_kasrkin":false,"weapons":[{"name":"Auto bolt rifle","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Torrent 1\""],"is_pistol":false},{"name":"Bolt rifle","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Piercing Crits 1"],"is_pistol":false},{"name":"Stalker bolt rifle (heavy)","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":5,"rules":["Heavy (Dash only)","Lethal 5+","Piercing Crits 1"],"is_pistol":false},{"name":"Stalker bolt rifle (mobile)","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":[],"is_pistol":false}]},{"name":"Sniper","full_name":"ELIMINATOR SNIPER","save":3,"wounds":12,"apl":3,"move":"7\"","defender_abilities":["Camo Cloak"],"is_aod":true,"is_kasrkin":false,"weapons":[{"name":"Bolt pistol","atk":4,"hit":3,"normal_dmg":3,"crit_dmg":4,"rules":["Range 8\""],"is_pistol":true},{"name":"Bolt sniper rifle (executioner)","atk":4,"hit":2,"normal_dmg":3,"crit_dmg":4,"rules":["Heavy (Dash only)","Saturate","Seek Light","Silent"],"is_pistol":false},{"name":"Bolt sniper rifle (hyperfrag)","atk":4,"hit":2,"normal_dmg":2,"crit_dmg":4,"rules":["Blast 1\"","Heavy (Dash only)","Silent"],"is_pistol":false},{"name":"Bolt sniper rifle (mortis)","atk":4,"hit":2,"normal_dmg":3,"crit_dmg":3,"rules":["Devastating 3","Heavy (Dash only)","Piercing 1","Silent"],"is_pistol":false}]}]}]};

/* ═══════════════════════════════════════════════════════════════════════════
   RULE PARSING
   ═══════════════════════════════════════════════════════════════════════════ */

const RULE_PATTERNS = [
  [/^Lethal\s+(\d+)\+?$/,            "Lethal"],
  [/^Accurate\s+(\d+)$/,             "Accurate"],
  [/^Piercing\s+(\d+)$/,             "Piercing"],
  [/^Piercing Crits\s+(\d+)$/,       "Piercing Crits"],
  [/^Devastating\s+(\d+)$/,          "Devastating"],
  [/^Range\s+\d+"$/,                 "Range"],
  [/^Torrent\s+\d+"$/,               "Torrent"],
  [/^Blast\s+\d+"$/,                 "Blast"],
  [/^Hot$/,                          "Hot"],
  [/^Ceaseless$/,                    "Ceaseless"],
  [/^Relentless$/,                   "Relentless"],
  [/^Balanced$/,                     "Balanced"],
  [/^Severe$/,                       "Severe"],
  [/^Rending$/,                      "Rending"],
  [/^Punishing$/,                    "Punishing"],
  [/^Saturate$/,                     "Saturate"],
  [/^Brutal$/,                       "Brutal"],
  [/^Shock$/,                        "Shock"],
  [/^Stun$/,                         "Stun"],
  [/^Heavy(\s*\([^)]*\))?$/,         "Heavy"],
  [/^Silent$/,                       "Silent"],
  [/^Seek( Light)?$/,                "Seek"],
  [/^Limited$/,                      "Limited"],
  [/^Concealed Position\*?$/,        "ConcealedPosition"],
];

function parseRule(s) {
  for (const [rx, name] of RULE_PATTERNS) {
    const m = s.match(rx);
    if (m) return { name, value: m[1] && /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : null, raw: s };
  }
  return { name: "__unknown__", value: null, raw: s };
}
const parseRules = (arr) => arr.map(parseRule);

/* ═══════════════════════════════════════════════════════════════════════════
   SIMULATION — verified to within ±0.01 of the Python reference
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
  const rules = weapon.parsedRules;
  const has = (n) => rules.some((r) => r.name === n);
  const val = (n) => { const r = rules.find((r) => r.name === n); return r ? r.value : null; };

  // modify_attack_stats
  let atkDice = weapon.atk;
  const hit = weapon.hit;
  let crit = 6;
  let preRet = 0;
  for (const r of rules) {
    if (r.name === "Lethal" && r.value < crit) crit = r.value;
    else if (r.name === "Accurate") {
      const k = Math.min(r.value, atkDice); atkDice -= k; preRet += k;
    }
  }
  if (atkEff.includes("Foregrip")) {
    const k = Math.min(1, atkDice); atkDice -= k; preRet += k;
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

  // pre_save_damage
  let dmg = 0, damCritDice = 0;
  const devV = val("Devastating");
  if (devV != null && atkC > 0) { dmg += atkC * devV; damCritDice = atkC; }

  // modify_defence_stats
  let defD = 3;
  let coverOff = false;
  const ignoreSat = defEff.includes("Camo Cloak");
  let coverSaves = 0;
  for (const r of rules) {
    if (r.name === "Piercing") defD = Math.max(0, defD - r.value);
    else if (r.name === "Piercing Crits" && atkC > 0) defD = Math.max(0, defD - r.value);
    else if (r.name === "Saturate" && !ignoreSat) coverOff = true;
  }
  if (env.cover && !coverOff && defD > 0) { defD -= 1; coverSaves += 1; }

  // roll defence dice
  let defC = 0, defN = coverSaves;
  const saveT = target.save;
  for (let i = 0; i < defD; i++) {
    const v = d6();
    if (v === 6) defC++; else if (v >= saveT) defN++;
  }

  // modify_defence_results
  if (defEff.includes("Transhuman Physiology") && defN > 0) { defN--; defC++; }

  // resolve saves
  const brutal = has("Brutal");
  const [remN, remC] = allocateSavesOptimally(
    atkN, atkC, defN, defC, weapon.normal_dmg, weapon.crit_dmg, brutal
  );
  dmg += remN * weapon.normal_dmg + remC * weapon.crit_dmg;
  let damNormDice = remN;
  if (!has("Devastating")) damCritDice = remC;

  // post_damage
  if (defEff.includes("Iron Halo") && damNormDice > 0) {
    dmg = Math.max(0, dmg - weapon.normal_dmg);
    damNormDice -= 1;
  }
  let selfDmg = 0;
  for (const r of rules) {
    if (r.name === "Hot") {
      const v = d6();
      if (v < hit) selfDmg += v * 2;
    }
  }

  return { damage: dmg, selfDamage: selfDmg, damDice: damNormDice + damCritDice };
}

function simulate(target, weapon, env, defEff, atkEff, trials) {
  const w = { ...weapon, parsedRules: parseRules(weapon.rules) };
  let sumD = 0, sumSD = 0, nAny = 0, nIncap = 0, nSelf = 0;
  const diceCounts = [0, 0, 0, 0, 0, 0];
  const dist = new Map();
  for (let i = 0; i < trials; i++) {
    const r = runShoot(target, w, env, defEff, atkEff);
    sumD += r.damage;
    sumSD += r.selfDamage;
    if (r.damage > 0) nAny++;
    if (r.damage >= target.wounds) nIncap++;
    if (r.selfDamage > 0) nSelf++;
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
    pSelf: nSelf / trials,
    pNDice: [1, 2, 3, 4, 5].map((k) => ({ n: k, p: diceCounts[k] / trials })),
    dist: distArr,
    maxATK: Math.max(weapon.atk, 5),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cinzel:wght@500;700&family=Oswald:wght@400;600&family=JetBrains+Mono:wght@400;600&display=swap');

body { margin: 0; }

.bg-grain {
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(184, 32, 58, 0.08) 0%, transparent 60%),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px),
    linear-gradient(180deg, #0a0706 0%, #0e0a08 100%);
}

.scanline::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 4px);
}

.panel {
  position: relative;
  background: #14100d;
  border: 1px solid #2a211d;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 12px rgba(0,0,0,0.6);
}
.panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, #b8203a 0%, transparent 80%);
}

.hard-shadow { text-shadow: 1px 1px 0 #000; }

.select-dark {
  background: #0a0706;
  border: 1px solid #2a211d;
  color: #e4ddd0;
  font-family: 'JetBrains Mono', monospace;
  transition: border-color 0.15s ease;
}
.select-dark:hover { border-color: #b8203a; }
.select-dark:focus { outline: none; border-color: #c9a74d; }

.btn-fire {
  background: linear-gradient(180deg, #b8203a 0%, #8a1a2e 100%);
  color: #fff8e0;
  border: 1px solid #c9a74d;
  font-family: 'Oswald', sans-serif;
  letter-spacing: 0.2em;
  transition: all 0.15s ease;
}
.btn-fire:hover { filter: brightness(1.15); }
.btn-fire:disabled { background: #2a211d; color: #7a6f5f; border-color: #2a211d; cursor: not-allowed; filter: none; }

.chip {
  display: inline-block;
  padding: 2px 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: #1f1814;
  border: 1px solid #3a302a;
  color: #c9a74d;
}
.chip-warn { color: #e68a6a; border-color: #6a3a2a; }
.chip-dim  { color: #7a6f5f; border-color: #2a211d; }

.tog {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: #0f0b09;
  border: 1px solid #2a211d;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #e4ddd0;
  cursor: pointer;
  transition: border-color 0.12s ease, background 0.12s ease;
  user-select: none;
}
.tog:hover { border-color: #5a4a3a; }
.tog.on { border-color: #c9a74d; background: #1a130d; color: #f4e6c0; }
.tog.on .tog-dot { background: #c9a74d; box-shadow: 0 0 8px #c9a74d; }
.tog-dot { width: 10px; height: 10px; background: #2a211d; border: 1px solid #3a302a; border-radius: 50%; }
.tog:disabled, .tog.disabled { opacity: 0.35; cursor: not-allowed; }

.bignum { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
.label-cap { font-family: 'Oswald', sans-serif; text-transform: uppercase; letter-spacing: 0.18em; color: #8a7e6a; font-size: 11px; }

.corner-brackets {
  position: relative;
}
.corner-brackets::before, .corner-brackets::after {
  content: '';
  position: absolute;
  width: 10px; height: 10px;
  border: 1px solid #c9a74d;
}
.corner-brackets::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.corner-brackets::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ═══════════════════════════════════════════════════════════════════════════ */

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <div className="label-cap mb-1">{label}</div>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select className="select-dark w-full px-3 py-2 text-sm"
            value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o, i) => (
        <option key={i} value={o.value} style={{ background: "#0a0706" }}>{o.label}</option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      className={`tog ${checked ? "on" : ""} ${disabled ? "disabled" : ""}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
    >
      <span className="tog-dot" />
      <span>{label}</span>
    </button>
  );
}

function StatChip({ label, value, accent }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="label-cap">{label}</span>
      <span className="bignum text-lg"
            style={{ color: accent || "#e4ddd0" }}>{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════════════ */

const ALL_OPERATIVES = DATA.factions.flatMap((f) =>
  f.operatives.map((op) => ({ ...op, faction: f.faction }))
);

function opKey(op) { return op.full_name; }
function findOp(key) { return ALL_OPERATIVES.find((o) => opKey(o) === key); }

export default function App() {
  // State
  const [shooterKey, setShooterKey] = useState(opKey(ALL_OPERATIVES.find((o) => o.full_name === "KASRKIN GUNNER")));
  const [targetKey,  setTargetKey]  = useState(opKey(ALL_OPERATIVES.find((o) => o.full_name === "SPACE MARINE CAPTAIN")));
  const [weaponIdx,  setWeaponIdx]  = useState(0);
  const [env, setEnv] = useState({ cover: false, obscured: false, vantageHeight: 0, targetEngaged: true });
  const [defEff, setDefEff] = useState([]);
  const [atkEff, setAtkEff] = useState([]);
  const [trials, setTrials] = useState(50000);
  const [stats, setStats] = useState(null);
  const [computing, setComputing] = useState(false);

  const shooter = findOp(shooterKey);
  const target  = findOp(targetKey);

  // Reset weapon when shooter changes
  const [lastShooter, setLastShooter] = useState(shooterKey);
  if (lastShooter !== shooterKey) {
    setLastShooter(shooterKey);
    setWeaponIdx(0);
    // Clear Foregrip if new shooter isn't Kasrkin
    const newOp = findOp(shooterKey);
    if (!newOp.is_kasrkin) setAtkEff((e) => e.filter((x) => x !== "Foregrip"));
  }

  // Reset defender effects when target changes (only keep valid ones)
  const [lastTarget, setLastTarget] = useState(targetKey);
  if (lastTarget !== targetKey) {
    setLastTarget(targetKey);
    const newTgt = findOp(targetKey);
    setDefEff((e) => e.filter((x) => {
      if (x === "Iron Halo")             return newTgt.defender_abilities.includes("Iron Halo");
      if (x === "Camo Cloak")            return newTgt.defender_abilities.includes("Camo Cloak");
      if (x === "Transhuman Physiology") return newTgt.is_aod;
      return true;
    }));
  }

  const weapon = shooter.weapons[Math.min(weaponIdx, shooter.weapons.length - 1)];

  // Available effect options based on current choices
  const canIronHalo  = target.defender_abilities.includes("Iron Halo");
  const canCamo      = target.defender_abilities.includes("Camo Cloak");
  const canTranshuman = target.is_aod;
  const canForegrip   = shooter.is_kasrkin && !weapon.is_pistol;

  function toggleEff(list, setList, name, allowed) {
    if (!allowed) return;
    setList(list.includes(name) ? list.filter((x) => x !== name) : [...list, name]);
  }

  function runFire() {
    setComputing(true);
    // Yield so the UI can update before the heavy sync work starts
    setTimeout(() => {
      const s = simulate(target, weapon, env, defEff, atkEff, trials);
      setStats({ ...s, shooterName: shooter.full_name, targetName: target.full_name, weaponName: weapon.name });
      setComputing(false);
    }, 10);
  }

  // Build option lists
  const opOptions = (filterFn) => ALL_OPERATIVES
    .filter(filterFn)
    .map((o) => ({ value: opKey(o), label: `${o.faction.split(" ")[0]} · ${o.full_name.replace(o.faction.split(" ")[0] + " ", "").replace(/^(SPACE MARINE |ASSAULT INTERCESSOR |INTERCESSOR |HEAVY INTERCESSOR |ELIMINATOR |KASRKIN )/, "")}` }));

  const weaponOptions = shooter.weapons.map((w, i) => ({
    value: String(i),
    label: `${w.name}  (A${w.atk} · ${w.hit}+ · ${w.normal_dmg}/${w.crit_dmg})`,
  }));

  return (
    <div className="min-h-screen bg-grain text-[#e4ddd0]"
         style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{FONT_CSS}</style>

      {/* HEADER */}
      <header className="max-w-6xl mx-auto px-4 pt-8 pb-6 text-center">
        <div className="text-[10px] tracking-[0.4em] text-[#7a6f5f] mb-2">
          + + COGITATOR MARK VI + + FIRING SOLUTIONS + +
        </div>
        <h1 className="text-4xl md:text-6xl"
            style={{ fontFamily: "'UnifrakturMaguntia', serif", color: "#c9a74d", textShadow: "2px 2px 0 #000, 0 0 24px rgba(184,32,58,0.25)" }}>
          Ballistica Imperialis
        </h1>
        <div className="mt-2 text-xs tracking-[0.3em]" style={{ fontFamily: "'Cinzel', serif", color: "#b8203a" }}>
          KASRKIN · vs · ADEPTUS ASTARTES
        </div>
      </header>

      {/* SHOOTER + TARGET */}
      <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SHOOTER */}
        <div className="panel p-4 corner-brackets">
          <div className="flex items-baseline justify-between mb-3">
            <h2 style={{ fontFamily: "'Oswald', sans-serif" }}
                className="text-lg tracking-[0.25em] text-[#c9a74d]">SHOOTER</h2>
            <span className="chip">ATTACKER</span>
          </div>

          <Field label="Operative">
            <Select value={shooterKey} onChange={setShooterKey} options={opOptions(() => true)} />
          </Field>

          <Field label="Weapon">
            <Select value={String(weaponIdx)} onChange={(v) => setWeaponIdx(parseInt(v, 10))} options={weaponOptions} />
          </Field>

          <div className="mt-2 mb-3 flex flex-wrap gap-2">
            <span className="chip">ATK {weapon.atk}</span>
            <span className="chip">HIT {weapon.hit}+</span>
            <span className="chip">DMG {weapon.normal_dmg}/{weapon.crit_dmg}</span>
            {weapon.is_pistol && <span className="chip chip-dim">PISTOL</span>}
          </div>

          {weapon.rules.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {weapon.rules.map((r, i) => (
                <span key={i} className="chip" style={{ background: "#1a130d", borderColor: "#4a3a2a" }}>
                  {r}
                </span>
              ))}
            </div>
          )}

          <div className="label-cap mt-4 mb-1">Attacker Effects</div>
          <div className="flex flex-wrap gap-2">
            <Toggle
              label={'Foregrip (within 3")'}
              checked={atkEff.includes("Foregrip")}
              disabled={!canForegrip}
              onChange={() => toggleEff(atkEff, setAtkEff, "Foregrip", canForegrip)}
            />
          </div>
          {!canForegrip && shooter.is_kasrkin && weapon.is_pistol && (
            <div className="text-[10px] text-[#7a6f5f] mt-1">Foregrip excludes pistols</div>
          )}
          {!shooter.is_kasrkin && (
            <div className="text-[10px] text-[#7a6f5f] mt-1">Foregrip is Kasrkin-only equipment</div>
          )}
        </div>

        {/* TARGET */}
        <div className="panel p-4 corner-brackets">
          <div className="flex items-baseline justify-between mb-3">
            <h2 style={{ fontFamily: "'Oswald', sans-serif" }}
                className="text-lg tracking-[0.25em] text-[#c9a74d]">TARGET</h2>
            <span className="chip">DEFENDER</span>
          </div>

          <Field label="Operative">
            <Select value={targetKey} onChange={setTargetKey} options={opOptions(() => true)} />
          </Field>

          <div className="mt-2 mb-3 flex flex-wrap gap-2">
            <span className="chip">SAVE {target.save}+</span>
            <span className="chip">{target.wounds} WOUNDS</span>
            <span className="chip chip-dim">APL {target.apl}</span>
            <span className="chip chip-dim">MV {target.move}</span>
          </div>

          {target.defender_abilities.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {target.defender_abilities.map((a, i) => (
                <span key={i} className="chip" style={{ background: "#1a130d", borderColor: "#4a3a2a" }}>
                  {a}
                </span>
              ))}
            </div>
          )}

          <div className="label-cap mt-4 mb-1">Defender Effects</div>
          <div className="flex flex-wrap gap-2">
            <Toggle
              label="Iron Halo"
              checked={defEff.includes("Iron Halo")}
              disabled={!canIronHalo}
              onChange={() => toggleEff(defEff, setDefEff, "Iron Halo", canIronHalo)}
            />
            <Toggle
              label="Camo Cloak"
              checked={defEff.includes("Camo Cloak")}
              disabled={!canCamo}
              onChange={() => toggleEff(defEff, setDefEff, "Camo Cloak", canCamo)}
            />
            <Toggle
              label="Transhuman Physiology (1CP)"
              checked={defEff.includes("Transhuman Physiology")}
              disabled={!canTranshuman}
              onChange={() => toggleEff(defEff, setDefEff, "Transhuman Physiology", canTranshuman)}
            />
          </div>
        </div>
      </section>

      {/* ENVIRONMENT */}
      <section className="max-w-6xl mx-auto px-4 mt-4">
        <div className="panel p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h2 style={{ fontFamily: "'Oswald', sans-serif" }}
                className="text-lg tracking-[0.25em] text-[#c9a74d]">ENGAGEMENT CONDITIONS</h2>
            <span className="chip">ENVIRONMENT</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <div className="label-cap mb-1">Cover</div>
              <Toggle
                label={env.cover ? "Defender in cover" : "No cover"}
                checked={env.cover}
                onChange={(v) => setEnv({ ...env, cover: v })}
              />
            </div>
            <div>
              <div className="label-cap mb-1">Obscured</div>
              <Toggle
                label={env.obscured ? "Target obscured (-1 ATK)" : "Clear sight lines"}
                checked={env.obscured}
                onChange={(v) => setEnv({ ...env, obscured: v })}
              />
            </div>
            <div>
              <div className="label-cap mb-1">Shooter Vantage</div>
              <Select
                value={String(env.vantageHeight)}
                onChange={(v) => setEnv({ ...env, vantageHeight: parseInt(v, 10) })}
                options={[
                  { value: "0", label: "No vantage" },
                  { value: "2", label: '≥ 2" higher (Accurate 1 if engaged)' },
                  { value: "4", label: '≥ 4" higher (Accurate 2 if engaged)' },
                ]}
              />
            </div>
            <div>
              <div className="label-cap mb-1">Target Order</div>
              <Select
                value={env.targetEngaged ? "engage" : "conceal"}
                onChange={(v) => setEnv({ ...env, targetEngaged: v === "engage" })}
                options={[
                  { value: "engage",  label: "Engage" },
                  { value: "conceal", label: "Conceal (no Vantage Accurate)" },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* RUN */}
      <section className="max-w-6xl mx-auto px-4 mt-4">
        <div className="panel p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <span className="label-cap">TRIALS</span>
            <Select
              value={String(trials)}
              onChange={(v) => setTrials(parseInt(v, 10))}
              options={[
                { value: "10000",  label: "10 000 · quick" },
                { value: "50000",  label: "50 000 · default" },
                { value: "200000", label: "200 000 · high precision" },
              ]}
            />
          </div>
          <button
            type="button"
            className="btn-fire px-10 py-3 text-lg w-full md:w-auto"
            onClick={runFire}
            disabled={computing}
          >
            {computing ? "COMPUTING..." : "FIRE WEAPON"}
          </button>
        </div>
      </section>

      {/* RESULTS */}
      {stats && (
        <section className="max-w-6xl mx-auto px-4 mt-6 mb-10">
          <div className="panel p-4 corner-brackets">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <h2 style={{ fontFamily: "'Oswald', sans-serif" }}
                  className="text-lg tracking-[0.25em] text-[#c9a74d]">FIRING DATA</h2>
              <span className="chip chip-dim">{stats.trials.toLocaleString()} TRIALS</span>
            </div>

            <div className="text-xs text-[#7a6f5f] mb-4 tracking-wider">
              {stats.shooterName} · {stats.weaponName}
              <span className="mx-2 text-[#b8203a]">→</span>
              {stats.targetName}
            </div>

            {/* Headline numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <HeadlineStat label="MEAN DAMAGE" value={stats.meanDmg.toFixed(2)} accent="#c9a74d"
                            hint={`of ${target.wounds} wounds`} />
              <HeadlineStat label="P(INCAPACITATE)" value={`${(stats.pIncap * 100).toFixed(1)}%`}
                            accent={stats.pIncap > 0.3 ? "#b8203a" : "#e4ddd0"}
                            hint={`≥ ${target.wounds} dmg`} />
              <HeadlineStat label="P(DEAL DAMAGE)" value={`${(stats.pAny * 100).toFixed(1)}%`}
                            hint="any target damage" />
              {stats.meanSelfDmg > 0 ? (
                <HeadlineStat label="SELF-DAMAGE" value={stats.meanSelfDmg.toFixed(2)}
                              accent="#e68a6a" hint={`Hot: ${(stats.pSelf * 100).toFixed(1)}%`} />
              ) : (
                <HeadlineStat label="ATTACK DICE" value={weapon.atk}
                              hint={`HIT ${weapon.hit}+`} />
              )}
            </div>

            {/* P(≥ N damaging dice) */}
            <div className="mb-6">
              <div className="label-cap mb-2">Probability of Damaging with at Least N Attack Dice</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {stats.pNDice.filter((x) => x.n <= Math.max(weapon.atk + 1, 4)).map((x) => (
                  <div key={x.n} className="p-3"
                       style={{ background: "#0f0b09", border: "1px solid #2a211d" }}>
                    <div className="label-cap">≥ {x.n} {x.n === 1 ? "DIE" : "DICE"}</div>
                    <div className="bignum text-xl" style={{ color: "#e4ddd0" }}>
                      {(x.p * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Damage distribution chart */}
            <div>
              <div className="label-cap mb-2">Damage Distribution</div>
              <div style={{ height: 260, background: "#0a0706", border: "1px solid #2a211d", padding: "12px 8px 8px 0" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dist} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <XAxis dataKey="dmg"
                           tick={{ fill: "#7a6f5f", fontFamily: "JetBrains Mono", fontSize: 10 }}
                           axisLine={{ stroke: "#2a211d" }}
                           tickLine={{ stroke: "#2a211d" }}
                           label={{ value: "damage inflicted",
                                    fill: "#8a7e6a", fontFamily: "Oswald", fontSize: 11,
                                    letterSpacing: "0.2em", position: "insideBottom", offset: -5 }} />
                    <YAxis tick={{ fill: "#7a6f5f", fontFamily: "JetBrains Mono", fontSize: 10 }}
                           axisLine={{ stroke: "#2a211d" }}
                           tickLine={{ stroke: "#2a211d" }}
                           tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip
                      cursor={{ fill: "rgba(184,32,58,0.08)" }}
                      contentStyle={{
                        background: "#0a0706", border: "1px solid #c9a74d",
                        fontFamily: "JetBrains Mono", fontSize: 12, color: "#e4ddd0",
                      }}
                      formatter={(v) => [`${(v * 100).toFixed(2)}%`, "probability"]}
                      labelFormatter={(v) => `${v} damage`}
                    />
                    <Bar dataKey="p" isAnimationActive={false}>
                      {stats.dist.map((entry, i) => {
                        const incap = entry.dmg >= target.wounds;
                        const zero = entry.dmg === 0;
                        return (
                          <Cell key={i}
                                fill={incap ? "#b8203a" : zero ? "#3a302a" : "#c9a74d"}
                                fillOpacity={incap ? 0.9 : zero ? 0.6 : 0.78} />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-[#7a6f5f]">
                <LegendDot color="#3a302a" label="NO DAMAGE" />
                <LegendDot color="#c9a74d" label="PARTIAL" />
                <LegendDot color="#b8203a" label={`INCAPACITATE (≥${target.wounds})`} />
              </div>
            </div>

            {/* Conditions summary */}
            <div className="mt-6 pt-4" style={{ borderTop: "1px solid #2a211d" }}>
              <div className="label-cap mb-2">Conditions Applied</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {env.cover     && <span className="chip">cover</span>}
                {env.obscured  && <span className="chip chip-warn">obscured</span>}
                {env.vantageHeight > 0 && <span className="chip">vantage {env.vantageHeight}"{env.targetEngaged ? "" : " (concealed — no Accurate)"}</span>}
                {!env.targetEngaged && env.vantageHeight === 0 && <span className="chip">target concealed</span>}
                {env.targetEngaged  && env.vantageHeight === 0 && !env.cover && !env.obscured && <span className="chip chip-dim">open ground</span>}
                {defEff.map((e, i) => <span key={i} className="chip" style={{ borderColor: "#4a3a2a" }}>D · {e}</span>)}
                {atkEff.map((e, i) => <span key={i} className="chip" style={{ borderColor: "#4a3a2a" }}>A · {e}</span>)}
              </div>
            </div>
          </div>
        </section>
      )}

      {!stats && (
        <section className="max-w-6xl mx-auto px-4 mt-6 mb-10 text-center">
          <div className="panel p-8">
            <div className="label-cap text-[#7a6f5f]">
              AWAITING FIRING SOLUTION · PRESS "FIRE WEAPON" TO COMPUTE
            </div>
          </div>
        </section>
      )}

      <footer className="max-w-6xl mx-auto px-4 pb-8 text-center text-[10px] text-[#5a4f3f] tracking-[0.2em]">
        + + + PRAISE BE THE OMNISSIAH + + + MONTE CARLO BY THE MACHINE GOD + + +
      </footer>
    </div>
  );
}

function HeadlineStat({ label, value, accent, hint }) {
  return (
    <div className="p-3 corner-brackets"
         style={{ background: "#0f0b09", border: "1px solid #2a211d" }}>
      <div className="label-cap">{label}</div>
      <div className="bignum text-3xl hard-shadow" style={{ color: accent || "#e4ddd0" }}>{value}</div>
      {hint && <div className="text-[10px] text-[#7a6f5f] mt-1">{hint}</div>}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span style={{ width: 10, height: 10, background: color, display: "inline-block" }} />
      <span className="tracking-[0.15em]">{label}</span>
    </span>
  );
}
