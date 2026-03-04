import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Loan { id: string; name: string; type: string; principal: number; interest_rate: number; tenure_months: number; emi: number; outstanding_balance: number; start_date: string; }

const LOAN_TYPES = ["home", "personal", "car", "education", "other"];

export default function Loans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "personal", principal: "", interest_rate: "", tenure_months: "", start_date: new Date().toISOString().split("T")[0] });

  const fetchLoans = async () => {
    if (!user) return;
    const { data } = await supabase.from("loans").select("*").eq("user_id", user.id).order("start_date", { ascending: false });
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
              <Button className="gradient-primary text-white"><Plus className="h-4 w-4 mr-2" />Add Loan</Button>
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
                      <SelectContent>{LOAN_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
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
                <Button type="submit" className="w-full gradient-primary text-white">Add Loan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Total Outstanding</p>
              <p className="text-2xl font-bold text-destructive" style={{ fontFamily: 'Space Grotesk' }}>${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Monthly EMI Total</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>${totalEMI.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loans.map(l => {
            const paidPct = Math.max(0, ((Number(l.principal) - Number(l.outstanding_balance)) / Number(l.principal)) * 100);
            return (
              <Card key={l.id} className="shadow-soft border-0">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{l.name}</p>
                      <Badge variant="outline" className="capitalize mt-1">{l.type}</Badge>
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
            );
          })}
          {loans.length === 0 && (
            <Card className="shadow-soft border-0 col-span-full"><CardContent className="p-8 text-center text-muted-foreground">No loans tracked yet.</CardContent></Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
