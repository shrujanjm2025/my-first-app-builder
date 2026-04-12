import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Wallet, TrendingUp, Star, Shield, Bell, Check, Info, AlertTriangle } from "lucide-react";

const DONUT_COLORS = ["hsl(217, 94%, 68%)", "hsl(270, 95%, 75%)", "hsl(166, 100%, 45%)"];
const sym = "₹";
const fmtK = (n: number) => n >= 100000 ? `${sym}${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${sym}${(n / 1000).toFixed(0)}K` : `${sym}${n}`;

const mockStats = { income: 85000, expenses: 42000, loans: 350000, goals: 3, emergencyFund: 255000, monthlySalary: 85000, creditScore: 742, fullName: "Demo User" };

const mockChartData = [
  { m: "Nov", income: 78000, expense: 38000 },
  { m: "Dec", income: 82000, expense: 41000 },
  { m: "Jan", income: 80000, expense: 39000 },
  { m: "Feb", income: 85000, expense: 44000 },
  { m: "Mar", income: 83000, expense: 40000 },
  { m: "Apr", income: 85000, expense: 42000 },
];

const mockExpenseByCategory = [
  { name: "Needs", value: 42500, color: DONUT_COLORS[0] },
  { name: "Wants", value: 25500, color: DONUT_COLORS[1] },
  { name: "Savings", value: 17000, color: DONUT_COLORS[2] },
];

const mockGoals = [
  { name: "Emergency Fund", current_amount: 180000, target_amount: 255000, target_date: "2026-08-01" },
  { name: "Vacation Fund", current_amount: 25000, target_amount: 60000, target_date: "2026-12-15" },
  { name: "New Laptop", current_amount: 45000, target_amount: 80000, target_date: "2026-06-30" },
];

const mockAlerts = [
  { type: "g", msg: "Credit score at 742 — Good" },
  { type: "y", msg: "Car insurance renews in 18 days" },
  { type: "b", msg: "You're saving 50.6% of income this month — great!" },
];

const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);

export default function Dashboard() {
  const stats = mockStats;
  const chartData = mockChartData;
  const expenseByCategory = mockExpenseByCategory;
  const goalsList = mockGoals;
  const alerts = mockAlerts;

  const savings = stats.income - stats.expenses;
  const savingsRate = stats.income > 0 ? ((savings / stats.income) * 100).toFixed(1) : "0";

  const statCards = [
    { label: "Monthly Income", value: fmtK(stats.income), sub: "Apr 2026", color: "primary", icon: Wallet, chip: "Active" },
    { label: "Total Expenses", value: fmtK(stats.expenses), sub: `of ${fmtK(stats.monthlySalary)} budgeted`, color: "accent", icon: TrendingUp },
    { label: "Net Savings", value: fmtK(Math.max(0, savings)), sub: `${savingsRate}% savings rate`, color: "gold", icon: Star, chip: "On track" },
    { label: "Credit Score", value: String(stats.creditScore), sub: "Good range", color: "destructive", icon: Shield },
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
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {stats.fullName.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's your financial pulse — {new Date().toLocaleDateString("en", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
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
            {goalsList.map((g, i) => {
              const progress = pct(g.current_amount, g.target_amount);
              return (
                <div key={i} className="mb-3.5">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px]">{g.name}</span>
                    <span className="text-[11px] text-muted-foreground">Due {new Date(g.target_date).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[11px] text-primary">{fmtK(g.current_amount)}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{fmtK(g.target_amount)}</span>
                  </div>
                  <div className="h-[5px] bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{
                      width: `${Math.min(100, progress)}%`,
                      background: progress >= 70 ? "hsl(166,100%,45%)" : progress >= 40 ? "hsl(43,96%,56%)" : "hsl(0,91%,71%)"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-[hsl(var(--warning))]" /> Smart Alerts
            </h3>
            {alerts.map((a, i) => {
              const AlertIcon = alertIcons[a.type] || Info;
              return (
                <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl mb-2.5 border text-[13px] leading-relaxed ${alertStyles[a.type] || alertStyles.b}`}>
                  <AlertIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{a.msg}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
