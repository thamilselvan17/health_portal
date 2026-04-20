import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { connectDB } from "./db";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize MongoDB connection
  await connectDB();

  const MemStore = MemoryStore(session);

  // Trust proxy for secure cookies (required for Render, Vercel, etc.)
  if (process.env.NODE_ENV === "production" || process.env.VERCEL || process.env.RENDER) {
    app.set("trust proxy", true);
  }

  const sessionParser = session({
    store: new MemStore({
      checkPeriod: 86400000 
    }),
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
    }
  });

  app.use(sessionParser);
  
  // Setup WebSocket server
  const wsServer = setupWebSocket(httpServer, sessionParser);

  // Health check (no DB dependency — useful for diagnosing Vercel routing)
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session.userId || req.session.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }
    next();
  };

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const user = await storage.createUser(input);
      req.session.userId = user.id;
      req.session.role = user.role;
      
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(input.email);
      
      if (!user || user.password !== input.password || user.role !== input.role) {
        return res.status(401).json({ message: "Invalid credentials or role" });
      }
      
      req.session.userId = user.id;
      req.session.role = user.role;
      
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get(api.auth.me.path, requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  });

  // Users
  app.get(api.users.doctors.path, requireAuth, async (req, res) => {
    const doctors = await storage.getDoctors();
    res.status(200).json(doctors);
  });

  app.get(api.users.patients.path, requireAuth, async (req, res) => {
    const patients = await storage.getPatients();
    res.status(200).json(patients);
  });

  app.post(api.users.updateAvatar.path, requireAuth, async (req, res) => {
    try {
      const input = api.users.updateAvatar.input.parse(req.body);
      const updatedUser = await storage.updateUserAvatar(req.session.userId!, input.avatar);
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Avatar update error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin
  app.get(api.admin.metrics.path, requireAdmin, async (_req, res) => {
    const metrics = await storage.getAdminMetrics();
    res.status(200).json(metrics);
  });

  // Doctor Availability
  app.get(api.doctorAvailability.get.path, requireAuth, async (req, res) => {
    const doctorId = req.params.id as string;
    const availability = await storage.getDoctorAvailability(doctorId);
    res.status(200).json(availability);
  });

  app.put(api.doctorAvailability.update.path, requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "doctor" || req.session.userId !== req.params.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { availability } = api.doctorAvailability.update.input.parse(req.body);
      const doctorId = req.params.id as string;
      const updated = await storage.updateDoctorAvailability(
        doctorId, 
        availability.map(a => ({ ...a, doctorId }))
      );
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.doctorAvailability.slots.path, requireAuth, async (req, res) => {
    try {
      const doctorId = req.params.id as string;
      const dateStr = req.query.date as string;
      
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
      }

      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      
      const availability = await storage.getDoctorAvailability(doctorId);
      const daySchedule = availability.find(a => a.dayOfWeek === dayOfWeek);
      
      if (!daySchedule) {
        return res.status(200).json([]);
      }

      // Simple slot generation: every 30 mins
      const slots = [];
      let current = new Date(`${dateStr}T${daySchedule.startTime}`);
      const end = new Date(`${dateStr}T${daySchedule.endTime}`);
      
      // Get existing appointments to filter slots
      const appointments = await storage.getAppointments();
      const bookedSlots = appointments
        .filter(a => a.doctorId === doctorId && a.status !== "rejected")
        .map(a => new Date(a.date).toISOString());

      while (current < end) {
        const slotTime = current.toISOString();
        if (!bookedSlots.includes(slotTime)) {
          slots.push(slotTime);
        }
        current = new Date(current.getTime() + 30 * 60000);
      }

      res.status(200).json(slots);
    } catch (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Appointments
  app.get(api.appointments.list.path, requireAuth, async (req, res) => {
    const appointments = await storage.getAppointmentsByUser(req.session.userId!, req.session.role!);
    res.status(200).json(appointments);
  });

  app.post(api.appointments.create.path, requireAuth, async (req, res) => {
    try {
      const inputSchema = api.appointments.create.input.extend({
        date: z.coerce.date(),
        studentId: z.string(),
        doctorId: z.string()
      });
      const input = inputSchema.parse(req.body);
      
      if (input.studentId !== req.session.userId) {
        return res.status(401).json({ message: "Can only create appointments for yourself" });
      }

      const appointment = await storage.createAppointment(input);
      
      // Create notification for doctor
      await storage.createNotification({
        userId: appointment.doctorId,
        message: "You have a new appointment request",
        type: "appointment_request",
        relatedId: appointment.id,
        read: false
      });

      // Broadcast via WS
      wsServer.broadcastToUser(appointment.doctorId, 'notification', { message: "New appointment request" });
      
      res.status(201).json(appointment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.appointments.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.appointments.update.input.parse(req.body);
      const id = req.params.id as string;
      
      if (req.session.role !== "doctor") {
         return res.status(401).json({ message: "Only doctors can update appointment status" });
      }
      
      const appointment = await storage.updateAppointment(id, input.status, input.notes);
      
      // Notify student
      await storage.createNotification({
        userId: appointment.studentId,
        message: `Your appointment has been ${input.status}`,
        type: "appointment_update",
        relatedId: appointment.id,
        read: false
      });

      wsServer.broadcastToUser(appointment.studentId, 'notification', { message: `Appointment ${input.status}` });
      
      res.status(200).json(appointment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.appointments.feedback.path, requireAuth, async (req, res) => {
    try {
      const input = api.appointments.feedback.input.parse(req.body);
      const id = req.params.id as string;
      
      if (req.session.role !== "student") {
         return res.status(401).json({ message: "Only students can leave feedback" });
      }
      
      const appointment = await storage.addAppointmentFeedback(id, input.rating, input.feedback);
      res.status(200).json(appointment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.appointments.delete.path, requireAuth, async (req, res) => {
    const id = req.params.id as string;
    await storage.deleteAppointment(id);
    res.status(204).send();
  });

  // Medical Records
  app.get(api.medicalRecords.list.path, requireAuth, async (req, res) => {
    const records = await storage.getMedicalRecordsByUser(req.session.userId!, req.session.role!);
    res.status(200).json(records);
  });

  app.post(api.medicalRecords.create.path, requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "doctor") {
         return res.status(401).json({ message: "Only doctors can create medical records" });
      }
      
      const inputSchema = api.medicalRecords.create.input.extend({
        patientId: z.string(),
        doctorId: z.string()
      });
      const input = inputSchema.parse(req.body);
      
      const record = await storage.createMedicalRecord(input);
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Messages
  app.get(api.messages.list.path, requireAuth, async (req, res) => {
    const otherUserId = req.params.userId as string;
    const messages = await storage.getMessages(req.session.userId!, otherUserId);
    res.status(200).json(messages);
  });

  app.post(api.messages.create.path, requireAuth, async (req, res) => {
    try {
      const inputSchema = api.messages.create.input.extend({
        senderId: z.string(),
        receiverId: z.string()
      });
      const input = inputSchema.parse(req.body);
      
      if (input.senderId !== req.session.userId) {
        return res.status(401).json({ message: "Can only send messages as yourself" });
      }

      const message = await storage.createMessage(input);
      
      // Notify receiver via WS
      wsServer.broadcastToUser(message.receiverId, 'message', message);
      
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.messages.markRead.path, requireAuth, async (req, res) => {
    const senderId = req.params.senderId as string;
    await storage.markMessagesRead(req.session.userId!, senderId);
    res.status(200).json({ success: true });
  });

  // Notifications
  app.get(api.notifications.list.path, requireAuth, async (req, res) => {
    const notifications = await storage.getNotifications(req.session.userId!);
    res.status(200).json(notifications);
  });

  app.put(api.notifications.markRead.path, requireAuth, async (req, res) => {
    const id = req.params.id as string;
    await storage.markNotificationRead(id);
    res.status(200).json({ success: true });
  });

  return httpServer;
}
