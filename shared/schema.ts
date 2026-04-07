import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users ──────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "doctor"] }).notNull(),
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserWithoutPassword = Omit<User, "password">;

// ── Appointments ───────────────────────────────────────
export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "completed"] }).notNull().default("pending"),
  notes: text("notes"),
  rating: integer("rating"),
  feedback: text("feedback"),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// ── Medical Records ────────────────────────────────────
export const medicalRecords = sqliteTable("medical_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  diagnosis: text("diagnosis").notNull(),
  prescription: text("prescription"),
  notes: text("notes"),
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({ id: true });
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;

// ── Doctor Availability ────────────────────────────────
export const doctorAvailability = sqliteTable("doctor_availability", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  doctorId: integer("doctor_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday … 6=Saturday
  startTime: text("start_time").notNull(),      // "HH:mm"
  endTime: text("end_time").notNull(),            // "HH:mm"
});

export const insertDoctorAvailabilitySchema = createInsertSchema(doctorAvailability).omit({ id: true });
export type DoctorAvailability = typeof doctorAvailability.$inferSelect;
export type InsertDoctorAvailability = z.infer<typeof insertDoctorAvailabilitySchema>;

// ── Messages ───────────────────────────────────────────
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true });
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// ── Notifications ──────────────────────────────────────
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  relatedId: integer("related_id"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true });
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
