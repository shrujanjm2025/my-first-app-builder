import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, currency").eq("id", user.id).single().then(({ data }) => {
      if (data) { setFullName(data.full_name || ""); setCurrency(data.currency || "USD"); }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, currency }).eq("id", user.id);
    setLoading(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-lg">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile</p>
        </div>
        <Card className="shadow-soft border-0">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
            <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Currency</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" /></div>
            <Button onClick={handleSave} className="gradient-primary text-white" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
