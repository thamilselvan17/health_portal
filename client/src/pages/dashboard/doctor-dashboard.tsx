import { useAuth } from "@/hooks/use-auth";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Bell } from "lucide-react";
import { format, isToday } from "date-fns";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export function DoctorDashboard() {
  const { user } = useAuth();
  const { data: appointments, isLoading: isLoadingAppts } = useAppointments();
  const { data: patients, isLoading: isLoadingPatients } = usePatients();

  const myAppointments = appointments?.filter(a => a.doctorId === user?.id) || [];
  const pendingRequests = myAppointments.filter(a => a.status === 'pending');
  const todayAppointments = myAppointments.filter(a => isToday(new Date(a.date)) && a.status === 'approved');

  const statusData = [
    { name: 'Pending', value: pendingRequests.length },
    { name: 'Approved', value: myAppointments.filter(a => a.status === 'approved').length },
    { name: 'Completed', value: myAppointments.filter(a => a.status === 'completed').length },
    { name: 'Rejected', value: myAppointments.filter(a => a.status === 'rejected').length },
  ];

  return (
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants} className="rounded-3xl bg-gradient-to-r from-slate-800 to-slate-700 p-8 text-white shadow-xl shadow-black/10 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-display font-bold mb-2">Dr. {user?.name}</h2>
          <p className="text-white/80 max-w-lg text-lg">
            You have {todayAppointments.length} appointments today and {pendingRequests.length} pending requests.
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Bell className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Schedule</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayAppointments.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{patients?.length || 0}</div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-xl font-display font-bold">Today's Appointments</h3>
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-card">
            <div className="divide-y divide-border">
              {isLoadingAppts ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : todayAppointments.length > 0 ? (
                todayAppointments.map((appt) => {
                  const patient = patients?.find(p => p.id === appt.studentId);
                  return (
                    <div key={appt.id} className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div>
                        <h4 className="font-semibold text-lg">{patient?.name || `Patient #${appt.studentId}`}</h4>
                        <p className="text-sm text-primary">{format(new Date(appt.date), "h:mm a")}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <p>No appointments scheduled for today.</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-xl font-display font-bold">Appointments Overview</h3>
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
      </div>
    </motion.div>
  );
}
