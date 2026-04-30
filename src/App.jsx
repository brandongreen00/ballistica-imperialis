import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FACTIONS } from "./data/factions.js";
import { simulate } from "./sim/simulate.js";
import { ATTACKER_EFFECTS, DEFENDER_EFFECTS } from "./sim/abilities.js";
import { FONT_CSS } from "./ui/styles.js";
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
function isAttackerEffectGated(effect, weapon) {
  return !!(effect.excludes_pistol && weapon?.is_pistol);
}

export default function App() {
  const [shooterFactionId, setShooterFactionId] = useState("kasrkin");
  const [shooterOpId, setShooterOpId] = useState("kasrkin-gunner");
  const [targetFactionId, setTargetFactionId] = useState("angels-of-death");
  const [targetOpId, setTargetOpId] = useState("aod-captain");
  const [weaponIdx, setWeaponIdx] = useState(0);
  const [env, setEnv] = useState({ cover: false, obscured: false, vantageHeight: 0, targetEngaged: true });
  const [defEffOn, setDefEffOn] = useState([]);
  const [atkEffOn, setAtkEffOn] = useState([]);
  const [trials, setTrials] = useState(50000);
  const [stats, setStats] = useState(null);
  const [computing, setComputing] = useState(false);

  const shooterFaction = factionById(shooterFactionId);
  const shooter = opById(shooterFaction, shooterOpId);
  const targetFaction = factionById(targetFactionId);
  const target = opById(targetFaction, targetOpId);

  const [lastShooterKey, setLastShooterKey] = useState(`${shooterFaction.id}/${shooter.id}`);
  const curShooterKey = `${shooterFaction.id}/${shooter.id}`;
  if (lastShooterKey !== curShooterKey) {
    setLastShooterKey(curShooterKey);
    setWeaponIdx(0);
    const allowed = new Set(availableAttackerIds(shooterFaction, shooter));
    setAtkEffOn((s) => s.filter((id) => allowed.has(id)));
  }

  const [lastTargetKey, setLastTargetKey] = useState(`${targetFaction.id}/${target.id}`);
  const curTargetKey = `${targetFaction.id}/${target.id}`;
  if (lastTargetKey !== curTargetKey) {
    setLastTargetKey(curTargetKey);
    const allowed = new Set(availableDefenderIds(targetFaction, target));
    setDefEffOn((s) => s.filter((id) => allowed.has(id)));
  }

  const weapon = shooter.weapons[Math.min(weaponIdx, Math.max(shooter.weapons.length - 1, 0))];
  const hasWeapon = !!weapon;

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

  function runFire() {
    if (!hasWeapon) return;
    setComputing(true);
    setTimeout(() => {
      const defEff = defEffOn.map((id) => DEFENDER_EFFECTS[id]).filter(Boolean);
      const atkEff = atkEffOn
        .map((id) => ATTACKER_EFFECTS[id])
        .filter((e) => e && !isAttackerEffectGated(e, weapon));
      const s = simulate(target, weapon, env, defEff, atkEff, trials);
      setStats({ ...s, shooterName: shooter.full_name, targetName: target.full_name, weaponName: weapon.name });
      setComputing(false);
    }, 10);
  }

  const factionOptions = FACTIONS.map((f) => ({ value: f.id, label: f.name }));
  const shooterOpOptions = shooterFaction.operatives.map((o) => ({ value: o.id, label: o.full_name }));
  const targetOpOptions = targetFaction.operatives.map((o) => ({ value: o.id, label: o.full_name }));
  const weaponOptions = hasWeapon
    ? shooter.weapons.map((w, i) => ({
        value: String(i),
        label: `${w.name}  (A${w.atk} · ${w.hit}+ · ${w.normal_dmg}/${w.crit_dmg})`,
      }))
    : [{ value: "0", label: "— no ranged weapon —" }];

  return (
    <div className="min-h-screen bg-grain text-[#e4ddd0]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{FONT_CSS}</style>

      <header className="max-w-6xl mx-auto px-4 pt-8 pb-6 text-center">
        <div className="text-[10px] tracking-[0.4em] text-[#7a6f5f] mb-2">+ + COGITATOR MARK VI + + FIRING SOLUTIONS + +</div>
        <h1 className="text-4xl md:text-6xl"
            style={{ fontFamily: "'UnifrakturMaguntia', serif", color: "#c9a74d", textShadow: "2px 2px 0 #000, 0 0 24px rgba(184,32,58,0.25)" }}>
          Ballistica Imperialis
        </h1>
        <div className="mt-2 text-xs tracking-[0.3em]" style={{ fontFamily: "'Cinzel', serif", color: "#b8203a" }}>
          {shooterFaction.name} · vs · {targetFaction.name}
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel p-4 corner-brackets">
          <div className="flex items-baseline justify-between mb-3">
            <h2 style={{ fontFamily: "'Oswald', sans-serif" }} className="text-lg tracking-[0.25em] text-[#c9a74d]">SHOOTER</h2>
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
                    <span key={i} className="chip" style={{ background: "#1a130d", borderColor: "#4a3a2a" }}>{r}</span>
                  ))}
                </div>
              )}
            </>
          )}

          <AttackerEffectsPanel
            availIds={availAtkIds}
            atkEffOn={atkEffOn}
            setAtkEffOn={setAtkEffOn}
            weapon={weapon}
            toggleEffect={toggleEffect}
          />
        </div>

        <div className="panel p-4 corner-brackets">
          <div className="flex items-baseline justify-between mb-3">
            <h2 style={{ fontFamily: "'Oswald', sans-serif" }} className="text-lg tracking-[0.25em] text-[#c9a74d]">TARGET</h2>
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

          {(target.defender_abilities || []).length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {(target.defender_abilities || []).map((id, i) => (
                <span key={i} className="chip" style={{ background: "#1a130d", borderColor: "#4a3a2a" }}>
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
            <h2 style={{ fontFamily: "'Oswald', sans-serif" }} className="text-lg tracking-[0.25em] text-[#c9a74d]">ENGAGEMENT CONDITIONS</h2>
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

      {stats && <ResultsPanel stats={stats} target={target} weapon={weapon} env={env} defEffOn={defEffOn} atkEffOn={atkEffOn} />}
      {!stats && (
        <section className="max-w-6xl mx-auto px-4 mt-6 mb-10 text-center">
          <div className="panel p-8">
            <div className="label-cap text-[#7a6f5f]">AWAITING FIRING SOLUTION · PRESS "FIRE WEAPON" TO COMPUTE</div>
          </div>
        </section>
      )}

      <footer className="max-w-6xl mx-auto px-4 pb-8 text-center text-[10px] text-[#5a4f3f] tracking-[0.2em]">
        + + + PRAISE BE THE OMNISSIAH + + + MONTE CARLO BY THE MACHINE GOD + + +
      </footer>
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
      {availIds.some((id) => {
        const e = ATTACKER_EFFECTS[id]; return e?.excludes_pistol && weapon?.is_pistol;
      }) && <div className="text-[10px] text-[#7a6f5f] mt-1">Some attacker effects exclude pistols</div>}
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
        <div className="text-[10px] text-[#7a6f5f] mt-1">
          {availIds.map((id) => DEFENDER_EFFECTS[id]?.note).filter(Boolean).join(" · ")}
        </div>
      )}
    </>
  );
}

