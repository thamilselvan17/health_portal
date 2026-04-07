import { useQuery } from "@tanstack/react-query";
import { api, type AuthResponse } from "@shared/routes";

export function useDoctors() {
  return useQuery<AuthResponse[]>({
    queryKey: [api.users.doctors.path],
    queryFn: async () => {
      const res = await fetch(api.users.doctors.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch doctors");
      return api.users.doctors.responses[200].parse(await res.json());
    },
  });
}

export function usePatients() {
  return useQuery<AuthResponse[]>({
    queryKey: [api.users.patients.path],
    queryFn: async () => {
      const res = await fetch(api.users.patients.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch patients");
      return api.users.patients.responses[200].parse(await res.json());
    },
  });
}
