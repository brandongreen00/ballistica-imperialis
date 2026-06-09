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
       modify_atk_dice     — { amount }  add <amount> to the weapon's Atk
                                         characteristic (Inquisitorial Tome
                                         Denunciation +1 within 2")
       normal_to_crit_attack — { count } promote <count> retained normal hits
                                         to critical hits, post-categorise
                                         (Hearthkyn Salvagers Grudge tokens)
       composite           — { effects: [{ type, params }, ...] }
                                         bundle multiple typed sub-effects
                                         under a single toggle (Ravener
                                         Venomspitter Distend Dorsal Sac
                                         adds Lethal 5+ and +1 Atk together)

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
       halve_one_die_damage  — { min }
                               halve the damage of one damaging retained die
                               (round up, floor at <min>). Modelled as halving
                               the lowest-damage damaging die — i.e. assumes
                               the attacker resolves their lowest-damage die
                               first to minimise the ploy
                               (Starstrider Undaunted Explorers ploy)
       worsen_attacker_hit   — { amount }
                               worsen the attacker's Hit characteristic by
                               <amount> (Hunter Clade Vanguard aura)
       modify_atk_dice       — { amount }
                               add <amount> to the attacker's weapon Atk
                               (negative for Inquisitorial Sanctification −1)
       force_crit_six        — {}
                               only natural 6s count as crits, regardless of
                               Lethal weapon rule (Wrecka Krusha Armoured Up)
       crit_save_on          — { threshold }
                               defence dice results of >= threshold count as
                               critical saves (normally only a natural 6),
                               e.g. the Angels of Death Hardy chapter tactic
                               makes 5+ critical saves
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
  suspect_eliminate_punishing: {
    id: "suspect_eliminate_punishing",
    label: "Suspect & Eliminate (Punishing)",
    type: "add_rules",
    params: { rules: [{ name: "Punishing" }] },
    note: "Insidiants strategy ploy — when shooting or fighting an enemy operative that has one of your Suspicion tokens",
  },
  fervent_hate_ceaseless: {
    id: "fervent_hate_ceaseless",
    label: "Fervent Hate (Ceaseless)",
    type: "add_rules",
    params: { rules: [{ name: "Ceaseless" }] },
    note: "Insidiants firefight ploy — vs an enemy operative without the IMPERIUM keyword",
  },
  fervent_hate_relentless: {
    id: "fervent_hate_relentless",
    label: "Fervent Hate (Relentless)",
    type: "add_rules",
    params: { rules: [{ name: "Relentless" }] },
    note: "Insidiants firefight ploy — Relentless instead of Ceaseless when the non-IMPERIUM target also has the CHAOS and/or PSYKER keyword",
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
  sia_blast: {
    id: "sia_blast",
    label: "Special Issue Ammo — Blast 1\"",
    type: "add_rules",
    params: { rules: [{ name: "Blast", value: 1 }] },
    excludes_torrent: true,
    excludes_grenade_or_bomb: true,
    note: "Deathwatch — once per turning point; cannot be used with Torrent weapons, explosive grenades, or melta bombs. Single-target sim only models the close-quarters Lethal 5+ interaction (no splash).",
  },
  sia_devastating: {
    id: "sia_devastating",
    label: "Special Issue Ammo — Devastating 1",
    type: "add_rules",
    params: { rules: [{ name: "Devastating", value: 1 }] },
    excludes_grenade_or_bomb: true,
    note: "Deathwatch — once per turning point; cannot be used with explosive grenades or melta bombs",
  },
  sia_lethal: {
    id: "sia_lethal",
    label: "Special Issue Ammo — Lethal 5+",
    type: "add_rules",
    params: { rules: [{ name: "Lethal", value: 5 }] },
    excludes_grenade_or_bomb: true,
    note: "Deathwatch — once per turning point; cannot be used with explosive grenades or melta bombs",
  },
  sia_piercing_crits: {
    id: "sia_piercing_crits",
    label: "Special Issue Ammo — Piercing Crits 1",
    type: "add_rules",
    params: { rules: [{ name: "Piercing Crits", value: 1 }] },
    excludes_grenade_or_bomb: true,
    note: "Deathwatch — once per turning point; cannot be used with explosive grenades or melta bombs",
  },
  sia_saturate: {
    id: "sia_saturate",
    label: "Special Issue Ammo — Saturate",
    type: "add_rules",
    params: { rules: [{ name: "Saturate" }] },
    excludes_grenade_or_bomb: true,
    note: "Deathwatch — once per turning point; cannot be used with explosive grenades or melta bombs",
  },
  sia_severe: {
    id: "sia_severe",
    label: "Special Issue Ammo — Severe",
    type: "add_rules",
    params: { rules: [{ name: "Severe" }] },
    excludes_grenade_or_bomb: true,
    note: "Deathwatch — once per turning point; cannot be used with explosive grenades or melta bombs",
  },
  lethal_proximity: {
    id: "lethal_proximity",
    label: "Lethal Proximity (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Starstrider — only when shooting an operative within 6\"",
  },
  improved_coordinates_uplink: {
    id: "improved_coordinates_uplink",
    label: "Improved Coordinates Uplink (Saturate)",
    type: "add_rules",
    params: { rules: [{ name: "Saturate" }] },
    note: "Starstrider — PRIVATEER SUPPORT ASSET only; target within 6\" of a friendly NAVIS operative (target also cannot be obscured)",
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
  denunciation: {
    id: "denunciation",
    label: "Denunciation (+1 ATK)",
    type: "modify_atk_dice",
    params: { amount: 1 },
    note: "Inquisitorial Tome — target within 2\" of an ally with Denunciation",
  },
  light_em_up: {
    id: "light_em_up",
    label: "Light 'Em Up (Severe)",
    type: "add_rules",
    params: { rules: [{ name: "Severe" }] },
    note: "Kasrkin Skill at Arms — ranged weapons vs ready enemy operatives",
  },
  elimination_pattern: {
    id: "elimination_pattern",
    label: "Elimination Pattern (Piercing Crits 1)",
    type: "add_rules",
    params: { rules: [{ name: "Piercing Crits", value: 1 }] },
    note: "Kasrkin — only with hot-shot weapons vs targets not in cover (Piercing 1 instead for hot-shot volley gun, not modelled)",
  },
  clearance_sweep_balanced: {
    id: "clearance_sweep_balanced",
    label: "Clearance Sweep (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Kasrkin — only when shooter and target are both within 5\" horizontally of the Clearance Sweep marker",
  },
  neutralise_target_relentless: {
    id: "neutralise_target_relentless",
    label: "Neutralise Target (Relentless)",
    type: "add_rules",
    params: { rules: [{ name: "Relentless" }] },
    note: "Kasrkin — only vs expended targets not in cover; ploy lets you re-roll any attack dice (modelled as Relentless)",
  },
  long_range_scope_saturate: {
    id: "long_range_scope_saturate",
    label: "Long-Range Scope (Saturate)",
    type: "add_rules",
    params: { rules: [{ name: "Saturate" }] },
    note: "Kasrkin equipment — hot-shot weapons (excl. laspistol) at >6\"; only triggers if you retain a crit (overestimated)",
  },
  relics_of_cadia: {
    id: "relics_of_cadia",
    label: "Relics of Cadia (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Kasrkin equipment — once per turning point, if you roll 2+ fails, discard one to retain another as normal (modelled as Balanced)",
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
  transdynamic_amplification: {
    id: "transdynamic_amplification",
    label: "Transdynamic Amplification (Ceaseless)",
    type: "add_rules",
    params: { rules: [{ name: "Ceaseless" }] },
    note: "Canoptek Circle — only when shooting through / from the Matrix",
  },
  piratical_profiteers: {
    id: "piratical_profiteers",
    label: "Piratical Profiteers (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Corsair — only if shooter or target contests an objective",
  },
  outcasts_punishing: {
    id: "outcasts_punishing",
    label: "Outcasts (Punishing)",
    type: "add_rules",
    params: { rules: [{ name: "Punishing" }] },
    note: "Corsair — only when shooter is >5\" from other friendlies",
  },
  contemptuous_adventurer: {
    id: "contemptuous_adventurer",
    label: "Contemptuous Adventurer (Relentless)",
    type: "add_rules",
    params: { rules: [{ name: "Relentless" }] },
    note: "Corsair — first Shoot/Fight action only",
  },
  prey_balanced_severe: {
    id: "prey_balanced_severe",
    label: "Prey (Balanced + Severe)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }, { name: "Severe" }] },
    note: "Farstalker — only if shooter hasn't moved this activation",
  },
  vengeance_relentless: {
    id: "vengeance_relentless",
    label: "Vengeance (Relentless)",
    type: "add_rules",
    params: { rules: [{ name: "Relentless" }] },
    note: "Farstalker — vs the operative that incapped a kinband member",
  },
  merciless_sadists: {
    id: "merciless_sadists",
    label: "Merciless Sadists (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Hand of the Archon — vs wounded enemy operatives",
  },
  hidden_engagement: {
    id: "hidden_engagement",
    label: "Hidden Engagement (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Hernkyn Yaegir — only when shooter is in cover",
  },
  grudge_token: {
    id: "grudge_token",
    label: "Grudge (1 token: normal → crit)",
    type: "normal_to_crit_attack",
    params: { count: 1 },
    note: "Hearthkyn Salvagers — per Grudge token on the target, retain 1 normal hit as a critical hit; modelled as 1 token",
  },
  magnify_ceaseless: {
    id: "magnify_ceaseless",
    label: "Magnify (Ceaseless)",
    type: "add_rules",
    params: { rules: [{ name: "Ceaseless" }] },
    note: "Hierotek Circle — only when an APPRENTEK / CRYPTEK with Engage (and outside enemy control range) is visible to this operative",
  },
  augment_lethal5: {
    id: "augment_lethal5",
    label: "Augment Weapon (Lethal 5+)",
    type: "add_rules",
    params: { rules: [{ name: "Lethal", value: 5 }] },
    note: "Technomancer Augment Weapon — pick any two of Lethal 5+ / Rending / Saturate / Severe; requires a friendly Technomancer (or Apprentek via Apprentek Assistance) within 6\"",
  },
  augment_rending: {
    id: "augment_rending",
    label: "Augment Weapon (Rending)",
    type: "add_rules",
    params: { rules: [{ name: "Rending" }] },
    note: "Technomancer Augment Weapon — pick any two of Lethal 5+ / Rending / Saturate / Severe; requires a friendly Technomancer (or Apprentek via Apprentek Assistance) within 6\"",
  },
  augment_saturate: {
    id: "augment_saturate",
    label: "Augment Weapon (Saturate)",
    type: "add_rules",
    params: { rules: [{ name: "Saturate" }] },
    note: "Technomancer Augment Weapon — pick any two of Lethal 5+ / Rending / Saturate / Severe; requires a friendly Technomancer (or Apprentek via Apprentek Assistance) within 6\"",
  },
  augment_severe: {
    id: "augment_severe",
    label: "Augment Weapon (Severe)",
    type: "add_rules",
    params: { rules: [{ name: "Severe" }] },
    note: "Technomancer Augment Weapon — pick any two of Lethal 5+ / Rending / Saturate / Severe; requires a friendly Technomancer (or Apprentek via Apprentek Assistance) within 6\"",
  },
  dakka_dakka_punishing: {
    id: "dakka_dakka_punishing",
    label: "Dakka Dakka Dakka! (Punishing)",
    type: "add_rules",
    params: { rules: [{ name: "Punishing" }] },
    note: "Kommandos — adds Punishing to ranged weapons",
  },
  inescapable_nightmare: {
    id: "inescapable_nightmare",
    label: "Inescapable Nightmare (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Mandrakes — only when shooter is WITHIN SHADOW",
  },
  bonded_accurate: {
    id: "bonded_accurate",
    label: "Bonded (Accurate 1)",
    type: "add_rules",
    params: { rules: [{ name: "Accurate", value: 1 }] },
    note: "Pathfinders — only when within 3\" of another non-DRONE Pathfinder",
  },
  airborne_predators: {
    id: "airborne_predators",
    label: "Airborne Predators (Balanced)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Vespid — adds Balanced to ranged weapons for the activation",
  },
  neutron_charge: {
    id: "neutron_charge",
    label: "Neutron Charge (Piercing 1)",
    type: "add_rules",
    params: { rules: [{ name: "Piercing", value: 1 }] },
    note: "Vespid faction rule — neutron weapons gain Piercing 1 until end of turning point if the operative performed a moving action. Toggle off when firing the Swarmguard's flamer (non-neutron).",
  },
  aerial_guidance: {
    id: "aerial_guidance",
    label: "Aerial Guidance (Oversight Drone — Saturate)",
    type: "add_rules",
    params: { rules: [{ name: "Saturate" }] },
    note: "Vespid Oversight Drone SUPPORT action — friendly Vespid visible to and within 6\" of the Drone gain Saturate on ranged weapons until the Drone's next activation",
  },
  communion_reroll: {
    id: "communion_reroll",
    label: "Communion (re-roll 1 attack die)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }] },
    note: "Vespid faction rule — spend 1 Communion point to re-roll one attack die; modelled as Balanced. The Strain Leader's Communion Helm grants this for free once per activation. Mutually exclusive with the Warrior's Warrior Instincts.",
  },
  warrior_instincts: {
    id: "warrior_instincts",
    label: "Warrior Instincts (Accurate 1)",
    type: "add_rules",
    params: { rules: [{ name: "Accurate", value: 1 }] },
    note: "Vespid Warrior — neutron blaster gains Accurate 1 if you don't spend any Communion points during this shoot. Don't enable alongside Communion for the same sequence.",
  },
  distend_dorsal_sac: {
    id: "distend_dorsal_sac",
    label: "Distend Dorsal Sac (1AP)",
    type: "composite",
    params: {
      effects: [
        { type: "add_rules", params: { rules: [{ name: "Lethal", value: 5 }] } },
        { type: "modify_atk_dice", params: { amount: 1 } },
      ],
    },
    note: "Venomspitter — Lethal 5+ and +1 Atk on venom bolt; also removes Range 8\" (range not modelled)",
  },
  destruction_saturate: {
    id: "destruction_saturate",
    label: "Destruction (Saturate)",
    type: "add_rules",
    params: { rules: [{ name: "Saturate" }] },
    note: "Wrecka Krew — adds Saturate to ranged weapons",
  },
  plague_rounds: {
    id: "plague_rounds",
    label: "Plague Rounds (Severe)",
    type: "add_rules",
    params: { rules: [{ name: "Severe" }] },
    requires_bolt_weapon: true,
    note: "Plague Marines equipment — boltguns and bolt pistols gain Poison and Severe. Poison's 1-dmg-per-activation token effect happens between activations and isn't modelled in a single shoot.",
  },
  day_is_at_hand: {
    id: "day_is_at_hand",
    label: "The Day is at Hand (Rending)",
    type: "add_rules",
    params: { rules: [{ name: "Rending" }] },
    note: "Wyrmblade — only when order changed from Conceal to Engage",
  },
  wyrmblade_crossfire: {
    id: "wyrmblade_crossfire",
    label: "Crossfire (Accurate 1)",
    type: "add_rules",
    params: { rules: [{ name: "Accurate", value: 1 }] },
    note: "Wyrmblade — vs targets shot by another friendly this turn",
  },
  patient_hunters: {
    id: "patient_hunters",
    label: "Patient Hunters (Balanced + Saturate)",
    type: "add_rules",
    params: { rules: [{ name: "Balanced" }, { name: "Saturate" }] },
    note: "XV26 — vs expended enemy operatives",
  },
  prepare_ambush_seek: {
    id: "prepare_ambush_seek",
    label: "Prepare Ambush (Seek)",
    type: "add_rules",
    params: { rules: [{ name: "Seek" }] },
    note: "XV26 — vs targets within 2\" of the Ambush marker",
  },
  markerlight_severe: {
    id: "markerlight_severe",
    label: "Markerlight (Severe)",
    type: "add_rules",
    params: { rules: [{ name: "Severe" }] },
    note: "XV26 — only when shooting a marked target",
  },
  // XV26 Kauyon faction rule: a friendly operative's ranged weapons gain
  // Accurate X, where X is set by the target's location (1 within 3" of your
  // territory, 2 within your territory, 3 within 3" of your drop zone). The
  // Shas'vre's For the Greater Good can raise X by 1 (max 3) when XV26 losses
  // mount. Pick the tier that matches the engagement — they share a group so
  // only one applies at a time.
  kauyon_accurate_1: {
    id: "kauyon_accurate_1",
    label: "Kauyon (Accurate 1)",
    type: "accurate",
    params: { count: 1 },
    group: "kauyon",
    note: "XV26 Kauyon — target within 3\" of your territory",
  },
  kauyon_accurate_2: {
    id: "kauyon_accurate_2",
    label: "Kauyon (Accurate 2)",
    type: "accurate",
    params: { count: 2 },
    group: "kauyon",
    note: "XV26 Kauyon — target within your territory",
  },
  kauyon_accurate_3: {
    id: "kauyon_accurate_3",
    label: "Kauyon (Accurate 3)",
    type: "accurate",
    params: { count: 3 },
    group: "kauyon",
    note: "XV26 Kauyon — target within 3\" of your drop zone (or raised by For the Greater Good)",
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
  aod_hardy: {
    id: "aod_hardy",
    label: "Hardy (5+ crit saves)",
    type: "crit_save_on",
    params: { threshold: 5 },
    note: "Angels of Death Hardy chapter tactic — when this operative is shot, defence dice of 5+ are critical saves. Its retaliation −1 damage clause is melee-only and isn't modelled in the shooting sim.",
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
  undaunted_explorers: {
    id: "undaunted_explorers",
    label: "Undaunted Explorers (1CP)",
    type: "halve_one_die_damage",
    params: { min: 2 },
    note: "Starstrider strategic ploy — first damaging attack die per turning point has its damage halved (round up, min 2); modelled as halving the lowest-damage damaging die",
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
  sanctification: {
    id: "sanctification",
    label: "Sanctification (-1 ATK)",
    type: "modify_atk_dice",
    params: { amount: -1 },
    note: "Inquisitorial Tome — defender within 2\" of an ally with Sanctification",
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
    note: "Kasrkin Demo-Trooper — only against Blast / Torrent weapons (excluding sweeping profiles)",
  },
  engage_from_cover: {
    id: "engage_from_cover",
    label: "Engage From Cover (reroll 1 fail)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Kasrkin strategy ploy — only when defender is in cover",
  },
  ice_in_your_veins: {
    id: "ice_in_your_veins",
    label: "Ice In Your Veins (-1 dmg per die ≥4)",
    type: "damage_reduction_per_die",
    params: { dice_type: "all", threshold: 4, reduce_by: 1 },
    note: "Kasrkin Skill at Arms — actually first dice ≥4 dmg only per sequence (overestimated)",
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
  hypershielding: {
    id: "hypershielding",
    label: "Hypershielding (reroll fails)",
    type: "defence_reroll",
    params: { fails: true },
    note: "Canoptek Circle — only when defender is in / protected by the Matrix",
  },
  shield_flare: {
    id: "shield_flare",
    label: "Shield Flare (ignore 1 normal die)",
    type: "ignore_damage_dice",
    params: { dice_type: "normal", count: 1 },
    note: "Canoptek Circle — only within the Matrix",
  },
  mobile_engagement: {
    id: "mobile_engagement",
    label: "Mobile Engagement (reroll 1 fail)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Corsair — only if defender moved this turning point",
  },
  denizens_of_night: {
    id: "denizens_of_night",
    label: "Denizens of Night (reroll 1 fail)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Hand of the Archon — only with intervening terrain or Vantage",
  },
  sturdy: {
    id: "sturdy",
    label: "Sturdy (all crits → normal)",
    type: "crit_to_normal_attack",
    params: { count: 99 },
    note: "Leagues of Votann (Hernkyn Yaegir / Hearthkyn Salvagers) — converts all attacker crit hits to normal hits",
  },
  wrought_defence: {
    id: "wrought_defence",
    label: "Wrought Defence (reroll 1 fail)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Hearthkyn Salvagers — only when 2+ defence dice failed; modelled as always available (slight overestimate at 1 fail)",
  },
  just_a_scratch: {
    id: "just_a_scratch",
    label: "Just a Scratch (ignore 1 normal die)",
    type: "ignore_damage_dice",
    params: { dice_type: "normal", count: 1 },
    note: "Kommandos — ignore one normal die damage (excludes Squig/Grot)",
  },
  whipcord_emergence_burrowed: {
    id: "whipcord_emergence_burrowed",
    label: "Whipcord Emergence — Burrowed (reroll 1)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    group: "whipcord_emergence",
    note: "Raveners — Burrowed this TP & not on Tunnel: re-roll one defence die",
  },
  whipcord_emergence_tunnel: {
    id: "whipcord_emergence_tunnel",
    label: "Whipcord Emergence — On Tunnel (reroll any)",
    type: "defence_reroll",
    params: { fails: true },
    group: "whipcord_emergence",
    note: "Raveners — on your Tunnel: re-roll any defence dice (regardless of Burrow)",
  },
  prismatic_blur: {
    id: "prismatic_blur",
    label: "Prismatic Blur (reroll 1 fail)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Void-dancer — only if defender moved this turning point",
  },
  tuff_gitz: {
    id: "tuff_gitz",
    label: "Tuff Gitz (reroll 1 fail)",
    type: "defence_reroll",
    params: { fails: true, count: 1 },
    note: "Wrecka Krew — only when defender has Engage order",
  },
  armoured_up: {
    id: "armoured_up",
    label: "Armoured Up (only natural 6 = crit)",
    type: "force_crit_six",
    params: {},
    note: "Wrecka Krusha — disables attacker's Lethal weapon rule",
  },
  aerial_agility: {
    id: "aerial_agility",
    label: "Aerial Agility (ignore 1 normal die approx.)",
    type: "ignore_damage_dice",
    params: { dice_type: "normal", count: 1 },
    note: "Vespid — actually D6 5+ per die capped at 1; modelled as auto-ignore (overestimate)",
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
