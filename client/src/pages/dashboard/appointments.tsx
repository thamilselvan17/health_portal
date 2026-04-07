import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useAppointments, useCreateAppointment, useUpdateAppointment } from "@/hooks/use-appointments";
import { apiRequest } from "@/lib/queryClient";
import { useDoctors, usePatients } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Loader2, Star } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { FeedbackDialog } from "@/components/feedback-dialog";

export function AppointmentsPage() {
  const { user } = useAuth();
  const { data: appointments } = useAppointments();
  const { data: doctors } = useDoctors();
  const { data: patients } = usePatients();
  
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [date, setDate] = useState<Date>();
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  const { data: availableSlots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ["/api/doctors/slots", selectedDoctorId, date],
    queryFn: async () => {
      if (!selectedDoctorId || !date) return [];
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const res = await apiRequest("GET", `/api/doctors/${selectedDoctorId}/slots?date=${dateStr}`);
      return res.json() as Promise<string[]>;
    },
    enabled: !!selectedDoctorId && !!date,
  });
  
  if (!user) return null;

  const isStudent = user.role === 'student';
  const myAppointments = appointments?.filter(
    a => isStudent ? a.studentId === user.id : a.doctorId === user.id
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !selectedDoctorId || !selectedSlot) {
      toast({ title: "Error", description: "Please select a doctor, date, and time slot", variant: "destructive" });
      return;
    }
    
    const appointmentDate = new Date(date);
    const [hours, mins] = selectedSlot.split(":").map(Number);
    appointmentDate.setHours(hours, mins, 0, 0);

    try {
      await createAppointment.mutateAsync({
        studentId: user.id,
        doctorId: parseInt(selectedDoctorId),
        date: appointmentDate,
      });
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Appointment requested successfully!" });
      setDate(undefined);
      setSelectedDoctorId("");
      setSelectedSlot("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await updateAppointment.mutateAsync({ id, status });
      toast({ title: "Updated", description: `Appointment marked as ${status}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const doctorAppointmentsOnDate = myAppointments.filter(app => {
    const appDate = new Date(app.date);
    return appDate.toDateString() === viewDate.toDateString();
  });

  const bookedDates = myAppointments.map(app => new Date(app.date));

  const renderAppointmentItem = (appt: any) => {
    const otherPerson = isStudent 
      ? doctors?.find(d => d.id === appt.doctorId)
      : patients?.find(p => p.id === appt.studentId);
      
    const displayName = isStudent ? `Dr. ${otherPerson?.name}` : otherPerson?.name || `Patient #${appt.studentId}`;

    return (
      <div key={appt.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors border-b last:border-0 border-border">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
            {otherPerson?.avatar ? (
              <img src={otherPerson.avatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-primary text-xs uppercase">{displayName.substring(isStudent ? 4 : 0, isStudent ? 6 : 2)}</span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{displayName}</h3>
            <p className="text-muted-foreground flex items-center gap-2 mt-1 text-sm">
              <CalendarIcon className="w-4 h-4" />
              {format(new Date(appt.date), "EEEE, MMMM do, yyyy - h:mm a")}
            </p>
            {appt.rating && (
              <div className="flex items-center gap-1 mt-2 text-sm">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${star <= appt.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`}
                    />
                  ))}
                </div>
                {appt.feedback && <span className="text-muted-foreground italic ml-2">"{appt.feedback}"</span>}
                {isStudent && (
                  <div className="ml-2">
                    <FeedbackDialog 
                      appointmentId={appt.id} 
                      initialRating={appt.rating} 
                      initialFeedback={appt.feedback || ""} 
                      isEdit={true} 
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <StatusBadge status={appt.status} />
          
          {!isStudent && appt.status === 'pending' && (
            <div className="flex gap-2 ml-2">
              <Button 
                size="icon" 
                variant="outline" 
                className="h-9 w-9 rounded-full text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200"
                onClick={() => handleStatusUpdate(appt.id, 'approved')}
                title="Approve"
              >
                <CheckCircle2 className="w-5 h-5" />
              </Button>
              <Button 
                size="icon" 
                variant="outline" 
                className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                onClick={() => handleStatusUpdate(appt.id, 'rejected')}
                title="Reject"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
          )}

          {!isStudent && appt.status === 'approved' && (
            <Button 
              size="sm"
              variant="secondary"
              onClick={() => handleStatusUpdate(appt.id, 'completed')}
              className="rounded-full"
            >
              Mark Completed
            </Button>
          )}

          {isStudent && appt.status === 'completed' && !appt.rating && (
            <FeedbackDialog appointmentId={appt.id} />
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            {isStudent ? "Manage your healthcare visits" : "Manage your patient schedule"}
          </p>
        </div>
        
        {isStudent && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all h-11 px-6">
                Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Book a Visit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBook} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label>Select Doctor</Label>
                  <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors?.map(doc => (
                        <SelectItem key={doc.id} value={doc.id.toString()}>
                          Dr. {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 flex flex-col">
                  <Label>Select Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`h-12 rounded-xl justify-start text-left font-normal border-input ${!date && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {date && selectedDoctorId && (
                  <div className="space-y-2">
                    <Label>Available Slots</Label>
                    {isLoadingSlots ? (
                      <div className="py-4 text-center text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Fetching slots...
                      </div>
                    ) : availableSlots && availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                         {availableSlots.map(slot => (
                           <Button 
                             key={slot} 
                             type="button" 
                             variant={selectedSlot === slot ? "default" : "outline"}
                             onClick={() => setSelectedSlot(slot)}
                             className="w-full h-10"
                           >
                             {slot}
                           </Button>
                         ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
                        No availability on this date.
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base"
                  disabled={createAppointment.isPending || !selectedSlot}
                >
                  Confirm Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-card h-fit xl:col-span-1">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">Calendar</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex justify-center">
              <Calendar
                mode="single"
                selected={viewDate}
                onSelect={(d) => d && setViewDate(d)}
                modifiers={{ booked: bookedDates }}
                modifiersStyles={{
                  booked: { fontWeight: 'bold', backgroundColor: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))' }
                }}
                className="rounded-xl border shadow-sm p-3"
              />
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-card lg:col-span-2">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">Appointments on {format(viewDate, "MMMM do, yyyy")}</CardTitle>
            </CardHeader>
            <div className="divide-y min-h-[300px]">
              {doctorAppointmentsOnDate.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                  <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p>No appointments scheduled for this date.</p>
                </div>
              ) : (
                doctorAppointmentsOnDate.map(renderAppointmentItem)
              )}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-card">
          <div className="divide-y">
            {myAppointments.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p>No appointments found.</p>
              </div>
            ) : (
              myAppointments.map(renderAppointmentItem)
            )}
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
