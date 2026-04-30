export const THEMES = {
  imperium: {
    "accent-primary":      "#c9a74d",
    "accent-action":       "#b8203a",
    "accent-action-deep":  "#8a1a2e",
    "accent-action-glow":  "rgba(184, 32, 58, 0.25)",
    "accent-action-soft":  "rgba(184, 32, 58, 0.08)",
    "grain-tint":          "rgba(184, 32, 58, 0.08)",

    "bg-base-1":           "#0a0706",
    "bg-base-2":           "#0e0a08",
    "panel-bg":            "#14100d",
    "input-bg":            "#0f0b09",
    "chip-bg":             "#1f1814",
    "chip-on-bg":          "#1a130d",

    "border":              "#2a211d",
    "border-mid":          "#3a302a",
    "border-accent":       "#4a3a2a",
    "border-hover":        "#5a4a3a",

    "text":                "#e4ddd0",
    "text-bright":         "#f4e6c0",
    "text-button":         "#fff8e0",
    "text-muted":          "#7a6f5f",
    "text-label":          "#8a7e6a",
    "text-footer":         "#5a4f3f",

    "warn":                "#e68a6a",
    "warn-border":         "#6a3a2a",
    "no-damage":           "#3a302a",

    "title-color":         "#c9a74d",
    "title-shadow":        "2px 2px 0 #000, 0 0 24px rgba(184, 32, 58, 0.25)",
    "title-letter-spacing":"normal",
    "tagline-color":       "#b8203a",

    "title-font":          "'UnifrakturMaguntia', serif",
    "subtitle-font":       "'Cinzel', serif",
    "section-font":        "'Oswald', sans-serif",
  },

  chaos: {
    "accent-primary":      "#c08a2a",
    "accent-action":       "#c8302a",
    "accent-action-deep":  "#5e0e10",
    "accent-action-glow":  "rgba(200, 48, 42, 0.45)",
    "accent-action-soft":  "rgba(200, 48, 42, 0.12)",
    "grain-tint":          "rgba(200, 48, 42, 0.10)",

    "bg-base-1":           "#080403",
    "bg-base-2":           "#0d0605",
    "panel-bg":            "#170808",
    "input-bg":            "#0c0504",
    "chip-bg":             "#1c0c0a",
    "chip-on-bg":          "#22100d",

    "border":              "#2c1612",
    "border-mid":          "#3d201a",
    "border-accent":       "#4f2a22",
    "border-hover":        "#603a30",

    "text":                "#ddd0c4",
    "text-bright":         "#f6d4a4",
    "text-button":         "#fff0d8",
    "text-muted":          "#7a584a",
    "text-label":          "#9a7060",
    "text-footer":         "#5a3a2e",

    "warn":                "#f0a050",
    "warn-border":         "#6a3a1a",
    "no-damage":           "#3a201a",

    "title-color":         "#c8302a",
    "title-shadow":        "2px 2px 0 #000, 0 0 28px rgba(200, 48, 42, 0.55)",
    "title-letter-spacing":"normal",
    "tagline-color":       "#c08a2a",

    "title-font":          "'UnifrakturMaguntia', serif",
    "subtitle-font":       "'Cinzel', serif",
    "section-font":        "'Oswald', sans-serif",
  },

  xenos: {
    "accent-primary":      "#5af0c8",
    "accent-action":       "#a76dff",
    "accent-action-deep":  "#5e3aaa",
    "accent-action-glow":  "rgba(167, 109, 255, 0.40)",
    "accent-action-soft":  "rgba(90, 240, 200, 0.10)",
    "grain-tint":          "rgba(90, 240, 200, 0.07)",

    "bg-base-1":           "#04090c",
    "bg-base-2":           "#061214",
    "panel-bg":            "#0a181a",
    "input-bg":            "#061214",
    "chip-bg":             "#0e1f22",
    "chip-on-bg":          "#102a2e",

    "border":              "#163030",
    "border-mid":          "#1d3e3e",
    "border-accent":       "#2a4a4a",
    "border-hover":        "#3a5a5a",

    "text":                "#d4e8e0",
    "text-bright":         "#e8fff0",
    "text-button":         "#0a181a",
    "text-muted":          "#6a8a82",
    "text-label":          "#80a098",
    "text-footer":         "#4a5a55",

    "warn":                "#ffd060",
    "warn-border":         "#6a5a2a",
    "no-damage":           "#1a2a2a",

    "title-color":         "#5af0c8",
    "title-shadow":        "0 0 6px rgba(90, 240, 200, 0.55), 0 0 28px rgba(167, 109, 255, 0.35)",
    "title-letter-spacing":"0.08em",
    "tagline-color":       "#a76dff",

    "title-font":          "'Orbitron', 'JetBrains Mono', monospace",
    "subtitle-font":       "'Exo 2', 'Cinzel', serif",
    "section-font":        "'Orbitron', 'Oswald', sans-serif",
  },
};

