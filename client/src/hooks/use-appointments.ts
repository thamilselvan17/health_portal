import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type AppointmentResponse } from "@shared/routes";
import { z } from "zod";

export function useAppointments() {
  return useQuery<AppointmentResponse[]>({
    queryKey: [api.appointments.list.path],
    queryFn: async () => {
      const res = await fetch(api.appointments.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return api.appointments.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.appointments.create.input>) => {
      const res = await fetch(api.appointments.create.path, {
        method: api.appointments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create appointment");
      return api.appointments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.appointments.list.path] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & z.infer<typeof api.appointments.update.input>) => {
      const url = buildUrl(api.appointments.update.path, { id });
      const res = await fetch(url, {
        method: api.appointments.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update appointment");
      return api.appointments.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.appointments.list.path] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.appointments.delete.path, { id });
      const res = await fetch(url, {
        method: api.appointments.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete appointment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.appointments.list.path] });
    },
  });
}
