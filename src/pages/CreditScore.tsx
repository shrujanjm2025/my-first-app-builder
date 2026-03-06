import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Check, CreditCard, Info } from "lucide-react";
import { toast } from "sonner";

const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;
const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);

export default function CreditScore() {
  const { user } = useAuth();
  const [score, setScore] = useState(650);
  const [sim, setSim] = useState({ payOnTime: false, reduceUtil: false, noNewDebt: false, payOldDebt: false });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("credit_score").eq("id", user.id).single().then(({ data }) => {
      if (data?.credit_score) setScore(data.credit_score);
    });
  }, [user]);

  const simScore = Math.min(900, score + (sim.payOnTime ? 15 : 0) + (sim.reduceUtil ? 20 : 0) + (sim.noNewDebt ? 8 : 0) + (sim.payOldDebt ? 12 : 0));

  const cards = [
    { name: "HDFC Regalia", limit: 200000, used: 45000 },
    { name: "ICICI Amazon Pay", limit: 150000, used: 38000 },
    { name: "Axis ACE", limit: 100000, used: 12000 },
  ];

  const getScoreColor = (s: number) => s >= 750 ? "hsl(166,100%,45%)" : s >= 650 ? "hsl(43,96%,56%)" : "hsl(0,91%,71%)";
  const getScoreLabel = (s: number) => s >= 800 ? "Exceptional" : s >= 750 ? "Excellent" : s >= 700 ? "Good" : s >= 650 ? "Fair" : "Poor";

  const handleSave = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ credit_score: score }).eq("id", user.id);
    toast.success("Credit score saved");
  };

  return (
    <DashboardLayout>
      <div className="animate-fadeUp space-y-4">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="font-heading text-xl font-extrabold mb-1">Credit Score Simulator</h2>
            <p className="text-[13px] text-muted-foreground">Monitor utilization, simulate improvements, stay below 30%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Score Gauge */}
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="text-[13px] text-muted-foreground font-semibold mb-2 uppercase tracking-wider">LIVE CREDIT SCORE</div>
            <div className="relative inline-block mb-3">
              <svg width="160" height="90" viewBox="0 0 160 90">
                <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" strokeLinecap="round" />
                <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke={getScoreColor(score)} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${((score - 300) / 600) * 220} 220`} style={{ transition: "stroke-dasharray 0.8s ease" }} />
              </svg>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center">
                <div className="font-mono text-[32px] font-bold" style={{ color: getScoreColor(score) }}>{score}</div>
                <div className="text-xs font-semibold" style={{ color: getScoreColor(score) }}>{getScoreLabel(score)}</div>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground/50 mb-4">
              <span>300 Poor</span><span>550 Fair</span><span>700 Good</span><span>900 Excellent</span>
            </div>
            <input type="range" min={300} max={900} step={10} value={score} onChange={e => setScore(+e.target.value)}
              className="w-full accent-primary mb-3" />
            <button onClick={handleSave}
              className="gradient-primary text-primary-foreground font-heading font-bold py-2 px-5 rounded-xl text-sm w-full hover:shadow-[0_6px_22px_hsl(var(--primary)/0.32)] transition-all">
              Save Score
            </button>
          </div>

          {/* Simulator */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold mb-1">Score Simulator</h3>
            <p className="text-xs text-muted-foreground mb-4">Toggle actions to see impact</p>
            {[
              { key: "payOnTime", label: "Pay all bills on time", impact: "+15" },
              { key: "reduceUtil", label: "Reduce utilization below 30%", impact: "+20" },
              { key: "noNewDebt", label: "Avoid new credit inquiries", impact: "+8" },
              { key: "payOldDebt", label: "Pay off old debt/collections", impact: "+12" },
            ].map((s, i) => (
              <div key={i} onClick={() => setSim(p => ({ ...p, [s.key]: !p[s.key as keyof typeof p] }))}
                className={`flex items-center gap-2.5 p-3 rounded-xl mb-2 cursor-pointer border transition-all ${
                  sim[s.key as keyof typeof sim] ? "bg-primary/10 border-primary/20" : "bg-secondary border-transparent"
                }`}>
                <div className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0 transition-all ${
                  sim[s.key as keyof typeof sim] ? "bg-primary" : "bg-muted-foreground/30"
                }`}>
                  {sim[s.key as keyof typeof sim] && <Check className="h-[11px] w-[11px] text-primary-foreground" />}
                </div>
                <span className={`flex-1 text-[13px] ${sim[s.key as keyof typeof sim] ? "text-primary" : ""}`}>{s.label}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">{s.impact}</span>
              </div>
            ))}
            <div className="h-px bg-border my-3" />
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted-foreground">Projected score:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{score}</span>
                <span className="text-muted-foreground/40">→</span>
                <span className="font-mono text-xl font-bold" style={{ color: getScoreColor(simScore) }}>{simScore}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">+{simScore - score}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Card Utilization */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-heading text-sm font-bold mb-1">Credit Card Utilization</h3>
          <p className="text-xs text-muted-foreground mb-4">Keep below 30% per card and overall for best score impact</p>
          <div className="flex flex-col gap-3.5">
            {cards.map((c, i) => {
              const util = pct(c.used, c.limit);
              const color = util > 30 ? "hsl(0,91%,71%)" : util > 20 ? "hsl(43,96%,56%)" : "hsl(166,100%,45%)";
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] text-muted-foreground">{fmtK(c.used)} / {fmtK(c.limit)}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        util > 30 ? "bg-destructive/10 text-destructive" : util > 20 ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" : "bg-primary/10 text-primary"
                      }`}>{util}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${util}%`, background: color }} />
                  </div>
                  {util > 30 && <p className="text-[11px] text-destructive mt-1">⚠️ Over 30% utilization. Pay down {fmtK(c.used - c.limit * 0.3)} to reach ideal range.</p>}
                </div>
              );
            })}
          </div>
          <div className="h-px bg-border my-4" />
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary rounded-xl p-3 text-center">
              <div className="font-mono text-lg font-semibold">{pct(cards.reduce((a, c) => a + c.used, 0), cards.reduce((a, c) => a + c.limit, 0))}%</div>
              <div className="text-[11px] text-muted-foreground mt-1">Overall Utilization</div>
            </div>
            <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/10">
              <div className="font-mono text-lg font-semibold text-primary">30%</div>
              <div className="text-[11px] text-primary mt-1">Ideal Maximum</div>
            </div>
            <div className="bg-secondary rounded-xl p-3 text-center">
              <div className="font-mono text-lg font-semibold text-[hsl(var(--warning))]">{fmtK(Math.max(0, cards.reduce((a, c) => a + c.used, 0) - cards.reduce((a, c) => a + c.limit * 0.3, 0)))}</div>
              <div className="text-[11px] text-muted-foreground mt-1">To Pay Down</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}