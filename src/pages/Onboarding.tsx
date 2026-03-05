import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Wallet, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { title: "Basic Info", desc: "Let's personalize your experience" },
  { title: "Income & Assets", desc: "Your financial starting point" },
  { title: "Loans & Debt", desc: "What you owe" },
  { title: "Insurance", desc: "Your safety net" },
  { title: "Credit & Savings", desc: "Credit health and savings" },
  { title: "Goals", desc: "What you want to achieve" },
];

const LOAN_TYPES = ["Home Loan", "Personal Loan", "Car Loan", "Credit Card Debt", "Education Loan", "Other"];
const INSURANCE_TYPES = ["Health", "Life", "Home", "Car", "Other"];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [otherIncome, setOtherIncome] = useState("");
  const [dependents, setDependents] = useState("0");
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [selectedInsurance, setSelectedInsurance] = useState<string[]>([]);
  const [creditScore, setCreditScore] = useState([650]);
  const [hasFD, setHasFD] = useState(false);
  const [hasRD, setHasRD] = useState(false);
  const [goals, setGoals] = useState("");
  const [currency, setCurrency] = useState("INR");

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      monthly_salary: parseFloat(monthlySalary) || 0,
      dependents: parseInt(dependents) || 0,
      credit_score: creditScore[0],
      currency,
      onboarding_completed: true,
    }).eq("id", user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome to FinanceFlow! 🎉");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const canNext = () => {
    if (step === 0) return fullName.trim().length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="p-2 rounded-xl gradient-primary">
            <Wallet className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold font-heading">FinanceFlow</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'gradient-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <Card className="shadow-elevated border-0">
          <CardHeader>
            <CardTitle>{STEPS[step].title}</CardTitle>
            <CardDescription>{STEPS[step].desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Currency</Label>
                  <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="INR" />
                </div>
                <div className="space-y-2">
                  <Label>Number of Dependents</Label>
                  <Input type="number" value={dependents} onChange={e => setDependents(e.target.value)} min="0" />
                  <p className="text-xs text-muted-foreground">Helps adjust budgeting for family expenses</p>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Monthly Salary After Taxes ({currency})</Label>
                  <Input type="number" value={monthlySalary} onChange={e => setMonthlySalary(e.target.value)} placeholder="e.g. 50000" />
                  <p className="text-xs text-muted-foreground">Used for 50/30/20 budgeting and emergency fund calculation</p>
                </div>
                <div className="space-y-2">
                  <Label>Other Income Sources ({currency}/month)</Label>
                  <Input type="number" value={otherIncome} onChange={e => setOtherIncome(e.target.value)} placeholder="Freelance, rental, etc." />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-muted-foreground">Select any loans you currently have:</p>
                <div className="space-y-3">
                  {LOAN_TYPES.map(loan => (
                    <div key={loan} className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedLoans.includes(loan)}
                        onCheckedChange={c => setSelectedLoans(c ? [...selectedLoans, loan] : selectedLoans.filter(l => l !== loan))}
                      />
                      <Label className="font-normal">{loan}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">You can add details later in the Loans section</p>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-sm text-muted-foreground">Select insurance policies you have:</p>
                <div className="space-y-3">
                  {INSURANCE_TYPES.map(ins => (
                    <div key={ins} className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedInsurance.includes(ins)}
                        onCheckedChange={c => setSelectedInsurance(c ? [...selectedInsurance, ins] : selectedInsurance.filter(i => i !== ins))}
                      />
                      <Label className="font-normal">{ins}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Add premiums and renewal dates in the Insurance section</p>
              </>
            )}

            {step === 4 && (
              <>
                <div className="space-y-3">
                  <Label>Approximate Credit Score (300-900)</Label>
                  <Slider value={creditScore} onValueChange={setCreditScore} min={300} max={900} step={10} />
                  <p className="text-center text-2xl font-bold font-heading text-primary">{creditScore[0]}</p>
                  <p className="text-xs text-muted-foreground text-center">
                    {creditScore[0] >= 750 ? "✅ Excellent" : creditScore[0] >= 650 ? "👍 Good" : creditScore[0] >= 500 ? "⚠️ Fair" : "🚨 Poor"}
                  </p>
                </div>
                <div className="flex items-center space-x-3 pt-2">
                  <Checkbox checked={hasFD} onCheckedChange={c => setHasFD(!!c)} />
                  <Label className="font-normal">I have Fixed Deposits (FDs)</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox checked={hasRD} onCheckedChange={c => setHasRD(!!c)} />
                  <Label className="font-normal">I have Recurring Deposits (RDs)</Label>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <div className="space-y-2">
                  <Label>Your SMART Financial Goals</Label>
                  <Textarea
                    value={goals}
                    onChange={e => setGoals(e.target.value)}
                    placeholder={"e.g.\n• Save ₹5,000/mo for emergency fund\n• Pay off ₹2,000 credit card debt\n• Build RD for home down payment\n• Invest ₹3,000/mo in mutual funds"}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">Make them Specific, Measurable, Achievable, Relevant, Time-bound</p>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                <ArrowLeft className="h-4 w-4 mr-2" />Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button className="gradient-primary text-primary-foreground" onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                  Next<ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button className="gradient-primary text-primary-foreground" onClick={handleFinish} disabled={loading}>
                  {loading ? "Finishing..." : "Get Started 🚀"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <button onClick={() => { handleFinish(); }} className="text-sm text-muted-foreground hover:text-foreground mt-4 block text-center w-full">
          Skip for now
        </button>
      </div>
    </div>
  );
}
