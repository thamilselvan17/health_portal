import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StudentDashboard } from "./student-dashboard";
import { DoctorDashboard } from "./doctor-dashboard";
import { AdminDashboard } from "./admin-dashboard";
import { useAuth } from "@/hooks/use-auth";

export function DashboardIndex() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }
  
  return (
    <DashboardLayout>
      {user.role === 'admin' ? <AdminDashboard /> : 
       user.role === 'student' ? <StudentDashboard /> : <DoctorDashboard />}
    </DashboardLayout>
  );
}
