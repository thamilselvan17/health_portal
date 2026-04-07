import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users, appointments, medicalRecords, doctorAvailability,
  type User, type InsertUser, type UserWithoutPassword,
  type Appointment, type InsertAppointment,
  type MedicalRecord, type InsertMedicalRecord,
  type DoctorAvailability, type InsertDoctorAvailability,
  type Message, type InsertMessage,
  type Notification, type InsertNotification,
  messages, notifications
} from "@shared/schema";
import { or, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserAvatar(id: number, avatar: string): Promise<User>;
  getDoctors(): Promise<UserWithoutPassword[]>;
  getPatients(): Promise<UserWithoutPassword[]>;

  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByUser(userId: number, role: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, status: string, notes?: string): Promise<Appointment>;
  addAppointmentFeedback(id: number, rating: number, feedback: string): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;

  getMedicalRecordsByUser(userId: number, role: string): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;

  getDoctorAvailability(doctorId: number): Promise<DoctorAvailability[]>;
  updateDoctorAvailability(doctorId: number, availability: InsertDoctorAvailability[]): Promise<DoctorAvailability[]>;

  // Real-time features
  getMessages(userId1: number, userId2: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesRead(receiverId: number, senderId: number): Promise<void>;
  
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserAvatar(id: number, avatar: string): Promise<User> {
    const [updated] = await db.update(users)
      .set({ avatar })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getDoctors(): Promise<UserWithoutPassword[]> {
    const doctorsList = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatar: users.avatar,
    }).from(users).where(eq(users.role, "doctor"));
    return doctorsList;
  }

  async getPatients(): Promise<UserWithoutPassword[]> {
    const patientsList = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatar: users.avatar,
    }).from(users).where(eq(users.role, "student"));
    return patientsList;
  }

  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }

  async getAppointmentsByUser(userId: number, role: string): Promise<Appointment[]> {
    if (role === "student") {
      return await db.select().from(appointments).where(eq(appointments.studentId, userId));
    } else {
      return await db.select().from(appointments).where(eq(appointments.doctorId, userId));
    }
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [created] = await db.insert(appointments).values(appointment).returning();
    return created;
  }

  async updateAppointment(id: number, status: string, notes?: string): Promise<Appointment> {
    const updateData: Partial<Appointment> = { status };
    if (notes !== undefined) updateData.notes = notes;

    const [updated] = await db.update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  async addAppointmentFeedback(id: number, rating: number, feedback: string): Promise<Appointment> {
    const [updated] = await db.update(appointments)
      .set({ rating, feedback })
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async getMedicalRecordsByUser(userId: number, role: string): Promise<MedicalRecord[]> {
    if (role === "student") {
      return await db.select().from(medicalRecords).where(eq(medicalRecords.patientId, userId));
    } else {
      return await db.select().from(medicalRecords).where(eq(medicalRecords.doctorId, userId));
    }
  }

  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const [created] = await db.insert(medicalRecords).values({ ...record, date: new Date() }).returning();
    return created;
  }

  async getDoctorAvailability(doctorId: number): Promise<DoctorAvailability[]> {
    return await db.select().from(doctorAvailability).where(eq(doctorAvailability.doctorId, doctorId));
  }

  async updateDoctorAvailability(doctorId: number, availability: InsertDoctorAvailability[]): Promise<DoctorAvailability[]> {
    await db.delete(doctorAvailability).where(eq(doctorAvailability.doctorId, doctorId));
    
    if (availability.length === 0) return [];
    
    return await db.insert(doctorAvailability).values(availability).returning();
  }

  async getMessages(userId1: number, userId2: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(messages.timestamp);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async markMessagesRead(receiverId: number, senderId: number): Promise<void> {
    await db.update(messages)
      .set({ read: true })
      .where(and(eq(messages.receiverId, receiverId), eq(messages.senderId, senderId)));
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.timestamp);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
