import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Policy { id: string; name: string; type: string; policy_number: string | null; coverage_amount: number | null; premium: number; premium_frequency: string; renewal_date: string | null; }

const COLORS = ["hsl(166,100%,45%)", "hsl(217,94%,68%)", "hsl(270,95%,75%)", "hsl(43,96%,56%)", "hsl(0,91%,71%)"];
const TYPE_ICONS: Record<string, string> = { health: "🏥", life: "❤️", home: "🏠", car: "🚗", other: "📋" };

export default function Insurance() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "health", policy_number: "", coverage_amount: "", premium: "", premium_frequency: "monthly", renewal_date: "" });

  const fetch = async () => {
    if (!user) return;
    const { data } = await supabase.from("insurance_policies").select("*").eq("user_id", user.id).order("renewal_date");
    setPolicies((data as Policy[]) || []);
  };

  useEffect(() => { fetch(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("insurance_policies").insert({
      user_id: user.id, name: form.name, type: form.type,
      policy_number: form.policy_number || null,
      coverage_amount: form.coverage_amount ? parseFloat(form.coverage_amount) : null,
      premium: parseFloat(form.premium), premium_frequency: form.premium_frequency,
      renewal_date: form.renewal_date || null,
    });
    if (error) toast.error(error.message); else { toast.success("Policy added"); setOpen(false); fetch(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("insurance_policies").delete().eq("id", id);
    fetch();
  };

  const totalPremium = policies.reduce((s, p) => {
    const mult = p.premium_frequency === "yearly" ? 1 / 12 : p.premium_frequency === "quarterly" ? 1 / 3 : 1;
    return s + Number(p.premium) * mult;
  }, 0);

  const coverageData = policies.filter(p => p.coverage_amount).map(p => ({ name: p.name, value: Number(p.coverage_amount) }));
  const premiumData = policies.map(p => ({
    name: p.name.length > 10 ? p.name.slice(0, 10) + "…" : p.name,
    premium: Number(p.premium),
    type: p.type,
  }));

  const getStatus = (renewalDate: string | null) => {
    if (!renewalDate) return { label: "Active", color: "bg-primary/10 text-primary" };
    const days = Math.ceil((new Date(renewalDate).getTime() - Date.now()) / (86400000));
    if (days < 0) return { label: "Overdue", color: "bg-destructive/10 text-destructive" };
    if (days < 30) return { label: "Due Soon", color: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" };
    return { label: "Active", color: "bg-primary/10 text-primary" };
  };

  return (
    <DashboardLayout>
      <div className="animate-fadeUp space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Insurance</h1>
            <p className="text-muted-foreground">Track policies, premiums and renewal alerts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Add Policy</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Insurance Policy</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Policy Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["life", "health", "home", "car", "other"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Policy Number</Label><Input value={form.policy_number} onChange={(e) => setForm({ ...form, policy_number: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Coverage Amount</Label><Input type="number" value={form.coverage_amount} onChange={(e) => setForm({ ...form, coverage_amount: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Premium</Label><Input type="number" step="0.01" value={form.premium} onChange={(e) => setForm({ ...form, premium: e.target.value })} required /></div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={form.premium_frequency} onValueChange={(v) => setForm({ ...form, premium_frequency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["monthly", "quarterly", "yearly"].map(f => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Renewal Date</Label><Input type="date" value={form.renewal_date} onChange={(e) => setForm({ ...form, renewal_date: e.target.value })} /></div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Add Policy</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Charts */}
        {policies.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-heading text-sm font-bold mb-3">Coverage Distribution</h3>
              {coverageData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={coverageData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {coverageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={({ active, payload }) => active && payload?.length ? (
                        <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-elevated">
                          <div className="font-semibold">{payload[0].name}</div>
                          <div className="text-primary font-mono">{Number(payload[0].value).toLocaleString()}</div>
                        </div>
                      ) : null} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {coverageData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px]">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">Add coverage amounts to see distribution</div>
              )}
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-heading text-sm font-bold mb-3">Premium Comparison</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={premiumData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-elevated">
                      <div className="text-primary font-mono">Premium: {Number(payload[0].value).toLocaleString()}</div>
                      <div className="text-muted-foreground capitalize">Type: {payload[0].payload.type}</div>
                    </div>
                  ) : null} />
                  <Bar dataKey="premium" fill="hsl(217,94%,68%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {policies.map(p => {
            const status = getStatus(p.renewal_date);
            return (
              <Card key={p.id} className="shadow-soft border-0 hover:-translate-y-0.5 hover:shadow-elevated transition-all">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{TYPE_ICONS[p.type] || "📋"}</span>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="capitalize text-[10px]">{p.type}</Badge>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${status.color}`}>{status.label}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Premium</span><p className="font-semibold">{Number(p.premium).toLocaleString()}/{p.premium_frequency.slice(0, 2)}</p></div>
                    <div><span className="text-muted-foreground">Coverage</span><p className="font-semibold">{p.coverage_amount ? Number(p.coverage_amount).toLocaleString() : '—'}</p></div>
                    {p.renewal_date && <div className="col-span-2"><span className="text-muted-foreground">Renewal</span><p className="font-semibold">{new Date(p.renewal_date).toLocaleDateString()}</p></div>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {policies.length === 0 && (
            <Card className="shadow-soft border-0 col-span-full"><CardContent className="p-8 text-center text-muted-foreground">No insurance policies tracked yet.</CardContent></Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
