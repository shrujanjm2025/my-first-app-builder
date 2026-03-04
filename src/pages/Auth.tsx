import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff, Wallet, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10 text-white max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Wallet className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>FinanceFlow</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Take control of your financial future
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Track expenses, manage budgets, plan investments, and achieve your financial goals — all in one place.
          </p>
        </div>
      </div>

      {/* Right panel - auth forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-2 rounded-xl gradient-primary">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>FinanceFlow</span>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup">
              <SignUpForm />
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SocialButton provider="google" label="Google" />
              <SocialButton provider="apple" label="Apple" />
              <SocialButton provider="facebook" label="Facebook" />
            </div>
          </div>
        </div>
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
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="login-email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-primary hover:underline">
            Forgot password?
          </button>
          <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
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
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for a confirmation link!");
    }
  };

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Create account</CardTitle>
        <CardDescription>Start your journey to financial freedom</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="signup-name" placeholder="John Doe" className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="signup-email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div className="flex gap-1 mt-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${password.length >= i * 3 ? (i <= 2 ? 'bg-destructive' : 'bg-[hsl(var(--success))]') : 'bg-muted'}`} />
                ))}
              </div>
            )}
          </div>
          <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
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
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>Enter your email to receive a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <Button type="submit" className="w-full gradient-primary text-white" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
          <button type="button" onClick={onBack} className="text-sm text-primary hover:underline w-full text-center">
            Back to login
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

function SocialButton({ provider, label }: { provider: string; label: string }) {
  const handleSocial = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleSocial}>
      {label}
    </Button>
  );
}