function ResultsPanel({ stats, target, weapon, env, defEffOn, atkEffOn }) {
  return (
    <section className="max-w-6xl mx-auto px-4 mt-6 mb-10">
      <div className="panel p-4 corner-brackets">
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <h2 style={{ fontFamily: "'Oswald', sans-serif" }} className="text-lg tracking-[0.25em] text-[#c9a74d]">FIRING DATA</h2>
          <span className="chip chip-dim">{stats.trials.toLocaleString()} TRIALS</span>
        </div>
        <div className="text-xs text-[#7a6f5f] mb-4 tracking-wider">
          {stats.shooterName} · {stats.weaponName}<span className="mx-2 text-[#b8203a]">→</span>{stats.targetName}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <HeadlineStat label="MEAN DAMAGE" value={stats.meanDmg.toFixed(2)} accent="#c9a74d" hint={`of ${target.wounds} wounds`} />
          <HeadlineStat label="P(INCAPACITATE)" value={`${(stats.pIncap * 100).toFixed(1)}%`}
            accent={stats.pIncap > 0.3 ? "#b8203a" : "#e4ddd0"} hint={`≥ ${target.wounds} dmg`} />
          <HeadlineStat label="P(DEAL DAMAGE)" value={`${(stats.pAny * 100).toFixed(1)}%`} hint="any target damage" />
          {stats.meanSelfDmg > 0
            ? <HeadlineStat label="SELF-DAMAGE" value={stats.meanSelfDmg.toFixed(2)} accent="#e68a6a" hint={`Hot: ${(stats.pSelf * 100).toFixed(1)}%`} />
            : <HeadlineStat label="ATTACK DICE" value={weapon.atk} hint={`HIT ${weapon.hit}+`} />}
        </div>

        <div className="mb-6">
          <div className="label-cap mb-2">Probability of Damaging with at Least N Attack Dice</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {stats.pNDice.filter((x) => x.n <= Math.max(weapon.atk + 1, 4)).map((x) => (
              <div key={x.n} className="p-3" style={{ background: "#0f0b09", border: "1px solid #2a211d" }}>
                <div className="label-cap">≥ {x.n} {x.n === 1 ? "DIE" : "DICE"}</div>
                <div className="bignum text-xl" style={{ color: "#e4ddd0" }}>{(x.p * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="label-cap mb-2">Damage Distribution</div>
          <div style={{ height: 260, background: "#0a0706", border: "1px solid #2a211d", padding: "12px 8px 8px 0" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dist} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <XAxis dataKey="dmg" tick={{ fill: "#7a6f5f", fontFamily: "JetBrains Mono", fontSize: 10 }}
                  axisLine={{ stroke: "#2a211d" }} tickLine={{ stroke: "#2a211d" }}
                  label={{ value: "damage inflicted", fill: "#8a7e6a", fontFamily: "Oswald", fontSize: 11, letterSpacing: "0.2em", position: "insideBottom", offset: -5 }} />
                <YAxis tick={{ fill: "#7a6f5f", fontFamily: "JetBrains Mono", fontSize: 10 }}
                  axisLine={{ stroke: "#2a211d" }} tickLine={{ stroke: "#2a211d" }}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip cursor={{ fill: "rgba(184,32,58,0.08)" }}
                  contentStyle={{ background: "#0a0706", border: "1px solid #c9a74d", fontFamily: "JetBrains Mono", fontSize: 12, color: "#e4ddd0" }}
                  formatter={(v) => [`${(v * 100).toFixed(2)}%`, "probability"]} labelFormatter={(v) => `${v} damage`} />
                <Bar dataKey="p" isAnimationActive={false}>
                  {stats.dist.map((entry, i) => {
                    const incap = entry.dmg >= target.wounds;
                    const zero = entry.dmg === 0;
                    return <Cell key={i} fill={incap ? "#b8203a" : zero ? "#3a302a" : "#c9a74d"} fillOpacity={incap ? 0.9 : zero ? 0.6 : 0.78} />;
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

        <div className="mt-6 pt-4" style={{ borderTop: "1px solid #2a211d" }}>
          <div className="label-cap mb-2">Conditions Applied</div>
          <div className="flex flex-wrap gap-2 text-xs">
            {env.cover && <span className="chip">cover</span>}
            {env.obscured && <span className="chip chip-warn">obscured</span>}
            {env.vantageHeight > 0 && <span className="chip">vantage {env.vantageHeight}"{env.targetEngaged ? "" : " (concealed — no Accurate)"}</span>}
            {!env.targetEngaged && env.vantageHeight === 0 && <span className="chip">target concealed</span>}
            {env.targetEngaged && env.vantageHeight === 0 && !env.cover && !env.obscured && <span className="chip chip-dim">open ground</span>}
            {defEffOn.map((id, i) => <span key={`d${i}`} className="chip" style={{ borderColor: "#4a3a2a" }}>D · {DEFENDER_EFFECTS[id]?.label || id}</span>)}
            {atkEffOn.map((id, i) => <span key={`a${i}`} className="chip" style={{ borderColor: "#4a3a2a" }}>A · {ATTACKER_EFFECTS[id]?.label || id}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}
