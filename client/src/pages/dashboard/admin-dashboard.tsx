import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import type { AdminMetricsResponse } from "@shared/routes";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export function AdminDashboard() {
  const { user } = useAuth();
  
  const { data: metrics, isLoading } = useQuery<AdminMetricsResponse>({
    queryKey: ['/api/admin/metrics']
  });

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
              Loading admin metrics...
          </div>
      )
  }

  const statusData = metrics?.appointmentsByStatus ? [
    { name: 'Pending', value: metrics.appointmentsByStatus['pending'] || 0 },
    { name: 'Approved', value: metrics.appointmentsByStatus['approved'] || 0 },
    { name: 'Completed', value: metrics.appointmentsByStatus['completed'] || 0 },
    { name: 'Rejected', value: metrics.appointmentsByStatus['rejected'] || 0 },
  ] : [];

  return (
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants} className="rounded-3xl bg-gradient-to-r from-purple-800 to-indigo-700 p-8 text-white shadow-xl shadow-black/10 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-display font-bold mb-2">Admin Portal</h2>
          <p className="text-white/80 max-w-lg text-lg">
            Welcome back, {user?.name}. Here is the global overview of the university clinic.
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Doctors</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.totalDoctors || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appointments</CardTitle>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.totalAppointments || 0}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medical Records</CardTitle>
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <FileText className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.totalRecords || 0}</div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-xl font-display font-bold">Global Appointment Statuses</h3>
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden p-6 bg-card">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fill: 'currentColor', opacity: 0.7 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'currentColor', opacity: 0.7 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-xl font-display font-bold">Quick Actions</h3>
            <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-card p-6 flex flex-col gap-4">
                <p className="text-muted-foreground">Additional features for Admins will go here, such as managing users, banning accounts, or approving new clinic staff.</p>
                {/* Future implementation placeholder */}
            </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
