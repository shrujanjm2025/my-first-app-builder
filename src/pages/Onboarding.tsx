import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Wallet, Check } from "lucide-react";

const QUESTIONS = [
  { q: "What is your full name?", sub: "We'll personalize your dashboard with this.", key: "name", type: "text" as const, placeholder: "e.g. Arjun Sharma" },
  { q: "What is your email address?", sub: "For alerts, login and secure notifications.", key: "email", type: "email" as const, placeholder: "arjun@example.com" },
  { q: "What is your monthly salary after taxes?", sub: "Optional — used to set up your 50/30/20 budget.", key: "salary", type: "number" as const, placeholder: "₹85,000", hint: "In INR" },
  { q: "Any other income sources or assets?", sub: "Freelance, rental income, investments, FDs/RDs.", key: "otherIncome", type: "textarea" as const, placeholder: "e.g. Freelance ₹10,000/mo, Rental ₹22,000/mo" },
  { q: "What types of loans do you have?", sub: "Select all that apply. You can add details later.", key: "loans", type: "checkboxes" as const, options: ["Home Loan", "Personal Loan", "Car Loan", "Credit Card Debt", "Education Loan", "Other"] },
  { q: "Do you have any insurance policies?", sub: "We'll set renewal alerts and budget for premiums.", key: "insurance", type: "checkboxes" as const, options: ["Health Insurance", "Life Insurance", "Home Insurance", "Car Insurance", "Other"] },
  { q: "What is your approximate credit score?", sub: "Optional (300–900). We'll simulate improvements.", key: "creditScore", type: "slider" as const, min: 300, max: 900, step: 10 },
  { q: "Do you have any FDs or RDs?", sub: "We'll track maturity, interest and compound growth.", key: "deposits", type: "checkboxes" as const, options: ["Fixed Deposit (FD)", "Recurring Deposit (RD)", "PPF", "Mutual Funds", "Stocks"] },
  { q: "How many dependents do you have?", sub: "Adjusts your needs allocation and emergency fund.", key: "dependents", type: "number" as const, placeholder: "0", hint: "family members / children" },
  { q: "What are your 3–4 SMART financial goals?", sub: "Specific, Measurable, Achievable, Relevant, Time-bound.", key: "goals", type: "textarea" as const, placeholder: "e.g. Save ₹50,000 emergency fund by March 2025\nPay off ₹20,000 credit card by April 2025\nVacation fund ₹40,000 by May 2025" },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, any>>({ loans: [], insurance: [], deposits: [], creditScore: 650 });
  const [loading, setLoading] = useState(false);

  const q = QUESTIONS[step];
  const progress = (step / QUESTIONS.length) * 100;

  const toggle = (key: string, val: string) => {
    setData(p => ({
      ...p,
      [key]: (p[key] || []).includes(val) ? p[key].filter((x: string) => x !== val) : [...(p[key] || []), val]
    }));
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: data.name || "",
      monthly_salary: parseFloat(data.salary) || 0,
      dependents: parseInt(data.dependents) || 0,
      credit_score: data.creditScore || 650,
      onboarding_completed: true,
    }).eq("id", user.id);

    if (error) toast.error(error.message);
    else { toast.success("Welcome to WealthOS! 🎉"); navigate("/dashboard"); }
    setLoading(false);
  };

  const getScoreColor = (s: number) => s >= 750 ? "text-primary" : s >= 650 ? "text-[hsl(var(--warning))]" : "text-destructive";
  const getScoreLabel = (s: number) => s >= 750 ? "Excellent" : s >= 650 ? "Good" : "Fair";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-muted z-50">
        <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="animate-fadeUp w-full max-w-[520px]">
        <div className="flex items-center gap-2.5 mb-9">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
            <Wallet className="h-[17px] w-[17px] text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-extrabold">WealthOS</span>
          <span className="ml-auto text-xs text-muted-foreground">{step + 1} / {QUESTIONS.length}</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="mb-7">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary mb-3">
              Question {step + 1}
            </span>
            <h2 className="font-heading text-xl font-extrabold leading-tight mb-1.5">{q.q}</h2>
            <p className="text-[13px] text-muted-foreground">{q.sub}</p>
          </div>

          {(q.type === "text" || q.type === "email" || q.type === "number") && (
            <div>
              <input type={q.type} placeholder={q.placeholder} value={data[q.key] || ""} onChange={e => setData(p => ({ ...p, [q.key]: e.target.value }))} autoFocus
                className="w-full bg-background/50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
              {q.hint && <p className="text-[11px] text-muted-foreground/50 mt-1.5">{q.hint}</p>}
            </div>
          )}

          {q.type === "textarea" && (
            <textarea rows={4} placeholder={q.placeholder} value={data[q.key] || ""} onChange={e => setData(p => ({ ...p, [q.key]: e.target.value }))}
              className="w-full bg-background/50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-y" />
          )}

          {q.type === "checkboxes" && q.options && (
            <div className="grid grid-cols-2 gap-2">
              {q.options.map(opt => {
                const checked = (data[q.key] || []).includes(opt);
                return (
                  <div key={opt} onClick={() => toggle(q.key, opt)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer border transition-all ${
                      checked ? "border-primary/40 bg-primary/10" : "border-border bg-background/30"
                    }`}>
                    <div className={`w-4 h-4 rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      checked ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    <span className={`text-[13px] ${checked ? "text-primary font-medium" : ""}`}>{opt}</span>
                  </div>
                );
              })}
            </div>
          )}

          {q.type === "slider" && (
            <div>
              <div className="text-center mb-4">
                <span className={`font-mono text-[40px] font-bold ${getScoreColor(data.creditScore)}`}>{data.creditScore}</span>
                <span className={`ml-2.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  data.creditScore >= 750 ? "bg-primary/10 text-primary" : data.creditScore >= 650 ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" : "bg-destructive/10 text-destructive"
                }`}>
                  {getScoreLabel(data.creditScore)}
                </span>
              </div>
              <input type="range" min={300} max={900} step={10} value={data.creditScore} onChange={e => setData(p => ({ ...p, creditScore: +e.target.value }))}
                className="w-full accent-primary" />
              <div className="flex justify-between text-[11px] text-muted-foreground/50 mt-1.5">
                <span>300 — Poor</span><span>550 — Fair</span><span>700 — Good</span><span>900 — Excellent</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2.5 mt-5">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-2.5 px-5 rounded-xl border border-border text-sm font-heading font-bold text-muted-foreground hover:bg-secondary transition-all">
              ← Back
            </button>
          )}
          <button onClick={() => step < QUESTIONS.length - 1 ? setStep(s => s + 1) : handleFinish()} disabled={loading}
            className="flex-[2] gradient-primary text-primary-foreground font-heading font-bold py-2.5 px-5 rounded-xl text-sm hover:shadow-[0_6px_22px_hsl(var(--primary)/0.32)] hover:-translate-y-0.5 transition-all disabled:opacity-50">
            {loading ? "Finishing..." : step < QUESTIONS.length - 1 ? "Continue →" : "🚀 Launch My Dashboard"}
          </button>
        </div>
        {step < QUESTIONS.length - 1 && (
          <p className="text-center text-xs text-muted-foreground/50 mt-3 cursor-pointer hover:text-muted-foreground" onClick={() => setStep(s => s + 1)}>
            Skip this question
          </p>
        )}
      </div>
    </div>
  );
}