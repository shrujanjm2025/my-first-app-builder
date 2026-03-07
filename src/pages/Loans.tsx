import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;
const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);

interface Loan { id: string; name: string; type: string; principal: number; interest_rate: number; tenure_months: number; emi: number; outstanding_balance: number; start_date: string; }
const LOAN_TYPES = ["home", "personal", "car", "education", "credit_card", "other"];
const LOAN_ICONS: Record<string, string> = { home: "🏠", car: "🚗", credit_card: "💳", personal: "💰", education: "🎓", other: "📋" };
const COLORS = ["hsl(166,100%,45%)", "hsl(217,94%,68%)", "hsl(270,95%,75%)", "hsl(43,96%,56%)", "hsl(0,91%,71%)", "hsl(190,100%,50%)"];

export default function Loans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("avalanche");
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

  const handleDelete = async (id: string) => { await supabase.from("loans").delete().eq("id", id); fetchLoans(); };

  const totalOutstanding = loans.reduce((s, l) => s + Number(l.outstanding_balance), 0);
  const totalEMI = loans.reduce((s, l) => s + Number(l.emi), 0);
  const avalancheOrder = [...loans].sort((a, b) => Number(b.interest_rate) - Number(a.interest_rate));
  const snowballOrder = [...loans].sort((a, b) => Number(a.outstanding_balance) - Number(b.outstanding_balance));

  const pieData = loans.map(l => ({ name: l.name, value: Number(l.outstanding_balance) }));
  const barData = loans.map(l => ({
    name: l.name.length > 8 ? l.name.slice(0, 8) + "…" : l.name,
    emi: Number(l.emi),
    rate: Number(l.interest_rate),
  }));

  return (
    <DashboardLayout>
      <div className="animate-fadeUp space-y-4">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="font-heading text-xl font-extrabold mb-1">Loans & Debt</h2>
            <p className="text-[13px] text-muted-foreground">Track EMIs, optimize repayment, save on interest</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="gradient-primary text-primary-foreground font-heading font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-1.5 hover:shadow-[0_6px_22px_hsl(var(--primary)/0.32)] transition-all">
                <Plus className="h-4 w-4" /> Add Loan
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Loan</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Loan Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LOAN_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Principal (₹)</Label><Input type="number" value={form.principal} onChange={e => setForm({ ...form, principal: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Interest Rate (%)</Label><Input type="number" step="0.01" value={form.interest_rate} onChange={e => setForm({ ...form, interest_rate: e.target.value })} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Tenure (months)</Label><Input type="number" value={form.tenure_months} onChange={e => setForm({ ...form, tenure_months: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required /></div>
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Add Loan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-primary/10 border-primary/20 text-primary text-[13px] leading-relaxed">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div><strong>Offset account tip:</strong> Keeping ₹50,000 in an offset-linked account reduces your Home Loan interest significantly. Paying 1 extra EMI/year saves lakhs in total interest.</div>
        </div>

        {/* Charts */}
        {loans.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-heading text-sm font-bold mb-3">Debt Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-elevated">
                      <div className="font-semibold">{payload[0].name}</div>
                      <div className="text-destructive font-mono">{fmtK(Number(payload[0].value))}</div>
                    </div>
                  ) : null} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px]">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-heading text-sm font-bold mb-3">Monthly EMI Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-elevated">
                      <div className="text-primary">EMI: {fmtK(Number(payload[0].value))}</div>
                      <div className="text-muted-foreground">Rate: {payload[0].payload.rate}%</div>
                    </div>
                  ) : null} />
                  <Bar dataKey="emi" fill="hsl(166,100%,45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Loan Cards */}
        {loans.length > 0 && (
          <div>
            <h3 className="font-heading text-[15px] font-bold mb-3">Active Loans</h3>
            <div className="flex flex-col gap-3">
              {loans.map(l => {
                const monthsPassed = Math.floor((Date.now() - new Date(l.start_date).getTime()) / (30 * 24 * 3600 * 1000));
                const progress = l.tenure_months > 0 ? pct(monthsPassed, l.tenure_months) : 0;
                return (
                  <div key={l.id} className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-elevated transition-all">
                    <div className="flex justify-between items-start mb-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[22px]">{LOAN_ICONS[l.type] || "📋"}</span>
                        <div>
                          <div className="font-heading font-bold text-[15px]">{l.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{l.tenure_months} months · {Number(l.interest_rate)}% p.a.</div>
                        </div>
                      </div>
                      <div className="text-right flex items-start gap-2">
                        <div>
                          <div className="font-mono text-lg font-semibold text-destructive">{fmtK(Number(l.outstanding_balance))}</div>
                          <div className="text-[11px] text-muted-foreground">outstanding</div>
                        </div>
                        <button onClick={() => handleDelete(l.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {l.tenure_months > 0 && (
                      <>
                        <div className="h-[5px] bg-muted rounded-full overflow-hidden mb-1.5">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%`, background: "linear-gradient(90deg, hsl(166,100%,45%), hsl(217,94%,68%))" }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground mb-3">
                          <span>{monthsPassed} of {l.tenure_months} months paid</span>
                          <span>{Math.max(0, l.tenure_months - monthsPassed)} months remaining</span>
                        </div>
                      </>
                    )}
                    <div className="flex gap-2">
                      <div className="flex-1 bg-secondary rounded-lg p-2 text-center">
                        <div className="font-mono text-sm font-semibold text-primary">{fmtK(Number(l.emi))}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Monthly EMI</div>
                      </div>
                      {Number(l.interest_rate) >= 30 && (
                        <div className="flex-[2] bg-destructive/10 border border-destructive/20 rounded-lg p-2 text-[11px] text-destructive">
                          ⚠️ {Number(l.interest_rate)}% APR is extremely high. Prioritize paying this off first.
                        </div>
                      )}
                      {Number(l.interest_rate) < 10 && (
                        <div className="flex-[2] bg-primary/10 rounded-lg p-2 text-[11px] text-primary">
                          💡 +1 extra EMI/year saves ~{fmtK(Math.round(Number(l.emi) * 4))} in total interest
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loans.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
            No loans tracked yet. Click "Add Loan" to get started.
          </div>
        )}

        {/* Debt Strategy */}
        {loans.length > 1 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold mb-3">Debt Repayment Strategy</h3>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setMethod("avalanche")}
                className={`py-1.5 px-3 rounded-lg font-heading text-xs font-bold transition-all ${method === "avalanche" ? "gradient-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}>
                🏔️ Debt Avalanche
              </button>
              <button onClick={() => setMethod("snowball")}
                className={`py-1.5 px-3 rounded-lg font-heading text-xs font-bold transition-all ${method === "snowball" ? "gradient-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}>
                ⛄ Debt Snowball
              </button>
            </div>
            <p className="text-[13px] text-muted-foreground mb-3">
              {method === "avalanche"
                ? <>Pay <strong className="text-foreground">minimum on all loans</strong>, then throw extra money at the <strong className="text-primary">highest interest rate</strong> first. Saves most money.</>
                : <>Pay <strong className="text-foreground">minimum on all</strong>, then attack the <strong className="text-primary">smallest balance</strong> first. Great for psychological wins.</>
              }
            </p>
            <div className="flex flex-col gap-2">
              {(method === "avalanche" ? avalancheOrder : snowballOrder).map((l, i) => (
                <div key={l.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  i === 0 ? (method === "avalanche" ? "bg-destructive/10 border-destructive/20" : "bg-primary/10 border-primary/20") : "bg-secondary border-transparent"
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    i === 0 ? (method === "avalanche" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground") : "bg-muted-foreground/30 text-background"
                  }`}>{i + 1}</div>
                  <span className={`flex-1 text-[13px] ${i === 0 ? "font-semibold" : ""}`}>{l.name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    method === "avalanche" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
                  }`}>
                    {method === "avalanche" ? `${Number(l.interest_rate)}%` : fmtK(Number(l.outstanding_balance))}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{i === 0 ? "Focus here" : "Minimum only"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
