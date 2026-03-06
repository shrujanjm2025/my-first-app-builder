import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;

interface BankAccount { id: string; bank_name: string; account_type: string; account_number: string | null; balance: number; }

export default function BankAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Record<string, any[]>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ bank_name: "", account_type: "savings", account_number: "", balance: "" });

  const fetchAccounts = async () => {
    if (!user) return;
    const { data } = await supabase.from("bank_accounts").select("*").eq("user_id", user.id).order("created_at");
    setAccounts((data as BankAccount[]) || []);
    // Fetch recent transactions
    const { data: txData } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(20);
    // Group by nothing for now - just show recent
    setTransactions({ recent: txData || [] });
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

  const handleDelete = async (id: string) => { await supabase.from("bank_accounts").delete().eq("id", id); fetchAccounts(); };

  const total = accounts.reduce((s, a) => s + Number(a.balance), 0);

  const bankColors: Record<string, string> = {
    "HDFC Bank": "#e31837", "SBI": "#2563eb", "ICICI Bank": "#f97316",
    "Axis Bank": "#8b5cf6", "Kotak": "#e11d48", "Yes Bank": "#0ea5e9",
  };

  return (
    <DashboardLayout>
      <div className="animate-fadeUp space-y-4">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="font-heading text-xl font-extrabold mb-1">Bank Accounts</h2>
            <p className="text-[13px] text-muted-foreground">Consolidated view of all linked accounts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="gradient-primary text-primary-foreground font-heading font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-1.5 transition-all">
                <Plus className="h-4 w-4" /> Add Account
              </button>
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
                <div className="space-y-2"><Label>Balance (₹)</Label><Input type="number" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} required /></div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Add Account</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Total Balance */}
        <div className="bg-card border border-border rounded-2xl p-5 bg-gradient-to-br from-primary/5 to-accent/3">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Total Liquid Balance</div>
          <div className="font-mono text-[40px] font-bold text-primary">{fmtK(total)}</div>
          <div className="text-xs text-muted-foreground mt-1">Across {accounts.length} accounts · Updated just now</div>
        </div>

        {/* Account Cards */}
        {accounts.map((acc, i) => {
          const color = bankColors[acc.bank_name] || "#6366f1";
          const initials = acc.bank_name.split(" ").map(w => w[0]).join("").slice(0, 3);
          return (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-elevated transition-all">
              <div className="flex justify-between items-start mb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center text-[10px] font-extrabold font-heading border"
                    style={{ background: `${color}22`, color, borderColor: `${color}33` }}>
                    {initials}
                  </div>
                  <div>
                    <div className="font-heading font-bold text-[15px]">{acc.bank_name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{acc.account_type} · {acc.account_number ? `••••${acc.account_number.slice(-4)}` : "No number"}</div>
                  </div>
                </div>
                <div className="text-right flex items-start gap-2">
                  <div>
                    <div className="font-mono text-[22px] font-semibold">{fmtK(Number(acc.balance))}</div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary mt-1">Active</span>
                  </div>
                  <button onClick={() => handleDelete(acc.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {accounts.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">No bank accounts added yet.</div>
        )}
      </div>
    </DashboardLayout>
  );
}