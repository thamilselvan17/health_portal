import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { usePatients } from "@/hooks/use-users";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Mail } from "lucide-react";
import { Redirect } from "wouter";

export function PatientsPage() {
  const { user } = useAuth();
  const { data: patients, isLoading } = usePatients();

  if (user?.role === 'student') return <Redirect to="/dashboard" />;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">My Patients</h1>
        <p className="text-muted-foreground mt-1">Directory of registered students</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse h-32 rounded-2xl" />
          ))
        ) : patients?.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No patients registered yet.</p>
          </div>
        ) : (
          patients?.map((patient) => (
            <Card key={patient.id} className="rounded-2xl hover:shadow-md transition-shadow cursor-default">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {patient.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">{patient.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[180px]">{patient.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
