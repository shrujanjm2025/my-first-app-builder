import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Landmark, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FD { id: string; bank_name: string; amount: number; interest_rate: number; start_date: string; maturity_date: string; }
interface RD { id: string; bank_name: string; monthly_amount: number; interest_rate: number; start_date: string; maturity_date: string; total_deposited: number; }

export default function Deposits() {
  const { user } = useAuth();
  const [fds, setFds] = useState<FD[]>([]);
  const [rds, setRds] = useState<RD[]>([]);
  const [fdOpen, setFdOpen] = useState(false);
  const [rdOpen, setRdOpen] = useState(false);
  const [fdForm, setFdForm] = useState({ bank_name: "", amount: "", interest_rate: "", start_date: "", maturity_date: "" });
  const [rdForm, setRdForm] = useState({ bank_name: "", monthly_amount: "", interest_rate: "", start_date: "", maturity_date: "" });

  const fetchAll = async () => {
    if (!user) return;
    const [fdRes, rdRes] = await Promise.all([
      supabase.from("fixed_deposits").select("*").eq("user_id", user.id).order("maturity_date"),
      supabase.from("recurring_deposits").select("*").eq("user_id", user.id).order("maturity_date"),
    ]);
    setFds((fdRes.data as FD[]) || []);
    setRds((rdRes.data as RD[]) || []);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const handleAddFD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("fixed_deposits").insert({
      user_id: user.id, bank_name: fdForm.bank_name, amount: parseFloat(fdForm.amount),
      interest_rate: parseFloat(fdForm.interest_rate), start_date: fdForm.start_date, maturity_date: fdForm.maturity_date,
    });
    if (error) toast.error(error.message);
    else { toast.success("FD added"); setFdOpen(false); setFdForm({ bank_name: "", amount: "", interest_rate: "", start_date: "", maturity_date: "" }); fetchAll(); }
  };

  const handleAddRD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const months = Math.ceil((new Date(rdForm.maturity_date).getTime() - new Date(rdForm.start_date).getTime()) / (30 * 24 * 3600 * 1000));
    const { error } = await supabase.from("recurring_deposits").insert({
      user_id: user.id, bank_name: rdForm.bank_name, monthly_amount: parseFloat(rdForm.monthly_amount),
      interest_rate: parseFloat(rdForm.interest_rate), start_date: rdForm.start_date,
      maturity_date: rdForm.maturity_date, total_deposited: parseFloat(rdForm.monthly_amount) * Math.max(months, 1),
    });
    if (error) toast.error(error.message);
    else { toast.success("RD added"); setRdOpen(false); setRdForm({ bank_name: "", monthly_amount: "", interest_rate: "", start_date: "", maturity_date: "" }); fetchAll(); }
  };

  const deleteFD = async (id: string) => { await supabase.from("fixed_deposits").delete().eq("id", id); fetchAll(); };
  const deleteRD = async (id: string) => { await supabase.from("recurring_deposits").delete().eq("id", id); fetchAll(); };

  const calcMaturityFD = (amount: number, rate: number, startDate: string, maturityDate: string) => {
    const years = (new Date(maturityDate).getTime() - new Date(startDate).getTime()) / (365.25 * 24 * 3600 * 1000);
    return amount * Math.pow(1 + rate / 400, 4 * years); // quarterly compounding
  };

  const totalFD = fds.reduce((s, f) => s + Number(f.amount), 0);
  const totalRD = rds.reduce((s, r) => s + Number(r.total_deposited), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">FD & RD Management</h1>
          <p className="text-muted-foreground">Track your fixed and recurring deposits</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Total FD Investment</p>
              <p className="text-2xl font-bold font-heading text-primary">${totalFD.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-1">Total RD Deposited</p>
              <p className="text-2xl font-bold font-heading text-accent">${totalRD.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="fd">
          <TabsList>
            <TabsTrigger value="fd">Fixed Deposits</TabsTrigger>
            <TabsTrigger value="rd">Recurring Deposits</TabsTrigger>
          </TabsList>

          <TabsContent value="fd" className="space-y-4 mt-4">
            <Dialog open={fdOpen} onOpenChange={setFdOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Add FD</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Fixed Deposit</DialogTitle></DialogHeader>
                <form onSubmit={handleAddFD} className="space-y-4">
                  <div className="space-y-2"><Label>Bank Name</Label><Input value={fdForm.bank_name} onChange={e => setFdForm({ ...fdForm, bank_name: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Amount</Label><Input type="number" value={fdForm.amount} onChange={e => setFdForm({ ...fdForm, amount: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Interest Rate (%)</Label><Input type="number" step="0.01" value={fdForm.interest_rate} onChange={e => setFdForm({ ...fdForm, interest_rate: e.target.value })} required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={fdForm.start_date} onChange={e => setFdForm({ ...fdForm, start_date: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Maturity Date</Label><Input type="date" value={fdForm.maturity_date} onChange={e => setFdForm({ ...fdForm, maturity_date: e.target.value })} required /></div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground">Add FD</Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fds.map(f => {
                const maturityValue = calcMaturityFD(Number(f.amount), Number(f.interest_rate), f.start_date, f.maturity_date);
                return (
                  <Card key={f.id} className="shadow-soft border-0">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10"><Landmark className="h-4 w-4 text-primary" /></div>
                          <p className="font-semibold">{f.bank_name}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteFD(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Principal</span><p className="font-semibold">${Number(f.amount).toLocaleString()}</p></div>
                        <div><span className="text-muted-foreground">Rate</span><p className="font-semibold">{Number(f.interest_rate)}%</p></div>
                        <div><span className="text-muted-foreground">Maturity Value</span><p className="font-semibold text-[hsl(var(--success))]">${maturityValue.toFixed(0)}</p></div>
                        <div><span className="text-muted-foreground">Maturity</span><p className="font-semibold">{new Date(f.maturity_date).toLocaleDateString()}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {fds.length === 0 && <Card className="shadow-soft border-0 col-span-full"><CardContent className="p-8 text-center text-muted-foreground">No fixed deposits yet.</CardContent></Card>}
            </div>
          </TabsContent>

          <TabsContent value="rd" className="space-y-4 mt-4">
            <Dialog open={rdOpen} onOpenChange={setRdOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Add RD</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Recurring Deposit</DialogTitle></DialogHeader>
                <form onSubmit={handleAddRD} className="space-y-4">
                  <div className="space-y-2"><Label>Bank Name</Label><Input value={rdForm.bank_name} onChange={e => setRdForm({ ...rdForm, bank_name: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Monthly Amount</Label><Input type="number" value={rdForm.monthly_amount} onChange={e => setRdForm({ ...rdForm, monthly_amount: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Interest Rate (%)</Label><Input type="number" step="0.01" value={rdForm.interest_rate} onChange={e => setRdForm({ ...rdForm, interest_rate: e.target.value })} required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={rdForm.start_date} onChange={e => setRdForm({ ...rdForm, start_date: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Maturity Date</Label><Input type="date" value={rdForm.maturity_date} onChange={e => setRdForm({ ...rdForm, maturity_date: e.target.value })} required /></div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground">Add RD</Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rds.map(r => (
                <Card key={r.id} className="shadow-soft border-0">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-accent/10"><Landmark className="h-4 w-4 text-accent" /></div>
                        <p className="font-semibold">{r.bank_name}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteRD(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Monthly</span><p className="font-semibold">${Number(r.monthly_amount).toLocaleString()}</p></div>
                      <div><span className="text-muted-foreground">Rate</span><p className="font-semibold">{Number(r.interest_rate)}%</p></div>
                      <div><span className="text-muted-foreground">Total Deposited</span><p className="font-semibold">${Number(r.total_deposited).toLocaleString()}</p></div>
                      <div><span className="text-muted-foreground">Maturity</span><p className="font-semibold">{new Date(r.maturity_date).toLocaleDateString()}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {rds.length === 0 && <Card className="shadow-soft border-0 col-span-full"><CardContent className="p-8 text-center text-muted-foreground">No recurring deposits yet.</CardContent></Card>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
