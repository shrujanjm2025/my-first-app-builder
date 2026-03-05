import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Target, CreditCard, Shield, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const DONUT_COLORS = [
  "hsl(250, 65%, 55%)", "hsl(170, 60%, 45%)", "hsl(38, 92%, 55%)",
  "hsl(0, 72%, 55%)", "hsl(200, 70%, 50%)", "hsl(280, 60%, 55%)",
  "hsl(120, 50%, 45%)", "hsl(30, 80%, 50%)"
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ income: 0, expenses: 0, loans: 0, goals: 0, emergencyFund: 0, monthlySalary: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      const [txRes, loanRes, goalRes, profileRes, insuranceRes, budgetRes] = await Promise.all([
        supabase.from("transactions").select("type, amount, date, category").eq("user_id", user.id).gte("date", startOfMonth),
        supabase.from("loans").select("outstanding_balance, name, start_date, tenure_months, emi").eq("user_id", user.id),
        supabase.from("goals").select("id").eq("user_id", user.id),
        supabase.from("profiles").select("monthly_salary, dependents").eq("id", user.id).single(),
        supabase.from("insurance_policies").select("name, renewal_date").eq("user_id", user.id),
        supabase.from("budgets").select("category, allocated_amount").eq("user_id", user.id).eq("month", startOfMonth),
      ]);

      const txs = txRes.data || [];
      const income = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expenses = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      const loans = (loanRes.data || []).reduce((s, l) => s + Number(l.outstanding_balance), 0);
      const monthlySalary = Number(profileRes.data?.monthly_salary) || 0;
      const needsMonthly = monthlySalary * 0.5;
      const emergencyFund = needsMonthly * 6;

      setStats({ income, expenses, loans, goals: (goalRes.data || []).length, emergencyFund, monthlySalary });

      // Expense by category for donut chart
      const catMap: Record<string, number> = {};
      txs.filter(t => t.type === "expense").forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount); });
      setExpenseByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      // Alerts
      const newAlerts: string[] = [];

      // Overspending alerts
      const budgets = budgetRes.data || [];
      budgets.forEach((b: any) => {
        const spent = catMap[b.category] || 0;
        if (spent > Number(b.allocated_amount)) {
          newAlerts.push(`⚠️ Over budget on ${b.category}: spent $${spent.toFixed(0)} of $${Number(b.allocated_amount).toFixed(0)}`);
        }
      });

      // Insurance renewal alerts
      (insuranceRes.data || []).forEach((p: any) => {
        if (p.renewal_date) {
          const renewal = new Date(p.renewal_date);
          const daysUntil = (renewal.getTime() - Date.now()) / (24 * 3600 * 1000);
          if (daysUntil < 0) newAlerts.push(`🚨 ${p.name} insurance is OVERDUE for renewal!`);
          else if (daysUntil < 30) newAlerts.push(`⏰ ${p.name} insurance renews in ${Math.ceil(daysUntil)} days`);
        }
      });

      // Loan alerts
      (loanRes.data || []).forEach((l: any) => {
        const monthsPassed = Math.floor((Date.now() - new Date(l.start_date).getTime()) / (30 * 24 * 3600 * 1000));
        if (monthsPassed >= l.tenure_months) {
          newAlerts.push(`🚨 ${l.name} loan tenure has ended — check if fully paid`);
        }
      });

      setAlerts(newAlerts);

      // Last 7 days chart
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        const dayIncome = txs.filter(t => t.type === "income" && t.date === dateStr).reduce((s, t) => s + Number(t.amount), 0);
        const dayExpense = txs.filter(t => t.type === "expense" && t.date === dateStr).reduce((s, t) => s + Number(t.amount), 0);
        return { date: d.toLocaleDateString("en", { weekday: "short" }), income: dayIncome, expenses: dayExpense };
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

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="shadow-soft border-0 border-l-4 border-l-[hsl(var(--warning))]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
                <span className="font-semibold text-sm">Alerts</span>
              </div>
              <div className="space-y-1">
                {alerts.map((a, i) => (
                  <p key={i} className="text-sm text-muted-foreground">{a}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                <p className="text-2xl font-bold font-heading">
                  {c.isCurrency === false ? c.value : `$${c.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Emergency Fund */}
        {stats.monthlySalary > 0 && (
          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Emergency Fund Target (6 months of needs)</span>
              </div>
              <p className="text-2xl font-bold font-heading text-primary">
                ${stats.emergencyFund.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Based on 50% of ${stats.monthlySalary.toLocaleString()} monthly salary × 6 months</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Area Chart */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Income vs Expenses (7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
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

          {/* Donut Chart */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {expenseByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expenseByCategory.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No expenses this month</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
