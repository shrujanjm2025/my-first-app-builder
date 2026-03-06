import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff, Wallet, ArrowRight } from "lucide-react";
import { useEffect } from "react";

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const [tab, setTab] = useState<"login" | "signup">("login");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5 relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,hsl(var(--primary)/0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="fixed bottom-[-200px] right-[-100px] w-[500px] h-[500px] bg-[radial-gradient(circle,hsl(var(--accent)/0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="animate-scaleIn w-full max-w-[440px]">
        {/* Logo */}
        <div className="text-center mb-9">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-2xl font-extrabold tracking-tight">WealthOS</span>
          </div>
          <p className="text-sm text-muted-foreground">Your finances, managed while you sleep.</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-card rounded-xl p-1 mb-6 border border-border">
          {(["login", "signup"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg font-heading text-sm font-bold transition-all ${
                tab === t ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-7">
          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <SocialButton provider="google" label="Google" icon={<GoogleIcon />} />
            <SocialButton provider="apple" label="Apple" icon={<AppleIcon />} />
          </div>

          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {tab === "login" ? <LoginForm /> : <SignUpForm />}

          {tab === "login" && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              No account?{" "}
              <span onClick={() => setTab("signup")} className="text-primary cursor-pointer font-semibold hover:underline">
                Sign up free
              </span>
            </p>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground/50 mt-5">
          🔒 Bank-grade encryption · GDPR compliant · No ads
        </p>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();

  if (showForgot) return <ForgotPasswordForm onBack={() => setShowForgot(false)} />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else navigate("/dashboard");
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Email Address</label>
        <input type="email" placeholder="arjun@email.com" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full bg-background/50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" required />
      </div>
      <div className="relative">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Password</label>
        <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full bg-background/50 border border-border rounded-xl px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" required />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[33px] text-muted-foreground hover:text-foreground">
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <div className="text-right -mt-2">
        <span onClick={() => setShowForgot(true)} className="text-xs text-primary cursor-pointer hover:underline">Forgot password?</span>
      </div>
      <button type="submit" disabled={loading}
        className="w-full gradient-primary text-primary-foreground font-heading font-bold py-2.5 px-5 rounded-xl text-sm flex items-center justify-center gap-2 hover:shadow-[0_6px_22px_hsl(var(--primary)/0.32)] hover:-translate-y-0.5 transition-all disabled:opacity-50">
        {loading ? "Signing in..." : "Log In to WealthOS"} <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email for a confirmation link!");
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Full Name</label>
        <input placeholder="Arjun Sharma" value={fullName} onChange={e => setFullName(e.target.value)}
          className="w-full bg-background/50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" required />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Email Address</label>
        <input type="email" placeholder="arjun@email.com" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full bg-background/50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" required />
      </div>
      <div className="relative">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Password</label>
        <input type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full bg-background/50 border border-border rounded-xl px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" required />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[33px] text-muted-foreground hover:text-foreground">
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <button type="submit" disabled={loading}
        className="w-full gradient-primary text-primary-foreground font-heading font-bold py-2.5 px-5 rounded-xl text-sm flex items-center justify-center gap-2 hover:shadow-[0_6px_22px_hsl(var(--primary)/0.32)] hover:-translate-y-0.5 transition-all disabled:opacity-50">
        {loading ? "Creating account..." : "Create My Account"} <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email for a reset link!");
  };

  return (
    <form onSubmit={handleReset} className="space-y-4">
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Email Address</label>
        <input type="email" placeholder="arjun@email.com" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full bg-background/50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" required />
      </div>
      <button type="submit" disabled={loading}
        className="w-full gradient-primary text-primary-foreground font-heading font-bold py-2.5 px-5 rounded-xl text-sm hover:shadow-[0_6px_22px_hsl(var(--primary)/0.32)] transition-all disabled:opacity-50">
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
      <button type="button" onClick={onBack} className="text-sm text-primary hover:underline w-full text-center">Back to login</button>
    </form>
  );
}

function SocialButton({ provider, label, icon }: { provider: string; label: string; icon: React.ReactNode }) {
  const handleSocial = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <button onClick={handleSocial}
      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-secondary border border-border text-sm font-heading font-bold text-foreground hover:bg-secondary/80 transition-all">
      {icon} {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}