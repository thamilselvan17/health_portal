import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StudentDashboard } from "./student-dashboard";
import { DoctorDashboard } from "./doctor-dashboard";
import { useAuth } from "@/hooks/use-auth";

export function DashboardIndex() {
  const { user } = useAuth();
  
  return (
    <DashboardLayout>
      {user?.role === 'student' ? <StudentDashboard /> : <DoctorDashboard />}
    </DashboardLayout>
  );
}
