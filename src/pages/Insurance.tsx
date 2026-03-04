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

interface Policy { id: string; name: string; type: string; policy_number: string | null; coverage_amount: number | null; premium: number; premium_frequency: string; renewal_date: string | null; }

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Insurance</h1>
            <p className="text-muted-foreground">Track your insurance policies</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white"><Plus className="h-4 w-4 mr-2" />Add Policy</Button>
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
                  <div className="space-y-2"><Label>Coverage ($)</Label><Input type="number" value={form.coverage_amount} onChange={(e) => setForm({ ...form, coverage_amount: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Premium ($)</Label><Input type="number" step="0.01" value={form.premium} onChange={(e) => setForm({ ...form, premium: e.target.value })} required /></div>
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
                <Button type="submit" className="w-full gradient-primary text-white">Add Policy</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {policies.map(p => (
            <Card key={p.id} className="shadow-soft border-0">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10"><Shield className="h-4 w-4 text-primary" /></div>
                    <div><p className="font-semibold">{p.name}</p><Badge variant="outline" className="capitalize">{p.type}</Badge></div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Premium</span><p className="font-semibold">${Number(p.premium).toFixed(2)}/{p.premium_frequency.slice(0, 2)}</p></div>
                  <div><span className="text-muted-foreground">Coverage</span><p className="font-semibold">{p.coverage_amount ? `$${Number(p.coverage_amount).toLocaleString()}` : '—'}</p></div>
                  {p.renewal_date && <div className="col-span-2"><span className="text-muted-foreground">Renewal</span><p className="font-semibold">{new Date(p.renewal_date).toLocaleDateString()}</p></div>}
                </div>
              </CardContent>
            </Card>
          ))}
          {policies.length === 0 && (
            <Card className="shadow-soft border-0 col-span-full"><CardContent className="p-8 text-center text-muted-foreground">No insurance policies tracked yet.</CardContent></Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
