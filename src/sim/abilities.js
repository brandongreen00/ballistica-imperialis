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
};

export const DEFENDER_EFFECTS = {
  iron_halo: {
    id: "iron_halo",
    label: "Iron Halo",
    type: "ignore_damage_dice",
    params: { dice_type: "normal", count: 1 },
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
