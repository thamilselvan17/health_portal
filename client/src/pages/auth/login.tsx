import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Activity, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "doctor" | "admin">("student");
  const { login, isLoggingIn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password, role });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-primary/10 -skew-y-6 origin-top-left -z-10"></div>
      
      <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl border border-white/50 p-8 z-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-400"></div>
                <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-primary/20 ring-1 ring-primary/10 overflow-hidden">
              <img src="/logo.png" alt="Vasool Raja Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-display font-bold text-center tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-2 text-center text-sm">
              Enter your credentials to access the portal
            </p>
          </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>I am a...</Label>
            <RadioGroup 
              value={role} 
              onValueChange={(val) => setRole(val as "student" | "doctor" | "admin")} 
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2 border rounded-xl p-3 w-full cursor-pointer hover:border-primary transition-colors">
                <RadioGroupItem value="student" id="r-student" />
                <Label htmlFor="r-student" className="cursor-pointer flex-1 text-sm">Student</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-xl p-3 w-full cursor-pointer hover:border-primary transition-colors">
                <RadioGroupItem value="doctor" id="r-doctor" />
                <Label htmlFor="r-doctor" className="cursor-pointer flex-1 text-sm">Doctor</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-xl p-3 w-full cursor-pointer hover:border-primary transition-colors">
                <RadioGroupItem value="admin" id="r-admin" />
                <Label htmlFor="r-admin" className="cursor-pointer flex-1 text-sm">Admin</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="student@university.edu"
                className="rounded-xl h-12 bg-muted/50 border-transparent focus:border-primary focus:bg-white transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                className="rounded-xl h-12 bg-muted/50 border-transparent focus:border-primary focus:bg-white transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
