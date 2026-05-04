/* ═══════════════════════════════════════════════════════════════════════════
   WEAPON RULE PARSING
   ═══════════════════════════════════════════════════════════════════════════ */

const RULE_PATTERNS = [
  [/^Lethal\s+(\d+)\+?$/,            "Lethal"],
  [/^Accurate\s+(\d+)$/,             "Accurate"],
  [/^Piercing\s+(\d+)$/,             "Piercing"],
  [/^Piercing Crits\s+(\d+)$/,       "Piercing Crits"],
  [/^(?:\d+"\s+)?Devastating\s+(\d+)$/, "Devastating"],
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
  [/^Soulstrike$/,                   "Soulstrike"],
  [/^Heavy(\s*\([^)]*\))?$/,         "Heavy"],
  [/^Silent$/,                       "Silent"],
  [/^Seek( Light)?$/,                "Seek"],
  [/^Limited(\s+\d+)?$/,             "Limited"],
  [/^Concealed Position\*?$/,        "ConcealedPosition"],
];

export function parseRule(s) {
  for (const [rx, name] of RULE_PATTERNS) {
    const m = s.match(rx);
    if (m) {
      return {
        name,
        value: m[1] && /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : null,
        raw: s,
      };
    }
  }
  return { name: "__unknown__", value: null, raw: s };
}

export const parseRules = (arr) => arr.map(parseRule);
