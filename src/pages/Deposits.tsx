import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;

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

  const fdMaturity = (p: number, r: number, months: number) => p * Math.pow(1 + r / 400, months / 3);
  const rdMaturity = (p: number, r: number, months: number) => p * ((Math.pow(1 + r / 1200, months) - 1) / (r / 1200)) * (1 + r / 1200);

  return (
    <DashboardLayout>
      <div className="animate-fadeUp space-y-4">
        <div className="mb-5">
          <h2 className="font-heading text-xl font-extrabold mb-1">FD & RD Manager</h2>
          <p className="text-[13px] text-muted-foreground">Track deposits, maturity dates and compound interest growth</p>
        </div>

        {/* Fixed Deposits */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-heading text-[15px] font-bold">Fixed Deposits (FD)</h3>
            <Dialog open={fdOpen} onOpenChange={setFdOpen}>
              <DialogTrigger asChild>
                <button className="gradient-primary text-primary-foreground font-heading font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 transition-all">
                  <Plus className="h-3.5 w-3.5" /> Add FD
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Fixed Deposit</DialogTitle></DialogHeader>
                <form onSubmit={handleAddFD} className="space-y-4">
                  <div className="space-y-2"><Label>Bank Name</Label><Input value={fdForm.bank_name} onChange={e => setFdForm({ ...fdForm, bank_name: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Amount (₹)</Label><Input type="number" value={fdForm.amount} onChange={e => setFdForm({ ...fdForm, amount: e.target.value })} required /></div>
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
          </div>
          <div className="flex flex-col gap-2.5">
            {fds.map((fd, i) => {
              const months = Math.ceil((new Date(fd.maturity_date).getTime() - new Date(fd.start_date).getTime()) / (30 * 24 * 3600 * 1000));
              const mat = fdMaturity(Number(fd.amount), Number(fd.interest_rate), months);
              const interest = mat - Number(fd.amount);
              return (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-elevated transition-all">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[hsl(var(--warning))]/10 rounded-xl flex items-center justify-center"><span className="text-lg">🏦</span></div>
                      <div>
                        <div className="font-heading font-bold text-sm">{fd.bank_name} FD</div>
                        <div className="text-xs text-muted-foreground">{Number(fd.interest_rate)}% p.a. · Matures {new Date(fd.maturity_date).toLocaleDateString("en", { month: "short", year: "numeric" })}</div>
                      </div>
                    </div>
                    <div className="text-right flex items-start gap-2">
                      <div>
                        <div className="font-mono text-xl font-semibold text-[hsl(var(--warning))]">{fmtK(Math.round(mat))}</div>
                        <div className="text-[11px] text-muted-foreground">Maturity Value</div>
                      </div>
                      <button onClick={() => deleteFD(fd.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-secondary rounded-lg p-2 text-center">
                      <div className="font-mono text-[13px] font-semibold">{fmtK(Number(fd.amount))}</div>
                      <div className="text-[10px] text-muted-foreground">Principal</div>
                    </div>
                    <div className="bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/15 rounded-lg p-2 text-center">
                      <div className="font-mono text-[13px] font-semibold text-[hsl(var(--warning))]">+{fmtK(Math.round(interest))}</div>
                      <div className="text-[10px] text-[hsl(var(--warning))]">Interest Earned</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-2 text-center">
                      <div className="font-mono text-[13px] font-semibold">{months}m</div>
                      <div className="text-[10px] text-muted-foreground">Tenure</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {fds.length === 0 && <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">No fixed deposits yet.</div>}
          </div>
        </div>

        {/* Recurring Deposits */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-heading text-[15px] font-bold">Recurring Deposits (RD)</h3>
            <Dialog open={rdOpen} onOpenChange={setRdOpen}>
              <DialogTrigger asChild>
                <button className="gradient-primary text-primary-foreground font-heading font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 transition-all">
                  <Plus className="h-3.5 w-3.5" /> Add RD
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Recurring Deposit</DialogTitle></DialogHeader>
                <form onSubmit={handleAddRD} className="space-y-4">
                  <div className="space-y-2"><Label>Bank Name</Label><Input value={rdForm.bank_name} onChange={e => setRdForm({ ...rdForm, bank_name: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Monthly Amount (₹)</Label><Input type="number" value={rdForm.monthly_amount} onChange={e => setRdForm({ ...rdForm, monthly_amount: e.target.value })} required /></div>
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
          </div>
          <div className="flex flex-col gap-2.5">
            {rds.map((rd, i) => {
              const months = Math.ceil((new Date(rd.maturity_date).getTime() - new Date(rd.start_date).getTime()) / (30 * 24 * 3600 * 1000));
              const mat = rdMaturity(Number(rd.monthly_amount), Number(rd.interest_rate), months);
              const invested = Number(rd.monthly_amount) * months;
              return (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-elevated transition-all">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><span className="text-lg">📅</span></div>
                      <div>
                        <div className="font-heading font-bold text-sm">{rd.bank_name} RD</div>
                        <div className="text-xs text-muted-foreground">{fmtK(Number(rd.monthly_amount))}/mo · {Number(rd.interest_rate)}% p.a.</div>
                      </div>
                    </div>
                    <div className="text-right flex items-start gap-2">
                      <div>
                        <div className="font-mono text-xl font-semibold text-primary">{fmtK(Math.round(mat))}</div>
                        <div className="text-[11px] text-muted-foreground">Maturity Value</div>
                      </div>
                      <button onClick={() => deleteRD(rd.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-secondary rounded-lg p-2 text-center">
                      <div className="font-mono text-[13px] font-semibold">{fmtK(invested)}</div>
                      <div className="text-[10px] text-muted-foreground">Total Invested</div>
                    </div>
                    <div className="bg-primary/10 border border-primary/15 rounded-lg p-2 text-center">
                      <div className="font-mono text-[13px] font-semibold text-primary">+{fmtK(Math.round(mat - invested))}</div>
                      <div className="text-[10px] text-primary">Interest Earned</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-2 text-center">
                      <div className="font-mono text-[13px] font-semibold">{months}m</div>
                      <div className="text-[10px] text-muted-foreground">Tenure</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {rds.length === 0 && <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">No recurring deposits yet.</div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}