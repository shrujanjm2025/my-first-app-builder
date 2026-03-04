import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Goal { id: string; name: string; target_amount: number; current_amount: number; target_date: string; inflation_rate: number; investment_return: number; }

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", target_amount: "", current_amount: "0", target_date: "", inflation_rate: "4", investment_return: "8" });

  const fetchGoals = async () => {
    if (!user) return;
    const { data } = await supabase.from("goals").select("*").eq("user_id", user.id).order("target_date");
    setGoals((data as Goal[]) || []);
  };

  useEffect(() => { fetchGoals(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("goals").insert({
      user_id: user.id, name: form.name,
      target_amount: parseFloat(form.target_amount), current_amount: parseFloat(form.current_amount),
      target_date: form.target_date, inflation_rate: parseFloat(form.inflation_rate), investment_return: parseFloat(form.investment_return),
    });
    if (error) toast.error(error.message); else { toast.success("Goal created"); setOpen(false); fetchGoals(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    fetchGoals();
  };

  const calcFutureValue = (pv: number, rate: number, years: number) => pv * Math.pow(1 + rate / 100, years);
  const calcMonthlyPMT = (fv: number, annualReturn: number, months: number) => {
    const r = annualReturn / 100 / 12;
    if (r === 0) return fv / months;
    return fv / ((Math.pow(1 + r, months) - 1) / r);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Financial Goals</h1>
            <p className="text-muted-foreground">Inflation-adjusted SMART goal planning</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white"><Plus className="h-4 w-4 mr-2" />Add Goal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Financial Goal</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2"><Label>Goal Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Down payment" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Current Cost ($)</Label><Input type="number" step="0.01" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Saved So Far ($)</Label><Input type="number" step="0.01" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Target Date</Label><Input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Inflation Rate (%)</Label><Input type="number" step="0.1" value={form.inflation_rate} onChange={(e) => setForm({ ...form, inflation_rate: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Investment Return (%)</Label><Input type="number" step="0.1" value={form.investment_return} onChange={(e) => setForm({ ...form, investment_return: e.target.value })} /></div>
                </div>
                <Button type="submit" className="w-full gradient-primary text-white">Create Goal</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map(g => {
            const years = Math.max(0, (new Date(g.target_date).getTime() - Date.now()) / (365.25 * 24 * 3600 * 1000));
            const months = Math.max(1, Math.ceil(years * 12));
            const fv = calcFutureValue(Number(g.target_amount), Number(g.inflation_rate), years);
            const remaining = fv - Number(g.current_amount);
            const monthlyPMT = remaining > 0 ? calcMonthlyPMT(remaining, Number(g.investment_return), months) : 0;
            const pct = Math.min((Number(g.current_amount) / fv) * 100, 100);

            return (
              <Card key={g.id} className="shadow-soft border-0">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10"><Target className="h-4 w-4 text-primary" /></div>
                      <span className="font-semibold">{g.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  <Progress value={pct} className="[&>div]:gradient-primary" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Future Value</span><p className="font-semibold">${fv.toFixed(0)}</p></div>
                    <div><span className="text-muted-foreground">Saved</span><p className="font-semibold">${Number(g.current_amount).toFixed(0)}</p></div>
                    <div><span className="text-muted-foreground">Monthly Needed</span><p className="font-semibold text-primary">${monthlyPMT.toFixed(0)}</p></div>
                    <div><span className="text-muted-foreground">Target Date</span><p className="font-semibold">{new Date(g.target_date).toLocaleDateString()}</p></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {goals.length === 0 && (
            <Card className="shadow-soft border-0 col-span-full"><CardContent className="p-8 text-center text-muted-foreground">No goals yet. Create your first financial goal!</CardContent></Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
