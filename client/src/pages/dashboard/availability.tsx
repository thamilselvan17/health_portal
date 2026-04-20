import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

interface DaySchedule {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export function AvailabilityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS_OF_WEEK.map((_, i) => ({
      dayOfWeek: i,
      enabled: false,
      startTime: "09:00",
      endTime: "17:00"
    }))
  );

  const { data: availability, isLoading } = useQuery({
    queryKey: ["/api/doctors/availability", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/doctors/${user?.id}/availability`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (availability && Array.isArray(availability)) {
      setSchedule(prev => {
        const newSchedule = [...prev];
        availability.forEach((slot: any) => {
          const index = newSchedule.findIndex(s => s.dayOfWeek === slot.dayOfWeek);
          if (index !== -1) {
            newSchedule[index] = {
              dayOfWeek: slot.dayOfWeek,
              enabled: true,
              startTime: slot.startTime,
              endTime: slot.endTime
            };
          }
        });
        return newSchedule;
      });
    }
  }, [availability]);

  const updateMutation = useMutation({
    mutationFn: async (newAvailability: any[]) => {
      const res = await apiRequest("PUT", `/api/doctors/${user?.id}/availability`, {
        availability: newAvailability
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors/availability", user?.id] });
      toast({
        title: "Success",
        description: "Your availability has been updated."
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  });

  const handleSave = () => {
    const activeSlots = schedule
      .filter(day => day.enabled)
      .map(day => ({
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime
      }));
      
    updateMutation.mutate(activeSlots);
  };

  const updateDay = (dayOfWeek: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule(prev => prev.map(day => 
      day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
    ));
  };

  if (!user || user.role !== "doctor") return null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Working Hours</h1>
          <p className="text-muted-foreground mt-2">
            Configure your weekly availability. Students will only be able to book appointments during these periods.
          </p>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {schedule.map((day) => (
                <div key={day.dayOfWeek} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 w-48">
                    <Switch 
                      checked={day.enabled}
                      onCheckedChange={(checked) => updateDay(day.dayOfWeek, "enabled", checked)}
                      id={`enable-${day.dayOfWeek}`}
                    />
                    <Label 
                      htmlFor={`enable-${day.dayOfWeek}`}
                      className={`font-semibold text-base ${day.enabled ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {DAYS_OF_WEEK[day.dayOfWeek]}
                    </Label>
                  </div>
                  
                  <div className={`flex items-center gap-4 flex-1 ${!day.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="time" 
                        value={day.startTime}
                        onChange={(e) => updateDay(day.dayOfWeek, "startTime", e.target.value)}
                        className="w-[120px]"
                      />
                      <span className="text-muted-foreground font-medium">to</span>
                      <Input 
                        type="time" 
                        value={day.endTime}
                        onChange={(e) => updateDay(day.dayOfWeek, "endTime", e.target.value)}
                        className="w-[120px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="p-6 bg-muted/50 border-t flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={updateMutation.isPending || isLoading}
              className="gap-2"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Availability
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
