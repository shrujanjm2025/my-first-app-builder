import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Wallet, Check, Plus, Minus, ChevronRight, ChevronLeft, Sparkles, ArrowRight, X } from "lucide-react";

/* ───────── constants ───────── */
const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
];

const INCOME_SOURCES = ["Freelance", "Rental Income", "Investments", "Side Business", "Other"];
const LOAN_TYPES = ["Home Loan", "Personal Loan", "Car Loan", "Credit Card Debt", "Education Loan", "Other"];
const INSURANCE_TYPES = ["Health Insurance", "Life Insurance", "Home Insurance", "Car Insurance", "Other"];

const TOTAL_STEPS = 11; // 10 questions + 1 summary

/* ───────── types ───────── */
interface IncomeSource { type: string; amount: string; }
interface LoanEntry { type: string; amount: string; interestRate: string; emi: string; }
interface InsuranceEntry { type: string; premium: string; renewalDate: string; }
interface FdRdEntry { bank: string; amount: string; interestRate: string; maturityDate: string; }

interface OnboardingData {
  full_name: string;
  email: string;
  currency: string;
  monthly_salary: string;
  other_income: IncomeSource[];
  loans: LoanEntry[];
  insurance: InsuranceEntry[];
  credit_score: number;
  fds_rds: FdRdEntry[];
  dependents: number;
  financial_goals: string;
}

const defaultData: OnboardingData = {
  full_name: "",
  email: "",
  currency: "INR",
  monthly_salary: "",
  other_income: [],
  loans: [],
  insurance: [],
  credit_score: 650,
  fds_rds: [],
  dependents: 0,
  financial_goals: "",
};

