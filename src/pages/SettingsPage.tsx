import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [dependents, setDependents] = useState("0");
  const [creditScore, setCreditScore] = useState(650);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, currency, monthly_salary, dependents, credit_score").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || "");
        setCurrency(data.currency || "INR");
        setMonthlySalary(String(data.monthly_salary || ""));
        setDependents(String(data.dependents || 0));
        setCreditScore(data.credit_score || 650);
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      currency,
      monthly_salary: parseFloat(monthlySalary) || 0,
      dependents: parseInt(dependents) || 0,
      credit_score: creditScore,
    }).eq("id", user.id);
    setLoading(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  const getScoreColor = (s: number) => s >= 750 ? "text-primary" : s >= 650 ? "text-[hsl(var(--warning))]" : "text-destructive";
  const getScoreLabel = (s: number) => s >= 750 ? "Excellent" : s >= 650 ? "Good" : "Fair";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-lg">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and onboarding answers</p>
        </div>
        <Card className="shadow-soft border-0">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
            <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monthly Salary (After Tax)</Label>
              <Input type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} placeholder="e.g. 50000" />
              <p className="text-xs text-muted-foreground">Used for 50/30/20 budgeting and emergency fund calculation</p>
            </div>
            <div className="space-y-2">
              <Label>Number of Dependents</Label>
              <Input type="number" value={dependents} onChange={(e) => setDependents(e.target.value)} min="0" />
            </div>
            <div className="space-y-2">
              <Label>Credit Score ({creditScore})</Label>
              <div className="flex items-center gap-3">
                <input type="range" min={300} max={900} step={10} value={creditScore} onChange={e => setCreditScore(+e.target.value)} className="flex-1 accent-primary" />
                <span className={`font-mono font-bold ${getScoreColor(creditScore)}`}>{creditScore}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  creditScore >= 750 ? "bg-primary/10 text-primary" : creditScore >= 650 ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" : "bg-destructive/10 text-destructive"
                }`}>{getScoreLabel(creditScore)}</span>
              </div>
            </div>
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
