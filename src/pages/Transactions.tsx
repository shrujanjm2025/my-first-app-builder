import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, Trash2, Download, Search, Filter } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "income" | "expense" | "investment" | "loan_payment";
  amount: number;
  category: string;
  description: string;
  date: string;
  notes?: string;
}

const EXPENSE_CATEGORIES = ["Groceries", "Food & Dining", "Transport", "Utilities", "Healthcare", "Entertainment", "Shopping", "Education", "Rent", "EMI", "Insurance", "Subscriptions", "Other"];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Rental Income", "Investment Returns", "Bonus", "Gift", "Other"];
const INVESTMENT_CATEGORIES = ["Mutual Funds", "Stocks", "FDs", "RDs", "PPF", "Gold", "Other"];
const LOAN_PAYMENT_CATEGORIES = ["Home Loan", "Personal Loan", "Car Loan", "Education Loan", "Credit Card", "Other"];

const CATEGORY_ICONS: Record<string, string> = {
  "Groceries": "🛒", "Food & Dining": "🍽️", "Transport": "🚗", "Utilities": "⚡", "Healthcare": "🏥",
  "Entertainment": "🎬", "Shopping": "🛍️", "Education": "📚", "Rent": "🏠", "EMI": "💳",
  "Insurance": "🛡️", "Subscriptions": "📱", "Salary": "💰", "Freelance": "💻", "Rental Income": "🏢",
  "Mutual Funds": "📈", "Stocks": "📊", "FDs": "🏦", "RDs": "📅", "PPF": "📋", "Gold": "💍",
  "Home Loan": "🏠", "Personal Loan": "💳", "Car Loan": "🚗", "Education Loan": "🎓", "Other": "📋"
};

