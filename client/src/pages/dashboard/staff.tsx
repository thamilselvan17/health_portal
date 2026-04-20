import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Search, Plus, Filter, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function StaffPage() {
  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-8" 
        variants={containerVariants} 
        initial="hidden" 
        animate="show"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Manage Staff</h1>
            <p className="text-muted-foreground mt-1">Manage hospital doctors, nurses, and administrative staff.</p>
          </div>
          <Button className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Add New Staff
          </Button>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email or department..." 
              className="pl-10 h-12 rounded-xl bg-card border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/50"
            />
          </div>
          <Button variant="outline" className="h-12 rounded-xl px-4 border-none bg-card shadow-sm hover:bg-muted/50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border-none shadow-md bg-card overflow-hidden">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Staff Members
                </CardTitle>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                  0 Members found
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No staff members yet</h3>
                <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                  Staff management functionality is coming soon. You'll be able to add and manage your clinic team here.
                </p>
                <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm max-w-sm">
                  <strong>Coming Soon:</strong> Robust IAM (Identity and Access Management) for all hospital personnel.
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
