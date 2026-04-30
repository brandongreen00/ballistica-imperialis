/* ═══════════════════════════════════════════════════════════════════════════
   ABILITY REGISTRY

   Defender and attacker effects are typed. Each entry has:
     id      — slug used in faction/operative data
     label   — display text in the toggle UI
     type    — drives behaviour in the simulator
     params  — type-specific parameters
     note    — optional caveat surfaced in the UI for approximations

   Supported types and their semantics inside the simulator:

     ATTACKER
       accurate            — { count }   reserve <count> dice as auto-passes,
                                         like the Accurate weapon rule
       add_rules           — { rules: [{ name, value? }, ...] }
                                         inject extra weapon rules for this
                                         shooting exchange (e.g. Severe from
                                         the Insidiants' Inspiring state, or
                                         Saturate + Accurate 1 from the
                                         Death Korps Siege Warfare ploy)

     DEFENDER
       ignore_damage_dice    — { dice_type: 'normal' | 'crit', count }
                               post-saves, ignore damage from <count> retained
                               dice of the chosen type (Iron Halo style)
       ignore_weapon_rule    — { rule }
                               treat the named weapon rule as not present for
                               this defender (Camo Cloak vs. Saturate)
       upgrade_save_to_crit  — { count }
                               convert <count> normal saves into crit saves
                               (Transhuman Physiology)
       discard_fail_for_save — { min_fails, count }
                               if at least <min_fails> defence dice failed,
                               gain <count> additional normal saves
                               (Astartes INDOMITUS strategy ploy)
       improve_save_in_cover — { amount }
                               improve save target by <amount> when in cover
                               (Death Korps Take Cover ploy)
       damage_reduction_per_die — { dice_type: 'normal' | 'crit' | 'all',
                                     threshold, reduce_by }
                               for each retained die of the chosen type, if
                               that die's damage stat is >= threshold,
                               subtract <reduce_by> per die (Death Korps
                               Veteran, Deathwatch Aggressive Force)
       damage_reduction_per_die_d6 — { dice_type, dmg_threshold,
                                        d6_threshold, reduce_by }
                               for each retained die of the chosen type, if
                               that die's damage stat is >= dmg_threshold,
                               roll a D6: on >= d6_threshold subtract
                               <reduce_by> from that die's damage (Plague
                               Marines Disgustingly Resilient, Castigator,
                               Axejack, Questkeeper, Mutant Regeneration)
       defence_reroll        — { fails: true, count? }
                               reroll defence dice that failed; with count
                               only reroll up to <count> failed dice
                               (Death Korps Zealot, Deathwatch Long Vigil)
       reduce_piercing       — { amount }
                               subtract <amount> from the value of all
                               Piercing / Piercing Crits weapon rules
                               (Deathwatch Storm Shield)
       cap_die_damage        — { dice_type, max }
                               cap each retained die's damage at <max>
                               (Warpcoven All is Dust)
       worsen_attacker_hit   — { amount }
                               worsen the attacker's Hit characteristic by
                               <amount> (Hunter Clade Vanguard aura)
       crit_to_normal_attack — { count }
                               convert <count> attacker crit hits to normal
                               hits before saves (Gellerpox Mutant)
       fnp                   — { threshold }
                               per-wound D6: a roll of >= threshold ignores
                               that wound (post-save, post-Iron-Halo)
       invuln_save           — { value }
                               replaces the operative's modified save target
                               with <value> for the defence roll, ignoring
                               Piercing modifiers
   ═══════════════════════════════════════════════════════════════════════════ */

