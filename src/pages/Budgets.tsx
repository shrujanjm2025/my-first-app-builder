import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, PiggyBank, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const BUDGET_CATEGORIES = ["Housing", "Food", "Transport", "Entertainment", "Healthcare", "Shopping", "Utilities", "Education", "Savings", "Groceries", "Other"];

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

  const totalBudget = budgets.reduce((s, b) => s + Number(b.allocated_amount), 0);
  const totalSpent = Object.values(spending).reduce((s, v) => s + v, 0);

  // 50/30/20 breakdown
  const needs = monthlySalary * 0.5;
  const wants = monthlySalary * 0.3;
  const savingsDebt = monthlySalary * 0.2;

  // Overspending alerts
  const overBudgetCategories = budgets.filter(b => (spending[b.category] || 0) > Number(b.allocated_amount));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Budgets</h1>
            <p className="text-muted-foreground">{new Date().toLocaleDateString("en", { month: "long", year: "numeric" })}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Set Budget</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Set Category Budget</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{BUDGET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Set Budget</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overspending Alerts */}
        {overBudgetCategories.length > 0 && (
          <Card className="shadow-soft border-0 border-l-4 border-l-destructive">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-semibold text-sm text-destructive">Overspending Alert!</span>
              </div>
              {overBudgetCategories.map(b => (
                <p key={b.id} className="text-sm text-muted-foreground">
                  {b.category}: ${(spending[b.category] || 0).toFixed(2)} spent of ${Number(b.allocated_amount).toFixed(2)} budget
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 50/30/20 Rule */}
        <Card className="shadow-soft border-0 gradient-primary text-primary-foreground">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <PiggyBank className="h-5 w-5" />
              <span className="font-semibold">50/30/20 Rule</span>
            </div>
            {monthlySalary > 0 ? (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-primary-foreground/70">50% Needs</p>
                  <p className="text-lg font-bold font-heading">${needs.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/70">30% Wants</p>
                  <p className="text-lg font-bold font-heading">${wants.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-primary-foreground/70">20% Savings</p>
                  <p className="text-lg font-bold font-heading">${savingsDebt.toFixed(0)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-primary-foreground/80">Set your monthly salary in Settings to see 50/30/20 breakdown</p>
            )}
            <div className="flex gap-2 mt-3">
              <div className="flex-1 h-2 rounded-full bg-primary-foreground/40" />
              <div className="w-[30%] h-2 rounded-full bg-primary-foreground/25" />
              <div className="w-[20%] h-2 rounded-full bg-primary-foreground/15" />
            </div>
          </CardContent>
        </Card>

        {/* Overview */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
              <p className="text-2xl font-bold font-heading">${totalBudget.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
              <p className={`text-2xl font-bold font-heading ${totalSpent > totalBudget ? "text-destructive" : ""}`}>${totalSpent.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map(b => {
            const spent = spending[b.category] || 0;
            const pct = Math.min((spent / Number(b.allocated_amount)) * 100, 100);
            const over = spent > Number(b.allocated_amount);
            return (
              <Card key={b.id} className="shadow-soft border-0">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{b.category}</span>
                    <span className={`text-sm font-semibold ${over ? "text-destructive" : "text-[hsl(var(--success))]"}`}>
                      {over ? "Over budget" : `${(100 - pct).toFixed(0)}% left`}
                    </span>
                  </div>
                  <Progress value={pct} className={over ? "[&>div]:bg-destructive" : "[&>div]:bg-[hsl(var(--success))]"} />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${spent.toFixed(2)} spent</span>
                    <span>${Number(b.allocated_amount).toFixed(2)} budget</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {budgets.length === 0 && (
            <Card className="shadow-soft border-0 col-span-full">
              <CardContent className="p-8 text-center text-muted-foreground">No budgets set for this month. Click "Set Budget" to get started.</CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
