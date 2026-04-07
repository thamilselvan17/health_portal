import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type MedicalRecordResponse } from "@shared/routes";
import { z } from "zod";

export function useMedicalRecords() {
  return useQuery<MedicalRecordResponse[]>({
    queryKey: [api.medicalRecords.list.path],
    queryFn: async () => {
      const res = await fetch(api.medicalRecords.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch medical records");
      return api.medicalRecords.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.medicalRecords.create.input>) => {
      const res = await fetch(api.medicalRecords.create.path, {
        method: api.medicalRecords.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create medical record");
      return api.medicalRecords.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.medicalRecords.list.path] });
    },
  });
}
