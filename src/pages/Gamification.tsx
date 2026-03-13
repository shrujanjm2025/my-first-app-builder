import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Trophy, Flame, Award, TrendingUp, Target, Brain, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  requirement: number;
}

interface UserStats {
  dailyStreak: number;
  maxStreak: number;
  totalPoints: number;
  badges: string[];
  lastActivityDate: string;
}

const ACHIEVEMENTS = [
  {
    id: "first-transaction",
    name: "First Step",
    description: "Record your first transaction",
    icon: "📝",
    requirement: 1,
    category: "transaction"
  },
  {
    id: "transaction-ten",
    name: "Record Keeper",
    description: "Record 10 transactions",
    icon: "📊",
    requirement: 10,
    category: "transaction"
  },
  {
    id: "transaction-hundred",
    name: "Data Master",
    description: "Record 100 transactions",
    icon: "💪",
    requirement: 100,
    category: "transaction"
  },
  {
    id: "week-streak",
    name: "On Fire",
    description: "Maintain 7-day streak",
    icon: "🔥",
    requirement: 7,
    category: "streak"
  },
  {
    id: "month-streak",
    name: "Unstoppable",
    description: "Maintain 30-day streak",
    icon: "⚡",
    requirement: 30,
    category: "streak"
  },
  {
    id: "savings-goal",
    name: "Goal Getter",
    description: "Complete your first savings goal",
    icon: "🎯",
    requirement: 1,
    category: "goals"
  },
  {
    id: "budget-master",
    name: "Budget Master",
    description: "Stay within budget for 3 months",
    icon: "💰",
    requirement: 3,
    category: "budget"
  },
  {
    id: "credit-boost",
    name: "Credit Hero",
    description: "Improve credit score by 50 points",
    icon: "🏆",
    requirement: 50,
    category: "credit"
  }
];

const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;

