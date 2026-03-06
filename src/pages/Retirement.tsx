import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;

export default function Retirement() {
  const [retireAge, setRetireAge] = useState(55);
  const [monthly, setMonthly] = useState(20000);
  const currentAge = 28;
  const years = retireAge - currentAge;
  const r = 0.12 / 12;
  const m = years * 12;
  const corpus = monthly * (((Math.pow(1 + r, m) - 1) / r) * (1 + r));
  const adjCorpus = corpus / Math.pow(1.05, years);

  const projData = Array.from({ length: Math.ceil(years / 5) + 1 }, (_, i) => {
    const yr = i * 5;
    const months = yr * 12;
    const val = months > 0 ? monthly * (((Math.pow(1 + r, months) - 1) / r) * (1 + r)) : 0;
    return { year: `Age ${currentAge + yr}`, value: Math.round(val / 100000) };
  });

  return (
    <DashboardLayout>
      <div className="animate-fadeUp space-y-4">
        <div className="mb-5">
          <h2 className="font-heading text-xl font-extrabold mb-1">Retirement Planner</h2>
          <p className="text-[13px] text-muted-foreground">Inflation-adjusted projections with 12% CAGR assumption</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold mb-4">Your Parameters</h3>
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Retire at age: <span className="font-mono text-primary">{retireAge}</span>
              </label>
              <input type="range" min={40} max={70} value={retireAge} onChange={e => setRetireAge(+e.target.value)} className="w-full accent-primary" />
              <div className="flex justify-between text-[11px] text-muted-foreground/50 mt-1">
                <span>40 (early)</span><span>{retireAge} years — {years} yrs to go</span><span>70 (late)</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Monthly SIP/Investment: <span className="font-mono text-primary">{fmtK(monthly)}</span>
              </label>
              <input type="range" min={5000} max={100000} step={1000} value={monthly} onChange={e => setMonthly(+e.target.value)} className="w-full accent-primary" />
              <div className="flex justify-between text-[11px] text-muted-foreground/50 mt-1">
                <span>₹5K</span><span>{fmtK(monthly)}/month</span><span>₹1L</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 bg-gradient-to-br from-primary/5 to-accent/3">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Projected Corpus at {retireAge}</div>
            <div className="font-mono text-4xl font-bold text-primary mb-1">{fmtK(Math.round(corpus))}</div>
            <div className="text-xs text-muted-foreground mb-5">
              Inflation-adjusted: <span className="text-[hsl(var(--warning))]">{fmtK(Math.round(adjCorpus))}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Years to Retire", value: `${years}`, unit: "yrs" },
                { label: "Total Invested", value: fmtK(monthly * m), unit: "" },
                { label: "Returns", value: fmtK(Math.round(corpus - monthly * m)), unit: "" },
                { label: "Return Multiple", value: `${(corpus / (monthly * m)).toFixed(1)}x`, unit: "" },
              ].map((s, i) => (
                <div key={i} className="bg-secondary rounded-xl p-3">
                  <div className="font-mono text-base font-semibold">{s.value}{s.unit}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-heading text-sm font-bold mb-4">Wealth Growth Projection</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={projData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(166,100%,45%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(166,100%,45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}L`} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="bg-secondary border border-border rounded-xl px-3 py-2 text-xs">
                  <div className="text-primary">Corpus: ₹{payload[0].value}L</div>
                </div>
              ) : null} />
              <Area type="monotone" dataKey="value" stroke="hsl(166,100%,45%)" strokeWidth={2.5} fill="url(#gr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}