const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n.toFixed(0)}`;

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "investment" | "loan_payment">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    type: "expense" as const,
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const fetchTransactions = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch transactions");
      return;
    }

    setTransactions((data as Transaction[]) || []);
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  useEffect(() => {
    let result = transactions;

    // Filter by type
    if (filterType !== "all") {
      result = result.filter(t => t.type === filterType);
    }

    // Filter by search
    if (searchTerm) {
      result = result.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (dateFrom) {
      result = result.filter(t => t.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(t => t.date <= dateTo);
    }

    setFiltered(result);
  }, [transactions, filterType, searchTerm, dateFrom, dateTo]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.amount || !form.category) {
      toast.error("Please fill in required fields");
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: form.type,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      date: form.date,
      notes: form.notes,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Transaction added");
      setOpen(false);
      setForm({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      fetchTransactions();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Transaction deleted");
      fetchTransactions();
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split("\n").filter(l => l.trim());
        const rows = lines.map(l => l.split(",").map(c => c.trim()));
        
        // Simple CSV parser - assumes: Date, Description, Amount, Type, Category
        const toInsert = rows.slice(1).map(row => ({
          user_id: user.id,
          date: row[0] || new Date().toISOString().split("T")[0],
          description: row[1] || "Imported",
          amount: parseFloat(row[2]) || 0,
          type: (row[3]?.toLowerCase() as any) || "expense",
          category: row[4] || "Other",
        })).filter(t => t.amount > 0);

        if (toInsert.length === 0) {
          toast.error("No valid transactions in CSV");
          return;
        }

        const { error } = await supabase.from("transactions").insert(toInsert);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(`Imported ${toInsert.length} transactions`);
          fetchTransactions();
        }
      } catch (err) {
        toast.error("Failed to parse CSV");
      }
    };
    reader.readAsText(file);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  const handleExportCSV = () => {
    const csv = [
      "Date,Description,Amount,Type,Category,Notes",
      ...filtered.map(t => `${t.date},"${t.description}",${t.amount},"${t.type}","${t.category}","${t.notes || ""}"`)
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fiscal-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCategoryOptions = () => {
    switch (form.type) {
      case "income":
        return INCOME_CATEGORIES;
      case "investment":
        return INVESTMENT_CATEGORIES;
      case "loan_payment":
        return LOAN_PAYMENT_CATEGORIES;
      default:
        return EXPENSE_CATEGORIES;
    }
  };

  const stats = {
    totalIncome: filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    totalExpense: filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    totalInvestment: filtered.filter(t => t.type === "investment").reduce((s, t) => s + t.amount, 0),
    totalLoans: filtered.filter(t => t.type === "loan_payment").reduce((s, t) => s + t.amount, 0),
  };

  return (
    <DashboardLayout>
      <div className="animate-fadeUp space-y-4">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="font-heading text-xl font-extrabold mb-1">Transactions</h2>
            <p className="text-[13px] text-muted-foreground">Manual entry, CSV import, categorization & filtering</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button className="gradient-primary text-primary-foreground font-heading font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-1.5 hover:shadow-[0_6px_22px_hsl(var(--primary)/0.32)] transition-all">
                  <Plus className="h-4 w-4" /> Add
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as any, category: "" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                          <SelectItem value="loan_payment">Loan Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (₹)</Label>
                      <Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {getCategoryOptions().map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Grocery shopping" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional info" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground">Add Transaction</Button>
                </form>
              </DialogContent>
            </Dialog>
            <button onClick={() => csvInputRef.current?.click()}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl border-2 border-border text-sm font-heading font-bold text-muted-foreground hover:bg-secondary transition-all">
              <Upload className="h-4 w-4" /> Import
            </button>
            <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
            <button onClick={handleExportCSV}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl border-2 border-border text-sm font-heading font-bold text-muted-foreground hover:bg-secondary transition-all">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            { label: "Income", value: stats.totalIncome, color: "hsl(166,100%,45%)" },
            { label: "Expenses", value: stats.totalExpense, color: "hsl(0,91%,71%)" },
            { label: "Investments", value: stats.totalInvestment, color: "hsl(217,94%,68%)" },
            { label: "Loan Payments", value: stats.totalLoans, color: "hsl(43,96%,56%)" },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 hover:-translate-y-0.5 hover:shadow-elevated transition-all">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div>
              <div className="font-mono text-lg font-bold" style={{ color: s.color }}>{fmtK(s.value)}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Filters & Search</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search description, category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterType} onValueChange={v => setFilterType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="loan_payment">Loan Payment</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From date" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To date" />
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {filtered.length > 0 ? (
            <div className="divide-y divide-border">
              {filtered.map((tx, i) => (
                <div key={i} className="p-4 hover:bg-secondary/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{CATEGORY_ICONS[tx.category] || "📋"}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{tx.description}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tx.category}</span>
                        {tx.notes && <span className="text-[10px] text-muted-foreground/60">{tx.notes}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(tx.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })} · {tx.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold text-sm ${
                      tx.type === "income" || tx.type === "investment" ? "text-primary" : "text-destructive"
                    }`}>
                      {tx.type === "expense" || tx.type === "loan_payment" ? "-" : "+"}₹{tx.amount.toLocaleString()}
                    </span>
                    <button onClick={() => handleDelete(tx.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No transactions found. Start by adding a transaction or importing from CSV.</p>
            </div>
          )}
        </div>

        {/* CSV Import Guide */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-sm text-primary">
          <div className="font-semibold mb-2">CSV Import Format</div>
          <p className="text-xs mb-2">Expected columns: Date (YYYY-MM-DD), Description, Amount, Type (income/expense/investment/loan_payment), Category</p>
          <div className="bg-background/50 rounded-lg p-2 text-[11px] font-mono text-muted-foreground overflow-x-auto">
            <div>2024-03-01,Grocery Store,2500,expense,Groceries</div>
            <div>2024-03-05,Freelance Project,15000,income,Freelance</div>
            <div>2024-03-10,SIP Investment,5000,investment,Mutual Funds</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
