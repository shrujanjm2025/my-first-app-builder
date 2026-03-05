import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, TrendingUp, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";

export default function CreditScore() {
  const { user } = useAuth();
  const [score, setScore] = useState([650]);
  const [creditLimit, setCreditLimit] = useState("100000");
  const [creditUsed, setCreditUsed] = useState("25000");
  const [onTimePayments, setOnTimePayments] = useState(true);
  const [oldestAccount, setOldestAccount] = useState("3");
  const [recentInquiries, setRecentInquiries] = useState("1");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("credit_score").eq("id", user.id).single().then(({ data }) => {
      if (data?.credit_score) setScore([data.credit_score]);
    });
  }, [user]);

  const utilization = parseFloat(creditUsed) / Math.max(parseFloat(creditLimit) || 1, 1) * 100;
  const utilizationOk = utilization <= 30;

  // Simulate score impact
  const simulateScore = () => {
    let simulated = score[0];
    if (utilizationOk) simulated += 20;
    else if (utilization > 50) simulated -= 30;
    else simulated -= 10;
    if (onTimePayments) simulated += 15;
    else simulated -= 50;
    if (parseInt(oldestAccount) >= 5) simulated += 10;
    if (parseInt(recentInquiries) > 3) simulated -= 15;
    return Math.min(900, Math.max(300, simulated));
  };

  const simulated = simulateScore();
  const diff = simulated - score[0];

  const getScoreColor = (s: number) => {
    if (s >= 750) return "text-[hsl(var(--success))]";
    if (s >= 650) return "text-primary";
    if (s >= 500) return "text-[hsl(var(--warning))]";
    return "text-destructive";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 750) return "Excellent";
    if (s >= 650) return "Good";
    if (s >= 500) return "Fair";
    return "Poor";
  };

  const suggestions = [
    { check: utilizationOk, text: "Keep credit utilization below 30%", impact: "High" },
    { check: onTimePayments, text: "Always pay bills on time", impact: "Very High" },
    { check: parseInt(oldestAccount) >= 5, text: "Maintain older credit accounts (5+ years)", impact: "Medium" },
    { check: parseInt(recentInquiries) <= 2, text: "Limit hard inquiries (max 2/year)", impact: "Low" },
    { check: utilization > 0, text: "Use credit cards regularly but responsibly", impact: "Medium" },
  ];

  const handleSaveScore = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ credit_score: score[0] }).eq("id", user.id);
    toast.success("Credit score saved");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Credit Score Simulator</h1>
          <p className="text-muted-foreground">Track and improve your credit health</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Score */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />Your Credit Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className={`text-6xl font-bold font-heading ${getScoreColor(score[0])}`}>{score[0]}</p>
                <Badge className="mt-2" variant="outline">{getScoreLabel(score[0])}</Badge>
              </div>
              <Slider value={score} onValueChange={setScore} min={300} max={900} step={10} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>300 (Poor)</span><span>900 (Excellent)</span>
              </div>
              <Button onClick={handleSaveScore} className="w-full gradient-primary text-primary-foreground">Save Score</Button>
            </CardContent>
          </Card>

          {/* Simulated Score */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />Simulated Score
              </CardTitle>
              <CardDescription>Based on your inputs below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className={`text-6xl font-bold font-heading ${getScoreColor(simulated)}`}>{simulated}</p>
                <p className={`text-sm font-medium mt-1 ${diff > 0 ? 'text-[hsl(var(--success))]' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {diff > 0 ? `+${diff} improvement` : diff < 0 ? `${diff} drop` : "No change"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credit Card Management */}
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle>Credit Card Utilization</CardTitle>
            <CardDescription>Keep below 30% for optimal credit health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Credit Limit</Label>
                <Input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Total Credit Used</Label>
                <Input type="number" value={creditUsed} onChange={e => setCreditUsed(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Utilization: {utilization.toFixed(1)}%</span>
                <span className={utilizationOk ? "text-[hsl(var(--success))]" : "text-destructive"}>
                  {utilizationOk ? "✅ Good" : "⚠️ Too High"}
                </span>
              </div>
              <Progress value={Math.min(utilization, 100)} className={utilizationOk ? "[&>div]:bg-[hsl(var(--success))]" : "[&>div]:bg-destructive"} />
            </div>
          </CardContent>
        </Card>

        {/* Factors */}
        <Card className="shadow-soft border-0">
          <CardHeader><CardTitle>Simulation Factors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox checked={onTimePayments} onCheckedChange={c => setOnTimePayments(!!c)} />
              <Label className="font-normal">I always pay bills on time</Label>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Oldest Account Age (years)</Label>
                <Input type="number" value={oldestAccount} onChange={e => setOldestAccount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Recent Hard Inquiries</Label>
                <Input type="number" value={recentInquiries} onChange={e => setRecentInquiries(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card className="shadow-soft border-0">
          <CardHeader><CardTitle>Improvement Suggestions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  {s.check ? <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] mt-0.5" /> : <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))] mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.text}</p>
                    <p className="text-xs text-muted-foreground">Impact: {s.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Offset Account Info */}
        <Card className="shadow-soft border-0 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Offset Account Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  An offset account is a savings account linked to your home loan. The balance in this account offsets the loan principal, reducing interest charges. 
                  For example, with a ₹50,00,000 loan and ₹5,00,000 in your offset account, you only pay interest on ₹45,00,000. 
                  Combined with paying 1 extra EMI per year, you can save years off your loan tenure.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
