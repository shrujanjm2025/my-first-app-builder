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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = {
  income: ["Salary", "Freelance", "Investment", "Gift", "Other"],
  expense: ["Housing", "Food", "Transport", "Entertainment", "Healthcare", "Shopping", "Utilities", "Education", "Other"],
};

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
}

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "expense" as "income" | "expense", category: "", amount: "", description: "", date: new Date().toISOString().split("T")[0] });

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(100);
    setTransactions((data as Transaction[]) || []);
  };

  useEffect(() => { fetchTransactions(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id, type: form.type, category: form.category,
      amount: parseFloat(form.amount), description: form.description || null, date: form.date,
    });
    if (error) toast.error(error.message);
    else { toast.success("Transaction added"); setOpen(false); setForm({ type: "expense", category: "", amount: "", description: "", date: new Date().toISOString().split("T")[0] }); fetchTransactions(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchTransactions(); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">Track your income and expenses</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white"><Plus className="h-4 w-4 mr-2" />Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v: "income" | "expense") => setForm({ ...form, type: v, category: "" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES[form.type].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                </div>
                <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" /></div>
                <Button type="submit" className="w-full gradient-primary text-white">Add Transaction</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-soft border-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transactions yet</TableCell></TableRow>
                ) : transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={tx.type === "income" ? "default" : "destructive"} className={tx.type === "income" ? "bg-[hsl(var(--success))]" : ""}>
                        {tx.type === "income" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.category}</TableCell>
                    <TableCell className="text-muted-foreground">{tx.description || "—"}</TableCell>
                    <TableCell className="text-right font-medium">${Number(tx.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
