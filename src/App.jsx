import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FACTIONS } from "./data/factions.js";
import { categoryFor } from "./data/factionCategories.js";
import { simulate } from "./sim/simulate.js";
import { fightSimulate } from "./sim/fight.js";
import { ATTACKER_EFFECTS, DEFENDER_EFFECTS } from "./sim/abilities.js";
import { FONT_CSS, THEMES } from "./ui/styles.js";
import { Field, Select, Toggle, HeadlineStat, LegendDot } from "./ui/primitives.jsx";

const factionById = (id) => FACTIONS.find((f) => f.id === id) ?? FACTIONS[0];
const opById = (faction, opId) => faction.operatives.find((o) => o.id === opId) ?? faction.operatives[0];
const uniq = (arr) => [...new Set(arr)];

function availableDefenderIds(faction, op) {
  return uniq([...(faction.defender_effects || []), ...(op.defender_abilities || [])]);
}
function availableAttackerIds(faction, op) {
  return uniq([...(faction.attacker_effects || []), ...(op.attacker_effects || [])]);
}
function weaponHasTorrent(weapon) {
  return !!weapon?.rules?.some((r) => /^Torrent\b/.test(r));
}
function isBoltWeapon(weapon) {
  const n = weapon?.name?.toLowerCase() ?? "";
  return n.includes("boltgun") || n.includes("bolt pistol");
}
function isAttackerEffectGated(effect, weapon) {
  if (effect.excludes_pistol && weapon?.is_pistol) return true;
  if (effect.excludes_torrent && weaponHasTorrent(weapon)) return true;
  if (effect.excludes_grenade_or_bomb && weapon?.is_grenade_or_bomb) return true;
  if (effect.requires_bolt_weapon && !isBoltWeapon(weapon)) return true;
  return false;
}

const CATEGORY_TAGLINE = {
  imperium: "+ + COGITATOR MARK VI + + FIRING SOLUTIONS + +",
  chaos:    "+ + DAEMONIC AUSPEX + + UNHOLY CALCULUS + +",
  xenos:    ":: SPECTRAL CALIBRATOR :: WRAITHCAST FIRING SOLUTIONS ::",
};
const CATEGORY_FOOTER = {
  imperium: "+ + + PRAISE BE THE OMNISSIAH + + + MONTE CARLO BY THE MACHINE GOD + + +",
  chaos:    "+ + + BLOOD FOR THE BLOOD GOD + + + SKULLS FOR THE SKULL THRONE + + +",
  xenos:    ":: WHISPERS OF THE INFINITY CIRCUIT :: PROBABILITY SUNG INTO BEING ::",
};

const SECTION_H2_STYLE = { fontFamily: "var(--section-font)", color: "var(--accent-primary)" };
const RULE_CHIP_STYLE = { background: "var(--chip-on-bg)", borderColor: "var(--border-accent)" };
const TITLE_STYLE = {
  fontFamily: "var(--title-font)",
  color: "var(--title-color)",
  textShadow: "var(--title-shadow)",
  letterSpacing: "var(--title-letter-spacing)",
};
const SUBTITLE_STYLE = { fontFamily: "var(--subtitle-font)", color: "var(--tagline-color)" };
const CONDITION_CHIP_STYLE = { borderColor: "var(--border-accent)" };

