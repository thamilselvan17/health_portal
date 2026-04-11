import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

declare module "express-session" {
  interface SessionData {
    userId: number;
    role: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const MemStore = MemoryStore(session);

  // Trust Vercel's reverse proxy for secure cookies
  if (process.env.VERCEL) {
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
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Doctor Availability
  app.get(api.doctorAvailability.get.path, requireAuth, async (req, res) => {
    const doctorId = parseInt(req.params.id);
    const availability = await storage.getDoctorAvailability(doctorId);
    res.status(200).json(availability);
  });

  app.put(api.doctorAvailability.update.path, requireAuth, async (req, res) => {
    try {
      if (req.session.role !== "doctor") {
        return res.status(401).json({ message: "Only doctors can update availability" });
      }
      
      const input = api.doctorAvailability.update.input.parse(req.body);
      
      const updatedAvailabilityData = input.availability.map(slot => ({
        ...slot,
        doctorId: req.session.userId!
      }));
      
      const savedAvailability = await storage.updateDoctorAvailability(req.session.userId!, updatedAvailabilityData as any);
      res.status(200).json(savedAvailability);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.doctorAvailability.slots.path, requireAuth, async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const dateStr = req.query.date as string;
      
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return res.status(400).json({ message: "Valid date query parameter (YYYY-MM-DD) is required" });
      }

      const targetDate = new Date(dateStr);
      const dayOfWeek = targetDate.getDay(); 

      const availability = await storage.getDoctorAvailability(doctorId);
      const dayAvailability = availability.filter(a => a.dayOfWeek === dayOfWeek);

      if (dayAvailability.length === 0) {
        return res.status(200).json([]); 
      }

      const slots: string[] = [];
      for (const period of dayAvailability) {
        let currentSlot = period.startTime; 
        
        while (currentSlot < period.endTime) {
          slots.push(currentSlot);
          
          const [hours, mins] = currentSlot.split(":").map(Number);
          const totalMins = hours * 60 + mins + 30;
          const nextHours = Math.floor(totalMins / 60).toString().padStart(2, "0");
          const nextMins = (totalMins % 60).toString().padStart(2, "0");
          currentSlot = `${nextHours}:${nextMins}`;
        }
      }

      const appointments = await storage.getAppointmentsByUser(doctorId, "doctor");
      const bookedAppointments = appointments.filter(app => {
        if (app.status === "rejected") return false;
        
        const appDate = new Date(app.date);
        const appDateStr = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, '0')}-${String(appDate.getDate()).padStart(2, '0')}`;
        return appDateStr === dateStr;
      });

      const bookedTimes = bookedAppointments.map(app => {
        const appDate = new Date(app.date);
        const hours = appDate.getHours().toString().padStart(2, "0");
        const mins = appDate.getMinutes().toString().padStart(2, "0");
        return `${hours}:${mins}`;
      });

      const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));
      availableSlots.sort();

      res.status(200).json(availableSlots);
    } catch (err) {
      console.error("Error fetching slots:", err);
      res.status(500).json({ message: "Internal server error" });
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
        studentId: z.coerce.number(),
        doctorId: z.coerce.number()
      });
      const input = inputSchema.parse(req.body);
      
      if (req.session.role === "student" && input.studentId !== req.session.userId) {
        return res.status(401).json({ message: "Can only book for yourself" });
      }

      const appointment = await storage.createAppointment(input);
      
      // Notify the doctor
      const notification = await storage.createNotification({
        userId: appointment.doctorId,
        message: `New appointment requested by Patient #${appointment.studentId}`,
        type: 'appointment',
        relatedId: appointment.id,
      });
      wsServer.broadcastToUser(appointment.doctorId, 'notification', notification);

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
      const id = parseInt(req.params.id);
      
      if (req.session.role !== "doctor") {
         return res.status(401).json({ message: "Only doctors can update appointment status" });
      }
      
      const appointment = await storage.updateAppointment(id, input.status, input.notes);
      
      // Notify the student
      const notification = await storage.createNotification({
        userId: appointment.studentId,
        message: `Your appointment has been ${input.status}`,
        type: 'appointment',
        relatedId: appointment.id,
      });
      wsServer.broadcastToUser(appointment.studentId, 'notification', notification);
      
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
      const id = parseInt(req.params.id);
      
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
    const id = parseInt(req.params.id);
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
        patientId: z.coerce.number(),
        doctorId: z.coerce.number()
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
    const otherUserId = parseInt(req.params.userId);
    const messages = await storage.getMessages(req.session.userId!, otherUserId);
    res.status(200).json(messages);
  });

  app.post(api.messages.create.path, requireAuth, async (req, res) => {
    try {
      const inputSchema = api.messages.create.input.extend({
        senderId: z.coerce.number(),
        receiverId: z.coerce.number()
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
    const senderId = parseInt(req.params.senderId);
    await storage.markMessagesRead(req.session.userId!, senderId);
    res.status(200).json({ success: true });
  });

  // Notifications
  app.get(api.notifications.list.path, requireAuth, async (req, res) => {
    const notifications = await storage.getNotifications(req.session.userId!);
    res.status(200).json(notifications);
  });

  app.put(api.notifications.markRead.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.markNotificationRead(id);
    res.status(200).json({ success: true });
  });

  return httpServer;
}
