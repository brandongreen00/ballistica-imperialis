import React from "react";

export function Field({ label, children }) {
  return (
    <div className="mb-3">
      <div className="label-cap mb-1">{label}</div>
      {children}
    </div>
  );
}

export function Select({ value, onChange, options }) {
  return (
    <select className="select-dark w-full px-3 py-2 text-sm"
            value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o, i) => (
        <option key={i} value={o.value} style={{ background: "var(--input-bg)" }}>{o.label}</option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, disabled, label }) {
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

export function HeadlineStat({ label, value, accent, hint }) {
  return (
    <div className="p-3 corner-brackets"
         style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
      <div className="label-cap">{label}</div>
      <div className="bignum text-3xl hard-shadow" style={{ color: accent || "var(--text)" }}>{value}</div>
      {hint && <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{hint}</div>}
    </div>
  );
}

export function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span style={{ width: 10, height: 10, background: color, display: "inline-block" }} />
      <span className="tracking-[0.15em]">{label}</span>
    </span>
  );
}