export default function App() {
  const [mode, setMode] = useState("shoot");
  const [shooterFactionId, setShooterFactionId] = useState("kasrkin");
  const [shooterOpId, setShooterOpId] = useState("kasrkin-gunner");
  const [targetFactionId, setTargetFactionId] = useState("angels-of-death");
  const [targetOpId, setTargetOpId] = useState("aod-captain");
  const [weaponIdx, setWeaponIdx] = useState(0);
  const [env, setEnv] = useState({ cover: false, obscured: false, vantageHeight: 0, targetEngaged: true, shooterInjured: false, closeQuarters: false });
  const [defEffOn, setDefEffOn] = useState([]);
  const [atkEffOn, setAtkEffOn] = useState([]);
  const [wrekaBanked, setWrekaBanked] = useState(0);
  const [wrekaSpend, setWrekaSpend] = useState(0);
  const [trials, setTrials] = useState(50000);
  const [stats, setStats] = useState(null);
  const [computing, setComputing] = useState(false);

  // ── Fight-mode state ────────────────────────────────────────────────────
  const [meleeAIdx, setMeleeAIdx] = useState(0);
  const [meleeBIdx, setMeleeBIdx] = useState(0);
  const [healthA, setHealthA] = useState(null); // re-initialised on operative change below
  const [priorityA, setPriorityA] = useState("MAX_DMG");
  const [priorityB, setPriorityB] = useState("MAX_DMG");
  const [initiator, setInitiator] = useState("A");
  const [fightStats, setFightStats] = useState(null);

  const shooterFaction = factionById(shooterFactionId);
  const shooter = opById(shooterFaction, shooterOpId);
  const targetFaction = factionById(targetFactionId);
  const target = opById(targetFaction, targetOpId);

  const category = categoryFor(shooterFactionId);
  const theme = THEMES[category];

  const [currentHealth, setCurrentHealth] = useState(target.wounds);

  const isWreckaKrew = shooterFaction.id === "wrecka-krew";
  const isBombSquig = shooter.id === "wk-bomb-squig";

  const [lastShooterKey, setLastShooterKey] = useState(`${shooterFaction.id}/${shooter.id}`);
  const curShooterKey = `${shooterFaction.id}/${shooter.id}`;
  if (lastShooterKey !== curShooterKey) {
    setLastShooterKey(curShooterKey);
    setWeaponIdx(0);
    setMeleeAIdx(0);
    setHealthA(shooter.wounds);
    const allowed = new Set(availableAttackerIds(shooterFaction, shooter));
    setAtkEffOn((s) => s.filter((id) => allowed.has(id)));
    setWrekaBanked(0);
    setWrekaSpend(0);
  }

  const [lastTargetKey, setLastTargetKey] = useState(`${targetFaction.id}/${target.id}`);
  const curTargetKey = `${targetFaction.id}/${target.id}`;
  if (lastTargetKey !== curTargetKey) {
    setLastTargetKey(curTargetKey);
    setMeleeBIdx(0);
    const allowed = new Set(availableDefenderIds(targetFaction, target));
    setDefEffOn((s) => s.filter((id) => allowed.has(id)));
    setCurrentHealth(target.wounds);
  }

  // healthA bootstrap on first render (shooter.wounds isn't known until after
  // the shooter is resolved above; null sentinel ensures this only runs once)
  if (healthA === null) setHealthA(shooter.wounds);

  const rangedWeapons = shooter.weapons.filter((w) => w.kind !== "melee");
  const weapon = rangedWeapons[Math.min(weaponIdx, Math.max(rangedWeapons.length - 1, 0))];
  const hasWeapon = !!weapon;

  const meleeWeaponsA = shooter.weapons.filter((w) => w.kind === "melee");
  const meleeWeaponsB = target.weapons.filter((w) => w.kind === "melee");
  const meleeWeaponA = meleeWeaponsA[Math.min(meleeAIdx, Math.max(meleeWeaponsA.length - 1, 0))];
  const meleeWeaponB = meleeWeaponsB[Math.min(meleeBIdx, Math.max(meleeWeaponsB.length - 1, 0))];
  const fightReady = !!meleeWeaponA && !!meleeWeaponB;

  const availAtkIds = availableAttackerIds(shooterFaction, shooter);
  const availDefIds = availableDefenderIds(targetFaction, target);

  function toggleEffect(setList, list, id, allowed) {
    if (!allowed) return;
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function changeShooterFaction(fid) {
    setShooterFactionId(fid);
    const f = factionById(fid);
    setShooterOpId(f.operatives[0].id);
  }
  function changeTargetFaction(fid) {
    setTargetFactionId(fid);
    const f = factionById(fid);
    setTargetOpId(f.operatives[0].id);
  }

  function runFight() {
    if (!fightReady) return;
    setComputing(true);
    setTimeout(() => {
      const hpA = Math.max(1, Math.min(healthA ?? shooter.wounds, shooter.wounds));
      const hpB = Math.max(1, Math.min(currentHealth, target.wounds));
      const s = fightSimulate({
        weaponA: meleeWeaponA,
        weaponB: meleeWeaponB,
        hpA, hpB,
        priorityA, priorityB, initiator,
      }, trials);
      setFightStats({
        ...s,
        nameA: shooter.full_name, nameB: target.full_name,
        weaponNameA: meleeWeaponA.name, weaponNameB: meleeWeaponB.name,
        startHpA: hpA, startHpB: hpB,
        priorityA, priorityB, initiator,
      });
      setComputing(false);
    }, 10);
  }

  function runFire() {
    if (!hasWeapon) return;
    setComputing(true);
    setTimeout(() => {
      const defEff = defEffOn.map((id) => DEFENDER_EFFECTS[id]).filter(Boolean);
      const atkEff = atkEffOn
        .map((id) => ATTACKER_EFFECTS[id])
        .filter((e) => e && !isAttackerEffectGated(e, weapon));
      const simEnv = isWreckaKrew
        ? { ...env, wreka: { enabled: true, banked: wrekaBanked, spend: isBombSquig ? 0 : wrekaSpend, isBombSquig } }
        : env;
      const s = simulate(target, weapon, simEnv, defEff, atkEff, trials, currentHealth);
      setStats({ ...s, shooterName: shooter.full_name, targetName: target.full_name, weaponName: weapon.name });
      setComputing(false);
    }, 10);
  }

  const factionOptions = FACTIONS.map((f) => ({ value: f.id, label: f.name }));
  const shooterOpOptions = shooterFaction.operatives.map((o) => ({ value: o.id, label: o.full_name }));
  const targetOpOptions = targetFaction.operatives.map((o) => ({ value: o.id, label: o.full_name }));
  const weaponOptions = hasWeapon
    ? rangedWeapons.map((w, i) => ({
        value: String(i),
        label: `${w.name}  (A${w.atk} · ${w.hit}+ · ${w.normal_dmg}/${w.crit_dmg})`,
      }))
    : [{ value: "0", label: "— no ranged weapon —" }];
  const meleeWeaponOptionsA = meleeWeaponsA.length
    ? meleeWeaponsA.map((w, i) => ({
        value: String(i),
        label: `${w.name}  (A${w.atk} · ${w.hit}+ · ${w.normal_dmg}/${w.crit_dmg})`,
      }))
    : [{ value: "0", label: "— no melee weapon —" }];
  const meleeWeaponOptionsB = meleeWeaponsB.length
    ? meleeWeaponsB.map((w, i) => ({
        value: String(i),
        label: `${w.name}  (A${w.atk} · ${w.hit}+ · ${w.normal_dmg}/${w.crit_dmg})`,
      }))
    : [{ value: "0", label: "— no melee weapon —" }];

  return (
    <div
      className={`theme-root theme-${category} min-h-screen bg-grain`}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <style>{FONT_CSS}</style>

      <header className="max-w-6xl mx-auto px-4 pt-8 pb-6 text-center">
        <div className="text-[10px] tracking-[0.4em] mb-2" style={{ color: "var(--text-muted)" }}>
          {CATEGORY_TAGLINE[category]}
        </div>
        <h1 className="text-4xl md:text-6xl" style={TITLE_STYLE}>
          Ballistica Imperialis
        </h1>
        <div className="mt-2 text-xs tracking-[0.3em]" style={SUBTITLE_STYLE}>
          {shooterFaction.name} · vs · {targetFaction.name}
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 mb-4">
        <div className="mode-bar" role="tablist" aria-label="Combat mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "shoot"}
            className={`mode-btn ${mode === "shoot" ? "on" : ""}`}
            onClick={() => setMode("shoot")}
          >
            <span className="mode-glyph">»</span> SHOOT
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "fight"}
            className={`mode-btn ${mode === "fight" ? "on" : ""}`}
            onClick={() => setMode("fight")}
          >
            <span className="mode-glyph">×</span> FIGHT
          </button>
        </div>
      </section>

      {mode === "fight" && (<>
      <section className="max-w-6xl mx-auto px-4 mb-4">
        <div
          className="panel p-3"
          role="status"
          style={{
            borderColor: "var(--warn-border)",
            background: "var(--chip-on-bg)",
          }}
        >
          <div
            className="label-cap mb-1"
            style={{ color: "var(--warn)", letterSpacing: "0.25em" }}
          >
            ⚠ ACTIVE DEVELOPMENT
          </div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Fight mode is a work in progress and still needs refinement — results may be inaccurate or incomplete. Use at your own risk and don't rely on the numbers yet.
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <CombatantPanel
          side="A"
          label="COMBATANT A"
          factionId={shooterFactionId}
          factionOptions={factionOptions}
          changeFaction={changeShooterFaction}
          op={shooter}
          opOptions={shooterOpOptions}
          setOpId={setShooterOpId}
          meleeWeapons={meleeWeaponsA}
          weaponOptions={meleeWeaponOptionsA}
          weaponIdx={meleeAIdx}
          setWeaponIdx={setMeleeAIdx}
          weapon={meleeWeaponA}
          health={Math.min(healthA ?? shooter.wounds, shooter.wounds)}
          setHealth={setHealthA}
          priority={priorityA}
          setPriority={setPriorityA}
          isInitiator={initiator === "A"}
        />
        <CombatantPanel
          side="B"
          label="COMBATANT B"
          factionId={targetFactionId}
          factionOptions={factionOptions}
          changeFaction={changeTargetFaction}
          op={target}
          opOptions={targetOpOptions}
          setOpId={setTargetOpId}
          meleeWeapons={meleeWeaponsB}
          weaponOptions={meleeWeaponOptionsB}
          weaponIdx={meleeBIdx}
          setWeaponIdx={setMeleeBIdx}
          weapon={meleeWeaponB}
          health={Math.min(currentHealth, target.wounds)}
          setHealth={setCurrentHealth}
          priority={priorityB}
          setPriority={setPriorityB}
          isInitiator={initiator === "B"}
        />
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-4">
        <div className="panel p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h2 style={SECTION_H2_STYLE} className="text-lg tracking-[0.25em]">ENGAGEMENT</h2>
            <span className="chip">SEQUENCE</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="label-cap mb-1">Initiator</div>
              <Select
                value={initiator}
                onChange={(v) => setInitiator(v)}
                options={[
                  { value: "A", label: `A — ${shooter.full_name}` },
                  { value: "B", label: `B — ${target.full_name}` },
                ]}
              />
              <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                Initiator resolves their first die first; resolution then alternates.
              </div>
            </div>
            <div>
              <div className="label-cap mb-1">Allocator priority</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                MAX&nbsp;DMG always strikes (highest-damage die first).<br />
                MIN&nbsp;RCVD parries opponent's highest-damage die while they have any dice left, then strikes.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-4">
        <div className="panel p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <span className="label-cap">TRIALS</span>
            <Select value={String(trials)} onChange={(v) => setTrials(parseInt(v, 10))}
              options={[
                { value: "10000", label: "10 000 · quick" },
                { value: "50000", label: "50 000 · default" },
                { value: "200000", label: "200 000 · high precision" },
              ]} />
          </div>
          <button
            type="button"
            className="btn-fire px-10 py-3 text-lg w-full md:w-auto"
            onClick={runFight}
            disabled={computing || !fightReady}
          >
            {computing ? "COMPUTING..." : !fightReady ? "NO MELEE WEAPON" : "FIGHT"}
          </button>
        </div>
      </section>

      {fightStats && <FightResultsPanel stats={fightStats} a={shooter} b={target} theme={theme} />}
      </>)}

      {mode === "shoot" && (<>
      <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel p-4 corner-brackets">
          <div className="flex items-baseline justify-between mb-3">
            <h2 style={SECTION_H2_STYLE} className="text-lg tracking-[0.25em]">SHOOTER</h2>
            <span className="chip">ATTACKER</span>
          </div>
          <Field label="Faction"><Select value={shooterFactionId} onChange={changeShooterFaction} options={factionOptions} /></Field>
          <Field label="Operative"><Select value={shooter.id} onChange={setShooterOpId} options={shooterOpOptions} /></Field>
          <Field label="Weapon">
            <Select value={String(weaponIdx)} onChange={(v) => setWeaponIdx(parseInt(v, 10))} options={weaponOptions} />
          </Field>

          {hasWeapon && (
            <>
              <div className="mt-2 mb-3 flex flex-wrap gap-2">
                <span className="chip">ATK {weapon.atk}</span>
                <span className="chip">HIT {weapon.hit}+</span>
                <span className="chip">DMG {weapon.normal_dmg}/{weapon.crit_dmg}</span>
                {weapon.is_pistol && <span className="chip chip-dim">PISTOL</span>}
              </div>
              {weapon.rules.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {weapon.rules.map((r, i) => (
                    <span key={i} className="chip" style={RULE_CHIP_STYLE}>{r}</span>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="label-cap mt-4 mb-1">Shooter State</div>
          <div className="flex flex-wrap gap-2">
            <Toggle
              label={env.shooterInjured ? "Injured (+1 Hit)" : "Not injured"}
              checked={env.shooterInjured}
              onChange={(v) => setEnv({ ...env, shooterInjured: v })}
            />
          </div>
          {env.shooterInjured && (
            <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Wounded operatives shoot with Hit +1 — harder to land hits, far less damage</div>
          )}

          <AttackerEffectsPanel
            availIds={availAtkIds}
            atkEffOn={atkEffOn}
            setAtkEffOn={setAtkEffOn}
            weapon={weapon}
            toggleEffect={toggleEffect}
          />

          {isWreckaKrew && (
            <WrekaPanel
              banked={wrekaBanked}
              setBanked={setWrekaBanked}
              spend={wrekaSpend}
              setSpend={setWrekaSpend}
              isBombSquig={isBombSquig}
            />
          )}
        </div>

        <div className="panel p-4 corner-brackets">
          <div className="flex items-baseline justify-between mb-3">
            <h2 style={SECTION_H2_STYLE} className="text-lg tracking-[0.25em]">TARGET</h2>
            <span className="chip">DEFENDER</span>
          </div>
          <Field label="Faction"><Select value={targetFactionId} onChange={changeTargetFaction} options={factionOptions} /></Field>
          <Field label="Operative"><Select value={target.id} onChange={setTargetOpId} options={targetOpOptions} /></Field>

          <div className="mt-2 mb-3 flex flex-wrap gap-2">
            <span className="chip">SAVE {target.save}+</span>
            <span className="chip">{target.wounds} WOUNDS</span>
            <span className="chip chip-dim">APL {target.apl}</span>
            <span className="chip chip-dim">MV {target.move}</span>
          </div>

          <HealthSlider target={target} value={currentHealth} onChange={setCurrentHealth} />

          {(target.defender_abilities || []).length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {(target.defender_abilities || []).map((id, i) => (
                <span key={i} className="chip" style={RULE_CHIP_STYLE}>
                  {DEFENDER_EFFECTS[id]?.label || id}
                </span>
              ))}
            </div>
          )}

          <DefenderEffectsPanel
            availIds={availDefIds}
            defEffOn={defEffOn}
            setDefEffOn={setDefEffOn}
            toggleEffect={toggleEffect}
          />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-4">
        <div className="panel p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h2 style={SECTION_H2_STYLE} className="text-lg tracking-[0.25em]">ENGAGEMENT CONDITIONS</h2>
            <span className="chip">ENVIRONMENT</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <div className="label-cap mb-1">Cover</div>
              <Toggle label={env.cover ? "Defender in cover" : "No cover"} checked={env.cover} onChange={(v) => setEnv({ ...env, cover: v })} />
            </div>
            <div>
              <div className="label-cap mb-1">Obscured</div>
              <Toggle label={env.obscured ? "Target obscured (-1 ATK)" : "Clear sight lines"} checked={env.obscured} onChange={(v) => setEnv({ ...env, obscured: v })} />
            </div>
            <div>
              <div className="label-cap mb-1">Shooter Vantage</div>
              <Select value={String(env.vantageHeight)} onChange={(v) => setEnv({ ...env, vantageHeight: parseInt(v, 10) })}
                options={[
                  { value: "0", label: "No vantage" },
                  { value: "2", label: '≥ 2" higher (Accurate 1 if engaged)' },
                  { value: "4", label: '≥ 4" higher (Accurate 2 if engaged)' },
                ]} />
            </div>
            <div>
              <div className="label-cap mb-1">Target Order</div>
              <Select value={env.targetEngaged ? "engage" : "conceal"} onChange={(v) => setEnv({ ...env, targetEngaged: v === "engage" })}
                options={[
                  { value: "engage", label: "Engage" },
                  { value: "conceal", label: "Conceal (no Vantage Accurate)" },
                ]} />
            </div>
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="label-cap mb-1">Killzone Rules</div>
            <Toggle
              label={env.closeQuarters ? "Close Quarters (Blast/Torrent → Lethal 5+)" : "Standard killzone"}
              checked={env.closeQuarters}
              onChange={(v) => setEnv({ ...env, closeQuarters: v })}
            />
            {env.closeQuarters && hasWeapon && !weapon.rules.some((r) => /^Blast|^Torrent/.test(r)) && (
              <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                Selected weapon has no Blast / Torrent — Close Quarters has no effect on it
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-4">
        <div className="panel p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <span className="label-cap">TRIALS</span>
            <Select value={String(trials)} onChange={(v) => setTrials(parseInt(v, 10))}
              options={[
                { value: "10000", label: "10 000 · quick" },
                { value: "50000", label: "50 000 · default" },
                { value: "200000", label: "200 000 · high precision" },
              ]} />
          </div>
          <button type="button" className="btn-fire px-10 py-3 text-lg w-full md:w-auto" onClick={runFire} disabled={computing || !hasWeapon}>
            {computing ? "COMPUTING..." : !hasWeapon ? "NO RANGED WEAPON" : "FIRE WEAPON"}
          </button>
        </div>
      </section>

      {stats && <ResultsPanel stats={stats} target={target} weapon={weapon} env={env} defEffOn={defEffOn} atkEffOn={atkEffOn} theme={theme} />}
      {!stats && (
        <section className="max-w-6xl mx-auto px-4 mt-6 mb-10 text-center">
          <div className="panel p-8">
            <div className="label-cap" style={{ color: "var(--text-muted)" }}>AWAITING FIRING SOLUTION · PRESS "FIRE WEAPON" TO COMPUTE</div>
          </div>
        </section>
      )}
      </>)}

      <footer className="max-w-6xl mx-auto px-4 pb-8 text-center text-[10px] tracking-[0.2em]"
              style={{ color: "var(--text-footer)" }}>
        {CATEGORY_FOOTER[category]}
        <div className="mt-2 text-[9px] tracking-[0.15em]">
          <a
            href="https://buymeacoffee.com/wemougtdcg"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--text-footer)", textDecoration: "underline", textUnderlineOffset: "2px" }}
          >
            buy me a coffee
          </a>
          <span style={{ margin: "0 8px" }}>·</span>
          <a
            href="https://pushy-gladiolus-6e2.notion.site/99d36b74a0bf4911a30a7b1c50e862bd?pvs=105"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--text-footer)", textDecoration: "underline", textUnderlineOffset: "2px" }}
          >
            feedback
          </a>
          <span style={{ margin: "0 8px" }}>·</span>
          <a
            href="https://www.notion.so/6bbf6b05d11c475baea03a00e48369d7?v=355a7f3d7b6c81ea971c000ce97f726d&source=copy_link"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--text-footer)", textDecoration: "underline", textUnderlineOffset: "2px" }}
          >
            roadmap
          </a>
        </div>
      </footer>
    </div>
  );
}

function HealthSlider({ target, value, onChange }) {
  const max = target.wounds;
  const clamped = Math.max(1, Math.min(value, max));
  const injuredThreshold = Math.ceil(max / 2) - 1;
  const isInjured = clamped <= injuredThreshold;
  const pct = (clamped / max) * 100;
  const trackColor = isInjured ? "var(--accent-action)" : clamped < max ? "var(--warn)" : "var(--accent-primary)";
  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between mb-1">
        <div className="label-cap">Current Health</div>
        <div className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: trackColor }}>
          {clamped} / {max} {isInjured && <span className="ml-1 chip chip-warn">INJURED</span>}
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={max}
        step={1}
        value={clamped}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="health-slider w-full"
        style={{ accentColor: trackColor, "--hp-pct": `${pct}%`, "--hp-color": trackColor }}
      />
      <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
        <span>1</span>
        <span>injured ≤ {injuredThreshold}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function AttackerEffectsPanel({ availIds, atkEffOn, setAtkEffOn, weapon, toggleEffect }) {
  if (availIds.length === 0) return null;
  return (
    <>
      <div className="label-cap mt-4 mb-1">Attacker Effects</div>
      <div className="flex flex-wrap gap-2">
        {availIds.map((id) => {
          const eff = ATTACKER_EFFECTS[id];
          if (!eff) return null;
          const gated = isAttackerEffectGated(eff, weapon);
          return (
            <Toggle key={id} label={eff.label} checked={atkEffOn.includes(id)} disabled={gated}
              onChange={() => toggleEffect(setAtkEffOn, atkEffOn, id, !gated)} />
          );
        })}
      </div>
      {availIds.some((id) => isAttackerEffectGated(ATTACKER_EFFECTS[id], weapon))
        && <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Some attacker effects don't apply to this weapon</div>}
    </>
  );
}

function DefenderEffectsPanel({ availIds, defEffOn, setDefEffOn, toggleEffect }) {
  if (availIds.length === 0) return null;
  return (
    <>
      <div className="label-cap mt-4 mb-1">Defender Effects</div>
      <div className="flex flex-wrap gap-2">
        {availIds.map((id) => {
          const eff = DEFENDER_EFFECTS[id];
          if (!eff) return null;
          return (
            <Toggle key={id} label={eff.label} checked={defEffOn.includes(id)}
              onChange={() => toggleEffect(setDefEffOn, defEffOn, id, true)} />
          );
        })}
      </div>
      {availIds.some((id) => DEFENDER_EFFECTS[id]?.note) && (
        <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
          {availIds.map((id) => DEFENDER_EFFECTS[id]?.note).filter(Boolean).join(" · ")}
        </div>
      )}
    </>
  );
}

function WrekaPanel({ banked, setBanked, spend, setSpend, isBombSquig }) {
  const safeBanked = Math.max(0, Math.min(6, banked));
  const maxSpend = isBombSquig ? 0 : 3;
  const safeSpend = Math.max(0, Math.min(maxSpend, spend));
  return (
    <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="flex items-baseline justify-between mb-2">
        <div className="label-cap">Wrecka Points</div>
        <span className="chip chip-dim">DA RAMPAGE</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <div className="text-[10px] tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>BANKED (start)</div>
            <div className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--accent-primary)" }}>{safeBanked} / 6</div>
          </div>
          <input
            type="range"
            min={0}
            max={6}
            step={1}
            value={safeBanked}
            onChange={(e) => setBanked(parseInt(e.target.value, 10))}
            className="w-full"
            style={{ accentColor: "var(--accent-primary)" }}
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <div className="text-[10px] tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>SPEND THIS ACTION</div>
            <div className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: isBombSquig ? "var(--text-muted)" : "var(--accent-action)" }}>
              {safeSpend} / {maxSpend}
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={maxSpend}
            step={1}
            value={safeSpend}
            disabled={isBombSquig}
            onChange={(e) => setSpend(parseInt(e.target.value, 10))}
            className="w-full"
            style={{ accentColor: "var(--accent-action)", opacity: isBombSquig ? 0.4 : 1 }}
          />
        </div>
      </div>
      <div className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
        {isBombSquig
          ? "Bomb Squig generates points on natural 6s but cannot spend them"
          : "Each natural 6 retained earns 1 point (cap 6). Spent points convert fails to normal hits."}
      </div>
    </div>
  );
}

function ResultsPanel({ stats, target, weapon, env, defEffOn, atkEffOn, theme }) {
  const tickStyle = { fill: theme["text-muted"], fontFamily: "JetBrains Mono", fontSize: 10 };
  const axisStroke = { stroke: theme["border"] };

  return (
    <section className="max-w-6xl mx-auto px-4 mt-6 mb-10">
      <div className="panel p-4 corner-brackets">
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <h2 style={SECTION_H2_STYLE} className="text-lg tracking-[0.25em]">FIRING DATA</h2>
          <span className="chip chip-dim">{stats.trials.toLocaleString()} TRIALS</span>
        </div>
        <div className="text-xs mb-4 tracking-wider" style={{ color: "var(--text-muted)" }}>
          {stats.shooterName} · {stats.weaponName}
          <span className="mx-2" style={{ color: "var(--accent-action)" }}>→</span>
          {stats.targetName}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <HeadlineStat label="MEAN DAMAGE" value={stats.meanDmg.toFixed(2)} accent="var(--accent-primary)"
            hint={stats.currentHealth < target.wounds ? `of ${stats.currentHealth} (max ${target.wounds})` : `of ${target.wounds} wounds`} />
          <HeadlineStat label="P(INCAPACITATE)" value={`${(stats.pIncap * 100).toFixed(1)}%`}
            accent={stats.pIncap > 0.3 ? "var(--accent-action)" : "var(--text)"} hint={`≥ ${stats.currentHealth} dmg`} />
          <HeadlineStat label="P(INJURE)"
            value={stats.pInjure == null ? "—" : `${(stats.pInjure * 100).toFixed(1)}%`}
            accent={stats.pInjure == null ? "var(--text-muted)" : stats.pInjure > 0.5 ? "var(--warn)" : "var(--text)"}
            hint={stats.pInjure == null ? "already injured" : `to ≤ ${stats.injuredThreshold} hp`} />
          <HeadlineStat label="P(DEAL DAMAGE)" value={`${(stats.pAny * 100).toFixed(1)}%`} hint="any target damage" />
          {stats.meanSelfDmg > 0
            ? <HeadlineStat label="SELF-DAMAGE" value={stats.meanSelfDmg.toFixed(2)} accent="var(--warn)" hint={`Hot: ${(stats.pSelf * 100).toFixed(1)}%`} />
            : <HeadlineStat label="ATTACK DICE" value={weapon.atk} hint={`HIT ${weapon.hit}+${env.shooterInjured ? " (+1 injured)" : ""}`} />}
        </div>

        {stats.wreka && (
          <div className="mb-6 p-3" style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-baseline justify-between mb-2">
              <div className="label-cap">Wrecka Points (this action)</div>
              <span className="chip chip-dim">
                START {stats.wreka.banked} · SPEND ≤ {stats.wreka.isBombSquig ? 0 : stats.wreka.requestedSpend}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>MEAN GENERATED</div>
                <div className="bignum text-2xl" style={{ color: "var(--accent-primary)" }}>{stats.wreka.meanGen.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>MEAN SPENT</div>
                <div className="bignum text-2xl" style={{ color: "var(--accent-action)" }}>{stats.wreka.meanSpent.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>EXPECTED END BANK</div>
                <div className="bignum text-2xl" style={{ color: "var(--text)" }}>{stats.wreka.meanEndBank.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="label-cap mb-2">Probability of Damaging with at Least N Attack Dice</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {stats.pNDice.filter((x) => x.n <= Math.max(weapon.atk + 1, 4)).map((x) => (
              <div key={x.n} className="p-3" style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
                <div className="label-cap">≥ {x.n} {x.n === 1 ? "DIE" : "DICE"}</div>
                <div className="bignum text-xl" style={{ color: "var(--text)" }}>{(x.p * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="label-cap mb-2">Damage Distribution</div>
          <div style={{ height: 260, background: "var(--bg-base-1)", border: "1px solid var(--border)", padding: "12px 8px 8px 0" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dist} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <XAxis dataKey="dmg" tick={tickStyle}
                  axisLine={axisStroke} tickLine={axisStroke}
                  label={{ value: "damage inflicted", fill: theme["text-label"], fontFamily: "Oswald", fontSize: 11, letterSpacing: "0.2em", position: "insideBottom", offset: -5 }} />
                <YAxis tick={tickStyle}
                  axisLine={axisStroke} tickLine={axisStroke}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip cursor={{ fill: theme["accent-action-soft"] }}
                  contentStyle={{ background: theme["bg-base-2"], border: `1px solid ${theme["accent-primary"]}`, fontFamily: "JetBrains Mono", fontSize: 12 }}
                  labelStyle={{ color: theme["accent-primary"], marginBottom: 4 }}
                  itemStyle={{ color: theme["text"] }}
                  formatter={(v) => [`${(v * 100).toFixed(2)}%`, "probability"]} labelFormatter={(v) => `${v} damage`} />
                <Bar dataKey="p" isAnimationActive={false}>
                  {stats.dist.map((entry, i) => {
                    const newHealth = Math.max(0, stats.currentHealth - entry.dmg);
                    const incap = entry.dmg >= stats.currentHealth;
                    const injure = !incap && !stats.alreadyInjured && newHealth <= stats.injuredThreshold;
                    const zero = entry.dmg === 0;
                    const fill = incap ? theme["accent-action"]
                      : injure ? theme["warn"]
                      : zero ? theme["no-damage"]
                      : theme["accent-primary"];
                    const opacity = incap ? 0.9 : injure ? 0.85 : zero ? 0.6 : 0.78;
                    return <Cell key={i} fill={fill} fillOpacity={opacity} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
            <LegendDot color={theme["no-damage"]} label="NO DAMAGE" />
            <LegendDot color={theme["accent-primary"]} label="PARTIAL" />
            {!stats.alreadyInjured && <LegendDot color={theme["warn"]} label={`INJURE (≤${stats.injuredThreshold} hp left)`} />}
            <LegendDot color={theme["accent-action"]} label={`INCAPACITATE (≥${stats.currentHealth})`} />
          </div>
        </div>

        <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="label-cap mb-2">Conditions Applied</div>
          <div className="flex flex-wrap gap-2 text-xs">
            {env.shooterInjured && <span className="chip chip-warn">shooter injured (+1 Hit)</span>}
            {stats.currentHealth < target.wounds && (
              <span className="chip" style={{ color: stats.alreadyInjured ? "var(--accent-action)" : "var(--warn)", borderColor: "var(--warn-border)" }}>
                target hp {stats.currentHealth}/{target.wounds}{stats.alreadyInjured ? " · already injured" : ""}
              </span>
            )}
            {env.cover && <span className="chip">cover</span>}
            {env.obscured && <span className="chip chip-warn">obscured</span>}
            {env.closeQuarters && <span className="chip">close quarters (Blast/Torrent → L5+)</span>}
            {env.vantageHeight > 0 && <span className="chip">vantage {env.vantageHeight}"{env.targetEngaged ? "" : " (concealed — no Accurate)"}</span>}
            {!env.targetEngaged && env.vantageHeight === 0 && <span className="chip">target concealed</span>}
            {env.targetEngaged && env.vantageHeight === 0 && !env.cover && !env.obscured && !env.shooterInjured && stats.currentHealth >= target.wounds && <span className="chip chip-dim">open ground</span>}
            {defEffOn.map((id, i) => <span key={`d${i}`} className="chip" style={CONDITION_CHIP_STYLE}>D · {DEFENDER_EFFECTS[id]?.label || id}</span>)}
            {atkEffOn.map((id, i) => <span key={`a${i}`} className="chip" style={CONDITION_CHIP_STYLE}>A · {ATTACKER_EFFECTS[id]?.label || id}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function CombatantPanel({
  side, label, factionId, factionOptions, changeFaction,
  op, opOptions, setOpId,
  meleeWeapons, weaponOptions, weaponIdx, setWeaponIdx, weapon,
  health, setHealth, priority, setPriority, isInitiator,
}) {
  const hasWeapon = !!weapon;
  return (
    <div className="panel p-4 corner-brackets">
      <div className="flex items-baseline justify-between mb-3">
        <h2 style={SECTION_H2_STYLE} className="text-lg tracking-[0.25em]">{label}</h2>
        <div className="flex gap-1">
          {isInitiator && <span className="chip chip-warn">INITIATOR</span>}
          <span className="chip">{side}</span>
        </div>
      </div>
      <Field label="Faction"><Select value={factionId} onChange={changeFaction} options={factionOptions} /></Field>
      <Field label="Operative"><Select value={op.id} onChange={setOpId} options={opOptions} /></Field>
      <Field label="Melee weapon">
        <Select value={String(weaponIdx)} onChange={(v) => setWeaponIdx(parseInt(v, 10))} options={weaponOptions} />
      </Field>

      {hasWeapon ? (
        <>
          <div className="mt-2 mb-3 flex flex-wrap gap-2">
            <span className="chip">ATK {weapon.atk}</span>
            <span className="chip">HIT {weapon.hit}+</span>
            <span className="chip">DMG {weapon.normal_dmg}/{weapon.crit_dmg}</span>
          </div>
          {weapon.rules.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {weapon.rules.map((r, i) => (
                <span key={i} className="chip" style={RULE_CHIP_STYLE}>{r}</span>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-[10px] mt-2 mb-3" style={{ color: "var(--text-muted)" }}>
          This operative has no melee profile on its datacard.
        </div>
      )}

      <HealthSlider target={op} value={health} onChange={setHealth} />

      <Field label="Priority">
        <Select
          value={priority}
          onChange={(v) => setPriority(v)}
          options={[
            { value: "MAX_DMG", label: "Maximise damage dealt (prioritise strikes)" },
            { value: "MIN_RCVD", label: "Minimise damage received (prioritise parries)" },
          ]}
        />
      </Field>
    </div>
  );
}

function FightResultsPanel({ stats, a, b, theme }) {
  const tickStyle = { fill: theme["text-muted"], fontFamily: "JetBrains Mono", fontSize: 10 };
  const axisStroke = { stroke: theme["border"] };
  const pIncapColor = (p) => p > 0.5 ? theme["accent-action"] : p > 0.2 ? theme["warn"] : theme["text"];
  const priorityLabel = (p) => p === "MAX_DMG" ? "MAX DMG" : "MIN RCVD";

  const histo = (dist, hp) => (
    <div style={{ height: 220, background: "var(--bg-base-1)", border: "1px solid var(--border)", padding: "12px 8px 8px 0" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dist} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <XAxis dataKey="dmg" tick={tickStyle} axisLine={axisStroke} tickLine={axisStroke}
            label={{ value: "damage taken", fill: theme["text-label"], fontFamily: "Oswald", fontSize: 11, letterSpacing: "0.2em", position: "insideBottom", offset: -5 }} />
          <YAxis tick={tickStyle} axisLine={axisStroke} tickLine={axisStroke}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
          <Tooltip cursor={{ fill: theme["accent-action-soft"] }}
            contentStyle={{ background: theme["bg-base-2"], border: `1px solid ${theme["accent-primary"]}`, fontFamily: "JetBrains Mono", fontSize: 12 }}
            labelStyle={{ color: theme["accent-primary"], marginBottom: 4 }}
            itemStyle={{ color: theme["text"] }}
            formatter={(v) => [`${(v * 100).toFixed(2)}%`, "probability"]} labelFormatter={(v) => `${v} damage`} />
          <Bar dataKey="p" isAnimationActive={false}>
            {dist.map((entry, i) => {
              const incap = entry.dmg >= hp;
              const zero = entry.dmg === 0;
              const fill = incap ? theme["accent-action"] : zero ? theme["no-damage"] : theme["accent-primary"];
              const opacity = incap ? 0.9 : zero ? 0.6 : 0.78;
              return <Cell key={i} fill={fill} fillOpacity={opacity} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <section className="max-w-6xl mx-auto px-4 mt-6 mb-10">
      <div className="panel p-4 corner-brackets">
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <h2 style={SECTION_H2_STYLE} className="text-lg tracking-[0.25em]">FIGHT DATA</h2>
          <span className="chip chip-dim">{stats.trials.toLocaleString()} TRIALS</span>
        </div>
        <div className="text-xs mb-4 tracking-wider" style={{ color: "var(--text-muted)" }}>
          {stats.nameA} · {stats.weaponNameA}
          <span className="mx-2" style={{ color: "var(--accent-action)" }}>×</span>
          {stats.nameB} · {stats.weaponNameB}
          <span className="mx-2" style={{ color: "var(--text-footer)" }}>·</span>
          initiator&nbsp;{stats.initiator} · A:{priorityLabel(stats.priorityA)} · B:{priorityLabel(stats.priorityB)}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3" style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
            <div className="label-cap mb-2">Combatant A · {a.full_name}</div>
            <div className="grid grid-cols-2 gap-2">
              <HeadlineStat label="DMG TAKEN" value={stats.meanDmgToA.toFixed(2)}
                accent="var(--accent-action)" hint={`of ${stats.startHpA} hp`} />
              <HeadlineStat label="P(INCAP)" value={`${(stats.pIncapA * 100).toFixed(1)}%`}
                accent={pIncapColor(stats.pIncapA)} />
            </div>
          </div>
          <div className="p-3" style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
            <div className="label-cap mb-2">Combatant B · {b.full_name}</div>
            <div className="grid grid-cols-2 gap-2">
              <HeadlineStat label="DMG TAKEN" value={stats.meanDmgToB.toFixed(2)}
                accent="var(--accent-action)" hint={`of ${stats.startHpB} hp`} />
              <HeadlineStat label="P(INCAP)" value={`${(stats.pIncapB * 100).toFixed(1)}%`}
                accent={pIncapColor(stats.pIncapB)} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <HeadlineStat label="P(BOTH ALIVE)" value={`${(stats.pNeitherIncap * 100).toFixed(1)}%`}
            accent={theme["text"]} />
          <HeadlineStat label="P(A INCAP ONLY)" value={`${(stats.pOnlyAIncap * 100).toFixed(1)}%`}
            accent={pIncapColor(stats.pOnlyAIncap)} />
          <HeadlineStat label="P(B INCAP ONLY)" value={`${(stats.pOnlyBIncap * 100).toFixed(1)}%`}
            accent={pIncapColor(stats.pOnlyBIncap)} />
          <HeadlineStat label="P(BOTH INCAP)" value={`${(stats.pBothIncap * 100).toFixed(1)}%`}
            accent={pIncapColor(stats.pBothIncap)} hint="mutual destruction" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          <div>
            <div className="label-cap mb-2">Damage to A</div>
            {histo(stats.distA, stats.startHpA)}
          </div>
          <div>
            <div className="label-cap mb-2">Damage to B</div>
            {histo(stats.distB, stats.startHpB)}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
          <LegendDot color={theme["no-damage"]} label="NO DAMAGE" />
          <LegendDot color={theme["accent-primary"]} label="PARTIAL" />
          <LegendDot color={theme["accent-action"]} label="INCAPACITATE" />
        </div>
      </div>
    </section>
  );
}
