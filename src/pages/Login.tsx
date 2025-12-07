import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      // Check for error
      if (error) {
        const isVerificationError = error.message?.toLowerCase().includes('email') || 
                                     error.message?.toLowerCase().includes('confirm') ||
                                     error.message?.toLowerCase().includes('verif');
        
        toast({
          variant: "destructive",
          title: isVerificationError ? "Email not verified" : "Login failed",
          description: isVerificationError 
            ? "Please verify your email before logging in. Check your inbox for the verification link."
            : error.message,
        });
        return;
      }

      const user = data?.user;

      if (!user) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Unable to sign in. Please try again.",
        });
        return;
      }
      
      // User is verified, proceed with login
      toast({
        title: "Success",
        description: "You're now signed in!",
      });
      // After signin, decide destination based on profile_completed
      try {
        const { data: profileData } = await supabaseClient
          .from('user_profiles')
          .select('profile_completed')
          .eq('user_id', user.id)
          .single();
        
        const profileCompleted = profileData?.profile_completed === true;
        // Route: first-time users -> setup, returning users -> homepage
        window.location.href = profileCompleted ? "/" : "/profile/setup";
      } catch {
        // Fallback: go to profile setup
        window.location.href = "/profile/setup";
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="container py-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <img src="/FFWPU Logo.png" alt="FFWPU-SA Logo" className="h-8 w-8" />
          <span className="text-lg">FFWPU-SA</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-gradient-subtle">
        <div className="container max-w-md px-4 py-16">
          <div className="mx-auto animate-slide-up">
            <Card className="shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

                <Button type="submit" className="w-full shadow-soft">Log in</Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create one
              </Link>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