function themeBlock(name, tokens) {
  const decls = Object.entries(tokens)
    .map(([k, v]) => `  --${k}: ${v};`)
    .join("\n");
  // Imperium is also the :root default so unthemed children render correctly.
  const selector = name === "imperium" ? `:root, .theme-imperium` : `.theme-${name}`;
  return `${selector} {\n${decls}\n}`;
}

const THEME_VARS_CSS = Object.entries(THEMES)
  .map(([n, t]) => themeBlock(n, t))
  .join("\n\n");

export const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Cinzel:wght@500;700&family=Oswald:wght@400;600&family=JetBrains+Mono:wght@400;600&family=Orbitron:wght@500;700;900&family=Exo+2:wght@500;700&display=swap');

${THEME_VARS_CSS}

html, body {
  margin: 0;
  background-color: var(--bg-base-1);
  min-height: 100%;
}
html { height: 100%; }
body { min-height: 100vh; min-height: 100dvh; }

.theme-root {
  color: var(--text);
  background-color: var(--bg-base-1);
}

.theme-root,
.theme-root .panel,
.theme-root .panel::before,
.theme-root .panel::after,
.theme-root .chip,
.theme-root .tog,
.theme-root .tog .tog-dot,
.theme-root .select-dark,
.theme-root .btn-fire,
.theme-root .corner-brackets::before,
.theme-root .corner-brackets::after,
.theme-root .label-cap,
.theme-root h1,
.theme-root h2 {
  transition: background 0.4s ease, background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease, box-shadow 0.4s ease, text-shadow 0.4s ease;
}

.bg-grain {
  background-image:
    radial-gradient(ellipse at 50% 0%, var(--grain-tint) 0%, transparent 60%),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px),
    linear-gradient(180deg, var(--bg-base-1) 0%, var(--bg-base-2) 100%);
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
  background: var(--panel-bg);
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 12px rgba(0,0,0,0.6);
}
.panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--accent-action) 0%, transparent 80%);
}

.hard-shadow { text-shadow: 1px 1px 0 #000; }

.select-dark {
  background: var(--input-bg);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: 'JetBrains Mono', monospace;
}
.select-dark:hover { border-color: var(--accent-action); }
.select-dark:focus { outline: none; border-color: var(--accent-primary); }

.btn-fire {
  background: linear-gradient(180deg, var(--accent-action) 0%, var(--accent-action-deep) 100%);
  color: var(--text-button);
  border: 1px solid var(--accent-primary);
  font-family: var(--section-font);
  letter-spacing: 0.2em;
}
.btn-fire:hover { filter: brightness(1.15); }
.btn-fire:disabled { background: var(--border); color: var(--text-muted); border-color: var(--border); cursor: not-allowed; filter: none; }

.chip {
  display: inline-block;
  padding: 2px 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--chip-bg);
  border: 1px solid var(--border-mid);
  color: var(--accent-primary);
}
.chip-warn { color: var(--warn); border-color: var(--warn-border); }
.chip-dim  { color: var(--text-muted); border-color: var(--border); }

.tog {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text);
  cursor: pointer;
  user-select: none;
}
.tog:hover { border-color: var(--border-hover); }
.tog.on { border-color: var(--accent-primary); background: var(--chip-on-bg); color: var(--text-bright); }
.tog.on .tog-dot { background: var(--accent-primary); box-shadow: 0 0 8px var(--accent-primary); }
.tog-dot { width: 10px; height: 10px; background: var(--border); border: 1px solid var(--border-mid); border-radius: 50%; }
.tog:disabled, .tog.disabled { opacity: 0.35; cursor: not-allowed; }

.bignum { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
.label-cap { font-family: var(--section-font); text-transform: uppercase; letter-spacing: 0.18em; color: var(--text-label); font-size: 11px; }

.corner-brackets {
  position: relative;
}
.corner-brackets::before, .corner-brackets::after {
  content: '';
  position: absolute;
  width: 10px; height: 10px;
  border: 1px solid var(--accent-primary);
}
.corner-brackets::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.corner-brackets::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.health-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  background: linear-gradient(
    to right,
    var(--hp-color, var(--accent-primary)) 0%,
    var(--hp-color, var(--accent-primary)) var(--hp-pct, 100%),
    var(--border) var(--hp-pct, 100%),
    var(--border) 100%
  );
  border: 1px solid var(--border);
  outline: none;
  cursor: pointer;
}
.health-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px; height: 18px;
  background: var(--panel-bg);
  border: 1px solid var(--hp-color, var(--accent-primary));
  box-shadow: 0 0 6px var(--accent-action-glow);
  cursor: grab;
}
.health-slider::-webkit-slider-thumb:active { cursor: grabbing; }
.health-slider::-moz-range-thumb {
  width: 14px; height: 18px;
  background: var(--panel-bg);
  border: 1px solid var(--hp-color, var(--accent-primary));
  box-shadow: 0 0 6px var(--accent-action-glow);
  cursor: grab;
  border-radius: 0;
}
.health-slider:focus { border-color: var(--hp-color, var(--accent-primary)); }
`;
