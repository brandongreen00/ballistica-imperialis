export const FONT_CSS = `
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