export const ATTACKER_EFFECTS = {
  foregrip: {
    id: "foregrip",
    label: 'Foregrip (within 3")',
    type: "accurate",
    params: { count: 1 },
    excludes_pistol: true,
  },
  inspiration_severe: {
    id: "inspiration_severe",
    label: "Inspiration (Severe)",
    type: "add_rules",
    params: { rules: [{ name: "Severe" }] },
    note: "Insidiants gain Severe while INSPIRING — toggle to assume that state",
  },
  siege_warfare: {
    id: "siege_warfare",
    label: "Siege Warfare (1CP)",
    type: "add_rules",
    params: { rules: [{ name: "Saturate" }, { name: "Accurate", value: 1 }] },
    note: "Death Korps strategy ploy — Saturate + Accurate 1 on ranged weapons",
  },
  take_aim_ceaseless: {
    id: "take_aim_ceaseless",
    label: "Take Aim! (Order)",
    type: "add_rules",
    params: { rules: [{ name: "Ceaseless" }] },
    note: "Death Korps Guardsman Order — adds Ceaseless to ranged weapons",
  },
  mission_tactics_balanced: {
    id: "mission_tactics_balanced",
    label: "Mission Tactics (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Deathwatch — only vs operatives matching the selected order",
  },
  suffer_not_the_alien: {
    id: "suffer_not_the_alien",
    label: "Suffer Not The Alien (Relentless)",
    type: "add_rules",
    params: { rules: [{ name: "Relentless" }] },
    note: "Deathwatch — only vs non-Chaos / non-Imperium targets",
  },
  advanced_auspex_scan: {
    id: "advanced_auspex_scan",
    label: "Advanced Auspex Scan (Saturate)",
    type: "add_rules",
    params: { rules: [{ name: "Saturate" }] },
    note: "Deathwatch — also clears obscured (toggle Obscured off manually)",
  },
  lethal_proximity: {
    id: "lethal_proximity",
    label: "Lethal Proximity (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Starstrider — only when shooting an operative within 6\"",
  },
  merciless: {
    id: "merciless",
    label: "Merciless (Balanced vs wounded)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Elucia Vhane — only vs already-wounded targets",
  },
  terminal_decree: {
    id: "terminal_decree",
    label: "Terminal Decree (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Exaction Squad — when shooting within 6\" or any Gunner shoots",
  },
  attack_order_ceaseless: {
    id: "attack_order_ceaseless",
    label: "Attack Order (Ceaseless)",
    type: "add_rules",
    params: { rules: [{ name: "Ceaseless" }] },
    note: "Imperial Navy Breacher — only within 3\" of the Attack Order marker",
  },
  quarry_ceaseless: {
    id: "quarry_ceaseless",
    label: "Quarry (Ceaseless)",
    type: "add_rules",
    params: { rules: [{ name: "Ceaseless" }] },
    note: "Inquisitorial Agent — only vs the designated Quarry operative",
  },
  elimination_pattern: {
    id: "elimination_pattern",
    label: "Elimination Pattern (Piercing Crits 1)",
    type: "add_rules",
    params: { rules: [{ name: "Piercing Crits", value: 1 }] },
    note: "Kasrkin — only with hot-shot weapons vs targets without cover save",
  },
  clearance_sweep_ceaseless: {
    id: "clearance_sweep_ceaseless",
    label: "Clearance Sweep (Ceaseless)",
    type: "add_rules",
    params: { rules: [{ name: "Ceaseless" }] },
    note: "Kasrkin — only within 5\" horizontally of the Clearance marker",
  },
  neutralise_target_balanced: {
    id: "neutralise_target_balanced",
    label: "Neutralise Target (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Kasrkin — approx. of \"reroll any attack dice\"",
  },
  long_range_scope_saturate: {
    id: "long_range_scope_saturate",
    label: "Long-Range Scope (Saturate)",
    type: "add_rules",
    params: { rules: [{ name: "Saturate" }] },
    note: "Kasrkin equipment — only with hot-shot weapons at >6\"",
  },
  ardent_vengeance: {
    id: "ardent_vengeance",
    label: "Ardent Vengeance (Punishing)",
    type: "add_rules",
    params: { rules: [{ name: "Punishing" }] },
    note: "Novitiates — only vs expended enemy operatives",
  },
  guided_by_faith: {
    id: "guided_by_faith",
    label: "Guided by Faith (Seek)",
    type: "add_rules",
    params: { rules: [{ name: "Seek" }] },
    note: "Novitiates — only when shooting within 6\"",
  },
  crack_shots: {
    id: "crack_shots",
    label: "Crack Shots (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Ratlings — only with rifles vs targets >6\" away",
  },
  ardent_eradication: {
    id: "ardent_eradication",
    label: "Ardent Eradication (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Sanctifiers — approx. of \"reroll any attack dice\" near Orator",
  },
  ambush_balanced: {
    id: "ambush_balanced",
    label: "Ambush (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Scout Squad — only when ambushing (Conceal-to-Engage or hidden start)",
  },
  maintain_momentum_severe: {
    id: "maintain_momentum_severe",
    label: "Maintain Momentum (Severe)",
    type: "add_rules",
    params: { rules: [{ name: "Severe" }] },
    note: "Tempestus Aquilons — only when shooting a ready enemy operative",
  },
  fierce_temperament: {
    id: "fierce_temperament",
    label: "Fierce Temperament (Severe)",
    type: "add_rules",
    params: { rules: [{ name: "Severe" }] },
    note: "Wolf Scout Hunter — only within the STORM",
  },
  tempests_fury: {
    id: "tempests_fury",
    label: "Tempest's Fury (Punishing, ignore Hot)",
    type: "add_rules",
    params: { rules: [{ name: "Punishing" }] },
    note: "Wolf Scout Gunner — within STORM; removes Hot self-damage (not modelled)",
  },
  glory_kill_ceaseless: {
    id: "glory_kill_ceaseless",
    label: "Glory Kill (Ceaseless)",
    type: "add_rules",
    params: { rules: [{ name: "Ceaseless" }] },
    note: "Blooded — vs the chosen Glory Kill target",
  },
  reckless_aspirant: {
    id: "reckless_aspirant",
    label: "Reckless Aspirant (Punishing)",
    type: "add_rules",
    params: { rules: [{ name: "Punishing" }] },
    note: "Blooded — token holders wholly in opponent's territory",
  },
  pelting_firepower_ceaseless: {
    id: "pelting_firepower_ceaseless",
    label: "Pelting Firepower (Ceaseless)",
    type: "add_rules",
    params: { rules: [{ name: "Ceaseless" }] },
    note: "Fellgor — vs targets shot by another friendly this turning point",
  },
  pelting_firepower_relentless: {
    id: "pelting_firepower_relentless",
    label: "Pelting Firepower (Relentless)",
    type: "add_rules",
    params: { rules: [{ name: "Relentless" }] },
    note: "Fellgor — vs targets shot by 2+ other friendlies this turning point",
  },
  fickle_fates_balanced: {
    id: "fickle_fates_balanced",
    label: "Fickle Fates (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Legionary — only when shooting a ready enemy operative",
  },
  predators_above: {
    id: "predators_above",
    label: "Predators Above (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Murderwing — only when ≥2\" higher than killzone floor or after BOOST",
  },
  cull_the_weak: {
    id: "cull_the_weak",
    label: "Cull the Weak (Punishing)",
    type: "add_rules",
    params: { rules: [{ name: "Punishing" }] },
    note: "Murderwing — vs lower / wounded / lower-APL targets",
  },
  cruel_tormenter: {
    id: "cruel_tormenter",
    label: "Cruel Tormenter (Lethal 5+)",
    type: "add_rules",
    params: { rules: [{ name: "Lethal", value: 5 }] },
    note: "Nemesis Claw Warrior — vs wounded or W≤7 targets",
  },
  black_hunt: {
    id: "black_hunt",
    label: "The Black Hunt (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Nemesis Claw — vs wounded targets",
  },
  khaines_vengeance: {
    id: "khaines_vengeance",
    label: "Khaine's Vengeance (Ceaseless)",
    type: "add_rules",
    params: { rules: [{ name: "Ceaseless" }] },
    note: "Blades of Khaine — vs expended enemy operatives",
  },
  crossfire_balanced: {
    id: "crossfire_balanced",
    label: "Crossfire (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Brood Brother — vs targets with Crossfire token",
  },
};

