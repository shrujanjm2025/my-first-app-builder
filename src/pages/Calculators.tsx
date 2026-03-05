import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingUp, Percent, DollarSign, Clock } from "lucide-react";

export default function Calculators() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Financial Calculators</h1>
          <p className="text-muted-foreground">Tools for better financial decisions</p>
        </div>

        <Tabs defaultValue="compound" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="compound">Compound Interest</TabsTrigger>
            <TabsTrigger value="emi">EMI Calculator</TabsTrigger>
            <TabsTrigger value="cur">Credit Utilization</TabsTrigger>
            <TabsTrigger value="dti">Debt-to-Income</TabsTrigger>
            <TabsTrigger value="networth">Net Worth</TabsTrigger>
            <TabsTrigger value="retirement">Retirement</TabsTrigger>
          </TabsList>

          <TabsContent value="compound"><CompoundInterestCalc /></TabsContent>
          <TabsContent value="emi"><EMICalc /></TabsContent>
          <TabsContent value="cur"><CURCalc /></TabsContent>
          <TabsContent value="dti"><DTICalc /></TabsContent>
          <TabsContent value="networth"><NetWorthCalc /></TabsContent>
          <TabsContent value="retirement"><RetirementCalc /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function CompoundInterestCalc() {
  const [p, setP] = useState("10000");
  const [r, setR] = useState("8");
  const [t, setT] = useState("10");
  const [n, setN] = useState("12");

  const principal = parseFloat(p) || 0;
  const rate = parseFloat(r) || 0;
  const time = parseFloat(t) || 0;
  const freq = parseInt(n) || 12;
  const amount = principal * Math.pow(1 + rate / 100 / freq, freq * time);
  const interest = amount - principal;

  return (
    <Card className="shadow-soft border-0">
      <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Compound Interest</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Principal ($)</Label><Input type="number" value={p} onChange={(e) => setP(e.target.value)} /></div>
          <div className="space-y-2"><Label>Annual Rate (%)</Label><Input type="number" step="0.1" value={r} onChange={(e) => setR(e.target.value)} /></div>
          <div className="space-y-2"><Label>Time (years)</Label><Input type="number" value={t} onChange={(e) => setT(e.target.value)} /></div>
          <div className="space-y-2"><Label>Compounding (per year)</Label><Input type="number" value={n} onChange={(e) => setN(e.target.value)} /></div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t">
          <div><p className="text-sm text-muted-foreground">Future Value</p><p className="text-xl font-bold text-primary font-heading">${amount.toFixed(2)}</p></div>
          <div><p className="text-sm text-muted-foreground">Interest Earned</p><p className="text-xl font-bold text-[hsl(var(--success))] font-heading">${interest.toFixed(2)}</p></div>
          <div><p className="text-sm text-muted-foreground">Total Growth</p><p className="text-xl font-bold font-heading">{principal > 0 ? ((amount / principal - 1) * 100).toFixed(1) : 0}%</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

function EMICalc() {
  const [p, setP] = useState("300000");
  const [r, setR] = useState("7");
  const [m, setM] = useState("240");

  const principal = parseFloat(p) || 0;
  const monthlyRate = (parseFloat(r) || 0) / 100 / 12;
  const months = parseInt(m) || 1;
  const emi = monthlyRate === 0 ? principal / months : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;

  return (
    <Card className="shadow-soft border-0">
      <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" />EMI Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Loan Amount ($)</Label><Input type="number" value={p} onChange={(e) => setP(e.target.value)} /></div>
          <div className="space-y-2"><Label>Interest Rate (%)</Label><Input type="number" step="0.1" value={r} onChange={(e) => setR(e.target.value)} /></div>
          <div className="space-y-2"><Label>Tenure (months)</Label><Input type="number" value={m} onChange={(e) => setM(e.target.value)} /></div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t">
          <div><p className="text-sm text-muted-foreground">Monthly EMI</p><p className="text-xl font-bold text-primary font-heading">${emi.toFixed(2)}</p></div>
          <div><p className="text-sm text-muted-foreground">Total Interest</p><p className="text-xl font-bold text-destructive font-heading">${totalInterest.toFixed(2)}</p></div>
          <div><p className="text-sm text-muted-foreground">Total Payment</p><p className="text-xl font-bold font-heading">${totalPayment.toFixed(2)}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

function CURCalc() {
  const [balances, setBalances] = useState("2500");
  const [limits, setLimits] = useState("10000");

  const b = parseFloat(balances) || 0;
  const l = parseFloat(limits) || 1;
  const cur = (b / l) * 100;

  return (
    <Card className="shadow-soft border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5 text-primary" />Credit Utilization Ratio</CardTitle>
        <CardDescription>Keep below 30% for optimal credit health</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Total Credit Card Balances ($)</Label><Input type="number" value={balances} onChange={(e) => setBalances(e.target.value)} /></div>
          <div className="space-y-2"><Label>Total Credit Limits ($)</Label><Input type="number" value={limits} onChange={(e) => setLimits(e.target.value)} /></div>
        </div>
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">Your CUR</p>
          <p className={`text-3xl font-bold font-heading ${cur <= 30 ? "text-[hsl(var(--success))]" : cur <= 50 ? "text-[hsl(var(--warning))]" : "text-destructive"}`}>
            {cur.toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">{cur <= 30 ? "✅ Great! Keep it up." : cur <= 50 ? "⚠️ Consider paying down some balances." : "🚨 High utilization — this may hurt your credit score."}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DTICalc() {
  const [debt, setDebt] = useState("1500");
  const [income, setIncome] = useState("5000");

  const d = parseFloat(debt) || 0;
  const i = parseFloat(income) || 1;
  const dti = (d / i) * 100;

  return (
    <Card className="shadow-soft border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Debt-to-Income Ratio</CardTitle>
        <CardDescription>Target below 36% for good borrowing capacity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Monthly Debt Payments ($)</Label><Input type="number" value={debt} onChange={(e) => setDebt(e.target.value)} /></div>
          <div className="space-y-2"><Label>Gross Monthly Income ($)</Label><Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} /></div>
        </div>
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">Your DTI</p>
          <p className={`text-3xl font-bold font-heading ${dti <= 36 ? "text-[hsl(var(--success))]" : dti <= 50 ? "text-[hsl(var(--warning))]" : "text-destructive"}`}>
            {dti.toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">{dti <= 36 ? "✅ Healthy ratio." : dti <= 50 ? "⚠️ Getting high. Reduce debt if possible." : "🚨 Very high — lenders may decline applications."}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function NetWorthCalc() {
  const [assets, setAssets] = useState("150000");
  const [liabilities, setLiabilities] = useState("80000");

  const a = parseFloat(assets) || 0;
  const l = parseFloat(liabilities) || 0;
  const nw = a - l;

  return (
    <Card className="shadow-soft border-0">
      <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Net Worth</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Total Assets ($)</Label><Input type="number" value={assets} onChange={(e) => setAssets(e.target.value)} /></div>
          <div className="space-y-2"><Label>Total Liabilities ($)</Label><Input type="number" value={liabilities} onChange={(e) => setLiabilities(e.target.value)} /></div>
        </div>
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">Net Worth</p>
          <p className={`text-3xl font-bold font-heading ${nw >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
            ${nw.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function RetirementCalc() {
  const [currentAge, setCurrentAge] = useState("30");
  const [retireAge, setRetireAge] = useState("60");
  const [monthlyExpense, setMonthlyExpense] = useState("30000");
  const [currentSavings, setCurrentSavings] = useState("500000");
  const [returnRate, setReturnRate] = useState("10");
  const [inflationRate, setInflationRate] = useState("6");

  const years = (parseInt(retireAge) || 60) - (parseInt(currentAge) || 30);
  const monthlyExp = parseFloat(monthlyExpense) || 0;
  const inflation = parseFloat(inflationRate) || 6;
  const returnR = parseFloat(returnRate) || 10;
  const savings = parseFloat(currentSavings) || 0;

  // Future monthly expense at retirement
  const futureMonthly = monthlyExp * Math.pow(1 + inflation / 100, years);
  // Corpus needed (25x annual expenses — 4% rule)
  const corpusNeeded = futureMonthly * 12 * 25;
  // Future value of current savings
  const futureSavings = savings * Math.pow(1 + returnR / 100, years);
  const gap = corpusNeeded - futureSavings;
  // Monthly SIP needed
  const r = returnR / 100 / 12;
  const months = years * 12;
  const monthlySIP = gap > 0 && r > 0 ? gap / ((Math.pow(1 + r, months) - 1) / r) : 0;

  return (
    <Card className="shadow-soft border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />Retirement Planning</CardTitle>
        <CardDescription>Plan your retirement corpus using the 4% rule</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Current Age</Label><Input type="number" value={currentAge} onChange={e => setCurrentAge(e.target.value)} /></div>
          <div className="space-y-2"><Label>Retirement Age</Label><Input type="number" value={retireAge} onChange={e => setRetireAge(e.target.value)} /></div>
          <div className="space-y-2"><Label>Monthly Expenses ($)</Label><Input type="number" value={monthlyExpense} onChange={e => setMonthlyExpense(e.target.value)} /></div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Current Savings ($)</Label><Input type="number" value={currentSavings} onChange={e => setCurrentSavings(e.target.value)} /></div>
          <div className="space-y-2"><Label>Expected Return (%)</Label><Input type="number" step="0.1" value={returnRate} onChange={e => setReturnRate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Inflation Rate (%)</Label><Input type="number" step="0.1" value={inflationRate} onChange={e => setInflationRate(e.target.value)} /></div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Future Monthly Expense</p>
            <p className="text-xl font-bold text-[hsl(var(--warning))] font-heading">${futureMonthly.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Corpus Needed</p>
            <p className="text-xl font-bold text-primary font-heading">${corpusNeeded.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gap</p>
            <p className={`text-xl font-bold font-heading ${gap > 0 ? "text-destructive" : "text-[hsl(var(--success))]"}`}>
              ${Math.abs(gap).toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Monthly SIP Needed</p>
            <p className="text-xl font-bold text-primary font-heading">${monthlySIP.toFixed(0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
