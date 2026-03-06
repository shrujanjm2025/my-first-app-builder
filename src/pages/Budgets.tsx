import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, PiggyBank } from "lucide-react";
import { toast } from "sonner";

const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;
const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);

const BUDGET_CATEGORIES = ["Housing", "Food", "Transport", "Entertainment", "Healthcare", "Shopping", "Utilities", "Education", "Savings", "Groceries", "Other"];
const CAT_ICONS: Record<string, string> = { Housing: "🏠", Food: "🍽️", Transport: "🚗", Entertainment: "🎬", Healthcare: "🏥", Shopping: "🛍️", Utilities: "⚡", Education: "📚", Savings: "💰", Groceries: "🛒", Other: "📋" };

interface Budget { id: string; category: string; allocated_amount: number; month: string; }

export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spending, setSpending] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "", amount: "" });
  const [monthlySalary, setMonthlySalary] = useState(0);
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

  const fetchData = async () => {
    if (!user) return;
    const [bRes, tRes, pRes] = await Promise.all([
      supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", currentMonth),
      supabase.from("transactions").select("category, amount").eq("user_id", user.id).eq("type", "expense").gte("date", currentMonth),
      supabase.from("profiles").select("monthly_salary").eq("id", user.id).single(),
    ]);
    setBudgets((bRes.data as Budget[]) || []);
    const sp: Record<string, number> = {};
    (tRes.data || []).forEach((t: any) => { sp[t.category] = (sp[t.category] || 0) + Number(t.amount); });
    setSpending(sp);
    setMonthlySalary(Number(pRes.data?.monthly_salary) || 0);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("budgets").insert({
      user_id: user.id, category: form.category, allocated_amount: parseFloat(form.amount), month: currentMonth,
    });
    if (error) toast.error(error.message);
    else { toast.success("Budget set"); setOpen(false); setForm({ category: "", amount: "" }); fetchData(); }
  };

  const totalSpent = Object.values(spending).reduce((s, v) => s + v, 0);

  const needs = { budget: monthlySalary * 0.5, spent: totalSpent * 0.5 };
  const wants = { budget: monthlySalary * 0.3, spent: totalSpent * 0.3 };
  const savings = { budget: monthlySalary * 0.2, spent: totalSpent * 0.2 };
  const emergTarget = needs.budget * 6;

  return (
    <DashboardLayout>
      <div className="animate-fadeUp space-y-4">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="font-heading text-xl font-extrabold mb-1">Budget Manager</h2>
            <p className="text-[13px] text-muted-foreground">50/30/20 rule · {new Date().toLocaleDateString("en", { month: "long", year: "numeric" })}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="gradient-primary text-primary-foreground font-heading font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-1.5 hover:shadow-[0_6px_22px_hsl(var(--primary)/0.32)] transition-all">
                <Plus className="h-4 w-4" /> Set Budget
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Set Category Budget</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{BUDGET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Set Budget</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Monthly Income Card */}
        {monthlySalary > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 bg-gradient-to-br from-primary/5 to-accent/3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-[15px] font-bold">Monthly Income</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-primary/10 text-primary">{fmtK(monthlySalary)}</span>
            </div>
          </div>
        )}

        {/* 50/30/20 Cards */}
        {monthlySalary > 0 && (
          <div className="grid grid-cols-3 gap-3.5">
            {[
              { label: "Needs (50%)", d: needs, color: "hsl(217,94%,68%)", desc: "Rent, groceries, utilities, EMIs" },
              { label: "Wants (30%)", d: wants, color: "hsl(270,95%,75%)", desc: "Dining, entertainment, shopping" },
              { label: "Savings (20%)", d: savings, color: "hsl(166,100%,45%)", desc: "Investments, RDs, goals" },
            ].map(({ label, d, color, desc }, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-elevated transition-all">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{label}</div>
                <div className="font-mono text-[22px] font-semibold mb-1">{fmtK(d.spent)}</div>
                <div className="text-[11px] text-muted-foreground/60 mb-3">of {fmtK(d.budget)} · {desc}</div>
                <div className="h-[5px] bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct(d.spent, d.budget))}%`, background: d.spent > d.budget ? "hsl(0,91%,71%)" : color }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[11px]">
                  <span style={{ color: d.spent > d.budget ? "hsl(0,91%,71%)" : "hsl(var(--muted-foreground))" }}>{pct(d.spent, d.budget)}% used</span>
                  <span style={{ color: d.spent > d.budget ? "hsl(0,91%,71%)" : "hsl(166,100%,45%)" }}>
                    {d.spent > d.budget ? `+${fmtK(d.spent - d.budget)} over` : `${fmtK(d.budget - d.spent)} left`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Emergency Fund */}
        {monthlySalary > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-heading text-[15px] font-bold">🛡️ Emergency Fund</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Target: 6 months of essential expenses = {fmtK(emergTarget)}</p>
              </div>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all" style={{ width: "0%", background: "linear-gradient(90deg, hsl(43,96%,56%), hsl(166,100%,45%))" }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-mono text-primary">Current: ₹0</span>
              <span className="font-mono text-muted-foreground">Needed: {fmtK(emergTarget)}</span>
            </div>
          </div>
        )}

        {/* Spending Categories */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-heading text-sm font-bold mb-4">Spending Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {budgets.map((b, i) => {
              const spent = spending[b.category] || 0;
              const over = spent > Number(b.allocated_amount);
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <span className="text-xl">{CAT_ICONS[b.category] || "📋"}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium">{b.category}</span>
                      {over && <span className="text-[10px] text-destructive font-semibold">OVER</span>}
                    </div>
                    <div className="h-[5px] bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct(spent, Number(b.allocated_amount)))}%`, background: over ? "hsl(0,91%,71%)" : "hsl(166,100%,45%)" }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-mono text-[10px]" style={{ color: over ? "hsl(0,91%,71%)" : "hsl(166,100%,45%)" }}>{fmtK(spent)}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{fmtK(Number(b.allocated_amount))}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {budgets.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No budgets set. Click "Set Budget" to start.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}