/* ───────── helpers ───────── */
const getScoreColor = (s: number) => s >= 750 ? "text-primary" : s >= 650 ? "text-[hsl(var(--warning))]" : "text-destructive";
const getScoreLabel = (s: number) => s >= 750 ? "Excellent" : s >= 650 ? "Good" : s >= 550 ? "Fair" : "Poor";
const getScoreBg = (s: number) => s >= 750 ? "bg-primary/10 text-primary" : s >= 650 ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" : "bg-destructive/10 text-destructive";
const getCurrencySymbol = (code: string) => CURRENCIES.find(c => c.code === code)?.symbol || "₹";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  // Resume from last saved step
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from("users_financial_profile")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        if (profile.onboarding_complete) {
          navigate("/dashboard");
          return;
        }
        setData({
          full_name: profile.full_name || "",
          email: profile.email || user.email || "",
          currency: profile.currency || "INR",
          monthly_salary: profile.monthly_salary ? String(profile.monthly_salary) : "",
          other_income: (profile.other_income as unknown as IncomeSource[]) || [],
          loans: (profile.loans as unknown as LoanEntry[]) || [],
          insurance: (profile.insurance as unknown as InsuranceEntry[]) || [],
          credit_score: profile.credit_score || 650,
          fds_rds: (profile.fds_rds as unknown as FdRdEntry[]) || [],
          dependents: profile.dependents || 0,
          financial_goals: profile.financial_goals || "",
        });
        setStep(profile.onboarding_step || 0);
      } else {
        // Create profile if missing (for existing users)
        await supabase.from("users_financial_profile").insert({
          id: user.id,
          email: user.email || "",
          full_name: "",
        });
        setData(prev => ({ ...prev, email: user.email || "" }));
      }
      setInitialLoading(false);
    };
    load();
  }, [user, navigate]);

  // Auto-save on step change
  const autoSave = useCallback(async (currentStep: number) => {
    if (!user) return;
    await supabase.from("users_financial_profile").update({
      full_name: data.full_name,
      email: data.email,
      currency: data.currency,
      monthly_salary: parseFloat(data.monthly_salary) || 0,
      other_income: data.other_income as any,
      loans: data.loans as any,
      insurance: data.insurance as any,
      credit_score: data.credit_score,
      fds_rds: data.fds_rds as any,
      dependents: data.dependents,
      financial_goals: data.financial_goals,
      onboarding_step: currentStep,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
  }, [user, data]);

  const goNext = async () => {
    const nextStep = step + 1;
    setDirection("next");
    await autoSave(nextStep);
    setStep(nextStep);
  };

  const goBack = () => {
    if (step > 0) {
      setDirection("prev");
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    // Save to financial profile
    await supabase.from("users_financial_profile").update({
      full_name: data.full_name,
      email: data.email,
      currency: data.currency,
      monthly_salary: parseFloat(data.monthly_salary) || 0,
      other_income: data.other_income as any,
      loans: data.loans as any,
      insurance: data.insurance as any,
      credit_score: data.credit_score,
      fds_rds: data.fds_rds as any,
      dependents: data.dependents,
      financial_goals: data.financial_goals,
      onboarding_step: TOTAL_STEPS,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    // Also update legacy profiles table
    await supabase.from("profiles").update({
      full_name: data.full_name,
      monthly_salary: parseFloat(data.monthly_salary) || 0,
      dependents: data.dependents,
      credit_score: data.credit_score,
      currency: data.currency,
      onboarding_completed: true,
    }).eq("id", user.id);

    toast.success("Welcome to WealthOS! 🎉");
    navigate("/dashboard");
    setLoading(false);
  };

  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  // Toggle item in checkbox arrays
  const toggleLoan = (type: string) => {
    const exists = data.loans.find(l => l.type === type);
    if (exists) update("loans", data.loans.filter(l => l.type !== type));
    else update("loans", [...data.loans, { type, amount: "", interestRate: "", emi: "" }]);
  };

  const updateLoan = (type: string, field: keyof LoanEntry, value: string) => {
    update("loans", data.loans.map(l => l.type === type ? { ...l, [field]: value } : l));
  };

  const toggleInsurance = (type: string) => {
    const exists = data.insurance.find(i => i.type === type);
    if (exists) update("insurance", data.insurance.filter(i => i.type !== type));
    else update("insurance", [...data.insurance, { type, premium: "", renewalDate: "" }]);
  };

  const updateInsurance = (type: string, field: keyof InsuranceEntry, value: string) => {
    update("insurance", data.insurance.map(i => i.type === type ? { ...i, [field]: value } : i));
  };

  const toggleIncome = (type: string) => {
    const exists = data.other_income.find(i => i.type === type);
    if (exists) update("other_income", data.other_income.filter(i => i.type !== type));
    else update("other_income", [...data.other_income, { type, amount: "" }]);
  };

  const updateIncome = (type: string, amount: string) => {
    update("other_income", data.other_income.map(i => i.type === type ? { ...i, amount } : i));
  };

  const addFdRd = () => {
    update("fds_rds", [...data.fds_rds, { bank: "", amount: "", interestRate: "", maturityDate: "" }]);
  };

  const removeFdRd = (idx: number) => {
    update("fds_rds", data.fds_rds.filter((_, i) => i !== idx));
  };

  const updateFdRd = (idx: number, field: keyof FdRdEntry, value: string) => {
    update("fds_rds", data.fds_rds.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  };

  const progress = ((step) / (TOTAL_STEPS - 1)) * 100;
  const sym = getCurrencySymbol(data.currency);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const isLastQuestion = step === TOTAL_STEPS - 2;
  const isSummary = step === TOTAL_STEPS - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-muted z-50">
        <div className="h-full gradient-primary transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div className="pt-8 px-5">
        <div className="max-w-[580px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
              <Wallet className="h-[17px] w-[17px] text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-extrabold">WealthOS</span>
          </div>
          {!isSummary && (
            <span className="text-xs text-muted-foreground font-mono">{step + 1} / {TOTAL_STEPS - 1}</span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <div
          key={step}
          className={`w-full max-w-[580px] ${direction === "next" ? "animate-fadeUp" : "animate-fadeUp"}`}
        >
          {/* ───── STEP 0: Full Name ───── */}
          {step === 0 && (
            <StepCard
              stepNum={1}
              question="What is your full name?"
              helper="We'll personalize your financial dashboard."
            >
              <StepInput
                type="text"
                placeholder="e.g. Arjun Sharma"
                value={data.full_name}
                onChange={v => update("full_name", v)}
                autoFocus
              />
            </StepCard>
          )}

          {/* ───── STEP 1: Email ───── */}
          {step === 1 && (
            <StepCard
              stepNum={2}
              question="What is your email address?"
              helper="We use this for secure login and alerts."
            >
              <StepInput
                type="email"
                placeholder="arjun@example.com"
                value={data.email}
                onChange={v => update("email", v)}
                autoFocus
              />
            </StepCard>
          )}

          {/* ───── STEP 2: Currency ───── */}
          {step === 2 && (
            <StepCard
              stepNum={3}
              question="What is your preferred currency?"
              helper="Used across all pages for consistent formatting."
            >
              <div className="grid grid-cols-3 gap-2.5">
                {CURRENCIES.map(c => {
                  const selected = data.currency === c.code;
                  return (
                    <button
                      key={c.code}
                      onClick={() => update("currency", c.code)}
                      className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 ${
                        selected
                          ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className="text-2xl font-mono font-bold">{c.symbol}</span>
                      <span className={`text-xs font-semibold ${selected ? "text-primary" : "text-muted-foreground"}`}>{c.code}</span>
                      <span className="text-[10px] text-muted-foreground/60">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </StepCard>
          )}

          {/* ───── STEP 3: Monthly Salary ───── */}
          {step === 3 && (
            <StepCard
              stepNum={4}
              question="What is your monthly salary after taxes?"
              helper="This helps us automatically create your 50/30/20 budget."
              optional
            >
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-lg">{sym}</span>
                <input
                  type="number"
                  placeholder="e.g. 85000"
                  value={data.monthly_salary}
                  onChange={e => update("monthly_salary", e.target.value)}
                  autoFocus
                  className="w-full bg-card border-2 border-border rounded-xl pl-10 pr-4 py-4 text-lg font-mono text-foreground placeholder:text-muted-foreground/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
              {data.monthly_salary && parseFloat(data.monthly_salary) > 0 && (
                <div className="mt-5 bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-primary mb-3">50/30/20 Budget Preview</p>
                  {[
                    { label: "Needs (50%)", amount: parseFloat(data.monthly_salary) * 0.5, color: "bg-accent" },
                    { label: "Wants (30%)", amount: parseFloat(data.monthly_salary) * 0.3, color: "bg-[hsl(var(--purple))]" },
                    { label: "Savings & Debt (20%)", amount: parseFloat(data.monthly_salary) * 0.2, color: "bg-primary" },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
                        <span className="text-xs text-muted-foreground">{b.label}</span>
                      </div>
                      <span className="font-mono text-sm font-semibold">{sym}{b.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </StepCard>
          )}

          {/* ───── STEP 4: Other Income ───── */}
          {step === 4 && (
            <StepCard
              stepNum={5}
              question="Do you have any other income sources or assets?"
              helper="Freelance, rental income, investments, side business."
              optional
            >
              <div className="space-y-2">
                {INCOME_SOURCES.map(src => {
                  const selected = data.other_income.find(i => i.type === src);
                  return (
                    <div key={src}>
                      <button
                        onClick={() => toggleIncome(src)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                          selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                        }`}>
                          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className={`text-sm ${selected ? "text-primary font-medium" : ""}`}>{src}</span>
                      </button>
                      {selected && (
                        <div className="ml-8 mt-2 mb-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">{sym}</span>
                            <input
                              type="number"
                              placeholder="Monthly amount"
                              value={selected.amount}
                              onChange={e => updateIncome(src, e.target.value)}
                              className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:border-primary outline-none transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </StepCard>
          )}

          {/* ───── STEP 5: Loans ───── */}
          {step === 5 && (
            <StepCard
              stepNum={6}
              question="What types of loans do you have?"
              helper="Select all that apply. Add amounts, interest rates, and EMIs."
              optional
            >
              <div className="space-y-2">
                {LOAN_TYPES.map(type => {
                  const selected = data.loans.find(l => l.type === type);
                  return (
                    <div key={type}>
                      <button
                        onClick={() => toggleLoan(type)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                          selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                        }`}>
                          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className={`text-sm ${selected ? "text-primary font-medium" : ""}`}>{type}</span>
                      </button>
                      {selected && (
                        <div className="ml-8 mt-2 mb-2 grid grid-cols-3 gap-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-[11px]">{sym}</span>
                            <input type="number" placeholder="Amount" value={selected.amount}
                              onChange={e => updateLoan(type, "amount", e.target.value)}
                              className="w-full bg-background border border-border rounded-lg pl-7 pr-2 py-2 text-xs font-mono focus:border-primary outline-none" />
                          </div>
                          <div className="relative">
                            <input type="number" placeholder="Rate %" value={selected.interestRate}
                              onChange={e => updateLoan(type, "interestRate", e.target.value)}
                              className="w-full bg-background border border-border rounded-lg px-2 py-2 text-xs font-mono focus:border-primary outline-none" />
                          </div>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-[11px]">{sym}</span>
                            <input type="number" placeholder="EMI" value={selected.emi}
                              onChange={e => updateLoan(type, "emi", e.target.value)}
                              className="w-full bg-background border border-border rounded-lg pl-7 pr-2 py-2 text-xs font-mono focus:border-primary outline-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </StepCard>
          )}

          {/* ───── STEP 6: Insurance ───── */}
          {step === 6 && (
            <StepCard
              stepNum={7}
              question="Do you have any insurance policies?"
              helper="We'll set renewal alerts and budget for premiums."
              optional
            >
              <div className="space-y-2">
                {INSURANCE_TYPES.map(type => {
                  const selected = data.insurance.find(i => i.type === type);
                  return (
                    <div key={type}>
                      <button
                        onClick={() => toggleInsurance(type)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                          selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                        }`}>
                          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className={`text-sm ${selected ? "text-primary font-medium" : ""}`}>{type}</span>
                      </button>
                      {selected && (
                        <div className="ml-8 mt-2 mb-2 grid grid-cols-2 gap-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-[11px]">{sym}</span>
                            <input type="number" placeholder="Premium" value={selected.premium}
                              onChange={e => updateInsurance(type, "premium", e.target.value)}
                              className="w-full bg-background border border-border rounded-lg pl-7 pr-2 py-2 text-xs font-mono focus:border-primary outline-none" />
                          </div>
                          <input type="date" value={selected.renewalDate}
                            onChange={e => updateInsurance(type, "renewalDate", e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-2 py-2 text-xs font-mono focus:border-primary outline-none" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </StepCard>
          )}

          {/* ───── STEP 7: Credit Score ───── */}
          {step === 7 && (
            <StepCard
              stepNum={8}
              question="What is your approximate credit score?"
              helper="We'll simulate ways to improve it."
              optional
            >
              <div className="text-center mb-6">
                <span className={`font-mono text-[56px] font-bold leading-none ${getScoreColor(data.credit_score)}`}>
                  {data.credit_score}
                </span>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getScoreBg(data.credit_score)}`}>
                    {getScoreLabel(data.credit_score)}
                  </span>
                </div>
              </div>
              <div className="px-2">
                <input
                  type="range" min={300} max={900} step={10}
                  value={data.credit_score}
                  onChange={e => update("credit_score", +e.target.value)}
                  className="w-full accent-primary h-2 rounded-full cursor-pointer"
                />
                <div className="flex justify-between mt-2">
                  {["300", "450", "600", "750", "900"].map(v => (
                    <span key={v} className="text-[10px] text-muted-foreground/50 font-mono">{v}</span>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-1.5 text-center">
                {[
                  { label: "Poor", range: "300-549", color: "bg-destructive/10 text-destructive" },
                  { label: "Fair", range: "550-649", color: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" },
                  { label: "Good", range: "650-749", color: "bg-accent/10 text-accent" },
                  { label: "Excellent", range: "750-900", color: "bg-primary/10 text-primary" },
                ].map(b => (
                  <div key={b.label} className={`p-2 rounded-lg ${b.color}`}>
                    <div className="text-[11px] font-semibold">{b.label}</div>
                    <div className="text-[9px] opacity-70">{b.range}</div>
                  </div>
                ))}
              </div>
            </StepCard>
          )}

          {/* ───── STEP 8: FDs / RDs ───── */}
          {step === 8 && (
            <StepCard
              stepNum={9}
              question="Do you have any Fixed Deposits or Recurring Deposits?"
              helper="We'll track maturity, interest, and compound growth."
              optional
            >
              <div className="space-y-3">
                {data.fds_rds.map((entry, idx) => (
                  <div key={idx} className="bg-card border border-border rounded-xl p-4 relative">
                    <button onClick={() => removeFdRd(idx)}
                      className="absolute top-2 right-2 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input type="text" placeholder="Bank name" value={entry.bank}
                        onChange={e => updateFdRd(idx, "bank", e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:border-primary outline-none" />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">{sym}</span>
                        <input type="number" placeholder="Amount" value={entry.amount}
                          onChange={e => updateFdRd(idx, "amount", e.target.value)}
                          className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2.5 text-sm font-mono focus:border-primary outline-none" />
                      </div>
                      <input type="number" placeholder="Interest %" value={entry.interestRate}
                        onChange={e => updateFdRd(idx, "interestRate", e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-mono focus:border-primary outline-none" />
                      <input type="date" placeholder="Maturity date" value={entry.maturityDate}
                        onChange={e => updateFdRd(idx, "maturityDate", e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:border-primary outline-none" />
                    </div>
                  </div>
                ))}
                <button onClick={addFdRd}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all">
                  <Plus className="h-4 w-4" /> Add {data.fds_rds.length === 0 ? "FD / RD" : "another"}
                </button>
              </div>
            </StepCard>
          )}

          {/* ───── STEP 9: Dependents ───── */}
          {step === 9 && (
            <StepCard
              stepNum={10}
              question="How many dependents do you have?"
              helper="This helps us calculate your emergency fund and adjust allocations."
              optional
            >
              <div className="flex items-center justify-center gap-6 py-6">
                <button
                  onClick={() => update("dependents", Math.max(0, data.dependents - 1))}
                  className="w-14 h-14 rounded-2xl border-2 border-border bg-card flex items-center justify-center hover:border-primary hover:text-primary transition-all"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <div className="text-center">
                  <span className="font-mono text-[56px] font-bold text-foreground">{data.dependents}</span>
                  <p className="text-xs text-muted-foreground mt-1">family members / children</p>
                </div>
                <button
                  onClick={() => update("dependents", data.dependents + 1)}
                  className="w-14 h-14 rounded-2xl border-2 border-border bg-card flex items-center justify-center hover:border-primary hover:text-primary transition-all"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              {data.dependents > 0 && parseFloat(data.monthly_salary) > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground">Recommended Emergency Fund (6 months)</p>
                  <p className="font-mono text-lg font-bold text-primary mt-1">
                    {sym}{(parseFloat(data.monthly_salary) * 0.5 * 6).toLocaleString()}
                  </p>
                </div>
              )}
            </StepCard>
          )}

          {/* ───── STEP 10: Financial Goals ───── */}
          {step === 10 && (
            <StepCard
              stepNum={11}
              question="What are your financial goals for the next month?"
              helper="Make them SMART — Specific, Measurable, Achievable, Relevant, Time-bound."
            >
              <textarea
                rows={6}
                placeholder={`e.g.\n• Save ${sym}5,000 for emergency fund by next month\n• Pay off ${sym}2,000 credit card debt\n• Start ${sym}3,000 RD for vacation\n• Invest ${sym}10,000 in mutual funds`}
                value={data.financial_goals}
                onChange={e => update("financial_goals", e.target.value)}
                className="w-full bg-card border-2 border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-y min-h-[160px] leading-relaxed"
              />
            </StepCard>
          )}

          {/* ───── SUMMARY ───── */}
          {isSummary && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-primary-foreground" />
                </div>
                <h2 className="font-heading text-2xl font-extrabold">You're all set!</h2>
                <p className="text-sm text-muted-foreground mt-1.5">Here's a summary of your financial profile</p>
              </div>

              <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
                <SummaryRow label="Name" value={data.full_name || "—"} />
                <SummaryRow label="Email" value={data.email || "—"} />
                <SummaryRow label="Currency" value={data.currency} />
                <SummaryRow label="Monthly Salary" value={data.monthly_salary ? `${sym}${parseFloat(data.monthly_salary).toLocaleString()}` : "Not set"} />
                <SummaryRow label="Other Income" value={data.other_income.length > 0 ? data.other_income.map(i => i.type).join(", ") : "None"} />
                <SummaryRow label="Loans" value={data.loans.length > 0 ? data.loans.map(l => l.type).join(", ") : "None"} />
                <SummaryRow label="Insurance" value={data.insurance.length > 0 ? data.insurance.map(i => i.type).join(", ") : "None"} />
                <SummaryRow label="Credit Score" value={`${data.credit_score} — ${getScoreLabel(data.credit_score)}`} />
                <SummaryRow label="FDs / RDs" value={data.fds_rds.length > 0 ? `${data.fds_rds.length} entries` : "None"} />
                <SummaryRow label="Dependents" value={String(data.dependents)} />
                <SummaryRow label="Goals" value={data.financial_goals ? "Set ✓" : "Not set"} />
              </div>

              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground font-heading font-bold py-4 px-6 rounded-xl text-base hover:shadow-[0_6px_22px_hsl(var(--primary)/0.32)] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Finish Setup & Launch Dashboard
                  </>
                )}
              </button>
            </div>
          )}

          {/* Navigation */}
          {!isSummary && (
            <div className="mt-6 space-y-3">
              <div className="flex gap-2.5">
                {step > 0 && (
                  <button onClick={goBack}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl border-2 border-border text-sm font-heading font-bold text-muted-foreground hover:bg-secondary transition-all">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                )}
                <button onClick={goNext}
                  className="flex-[2] gradient-primary text-primary-foreground font-heading font-bold py-3 px-5 rounded-xl text-sm hover:shadow-[0_6px_22px_hsl(var(--primary)/0.32)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  {isLastQuestion ? (
                    <>Review Summary <ArrowRight className="h-4 w-4" /></>
                  ) : (
                    <>Continue <ChevronRight className="h-4 w-4" /></>
                  )}
                </button>
              </div>
              {step < TOTAL_STEPS - 2 && (
                <p className="text-center text-xs text-muted-foreground/50 cursor-pointer hover:text-muted-foreground transition-colors"
                  onClick={goNext}>
                  Skip this question
                </p>
              )}
            </div>
          )}

          {isSummary && (
            <div className="mt-4">
              <button onClick={goBack}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl border-2 border-border text-sm font-heading font-bold text-muted-foreground hover:bg-secondary transition-all">
                <ChevronLeft className="h-4 w-4" /> Go Back & Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── Shared sub-components ───────── */
function StepCard({ stepNum, question, helper, optional, children }: {
  stepNum: number; question: string; helper: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
            Step {stepNum}
          </span>
          {optional && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
              Optional
            </span>
          )}
        </div>
        <h2 className="font-heading text-xl md:text-2xl font-extrabold leading-tight mb-2">{question}</h2>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}

function StepInput({ type, placeholder, value, onChange, autoFocus }: {
  type: string; placeholder: string; value: string; onChange: (v: string) => void; autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoFocus={autoFocus}
      className="w-full bg-background/50 border-2 border-border rounded-xl px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/30 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
    />
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground max-w-[60%] text-right truncate">{value}</span>
    </div>
  );
}
