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
import { Plus, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface BankAccount {
  id: string;
  bank_name: string;
  account_type: string;
  account_number: string | null;
  balance: number;
}

export default function BankAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ bank_name: "", account_type: "savings", account_number: "", balance: "" });

  const fetchAccounts = async () => {
    if (!user) return;
    const { data } = await supabase.from("bank_accounts").select("*").eq("user_id", user.id).order("created_at");
    setAccounts((data as BankAccount[]) || []);
  };

  useEffect(() => { fetchAccounts(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("bank_accounts").insert({
      user_id: user.id, bank_name: form.bank_name, account_type: form.account_type,
      account_number: form.account_number || null, balance: parseFloat(form.balance) || 0,
    });
    if (error) toast.error(error.message);
    else { toast.success("Account added"); setOpen(false); setForm({ bank_name: "", account_type: "savings", account_number: "", balance: "" }); fetchAccounts(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("bank_accounts").delete().eq("id", id);
    toast.success("Deleted");
    fetchAccounts();
  };

  const total = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bank Accounts</h1>
            <p className="text-muted-foreground">Manage all your bank accounts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Add Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2"><Label>Bank Name</Label><Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <Select value={form.account_type} onValueChange={v => setForm({ ...form, account_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["savings", "current", "salary", "fixed deposit", "NRI"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Account Number</Label><Input value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Balance</Label><Input type="number" step="0.01" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} required /></div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Add Account</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-soft border-0">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
            <p className="text-2xl font-bold font-heading text-[hsl(var(--success))]">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map(a => (
            <Card key={a.id} className="shadow-soft border-0">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="font-semibold">{a.bank_name}</p>
                      <Badge variant="outline" className="capitalize">{a.account_type}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                {a.account_number && <p className="text-xs text-muted-foreground">••••{a.account_number.slice(-4)}</p>}
                <p className="text-xl font-bold font-heading">${Number(a.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
          ))}
          {accounts.length === 0 && (
            <Card className="shadow-soft border-0 col-span-full"><CardContent className="p-8 text-center text-muted-foreground">No bank accounts added yet.</CardContent></Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
