import { z } from "zod";

// ── Shared Types ───────────────────────────────────────
// We use string IDs to stay native to MongoDB ObjectIds

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z.enum(["student", "doctor", "admin"]),
  avatar: z.string().optional().nullable(),
});

export type User = z.infer<typeof userSchema>;
export type UserWithoutPassword = Omit<User, "password">;
export const insertUserSchema = userSchema.omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

export const appointmentSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  doctorId: z.string(),
  date: z.coerce.date(),
  reason: z.string(),
  status: z.enum(["pending", "approved", "rejected", "completed"]),
  notes: z.string().optional().nullable(),
  rating: z.number().optional().nullable(),
  feedback: z.string().optional().nullable(),
});

export type Appointment = z.infer<typeof appointmentSchema>;
// status is optional for insertion as it defaults to 'pending'
export const insertAppointmentSchema = appointmentSchema.omit({ id: true, status: true }).extend({
  status: z.enum(["pending", "approved", "rejected", "completed"]).optional()
});
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export const medicalRecordSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  date: z.coerce.date(),
  diagnosis: z.string(),
  prescription: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type MedicalRecord = z.infer<typeof medicalRecordSchema>;
export const insertMedicalRecordSchema = medicalRecordSchema.omit({ id: true, date: true });
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;

export const doctorAvailabilitySchema = z.object({
  id: z.string(),
  doctorId: z.string(),
  dayOfWeek: z.number(), // 0=Sunday … 6=Saturday
  startTime: z.string(),      // "HH:mm"
  endTime: z.string(),        // "HH:mm"
});

export type DoctorAvailability = z.infer<typeof doctorAvailabilitySchema>;
export const insertDoctorAvailabilitySchema = doctorAvailabilitySchema.omit({ id: true });
export type InsertDoctorAvailability = z.infer<typeof insertDoctorAvailabilitySchema>;

export const messageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string(),
  timestamp: z.coerce.date(),
  read: z.boolean(),
});

export type Message = z.infer<typeof messageSchema>;
export const insertMessageSchema = messageSchema.omit({ id: true, timestamp: true, read: true }).extend({
  read: z.boolean().optional()
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  message: z.string(),
  type: z.string(),
  relatedId: z.string().optional().nullable(),
  timestamp: z.coerce.date(),
  read: z.boolean(),
});

export type Notification = z.infer<typeof notificationSchema>;
export const insertNotificationSchema = notificationSchema.omit({ id: true, timestamp: true, read: true }).extend({
  read: z.boolean().optional()
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
