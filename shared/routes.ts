import { z } from "zod";

// ── Shared response schemas ────────────────────────────
const userResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  avatar: z.string().nullable(),
});

const appointmentResponseSchema = z.object({
  id: z.number(),
  studentId: z.number(),
  doctorId: z.number(),
  date: z.coerce.date(),
  reason: z.string(),
  status: z.string(),
  notes: z.string().nullable(),
  rating: z.number().nullable(),
  feedback: z.string().nullable(),
});

const medicalRecordResponseSchema = z.object({
  id: z.number(),
  patientId: z.number(),
  doctorId: z.number(),
  date: z.coerce.date(),
  diagnosis: z.string(),
  prescription: z.string().nullable(),
  notes: z.string().nullable(),
});

export type AuthResponse = z.infer<typeof userResponseSchema>;
export type AppointmentResponse = z.infer<typeof appointmentResponseSchema>;
export type MedicalRecordResponse = z.infer<typeof medicalRecordResponseSchema>;

// ── Helper ─────────────────────────────────────────────
export function buildUrl(
  template: string,
  params: Record<string, string | number>,
): string {
  let url = template;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, String(value));
  }
  return url;
}

// ── API contract ───────────────────────────────────────
export const api = {
  auth: {
    register: {
      method: "POST" as const,
      path: "/api/auth/register",
      input: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        role: z.enum(["student", "doctor"]),
      }),
      responses: { 201: userResponseSchema },
    },
    login: {
      method: "POST" as const,
      path: "/api/auth/login",
      input: z.object({
        email: z.string().email(),
        password: z.string(),
        role: z.enum(["student", "doctor"]),
      }),
      responses: { 200: userResponseSchema },
    },
    logout: {
      method: "POST" as const,
      path: "/api/auth/logout",
      input: z.object({}),
      responses: { 200: z.object({ message: z.string() }) },
    },
    me: {
      method: "GET" as const,
      path: "/api/auth/me",
      responses: { 200: userResponseSchema },
    },
  },

  users: {
    doctors: {
      method: "GET" as const,
      path: "/api/users/doctors",
      responses: { 200: z.array(userResponseSchema) },
    },
    patients: {
      method: "GET" as const,
      path: "/api/users/patients",
      responses: { 200: z.array(userResponseSchema) },
    },
    updateAvatar: {
      method: "POST" as const,
      path: "/api/users/avatar",
      input: z.object({ avatar: z.string() }),
      responses: { 200: userResponseSchema },
    },
  },

  doctorAvailability: {
    get: {
      method: "GET" as const,
      path: "/api/doctors/:id/availability",
      responses: { 200: z.array(z.any()) },
    },
    update: {
      method: "PUT" as const,
      path: "/api/doctors/:id/availability",
      input: z.object({
        availability: z.array(
          z.object({
            dayOfWeek: z.number(),
            startTime: z.string(),
            endTime: z.string(),
          }),
        ),
      }),
      responses: { 200: z.array(z.any()) },
    },
    slots: {
      method: "GET" as const,
      path: "/api/doctors/:id/slots",
      responses: { 200: z.array(z.string()) },
    },
  },

  appointments: {
    list: {
      method: "GET" as const,
      path: "/api/appointments",
      responses: { 200: z.array(appointmentResponseSchema) },
    },
    create: {
      method: "POST" as const,
      path: "/api/appointments",
      input: z.object({
        studentId: z.number(),
        doctorId: z.number(),
        date: z.coerce.date(),
        reason: z.string().min(1, "Reason is required"),
      }),
      responses: { 201: appointmentResponseSchema },
    },
    update: {
      method: "PUT" as const,
      path: "/api/appointments/:id",
      input: z.object({
        status: z.enum(["pending", "approved", "rejected", "completed"]),
        notes: z.string().optional(),
      }),
      responses: { 200: appointmentResponseSchema },
    },
    feedback: {
      method: "PUT" as const,
      path: "/api/appointments/:id/feedback",
      input: z.object({
        rating: z.number().min(1).max(5),
        feedback: z.string(),
      }),
      responses: { 200: appointmentResponseSchema },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/appointments/:id",
      responses: { 204: z.void() },
    },
  },

  medicalRecords: {
    list: {
      method: "GET" as const,
      path: "/api/medical-records",
      responses: { 200: z.array(medicalRecordResponseSchema) },
    },
    create: {
      method: "POST" as const,
      path: "/api/medical-records",
      input: z.object({
        patientId: z.number(),
        doctorId: z.number(),
        diagnosis: z.string().min(1, "Diagnosis is required"),
        prescription: z.string().optional(),
        notes: z.string().optional(),
      }),
      responses: { 201: medicalRecordResponseSchema },
    },
  },

  messages: {
    list: {
      method: "GET" as const,
      path: "/api/messages/:userId",
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/messages",
      input: z.object({
        senderId: z.number(),
        receiverId: z.number(),
        content: z.string().min(1),
      }),
      responses: { 201: z.any() },
    },
    markRead: {
      method: "PUT" as const,
      path: "/api/messages/:senderId/read",
      responses: { 200: z.object({ success: z.boolean() }) },
    },
  },

  notifications: {
    list: {
      method: "GET" as const,
      path: "/api/notifications",
      responses: { 200: z.array(z.any()) },
    },
    markRead: {
      method: "PUT" as const,
      path: "/api/notifications/:id/read",
      responses: { 200: z.object({ success: z.boolean() }) },
    },
  },
};