export const DEFENDER_EFFECTS = {
  iron_halo: {
    id: "iron_halo",
    label: "Iron Halo",
    type: "ignore_damage_dice",
    params: { dice_type: "normal", count: 1 },
    note: "Iron Halo is once-per-battle; modelled as available for this single shoot",
  },
  camo_cloak: {
    id: "camo_cloak",
    label: "Camo Cloak",
    type: "ignore_weapon_rule",
    params: { rule: "Saturate" },
  },
  transhuman: {
    id: "transhuman",
    label: "Transhuman Physiology (1CP)",
    type: "upgrade_save_to_crit",
    params: { count: 1 },
  },
  indomitus: {
    id: "indomitus",
    label: "Indomitus (1CP)",
    type: "discard_fail_for_save",
    params: { min_fails: 2, count: 1 },
    note: "Indomitus needs ≥2 failed defence dice to trigger",
  },
  take_cover: {
    id: "take_cover",
    label: "Take Cover (1CP)",
    type: "improve_save_in_cover",
    params: { amount: 1 },
    note: "Death Korps Take Cover — Save +1 only when in cover",
  },
  veteran_dmg_reduction: {
    id: "veteran_dmg_reduction",
    label: "Veteran (-1 dmg per normal die ≥3)",
    type: "damage_reduction_per_die",
    params: { dice_type: "normal", threshold: 3, reduce_by: 1 },
    note: "Death Korps Veteran — normal damage 3+ takes 1 less per retained die",
  },
  zealot_defence_reroll: {
    id: "zealot_defence_reroll",
    label: "Zealot (reroll fails)",
    type: "defence_reroll",
    params: { fails: true },
    note: "Death Korps Zealot — reroll any failed defence dice",
  },
  storm_shield: {
    id: "storm_shield",
    label: "Storm Shield (-1 Piercing)",
    type: "reduce_piercing",
    params: { amount: 1 },
    note: "Deathwatch Aegis Veteran — reduces Piercing X / Piercing Crits X by 1",
  },
  aggressive_force: {
    id: "aggressive_force",
    label: "Aggressive Force (-1 dmg per die ≥3)",
    type: "damage_reduction_per_die",
    params: { dice_type: "all", threshold: 3, reduce_by: 1 },
    note: "Deathwatch Demolisher — applies to both normal and crit retained dice",
  },
  shield_that_slays: {
    id: "shield_that_slays",
    label: "Shield That Slays (-1 dmg per normal die ≥4)",
    type: "damage_reduction_per_die",
    params: { dice_type: "normal", threshold: 4, reduce_by: 1 },
    note: "Deathwatch — only when defender is in opponent territory",
  },
  long_vigil: {
    id: "long_vigil",
    label: "Long Vigil (reroll 1 fail)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Deathwatch — only when defender is in own territory",
  },
  disruption_field: {
    id: "disruption_field",
    label: "Disruption Field (ignore Piercing)",
    type: "reduce_piercing",
    params: { amount: 99 },
    note: "Elucia Vhane — fully negates Piercing X / Piercing Crits X",
  },
  rapid_reflexes: {
    id: "rapid_reflexes",
    label: "Rapid Reflexes (ignore Piercing)",
    type: "reduce_piercing",
    params: { amount: 99 },
    note: "Death Cult Executioner — fully negates Piercing X / Piercing Crits X",
  },
  hardy: {
    id: "hardy",
    label: "Hardy",
    type: "ignore_damage_dice",
    params: { dice_type: "normal", count: 1 },
    note: "Voidmaster Hardy — once per battle; modelled as available this shoot",
  },
  vanguard_aura: {
    id: "vanguard_aura",
    label: "Vanguard Aura (-1 attacker Hit)",
    type: "worsen_attacker_hit",
    params: { amount: 1 },
    note: "Hunter Clade Vanguard — only when attacker is within 2\" of a Vanguard",
  },
  brace_for_counterattack: {
    id: "brace_for_counterattack",
    label: "Brace for Counterattack (-1 dmg per die ≥3)",
    type: "damage_reduction_per_die",
    params: { dice_type: "all", threshold: 3, reduce_by: 1 },
    note: "Navy Breacher firefight ploy — only in territory or non-moving",
  },
  dt_blast_reroll: {
    id: "dt_blast_reroll",
    label: "Demo-Trooper (reroll 1 fail vs Blast/Torrent)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Kasrkin Demo-Trooper — only against Blast / Torrent weapons",
  },
  sermon_dmg_reduction: {
    id: "sermon_dmg_reduction",
    label: "Sermon (-1 dmg per die ≥4)",
    type: "damage_reduction_per_die",
    params: { dice_type: "all", threshold: 4, reduce_by: 1 },
    note: "Sanctifier Confessor — only while benefitting from the Sermon",
  },
  rosarius: {
    id: "rosarius",
    label: "Rosarius (1CP)",
    type: "ignore_damage_dice",
    params: { dice_type: "normal", count: 1 },
    note: "Sanctifiers firefight ploy — ignore damage from one normal die",
  },
  guerrilla_engagement: {
    id: "guerrilla_engagement",
    label: "Guerrilla Engagement (reroll 1 fail)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Scout Squad — only in cover and >6\" from visible enemies",
  },
  cloaked_by_storm: {
    id: "cloaked_by_storm",
    label: "Cloaked by the Storm (reroll 1 fail)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Wolf Scouts — only within the STORM",
  },
  malevolent_grit: {
    id: "malevolent_grit",
    label: "Malevolent Grit (reroll 1 fail)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Blooded — token holders or wholly in opponent's territory",
  },
  plagueridden_determination: {
    id: "plagueridden_determination",
    label: "Plagueridden Determination (reroll 1 fail)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Gellerpox — only when defender has Engage order",
  },
  augmented_endurance_half: {
    id: "augmented_endurance_half",
    label: "Augmented Endurance (half tank, reroll 1)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Goremonger — only when GORE TANK is half",
  },
  augmented_endurance_full: {
    id: "augmented_endurance_full",
    label: "Augmented Endurance (full tank, reroll all)",
    type: "defence_reroll",
    params: { fails: true },
    note: "Goremonger — only when GORE TANK is full",
  },
  nightmare_on_high: {
    id: "nightmare_on_high",
    label: "Nightmare on High (reroll 1 fail)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Murderwing — only when ≥2\" higher than killzone floor or after BOOST",
  },
  disgustingly_resilient: {
    id: "disgustingly_resilient",
    label: "Disgustingly Resilient (D6 4+ if dmg ≥3)",
    type: "damage_reduction_per_die_d6",
    params: { dice_type: "all", dmg_threshold: 3, d6_threshold: 4, reduce_by: 1 },
    note: "Plague Marines — per retained die with dmg ≥3, D6 4+ reduces by 1",
  },
  all_is_dust: {
    id: "all_is_dust",
    label: "All is Dust (cap normal dmg at 1)",
    type: "cap_die_damage",
    params: { dice_type: "normal", max: 1 },
    note: "Warpcoven — only applies to Rubric Marines",
  },
  mutant_crit_to_normal: {
    id: "mutant_crit_to_normal",
    label: "Mutant (crit → normal)",
    type: "crit_to_normal_attack",
    params: { count: 1 },
    note: "Gellerpox Mutant — convert one attacker crit hit to normal",
  },
  traitor_thug_tough: {
    id: "traitor_thug_tough",
    label: "Tough (-1 dmg per normal die ≥3)",
    type: "damage_reduction_per_die",
    params: { dice_type: "normal", threshold: 3, reduce_by: 1 },
    note: "Traitor Thug — same mechanic as DKoK Veteran",
  },
};

export function defenderEffect(id) {
  const e = DEFENDER_EFFECTS[id];
  if (!e) throw new Error(`Unknown defender effect: ${id}`);
  return e;
}

export function attackerEffect(id) {
  const e = ATTACKER_EFFECTS[id];
  if (!e) throw new Error(`Unknown attacker effect: ${id}`);
  return e;
}
