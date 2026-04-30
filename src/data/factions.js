/* ═══════════════════════════════════════════════════════════════════════════
   KILL TEAMS

   Source of truth: https://wahapedia.ru/kill-team3/

   Schema:
     {
       id, name, short,
       attacker_effects: [effect_id, ...],   // selectable for any operative
       defender_effects: [effect_id, ...],   // selectable when targeting any
       operatives: [{
         id, name, full_name,
         save, wounds, apl, move,
         defender_abilities: [effect_id, ...],  // operative-specific
         attacker_effects:    [effect_id, ...], // operative-specific
         weapons: [{
           name, atk, hit, normal_dmg, crit_dmg, rules, is_pistol,
         }],
       }],
     }
   ═══════════════════════════════════════════════════════════════════════════ */

export const FACTIONS = [
  {
    id: "kasrkin",
    name: "KASRKIN",
    short: "KASRKIN",
    attacker_effects: ["foregrip"],
    defender_effects: [],
    operatives: [
      {
        id: "kasrkin-sergeant",
        name: "Sergeant",
        full_name: "KASRKIN SERGEANT",
        save: 4, wounds: 9, apl: 3, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Bolt pistol", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Range 8\""], is_pistol: true },
          { name: "Hot-shot lasgun", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: [], is_pistol: false },
          { name: "Hot-shot laspistol", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Range 8\""], is_pistol: true },
          { name: "Plasma pistol (standard)", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 5, rules: ["Range 8\"", "Piercing 1"], is_pistol: true },
          { name: "Plasma pistol (supercharge)", atk: 4, hit: 3, normal_dmg: 4, crit_dmg: 5, rules: ["Range 8\"", "Hot", "Lethal 5+", "Piercing 1"], is_pistol: true },
        ],
      },
      {
        id: "kasrkin-combat-medic",
        name: "Combat Medic",
        full_name: "KASRKIN COMBAT MEDIC",
        save: 4, wounds: 8, apl: 2, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Hot-shot lasgun", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: [], is_pistol: false },
        ],
      },
      {
        id: "kasrkin-demo-trooper",
        name: "Demo-Trooper",
        full_name: "KASRKIN DEMO-TROOPER",
        save: 4, wounds: 8, apl: 2, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Hot-shot laspistol", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Range 8\""], is_pistol: true },
        ],
      },
      {
        id: "kasrkin-gunner",
        name: "Gunner",
        full_name: "KASRKIN GUNNER",
        save: 4, wounds: 8, apl: 2, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Flamer", atk: 4, hit: 2, normal_dmg: 3, crit_dmg: 3, rules: ["Range 8\"", "Saturate", "Torrent 2\""], is_pistol: false },
          { name: "Grenade launcher (frag)", atk: 4, hit: 3, normal_dmg: 2, crit_dmg: 4, rules: ["Blast 2\""], is_pistol: false },
          { name: "Grenade launcher (krak)", atk: 4, hit: 3, normal_dmg: 4, crit_dmg: 5, rules: ["Piercing 1"], is_pistol: false },
          { name: "Hot-shot volley gun (focused)", atk: 5, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Piercing Crits 1"], is_pistol: false },
          { name: "Hot-shot volley gun (sweeping)", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Piercing Crits 1", "Torrent 1\""], is_pistol: false },
          { name: "Meltagun", atk: 4, hit: 3, normal_dmg: 6, crit_dmg: 3, rules: ["Range 6\"", "Devastating 4", "Piercing 2"], is_pistol: false },
          { name: "Plasma gun (standard)", atk: 4, hit: 3, normal_dmg: 4, crit_dmg: 6, rules: ["Piercing 1"], is_pistol: false },
          { name: "Plasma gun (supercharge)", atk: 4, hit: 3, normal_dmg: 5, crit_dmg: 6, rules: ["Hot", "Lethal 5+", "Piercing 1"], is_pistol: false },
        ],
      },
      {
        id: "kasrkin-recon-trooper",
        name: "Recon-Trooper",
        full_name: "KASRKIN RECON-TROOPER",
        save: 4, wounds: 8, apl: 2, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Hot-shot lasgun", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: [], is_pistol: false },
        ],
      },
      {
        id: "kasrkin-sharpshooter",
        name: "Sharpshooter",
        full_name: "KASRKIN SHARPSHOOTER",
        save: 4, wounds: 8, apl: 2, move: "6\"",
        defender_abilities: ["camo_cloak"],
        attacker_effects: [],
        weapons: [
          { name: "Hot-shot marksman rifle (concealed)", atk: 4, hit: 2, normal_dmg: 3, crit_dmg: 3, rules: ["Devastating 3", "Heavy", "Silent", "Concealed Position*"], is_pistol: false },
          { name: "Hot-shot marksman rifle (mobile)", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: [], is_pistol: false },
          { name: "Hot-shot marksman rifle (stationary)", atk: 4, hit: 2, normal_dmg: 3, crit_dmg: 3, rules: ["Devastating 3", "Heavy"], is_pistol: false },
        ],
      },
      {
        id: "kasrkin-trooper",
        name: "Trooper",
        full_name: "KASRKIN TROOPER",
        save: 4, wounds: 8, apl: 2, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Hot-shot lasgun", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: [], is_pistol: false },
        ],
      },
      {
        id: "kasrkin-vox-trooper",
        name: "Vox-Trooper",
        full_name: "KASRKIN VOX-TROOPER",
        save: 4, wounds: 8, apl: 2, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Hot-shot lasgun", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: [], is_pistol: false },
        ],
      },
    ],
  },

  {
    id: "angels-of-death",
    name: "ANGELS OF DEATH",
    short: "ANGELS",
    attacker_effects: [],
    defender_effects: ["transhuman"],
    operatives: [
      {
        id: "aod-captain",
        name: "Captain",
        full_name: "SPACE MARINE CAPTAIN",
        save: 3, wounds: 15, apl: 3, move: "6\"",
        defender_abilities: ["iron_halo"],
        attacker_effects: [],
        weapons: [
          { name: "Plasma pistol (standard)", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 5, rules: ["Range 8\"", "Piercing 1"], is_pistol: true },
          { name: "Plasma pistol (supercharge)", atk: 4, hit: 3, normal_dmg: 4, crit_dmg: 5, rules: ["Range 8\"", "Hot", "Lethal 5+", "Piercing 1"], is_pistol: true },
        ],
      },
      {
        id: "aod-assault-sergeant",
        name: "Sergeant",
        full_name: "ASSAULT INTERCESSOR SERGEANT",
        save: 3, wounds: 15, apl: 3, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Hand flamer", atk: 4, hit: 2, normal_dmg: 3, crit_dmg: 3, rules: ["Range 6\"", "Saturate", "Torrent 1\""], is_pistol: false },
          { name: "Heavy bolt pistol", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Range 8\"", "Piercing Crits 1"], is_pistol: true },
          { name: "Plasma pistol (standard)", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 5, rules: ["Range 8\"", "Piercing 1"], is_pistol: true },
          { name: "Plasma pistol (supercharge)", atk: 4, hit: 3, normal_dmg: 4, crit_dmg: 5, rules: ["Range 8\"", "Hot", "Lethal 5+", "Piercing 1"], is_pistol: true },
        ],
      },
      {
        id: "aod-intercessor-sergeant",
        name: "Sergeant",
        full_name: "INTERCESSOR SERGEANT",
        save: 3, wounds: 15, apl: 3, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Auto bolt rifle", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Torrent 1\""], is_pistol: false },
          { name: "Bolt rifle", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Piercing Crits 1"], is_pistol: false },
          { name: "Stalker bolt rifle (heavy)", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 5, rules: ["Heavy (Dash only)", "Lethal 5+", "Piercing Crits 1"], is_pistol: false },
          { name: "Stalker bolt rifle (mobile)", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: [], is_pistol: false },
        ],
      },
      {
        id: "aod-assault-grenadier",
        name: "Grenadier",
        full_name: "ASSAULT INTERCESSOR GRENADIER",
        save: 3, wounds: 14, apl: 3, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Heavy bolt pistol", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Range 8\"", "Piercing Crits 1"], is_pistol: true },
        ],
      },
      {
        id: "aod-assault-warrior",
        name: "Warrior",
        full_name: "ASSAULT INTERCESSOR WARRIOR",
        save: 3, wounds: 14, apl: 3, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Heavy bolt pistol", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Range 8\"", "Piercing Crits 1"], is_pistol: true },
        ],
      },
      {
        id: "aod-heavy-gunner",
        name: "Gunner",
        full_name: "HEAVY INTERCESSOR GUNNER",
        save: 3, wounds: 18, apl: 3, move: "5\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Bolt pistol", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Range 8\""], is_pistol: true },
          { name: "Heavy bolter (focused)", atk: 5, hit: 3, normal_dmg: 4, crit_dmg: 5, rules: ["Piercing Crits 1"], is_pistol: false },
          { name: "Heavy bolter (sweeping)", atk: 4, hit: 3, normal_dmg: 4, crit_dmg: 5, rules: ["Piercing Crits 1", "Torrent 1\""], is_pistol: false },
        ],
      },
      {
        id: "aod-intercessor-gunner",
        name: "Gunner",
        full_name: "INTERCESSOR GUNNER",
        save: 3, wounds: 14, apl: 3, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Auto bolt rifle", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Torrent 1\""], is_pistol: false },
          { name: "Auxiliary grenade launcher (frag)", atk: 4, hit: 3, normal_dmg: 2, crit_dmg: 4, rules: ["Blast 2\""], is_pistol: false },
          { name: "Auxiliary grenade launcher (krak)", atk: 4, hit: 3, normal_dmg: 4, crit_dmg: 5, rules: ["Piercing 1"], is_pistol: false },
          { name: "Bolt rifle", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Piercing Crits 1"], is_pistol: false },
          { name: "Stalker bolt rifle (heavy)", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 5, rules: ["Heavy (Dash only)", "Lethal 5+", "Piercing Crits 1"], is_pistol: false },
          { name: "Stalker bolt rifle (mobile)", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: [], is_pistol: false },
        ],
      },
      {
        id: "aod-intercessor-warrior",
        name: "Warrior",
        full_name: "INTERCESSOR WARRIOR",
        save: 3, wounds: 14, apl: 3, move: "6\"",
        defender_abilities: [],
        attacker_effects: [],
        weapons: [
          { name: "Auto bolt rifle", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Torrent 1\""], is_pistol: false },
          { name: "Bolt rifle", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Piercing Crits 1"], is_pistol: false },
          { name: "Stalker bolt rifle (heavy)", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 5, rules: ["Heavy (Dash only)", "Lethal 5+", "Piercing Crits 1"], is_pistol: false },
          { name: "Stalker bolt rifle (mobile)", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: [], is_pistol: false },
        ],
      },
      {
        id: "aod-eliminator-sniper",
        name: "Sniper",
        full_name: "ELIMINATOR SNIPER",
        save: 3, wounds: 12, apl: 3, move: "7\"",
        defender_abilities: ["camo_cloak"],
        attacker_effects: [],
        weapons: [
          { name: "Bolt pistol", atk: 4, hit: 3, normal_dmg: 3, crit_dmg: 4, rules: ["Range 8\""], is_pistol: true },
          { name: "Bolt sniper rifle (executioner)", atk: 4, hit: 2, normal_dmg: 3, crit_dmg: 4, rules: ["Heavy (Dash only)", "Saturate", "Seek Light", "Silent"], is_pistol: false },
          { name: "Bolt sniper rifle (hyperfrag)", atk: 4, hit: 2, normal_dmg: 2, crit_dmg: 4, rules: ["Blast 1\"", "Heavy (Dash only)", "Silent"], is_pistol: false },
          { name: "Bolt sniper rifle (mortis)", atk: 4, hit: 2, normal_dmg: 3, crit_dmg: 3, rules: ["Devastating 3", "Heavy (Dash only)", "Piercing 1", "Silent"], is_pistol: false },
        ],
      },
    ],
  },
];
