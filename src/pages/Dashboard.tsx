import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Target, CreditCard, Shield } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ income: 0, expenses: 0, loans: 0, goals: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const [txRes, loanRes, goalRes] = await Promise.all([
        supabase.from("transactions").select("type, amount, date").eq("user_id", user.id).gte("date", startOfMonth),
        supabase.from("loans").select("outstanding_balance").eq("user_id", user.id),
        supabase.from("goals").select("id").eq("user_id", user.id),
      ]);

      const txs = txRes.data || [];
      const income = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expenses = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      const loans = (loanRes.data || []).reduce((s, l) => s + Number(l.outstanding_balance), 0);

      setStats({ income, expenses, loans, goals: (goalRes.data || []).length });

      // Generate last 7 days chart data
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayIncome = txs.filter(t => t.type === "income" && t.date === dateStr).reduce((s, t) => s + Number(t.amount), 0);
        const dayExpense = txs.filter(t => t.type === "expense" && t.date === dateStr).reduce((s, t) => s + Number(t.amount), 0);
        return { date: d.toLocaleDateString('en', { weekday: 'short' }), income: dayIncome, expenses: dayExpense };
      });
      setChartData(last7);
    };
    fetchStats();
  }, [user]);

  const cards = [
    { title: "Income", value: stats.income, icon: ArrowUpRight, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/10" },
    { title: "Expenses", value: stats.expenses, icon: ArrowDownRight, color: "text-destructive", bg: "bg-destructive/10" },
    { title: "Outstanding Loans", value: stats.loans, icon: CreditCard, color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning))]/10" },
    { title: "Active Goals", value: stats.goals, icon: Target, color: "text-primary", bg: "bg-primary/10", isCurrency: false },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your financial overview this month</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(c => (
            <Card key={c.title} className="shadow-soft border-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{c.title}</span>
                  <div className={`p-2 rounded-lg ${c.bg}`}>
                    <c.icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                  {c.isCurrency === false ? c.value : `$${c.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Income vs Expenses (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(152, 60%, 42%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(152, 60%, 42%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area type="monotone" dataKey="income" stroke="hsl(152, 60%, 42%)" fill="url(#incomeGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="hsl(0, 72%, 55%)" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
