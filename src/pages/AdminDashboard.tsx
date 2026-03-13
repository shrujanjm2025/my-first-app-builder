import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, AlertCircle, CheckCircle, Clock, Shield } from "lucide-react";
import { toast } from "sonner";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersLastMonth: number;
  completedOnboarding: number;
  avgTransactions: number;
  totalTransactions: number;
  totalRevenue: number;
  complianceRate: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersLastMonth: 0,
    completedOnboarding: 0,
    avgTransactions: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    complianceRate: 0
  });
  const [userActivityData, setUserActivityData] = useState<any[]>([]);
  const [featureUsage, setFeatureUsage] = useState<any[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) return;

    // Check if user is admin (you can modify this logic based on your setup)
    // For now, we'll allow the platform creator/special users
    const { data: profile } = await supabase
      .from("users_financial_profile")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profile?.is_admin) {
      setIsAdmin(true);
      loadAdminStats();
    } else {
      // Not an admin - redirect to dashboard
      toast.error("Access denied. Admin panel is restricted.");
      navigate("/dashboard");
    }
  };

  const loadAdminStats = async () => {
    setLoading(true);

    // Get user statistics
    const { data: allUsers } = await supabase.from("users_financial_profile").select("id, created_at, onboarding_complete, last_login");
    const { data: transactions } = await supabase.from("transactions").select("id, user_id, amount, date");
    const { data: budgets } = await supabase.from("budgets").select("*");

    if (!allUsers) return;

    // Calculate stats
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalUsers = allUsers.length;
    const completedOnboarding = allUsers.filter(u => u.onboarding_complete).length;
    const newUsersLastMonth = allUsers.filter(u => new Date(u.created_at) > oneMonthAgo).length;
    const activeUsers = allUsers.filter(u => u.last_login && new Date(u.last_login) > sevenDaysAgo).length;

    const totalTransactions = transactions?.length || 0;
    const avgTransactions = totalUsers > 0 ? Math.round(totalTransactions / totalUsers) : 0;
    const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // Compliance rate (users who gave consent)
    const { data: complianceData } = await supabase
      .from("users_financial_profile")
      .select("compliance_consents")
      .neq("compliance_consents", null);
    const complianceRate = totalUsers > 0 ? Math.round((complianceData?.length || 0) / totalUsers * 100) : 0;

    setStats({
      totalUsers,
      activeUsers,
      newUsersLastMonth,
      completedOnboarding,
      avgTransactions,
      totalTransactions,
      totalRevenue: Math.round(totalRevenue),
      complianceRate
    });

    // Activity trend (last 7 days)
    const activityData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en", { weekday: "short" });
      const dayTransactions = transactions?.filter(t => t.date === dateStr).length || 0;
      return { day: dayName, transactions: dayTransactions, users: Math.max(1, dayTransactions / 5) };
    });
    setUserActivityData(activityData);

    // Feature usage (mock data - would be tracked in production)
    setFeatureUsage([
      { name: "Dashboard", value: Math.round(activeUsers * 0.9), color: "hsl(217, 94%, 68%)" },
      { name: "Transactions", value: Math.round(activeUsers * 0.7), color: "hsl(166, 100%, 45%)" },
      { name: "Goals", value: Math.round(activeUsers * 0.5), color: "hsl(270, 95%, 75%)" },
      { name: "Budgets", value: Math.round(activeUsers * 0.6), color: "hsl(43, 96%, 56%)" },
      { name: "Gamification", value: Math.round(activeUsers * 0.4), color: "hsl(0, 91%, 71%)" }
    ]);

    // Check for compliance issues
    const issues = [];
    if (complianceRate < 80) {
      issues.push({
        type: "warning",
        title: "Low Compliance Rate",
        message: `${complianceRate}% of users have given consent. Target: 95%+`
      });
    }
    if (activeUsers < totalUsers * 0.3) {
      issues.push({
        type: "warning",
        title: "Low Engagement",
        message: `Only ${Math.round(activeUsers / totalUsers * 100)}% of users active in last 7 days`
      });
    }
    if (completedOnboarding < totalUsers * 0.7) {
      issues.push({
        type: "info",
        title: "Incomplete Onboarding",
        message: `${totalUsers - completedOnboarding} users haven't completed onboarding`
      });
    }

    setComplianceIssues(issues);

    // Recent users
    const recent = allUsers
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((u, i) => ({
        id: i + 1,
        userId: u.id.substring(0, 8) + "...",
        joinDate: new Date(u.created_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }),
        status: u.onboarding_complete ? "Completed" : "Pending",
        lastActive: u.last_login ? new Date(u.last_login).toLocaleDateString("en", { month: "short", day: "numeric" }) : "Never"
      })) || [];

    setRecentUsers(recent);
    setLoading(false);
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-96">Loading admin dashboard...</div></DashboardLayout>;
  }

  if (!isAdmin) {
    return null;
  }

  const fmtK = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`;

  return (
    <DashboardLayout>
      <div className="animate-fadeUp space-y-5">
        <div>
          <h2 className="font-heading text-xl font-extrabold mb-1">Admin Dashboard</h2>
          <p className="text-[13px] text-muted-foreground">Platform metrics, user activity & compliance monitoring</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            { label: "Total Users", value: fmtK(stats.totalUsers), icon: Users, color: "primary" },
            { label: "Active (7d)", value: fmtK(stats.activeUsers), icon: TrendingUp, color: "accent" },
            { label: "Onboarded", value: `${Math.round(stats.completedOnboarding / stats.totalUsers * 100)}%`, icon: CheckCircle, color: "primary" },
            { label: "Compliance", value: `${stats.complianceRate}%`, icon: Shield, color: "accent" }
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-elevated transition-all">
                <div className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center bg-${m.color}/10 mb-3`}>
                  <Icon className={`h-[18px] w-[18px] text-${m.color}`} />
                </div>
                <div className="font-mono text-2xl font-semibold mb-1">{m.value}</div>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase">{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* Activity & Revenue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold mb-4">Activity Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="transactions" stroke="hsl(217, 94%, 68%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold mb-4">Feature Usage</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={featureUsage} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                  {featureUsage.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Status */}
        {complianceIssues.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-[hsl(var(--warning))]" />
              <h3 className="font-heading text-sm font-bold">Alerts & Issues</h3>
            </div>
            <div className="space-y-2">
              {complianceIssues.map((issue, i) => (
                <div key={i} className={`p-3 rounded-xl border-l-4 ${
                  issue.type === "warning" ? "bg-[hsl(var(--warning))]/5 border-[hsl(var(--warning))]" : "bg-accent/5 border-accent"
                }`}>
                  <div className={`font-semibold text-sm ${
                    issue.type === "warning" ? "text-[hsl(var(--warning))]" : "text-accent"
                  }`}>{issue.title}</div>
                  <div className="text-[12px] text-muted-foreground mt-1">{issue.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Users Table */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-heading text-sm font-bold mb-4">Recent Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">#</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">User ID</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Join Date</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u, i) => (
                  <tr key={i} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="py-2 px-3 text-muted-foreground">{u.id}</td>
                    <td className="py-2 px-3 font-mono text-xs">{u.userId}</td>
                    <td className="py-2 px-3">{u.joinDate}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.status === "Completed" ? "bg-primary/10 text-primary" : "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]"
                      }`}>{u.status}</span>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{u.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
            <div className="text-xs font-semibold text-primary uppercase mb-1">Total Transactions</div>
            <div className="font-mono text-2xl font-bold text-primary">{fmtK(stats.totalTransactions)}</div>
            <div className="text-[11px] text-primary/60 mt-1">Avg per user: {stats.avgTransactions}</div>
          </div>
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
            <div className="text-xs font-semibold text-accent uppercase mb-1">Total Value</div>
            <div className="font-mono text-2xl font-bold text-accent">₹{fmtK(stats.totalRevenue)}</div>
            <div className="text-[11px] text-accent/60 mt-1">All transactions tracked</div>
          </div>
          <div className="bg-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/20 rounded-2xl p-5">
            <div className="text-xs font-semibold text-[hsl(var(--warning))] uppercase mb-1">New Users (30d)</div>
            <div className="font-mono text-2xl font-bold text-[hsl(var(--warning))]">{fmtK(stats.newUsersLastMonth)}</div>
            <div className="text-[11px] text-[hsl(var(--warning))]/60 mt-1">{Math.round(stats.newUsersLastMonth / stats.totalUsers * 100)}% of total</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
