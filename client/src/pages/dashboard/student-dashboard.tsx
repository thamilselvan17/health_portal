import { useAuth } from "@/hooks/use-auth";
import { useAppointments } from "@/hooks/use-appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Activity, Clock } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function StudentDashboard() {
  const { user } = useAuth();
  const { data: appointments, isLoading } = useAppointments();

  const myAppointments = appointments?.filter(a => a.studentId === user?.id) || [];
  const upcoming = myAppointments.filter(a => new Date(a.date) > new Date() && a.status !== 'rejected');
  const nextAppointment = upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return (
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants} className="rounded-3xl bg-gradient-to-r from-primary to-blue-500 p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-display font-bold mb-2">Hello, {user?.name}!</h2>
          <p className="text-white/80 max-w-lg text-lg">
            Stay on top of your health. Book appointments and manage your medical records easily.
          </p>
        </div>
        <div className="absolute right-0 top-0 opacity-10 transform scale-[1.75] translate-x-1/4 -translate-y-1/4">
           <img src="/logo.png" alt="Vasool Raja Logo Background" className="w-64 h-64 object-contain filter grayscale invert" />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Appointments</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{myAppointments.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcoming.length}</div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-xl font-display font-bold">Next Appointment</h3>
        {isLoading ? (
          <motion.div 
            className="bg-card rounded-2xl h-32 border border-border shadow-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          ></motion.div>
        ) : nextAppointment ? (
          <Card className="rounded-2xl border-primary/20 shadow-md bg-primary/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-primary font-semibold mb-1">
                  {format(new Date(nextAppointment.date), "EEEE, MMMM do, yyyy")}
                </p>
                <h4 className="text-lg font-bold">Consultation</h4>
                <p className="text-muted-foreground text-sm mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {format(new Date(nextAppointment.date), "h:mm a")}
                </p>
              </div>
              <StatusBadge status={nextAppointment.status} />
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-dashed bg-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>You have no upcoming appointments.</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
