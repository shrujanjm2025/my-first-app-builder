import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, PiggyBank } from "lucide-react";
import { toast } from "sonner";

const BUDGET_CATEGORIES = ["Housing", "Food", "Transport", "Entertainment", "Healthcare", "Shopping", "Utilities", "Education", "Savings", "Other"];

interface Budget { id: string; category: string; allocated_amount: number; month: string; }

export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spending, setSpending] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "", amount: "" });
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

  const fetch = async () => {
    if (!user) return;
    const [bRes, tRes] = await Promise.all([
      supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", currentMonth),
      supabase.from("transactions").select("category, amount").eq("user_id", user.id).eq("type", "expense").gte("date", currentMonth),
    ]);
    setBudgets((bRes.data as Budget[]) || []);
    const sp: Record<string, number> = {};
    (tRes.data || []).forEach((t: any) => { sp[t.category] = (sp[t.category] || 0) + Number(t.amount); });
    setSpending(sp);
  };

  useEffect(() => { fetch(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("budgets").insert({
      user_id: user.id, category: form.category, allocated_amount: parseFloat(form.amount), month: currentMonth,
    });
    if (error) toast.error(error.message);
    else { toast.success("Budget set"); setOpen(false); setForm({ category: "", amount: "" }); fetch(); }
  };

  const totalBudget = budgets.reduce((s, b) => s + Number(b.allocated_amount), 0);
  const totalSpent = Object.values(spending).reduce((s, v) => s + v, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Budgets</h1>
            <p className="text-muted-foreground">{new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white"><Plus className="h-4 w-4 mr-2" />Set Budget</Button>
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
                <Button type="submit" className="w-full gradient-primary text-white">Set Budget</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* 50/30/20 guide */}
        <Card className="shadow-soft border-0 gradient-primary text-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <PiggyBank className="h-5 w-5" />
              <span className="font-semibold">50/30/20 Rule Guide</span>
            </div>
            <p className="text-sm text-white/80">50% Needs • 30% Wants • 20% Savings & Debt Repayment</p>
            <div className="flex gap-2 mt-3">
              <div className="flex-1 h-2 rounded-full bg-white/40" /><div className="w-[30%] h-2 rounded-full bg-white/25" /><div className="w-[20%] h-2 rounded-full bg-white/15" />
            </div>
          </CardContent>
        </Card>

        {/* Overview */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>${totalBudget.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
              <p className={`text-2xl font-bold ${totalSpent > totalBudget ? 'text-destructive' : ''}`} style={{ fontFamily: 'Space Grotesk' }}>${totalSpent.toFixed(2)}</p>
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
                    <span className={`text-sm font-semibold ${over ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>
                      {over ? 'Over budget' : `${(100 - pct).toFixed(0)}% left`}
                    </span>
                  </div>
                  <Progress value={pct} className={over ? '[&>div]:bg-destructive' : '[&>div]:bg-[hsl(var(--success))]'} />
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
