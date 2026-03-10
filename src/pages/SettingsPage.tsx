import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, Plus, Minus, X } from "lucide-react";

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

interface IncomeSource { type: string; amount: string; }
interface LoanEntry { type: string; amount: string; interestRate: string; emi: string; }
interface InsuranceEntry { type: string; premium: string; renewalDate: string; }
interface FdRdEntry { bank: string; amount: string; interestRate: string; maturityDate: string; }

export default function SettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [dependents, setDependents] = useState(0);
  const [creditScore, setCreditScore] = useState(650);
  const [otherIncome, setOtherIncome] = useState<IncomeSource[]>([]);
  const [loans, setLoans] = useState<LoanEntry[]>([]);
  const [insurance, setInsurance] = useState<InsuranceEntry[]>([]);
  const [fdsRds, setFdsRds] = useState<FdRdEntry[]>([]);
  const [financialGoals, setFinancialGoals] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("users_financial_profile").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || "");
        setCurrency(data.currency || "INR");
        setMonthlySalary(data.monthly_salary ? String(data.monthly_salary) : "");
        setDependents(data.dependents || 0);
        setCreditScore(data.credit_score || 650);
        setOtherIncome((data.other_income as unknown as IncomeSource[]) || []);
        setLoans((data.loans as unknown as LoanEntry[]) || []);
        setInsurance((data.insurance as unknown as InsuranceEntry[]) || []);
        setFdsRds((data.fds_rds as unknown as FdRdEntry[]) || []);
        setFinancialGoals(data.financial_goals || "");
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("users_financial_profile").update({
      full_name: fullName,
      currency,
      monthly_salary: parseFloat(monthlySalary) || 0,
      dependents,
      credit_score: creditScore,
      other_income: otherIncome as any,
      loans: loans as any,
      insurance: insurance as any,
      fds_rds: fdsRds as any,
      financial_goals: financialGoals,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    // Sync to profiles table
    await supabase.from("profiles").update({
      full_name: fullName,
      currency,
      monthly_salary: parseFloat(monthlySalary) || 0,
      dependents,
      credit_score: creditScore,
    }).eq("id", user.id);

    setLoading(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  const getScoreColor = (s: number) => s >= 750 ? "text-primary" : s >= 650 ? "text-[hsl(var(--warning))]" : "text-destructive";
  const getScoreLabel = (s: number) => s >= 750 ? "Excellent" : s >= 650 ? "Good" : "Fair";
  const sym = CURRENCIES.find(c => c.code === currency)?.symbol || "₹";

  const toggleItem = <T,>(list: T[], setList: (l: T[]) => void, item: T, key: keyof T) => {
    const exists = list.find(i => i[key] === (item as any)[key]);
    if (exists) setList(list.filter(i => i[key] !== (item as any)[key]));
    else setList([...list, item]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold font-heading">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and financial preferences</p>
        </div>

        {/* Profile */}
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
            <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Income */}
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="text-lg">Income</CardTitle>
            <CardDescription>Salary and other income sources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Monthly Salary (After Tax)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">{sym}</span>
                <Input type="number" value={monthlySalary} onChange={e => setMonthlySalary(e.target.value)} className="pl-8" placeholder="e.g. 85000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Other Income Sources</Label>
              <div className="space-y-2">
                {INCOME_SOURCES.map(src => {
                  const selected = otherIncome.find(i => i.type === src);
                  return (
                    <div key={src} className="flex items-center gap-2">
                      <button onClick={() => {
                        if (selected) setOtherIncome(otherIncome.filter(i => i.type !== src));
                        else setOtherIncome([...otherIncome, { type: src, amount: "" }]);
                      }}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                        }`}>
                        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </button>
                      <span className="text-sm flex-1">{src}</span>
                      {selected && (
                        <div className="relative w-32">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">{sym}</span>
                          <Input type="number" value={selected.amount} className="pl-6 h-8 text-xs"
                            onChange={e => setOtherIncome(otherIncome.map(i => i.type === src ? { ...i, amount: e.target.value } : i))} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Score & Dependents */}
        <Card className="shadow-soft border-0">
          <CardHeader><CardTitle className="text-lg">Credit & Dependents</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Credit Score ({creditScore})</Label>
              <div className="flex items-center gap-3">
                <input type="range" min={300} max={900} step={10} value={creditScore} onChange={e => setCreditScore(+e.target.value)} className="flex-1 accent-primary" />
                <span className={`font-mono font-bold ${getScoreColor(creditScore)}`}>{creditScore}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  creditScore >= 750 ? "bg-primary/10 text-primary" : creditScore >= 650 ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" : "bg-destructive/10 text-destructive"
                }`}>{getScoreLabel(creditScore)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Number of Dependents</Label>
              <div className="flex items-center gap-4">
                <button onClick={() => setDependents(Math.max(0, dependents - 1))}
                  className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-secondary"><Minus className="h-4 w-4" /></button>
                <span className="font-mono text-2xl font-bold w-8 text-center">{dependents}</span>
                <button onClick={() => setDependents(dependents + 1)}
                  className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-secondary"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Goals */}
        <Card className="shadow-soft border-0">
          <CardHeader><CardTitle className="text-lg">Financial Goals</CardTitle></CardHeader>
          <CardContent>
            <textarea rows={4} value={financialGoals} onChange={e => setFinancialGoals(e.target.value)}
              placeholder={`e.g.\n• Save ${sym}5,000 emergency fund\n• Pay off credit card debt`}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none resize-y" />
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="gradient-primary text-primary-foreground w-full" disabled={loading}>
          {loading ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </DashboardLayout>
  );
}