export default function Gamification() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    dailyStreak: 0,
    maxStreak: 0,
    totalPoints: 0,
    badges: [],
    lastActivityDate: ""
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [projections, setProjections] = useState<any>(null);
  const [behavioralAlerts, setBehavioralAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    calculateGamification();
  }, [user]);

  const calculateGamification = async () => {
    if (!user) return;

    // Fetch all relevant user data
    const [txRes, goalsRes, fpRes, budgetRes] = await Promise.all([
      supabase.from("transactions").select("date, type, amount").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("goals").select("*").eq("user_id", user.id),
      supabase.from("users_financial_profile").select("*").eq("id", user.id).single(),
      supabase.from("budgets").select("*").eq("user_id", user.id),
    ]);

    const txs = txRes.data || [];
    const goals = goalsRes.data || [];
    const fp = fpRes.data;
    const budgets = budgetRes.data || [];

    // Calculate daily streak
    let dailyStreak = 0;
    let maxStreak = 0;
    let currentStreak = 0;
    const today = new Date().toISOString().split("T")[0];
    const txDates = [...new Set(txs.map(t => t.date))].sort().reverse();

    let checkDate = new Date();
    while (currentStreak < 365) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (txDates.includes(dateStr)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (dateStr !== today) {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    dailyStreak = currentStreak;

    // Calculate points from various activities
    let totalPoints = 0;
    totalPoints += txs.length * 5; // 5 points per transaction
    totalPoints += dailyStreak * 10; // 10 points per day in streak
    totalPoints += goals.filter(g => g.status === "completed").length * 100; // 100 points per goal
    const completedBudgets = budgets.filter(b => {
      const spent = txs
        .filter(t => t.type === "expense" && t.date.startsWith(b.month))
        .reduce((s, t) => s + Number(t.amount), 0);
      return spent <= Number(b.allocated_amount);
    }).length;
    totalPoints += completedBudgets * 50; // 50 points per month under budget

    // Unlock achievements
    const unlockedAchievements: Achievement[] = ACHIEVEMENTS.map(ach => {
      let progress = 0;
      let unlocked = false;

      if (ach.category === "transaction") {
        progress = txs.length;
        unlocked = progress >= ach.requirement;
      } else if (ach.category === "streak") {
        progress = dailyStreak;
        unlocked = progress >= ach.requirement;
      } else if (ach.category === "goals") {
        progress = goals.filter(g => g.status === "completed").length;
        unlocked = progress >= ach.requirement;
      } else if (ach.category === "budget") {
        progress = completedBudgets;
        unlocked = progress >= ach.requirement;
      } else if (ach.category === "credit") {
        const startCredit = 650; // Assume started at 650
        progress = (fp?.credit_score || 650) - startCredit;
        unlocked = progress >= ach.requirement;
      }

      return { ...ach, progress: Math.min(progress, ach.requirement), unlocked } as Achievement;
    });

    setAchievements(unlockedAchievements);
    setStats({
      dailyStreak,
      maxStreak,
      totalPoints,
      badges: unlockedAchievements.filter(a => a.unlocked).map(a => a.id),
      lastActivityDate: txs[0]?.date || ""
    });

    // Calculate compound interest projections (loss aversion motivation)
    const monthlySalary = Number(fp?.monthly_salary) || 0;
    const currentSavings = fp?.total_savings || 0;
    const savingsRate = monthlySalary * 0.2; // Assume 20% savings
    const monthlyRate = 0.07 / 12; // 7% annual interest

    const projectionData = Array.from({ length: 12 }, (_, month) => {
      const futureValue = (currentSavings + savingsRate * (month + 1)) * Math.pow(1 + monthlyRate, month + 1);
      return {
        month: month + 1,
        conservative: Math.round(currentSavings + savingsRate * (month + 1)),
        withCompound: Math.round(futureValue),
        missed: Math.round((futureValue - (currentSavings + savingsRate * (month + 1))) * 1000) / 1000
      };
    });

    setProjections(projectionData);

    // Generate behavioral alerts (loss aversion nudges)
    const alerts = [];

    // Missing streak alert
    if (dailyStreak > 5 && dailyStreak < 30) {
      alerts.push({
        type: "streak",
        severity: "medium",
        title: "Maintain Your Streak",
        message: `You're ${30 - dailyStreak} days away from the "Unstoppable" badge! Don't break the chain.`,
        icon: "🔥"
      });
    }

    // Compound interest alert
    if (projectionData.length > 0) {
      const gain = projectionData[11].missed;
      alerts.push({
        type: "compound",
        severity: "info",
        title: "Compound Growth Opportunity",
        message: `Consistent savings for 1 year could earn you ₹${Math.round(gain).toLocaleString()} in compound interest alone!`,
        icon: "📈"
      });
    }

    // Goal progress alert
    const activeGoals = goals.filter(g => g.status === "active");
    if (activeGoals.length > 0) {
      const closestGoal = activeGoals[0];
      const progress = Number(closestGoal.current_amount) / Number(closestGoal.target_amount);
      if (progress > 0.7) {
        alerts.push({
          type: "goal",
          severity: "success",
          title: "Goal Almost Complete!",
          message: `${closestGoal.name} is ${Math.round(progress * 100)}% complete. Push for the finish line!`,
          icon: "🎯"
        });
      }
    }

    // Loss aversion: show what you'd miss
    if (txs.length > 0) {
      const avgMonthlyExpense = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0) / Math.max(1, new Set(txs.map(t => t.date.substring(0, 7))).size);
      alerts.push({
        type: "lossaversion",
        severity: "warning",
        title: "One Month Without Progress",
        message: `If you stop tracking, you'd spend an estimated ₹${Math.round(avgMonthlyExpense)} without understanding where it goes.`,
        icon: "⚠️"
      });
    }

    setBehavioralAlerts(alerts);
  };

  return (
    <DashboardLayout>
      <div className="animate-fadeUp space-y-5">
        <div>
          <h2 className="font-heading text-xl font-extrabold mb-1">Gamification & Progress</h2>
          <p className="text-[13px] text-muted-foreground">Streaks, badges, achievements & behavioral nudges</p>
        </div>

        {/* Streak & Points Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Streak */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-0.5 hover:shadow-elevated transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[44px] h-[44px] rounded-xl bg-[hsl(var(--warning))]/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase">Daily Streak</div>
                <div className="font-mono text-2xl font-bold">{stats.dailyStreak}</div>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">Best: {stats.maxStreak} days</div>
          </div>

          {/* Total Points */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-0.5 hover:shadow-elevated transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[44px] h-[44px] rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase">Total Points</div>
                <div className="font-mono text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">Keep it up! 🚀</div>
          </div>

          {/* Badges Unlocked */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-0.5 hover:shadow-elevated transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[44px] h-[44px] rounded-xl bg-accent/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase">Badges</div>
                <div className="font-mono text-2xl font-bold">{stats.badges.length}/{ACHIEVEMENTS.length}</div>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">{8 - stats.badges.length} to unlock</div>
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-heading text-sm font-bold mb-4">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  ach.unlocked
                    ? "bg-primary/5 border-primary/30"
                    : "bg-muted/30 border-border opacity-50"
                }`}
              >
                <div className="text-3xl mb-2">{ach.icon}</div>
                <div className="font-semibold text-xs mb-1">{ach.name}</div>
                <div className="text-[11px] text-muted-foreground mb-2">{ach.description}</div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      ach.unlocked ? "bg-primary" : "bg-[hsl(var(--warning))]"
                    }`}
                    style={{ width: `${(ach.progress / ach.requirement) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {ach.progress}/{ach.requirement}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compound Interest Projection */}
        {projections && (
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-heading text-sm font-bold">12-Month Compound Projection</h3>
            </div>
            <div className="text-[13px] text-muted-foreground mb-4">
              If you maintain consistent savings and earn 7% annual interest:
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-background/50 rounded-xl p-3">
                <div className="text-[11px] font-semibold text-muted-foreground mb-1">Current</div>
                <div className="font-mono font-bold">{fmtK(projections[0]?.conservative || 0)}</div>
              </div>
              <div className="bg-background/50 rounded-xl p-3">
                <div className="text-[11px] font-semibold text-muted-foreground mb-1">After 12 Months</div>
                <div className="font-mono font-bold text-primary">{fmtK(projections[11]?.withCompound || 0)}</div>
              </div>
              <div className="bg-background/50 rounded-xl p-3">
                <div className="text-[11px] font-semibold text-muted-foreground mb-1">Interest Earned</div>
                <div className="font-mono font-bold text-accent">{fmtK(projections[11]?.missed || 0)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Behavioral Nudges & Loss Aversion Alerts */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-sm font-bold">Behavioral Nudges</h3>
          </div>
          {behavioralAlerts.length > 0 ? (
            <div className="space-y-3">
              {behavioralAlerts.map((alert, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border-l-4 flex gap-3 ${
                    alert.severity === "success"
                      ? "bg-primary/5 border-primary text-primary"
                      : alert.severity === "warning"
                      ? "bg-[hsl(var(--warning))]/5 border-[hsl(var(--warning))] text-[hsl(var(--warning))]"
                      : alert.severity === "medium"
                      ? "bg-accent/5 border-accent text-accent"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  <div className="text-lg flex-shrink-0">{alert.icon}</div>
                  <div>
                    <div className="font-semibold text-sm">{alert.title}</div>
                    <div className="text-[12px] mt-1 opacity-90">{alert.message}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add transactions to see personalized insights.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
