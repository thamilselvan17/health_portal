import { useAuth } from "@/hooks/use-auth";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Bell } from "lucide-react";
import { format, isToday } from "date-fns";

export function DoctorDashboard() {
  const { user } = useAuth();
  const { data: appointments, isLoading: isLoadingAppts } = useAppointments();
  const { data: patients, isLoading: isLoadingPatients } = usePatients();

  const myAppointments = appointments?.filter(a => a.doctorId === user?.id) || [];
  const pendingRequests = myAppointments.filter(a => a.status === 'pending');
  const todayAppointments = myAppointments.filter(a => isToday(new Date(a.date)) && a.status === 'approved');

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-slate-800 to-slate-700 p-8 text-white shadow-xl shadow-black/10 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-display font-bold mb-2">Dr. {user?.name}</h2>
          <p className="text-white/80 max-w-lg text-lg">
            You have {todayAppointments.length} appointments today and {pendingRequests.length} pending requests.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow">
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

        <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow">
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

        <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow">
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
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-display font-bold">Today's Appointments</h3>
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <div className="divide-y">
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
      </div>
    </div>
  );
}
