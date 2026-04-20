import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, ShieldCheck, Clock, Stethoscope } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

export function LandingPage() {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <header className="h-20 flex items-center justify-between px-6 lg:px-12 glass-card fixed top-0 w-full z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary/25 overflow-hidden">
            <img src="/logo.png" alt="Vasool Raja Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Vasool Raja Hospital</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link href="/register">
            <Button className="rounded-xl font-semibold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-20">
        <section className="relative overflow-hidden hero-gradient pt-24 pb-32 px-6 lg:px-12 flex flex-col items-center text-center">
          {/* Decorative background blur */}
          <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 -right-20 w-72 h-72 bg-secondary/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

          <motion.div className="relative z-10 max-w-4xl mx-auto space-y-8" initial="initial" animate="animate" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-primary/10 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-medium text-primary">Student Health Services Online</span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-foreground leading-[1.1]">
              Your health on campus, <br />
              <span className="text-gradient">simplified.</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Book appointments, access medical records, and connect with campus healthcare professionals securely through our modern portal.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full rounded-2xl text-base px-8 h-14 shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all duration-300">
                  Join as Student <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full rounded-2xl text-base px-8 h-14 bg-white/50 border-2 hover:bg-white transition-all duration-300">
                  Doctor Login
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            className="relative mt-20 w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-black/10 border border-white/40"
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            {/* landing page hero modern campus clinic */}
            <img 
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&h=800&fit=crop" 
              alt="Modern Campus Clinic" 
              className="w-full object-cover aspect-[21/9]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </motion.div>
        </section>

        <section className="py-24 px-6 lg:px-12 bg-white">
          <motion.div 
            className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-xl">Quick Booking</h3>
              <p className="text-muted-foreground leading-relaxed">Schedule appointments with campus doctors in seconds. No more waiting in lines.</p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-xl">Secure Records</h3>
              <p className="text-muted-foreground leading-relaxed">Access your medical history and prescriptions anytime, anywhere, completely secure.</p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-xl">Expert Care</h3>
              <p className="text-muted-foreground leading-relaxed">Connect directly with certified university healthcare professionals dedicated to you.</p>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
