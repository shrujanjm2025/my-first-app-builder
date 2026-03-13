import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Wallet, TrendingUp, Star, Shield, Bell, Check, Info, AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CURRENCIES: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$", SGD: "S$", AED: "د.إ", JPY: "¥" };

const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);
const DONUT_COLORS = ["hsl(217, 94%, 68%)", "hsl(270, 95%, 75%)", "hsl(166, 100%, 45%)"];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate() as any;
  const [sym, setSym] = useState("₹");
  const [stats, setStats] = useState({ income: 0, expenses: 0, loans: 0, goals: 0, emergencyFund: 0, monthlySalary: 0, creditScore: 0, fullName: "" });
  const [chartData, setChartData] = useState<any[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<{ type: string; msg: string }[]>([]);
  const [goalsList, setGoalsList] = useState<any[]>([]);

  const fmtK = (n: number) => n >= 100000 ? `${sym}${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${sym}${(n / 1000).toFixed(0)}K` : `${sym}${n}`;

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      // Pull from users_financial_profile (primary) instead of profiles
      const [txRes, loanRes, goalRes, fpRes, insuranceRes, budgetRes] = await Promise.all([
        supabase.from("transactions").select("type, amount, date, category").eq("user_id", user.id).gte("date", startOfMonth),
        supabase.from("loans").select("outstanding_balance, name, start_date, tenure_months, emi, interest_rate").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("users_financial_profile").select("*").eq("id", user.id).single(),
        supabase.from("insurance_policies").select("name, renewal_date").eq("user_id", user.id),
        supabase.from("budgets").select("category, allocated_amount").eq("user_id", user.id).eq("month", startOfMonth),
      ]);

      const fp = fpRes.data;

      // Redirect to onboarding if not complete
      if (fp && !fp.onboarding_complete) {
        navigate("/onboarding");
        return;
      }

      const currency = fp?.currency || "INR";
      setSym(CURRENCIES[currency] || "₹");

      const txs = txRes.data || [];
      const income = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expenses = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      const loans = (loanRes.data || []).reduce((s, l) => s + Number(l.outstanding_balance), 0);
      const monthlySalary = Number(fp?.monthly_salary) || 0;
      const needsMonthly = monthlySalary * 0.5;
      const emergencyFund = needsMonthly * 6;
      const creditScore = Number(fp?.credit_score) || 0;
      const fullName = fp?.full_name || "";

      setStats({ income, expenses, loans, goals: (goalRes.data || []).length, emergencyFund, monthlySalary, creditScore, fullName });
      setGoalsList((goalRes.data || []).slice(0, 4));

      // Build real expense breakdown by actual transaction categories
      const categoryMap: Record<string, number> = {};
      const categoryColors: Record<string, string> = {};
      const categoryColorPalette = ["hsl(217, 94%, 68%)", "hsl(270, 95%, 75%)", "hsl(166, 100%, 45%)", "hsl(43, 96%, 56%)", "hsl(0, 91%, 71%)", "hsl(250, 95%, 65%)"];
      
      txs.filter(t => t.type === "expense").forEach((t, idx) => {
        const cat = t.category || "Other";
        categoryMap[cat] = (categoryMap[cat] || 0) + Number(t.amount);
        if (!categoryColors[cat]) {
          categoryColors[cat] = categoryColorPalette[Object.keys(categoryColors).length % categoryColorPalette.length];
        }
      });

      if (Object.keys(categoryMap).length > 0) {
        const expenseData = Object.entries(categoryMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value]) => ({ name, value: Math.round(value), color: categoryColors[name] }));
        setExpenseByCategory(expenseData);
      } else if (monthlySalary > 0) {
        // Fallback to 50/30/20 if no real expenses
        setExpenseByCategory([
          { name: "Needs", value: monthlySalary * 0.5, color: DONUT_COLORS[0] },
          { name: "Wants", value: monthlySalary * 0.3, color: DONUT_COLORS[1] },
          { name: "Savings", value: monthlySalary * 0.2, color: DONUT_COLORS[2] },
        ]);
      }

      const newAlerts: { type: string; msg: string }[] = [];
      const budgets = budgetRes.data || [];
      const catMap: Record<string, number> = {};
      txs.filter(t => t.type === "expense").forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount); });

      budgets.forEach((b: any) => {
        const spent = catMap[b.category] || 0;
        if (spent > Number(b.allocated_amount)) {
          newAlerts.push({ type: "y", msg: `Wants budget exceeded by ${CURRENCIES[currency]}${(spent - Number(b.allocated_amount)).toFixed(0)} on ${b.category}` });
        }
      });

      (insuranceRes.data || []).forEach((p: any) => {
        if (p.renewal_date) {
          const renewal = new Date(p.renewal_date);
          const daysUntil = (renewal.getTime() - Date.now()) / (24 * 3600 * 1000);
          if (daysUntil < 0) newAlerts.push({ type: "r", msg: `${p.name} insurance is OVERDUE for renewal` });
          else if (daysUntil < 30) newAlerts.push({ type: "y", msg: `${p.name} insurance renews in ${Math.ceil(daysUntil)} days` });
        }
      });

      if (creditScore > 0) {
        newAlerts.push({ type: "g", msg: `Credit score at ${creditScore} — ${creditScore >= 750 ? "Excellent" : creditScore >= 650 ? "Good" : "Needs work"}` });
      }

      setAlerts(newAlerts);

      // Fetch last 6 months of transaction data for accurate trend
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
          start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0],
          end: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0],
          m: d.toLocaleDateString("en", { month: "short" })
        };
      });

      const chartDataPoints = last6Months.map(month => {
        const monthTxs = txs.filter(t => t.date >= month.start && t.date <= month.end);
        const monthIncome = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
        const monthExpense = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
        return { m: month.m, income: Math.round(monthIncome), expense: Math.round(monthExpense) };
      });

      setChartData(chartDataPoints);
    };
    fetchStats();
  }, [user, navigate]);

  const savings = stats.income - stats.expenses;
  const savingsRate = stats.income > 0 ? ((savings / stats.income) * 100).toFixed(1) : "0";

  const statCards = [
    { label: "Monthly Income", value: fmtK(stats.income), sub: new Date().toLocaleDateString("en", { month: "short", year: "numeric" }), color: "primary", icon: Wallet, chip: stats.income > 0 ? "Active" : undefined },
    { label: "Total Expenses", value: fmtK(stats.expenses), sub: `of ${fmtK(stats.monthlySalary || stats.income)} budgeted`, color: "accent", icon: TrendingUp },
    { label: "Net Savings", value: fmtK(Math.max(0, savings)), sub: `${savingsRate}% savings rate`, color: "gold", icon: Star, chip: Number(savingsRate) >= 20 ? "On track" : undefined },
    { label: "Credit Score", value: stats.creditScore > 0 ? String(stats.creditScore) : "—", sub: stats.creditScore >= 750 ? "Excellent range" : stats.creditScore >= 650 ? "Good" : "Set in settings", color: "destructive", icon: Shield },
  ];

  const alertIcons: Record<string, any> = { r: AlertTriangle, y: AlertTriangle, g: Check, b: Info };
  const alertStyles: Record<string, string> = {
    r: "bg-destructive/10 border-destructive/20 text-destructive",
    y: "bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
    g: "bg-primary/10 border-primary/20 text-primary",
    b: "bg-accent/10 border-accent/20 text-accent",
  };

  return (
    <DashboardLayout>
      <div className="animate-fadeUp space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-heading text-[26px] font-extrabold">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {stats.fullName?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's your financial pulse — {new Date().toLocaleDateString("en", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <button onClick={() => navigate("/transactions")} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-heading font-bold text-sm hover:shadow-[0_6px_22px_hsl(var(--primary)/0.32)] hover:-translate-y-0.5 transition-all">
            View Transactions <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {statCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-elevated transition-all">
                <div className="flex justify-between items-start mb-3.5">
                  <div className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center bg-${c.color}/10`}>
                    <Icon className={`h-[18px] w-[18px] text-${c.color}`} />
                  </div>
                  {c.chip && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">{c.chip}</span>}
                </div>
                <div className="font-mono text-2xl font-semibold mb-1">{c.value}</div>
                <div className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider">{c.label}</div>
                {c.sub && <div className="text-[11px] text-muted-foreground/60 mt-1">{c.sub}</div>}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold mb-1">Budget Allocation</h3>
            <p className="text-xs text-muted-foreground mb-4">50/30/20 rule</p>
            {expenseByCategory.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value">
                      {expenseByCategory.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div className="bg-secondary border border-border rounded-xl px-3 py-2 text-xs">
                        <span style={{ color: payload[0].payload.color }}>{payload[0].name}: {fmtK(Number(payload[0].value))}</span>
                      </div>
                    ) : null} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-2">
                  {expenseByCategory.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-muted-foreground flex-1">{d.name}</span>
                      <span className="font-mono text-xs">{fmtK(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">Set salary in settings</div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold mb-1">Income vs Expenses</h3>
            <p className="text-xs text-muted-foreground mb-4">6-month trend</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(166,100%,45%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(166,100%,45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0,91%,71%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(0,91%,71%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="m" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} />
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div className="bg-secondary border border-border rounded-xl px-3 py-2 text-xs space-y-1">
                    {payload.map((p, i) => (
                      <div key={i} style={{ color: p.color }}><span className="font-semibold">{p.name}:</span> {fmtK(Number(p.value))}</div>
                    ))}
                  </div>
                ) : null} />
                <Area type="monotone" dataKey="income" name="Income" stroke="hsl(166,100%,45%)" strokeWidth={2} fill="url(#gi)" />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="hsl(0,91%,71%)" strokeWidth={2} fill="url(#ge)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold mb-4">SMART Goals</h3>
            {goalsList.length > 0 ? goalsList.map((g, i) => {
              const progress = pct(Number(g.current_amount), Number(g.target_amount));
              return (
                <div key={i} className="mb-3.5">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px]">{g.name}</span>
                    <span className="text-[11px] text-muted-foreground">Due {new Date(g.target_date).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[11px] text-primary">{fmtK(Number(g.current_amount))}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{fmtK(Number(g.target_amount))}</span>
                  </div>
                  <div className="h-[5px] bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{
                      width: `${Math.min(100, progress)}%`,
                      background: progress >= 70 ? "hsl(166,100%,45%)" : progress >= 40 ? "hsl(43,96%,56%)" : "hsl(0,91%,71%)"
                    }} />
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground">No goals set yet. Add goals to track progress.</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-[hsl(var(--warning))]" /> Smart Alerts
            </h3>
            {alerts.length > 0 ? alerts.map((a, i) => {
              const AlertIcon = alertIcons[a.type] || Info;
              return (
                <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl mb-2.5 border text-[13px] leading-relaxed ${alertStyles[a.type] || alertStyles.b}`}>
                  <AlertIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{a.msg}</span>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground">No alerts right now. Everything looks good! ✅</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
