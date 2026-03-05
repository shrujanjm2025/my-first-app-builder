import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CreditCard, Trash2, Info, TrendingDown, Zap } from "lucide-react";
import { toast } from "sonner";

interface Loan { id: string; name: string; type: string; principal: number; interest_rate: number; tenure_months: number; emi: number; outstanding_balance: number; start_date: string; }

const LOAN_TYPES = ["home", "personal", "car", "education", "credit_card", "other"];

export default function Loans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "personal", principal: "", interest_rate: "", tenure_months: "", start_date: new Date().toISOString().split("T")[0] });

  const fetchLoans = async () => {
    if (!user) return;
    const { data } = await supabase.from("loans").select("*").eq("user_id", user.id).order("interest_rate", { ascending: false });
    setLoans((data as Loan[]) || []);
  };

  useEffect(() => { fetchLoans(); }, [user]);

  const calcEMI = (p: number, annualRate: number, months: number) => {
    const r = annualRate / 100 / 12;
    if (r === 0) return p / months;
    return (p * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const p = parseFloat(form.principal);
    const r = parseFloat(form.interest_rate);
    const m = parseInt(form.tenure_months);
    const emi = calcEMI(p, r, m);
    const { error } = await supabase.from("loans").insert({
      user_id: user.id, name: form.name, type: form.type,
      principal: p, interest_rate: r, tenure_months: m,
      emi: Math.round(emi * 100) / 100, outstanding_balance: p, start_date: form.start_date,
    });
    if (error) toast.error(error.message); else { toast.success("Loan added"); setOpen(false); fetchLoans(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("loans").delete().eq("id", id);
    fetchLoans();
  };

  const totalOutstanding = loans.reduce((s, l) => s + Number(l.outstanding_balance), 0);
  const totalEMI = loans.reduce((s, l) => s + Number(l.emi), 0);

  // Debt Avalanche: highest interest first
  const avalancheOrder = [...loans].sort((a, b) => Number(b.interest_rate) - Number(a.interest_rate));
  // Debt Snowball: lowest balance first
  const snowballOrder = [...loans].sort((a, b) => Number(a.outstanding_balance) - Number(b.outstanding_balance));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Loans</h1>
            <p className="text-muted-foreground">Manage and optimize your debt</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Add Loan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Loan</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Loan Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LOAN_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Principal ($)</Label><Input type="number" step="0.01" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Interest Rate (%)</Label><Input type="number" step="0.01" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Tenure (months)</Label><Input type="number" value={form.tenure_months} onChange={(e) => setForm({ ...form, tenure_months: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></div>
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Add Loan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Total Outstanding</p>
              <p className="text-2xl font-bold text-destructive font-heading">${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Monthly EMI Total</p>
              <p className="text-2xl font-bold font-heading">${totalEMI.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </div>

        {/* Loan Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loans.map(l => (
            <Card key={l.id} className="shadow-soft border-0">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{l.name}</p>
                    <Badge variant="outline" className="capitalize mt-1">{l.type.replace("_", " ")}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">EMI</span><p className="font-semibold">${Number(l.emi).toFixed(2)}/mo</p></div>
                  <div><span className="text-muted-foreground">Rate</span><p className="font-semibold">{Number(l.interest_rate)}%</p></div>
                  <div><span className="text-muted-foreground">Outstanding</span><p className="font-semibold text-destructive">${Number(l.outstanding_balance).toFixed(0)}</p></div>
                  <div><span className="text-muted-foreground">Tenure</span><p className="font-semibold">{l.tenure_months} months</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
          {loans.length === 0 && (
            <Card className="shadow-soft border-0 col-span-full"><CardContent className="p-8 text-center text-muted-foreground">No loans tracked yet.</CardContent></Card>
          )}
        </div>

        {/* Debt Repayment Strategies */}
        {loans.length > 1 && (
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle>Debt Repayment Strategies</CardTitle>
              <CardDescription>Choose a method to pay off debt faster</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="avalanche">
                <TabsList>
                  <TabsTrigger value="avalanche" className="gap-1"><Zap className="h-3.5 w-3.5" />Avalanche</TabsTrigger>
                  <TabsTrigger value="snowball" className="gap-1"><TrendingDown className="h-3.5 w-3.5" />Snowball</TabsTrigger>
                </TabsList>
                <TabsContent value="avalanche" className="mt-4">
                  <p className="text-sm text-muted-foreground mb-3">Pay minimums on all debts, then put extra money toward the <strong>highest interest rate</strong> first. Saves the most money overall.</p>
                  <div className="space-y-2">
                    {avalancheOrder.map((l, i) => (
                      <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <span className="text-sm font-bold text-primary w-6">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{l.name}</p>
                          <p className="text-xs text-muted-foreground">{Number(l.interest_rate)}% rate • ${Number(l.outstanding_balance).toLocaleString()} balance</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="snowball" className="mt-4">
                  <p className="text-sm text-muted-foreground mb-3">Pay minimums on all debts, then put extra money toward the <strong>smallest balance</strong> first. Builds momentum with quick wins.</p>
                  <div className="space-y-2">
                    {snowballOrder.map((l, i) => (
                      <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <span className="text-sm font-bold text-primary w-6">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{l.name}</p>
                          <p className="text-xs text-muted-foreground">${Number(l.outstanding_balance).toLocaleString()} balance • {Number(l.interest_rate)}% rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Suggestions */}
        <Card className="shadow-soft border-0 bg-primary/5">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Tips to Pay Off Loans Faster</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc pl-4">
                  <li><strong>Offset Account:</strong> Link a savings account to your home loan — the balance offsets principal, reducing interest paid.</li>
                  <li><strong>1 Extra EMI/Year:</strong> Making just one extra EMI payment per year can shave years off your loan tenure.</li>
                  <li><strong>Round Up EMIs:</strong> Round your EMI up to the nearest hundred to pay off faster without noticing.</li>
                  <li><strong>Refinance:</strong> If rates drop, refinancing to a lower rate can save thousands.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
