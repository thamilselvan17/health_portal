import { mongoose } from "./db";
import {
  type User, type InsertUser, type UserWithoutPassword,
  type Appointment, type InsertAppointment,
  type MedicalRecord, type InsertMedicalRecord,
  type DoctorAvailability, type InsertDoctorAvailability,
  type Message, type InsertMessage,
  type Notification, type InsertNotification
} from "@shared/schema";

// ── Models ─────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "doctor", "admin"], required: true },
  avatar: { type: String },
}, { 
  toJSON: { 
    transform: (doc, ret: any) => { 
      ret.id = ret._id.toString(); 
      delete ret._id; 
      delete ret.__v; 
    } 
  } 
});

const appointmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "completed"], default: "pending" },
  notes: { type: String },
  rating: { type: Number },
  feedback: { type: String },
}, { 
  toJSON: { 
    transform: (doc, ret: any) => { 
      ret.id = ret._id.toString(); 
      ret.studentId = ret.studentId.toString();
      ret.doctorId = ret.doctorId.toString();
      delete ret._id; 
      delete ret.__v; 
    } 
  } 
});

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  diagnosis: { type: String, required: true },
  prescription: { type: String },
  notes: { type: String },
}, { 
  toJSON: { 
    transform: (doc, ret: any) => { 
      ret.id = ret._id.toString(); 
      ret.patientId = ret.patientId.toString();
      ret.doctorId = ret.doctorId.toString();
      delete ret._id; 
      delete ret.__v; 
    } 
  } 
});

const doctorAvailabilitySchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayOfWeek: { type: Number, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
}, { 
  toJSON: { 
    transform: (doc, ret: any) => { 
      ret.id = ret._id.toString(); 
      ret.doctorId = ret.doctorId.toString();
      delete ret._id; 
      delete ret.__v; 
    } 
  } 
});

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
}, { 
  toJSON: { 
    transform: (doc, ret: any) => { 
      ret.id = ret._id.toString(); 
      ret.senderId = ret.senderId.toString();
      ret.receiverId = ret.receiverId.toString();
      delete ret._id; 
      delete ret.__v; 
    } 
  } 
});

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  relatedId: { type: String },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
}, { 
  toJSON: { 
    transform: (doc, ret: any) => { 
      ret.id = ret._id.toString(); 
      ret.userId = ret.userId.toString();
      delete ret._id; 
      delete ret.__v; 
    } 
  } 
});

const UserModel = mongoose.model("User", userSchema);
const AppointmentModel = mongoose.model("Appointment", appointmentSchema);
const MedicalRecordModel = mongoose.model("MedicalRecord", medicalRecordSchema);
const DoctorAvailabilityModel = mongoose.model("DoctorAvailability", doctorAvailabilitySchema);
const MessageModel = mongoose.model("Message", messageSchema);
const NotificationModel = mongoose.model("Notification", notificationSchema);

// ── Storage Implementation ─────────────────────────────

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserAvatar(id: string, avatar: string): Promise<User>;
  getDoctors(): Promise<UserWithoutPassword[]>;
  getPatients(): Promise<UserWithoutPassword[]>;

  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByUser(userId: string, role: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, status: "pending" | "approved" | "rejected" | "completed", notes?: string): Promise<Appointment>;
  addAppointmentFeedback(id: string, rating: number, feedback: string): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;

  getMedicalRecordsByUser(userId: string, role: string): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;

  getDoctorAvailability(doctorId: string): Promise<DoctorAvailability[]>;
  updateDoctorAvailability(doctorId: string, availability: InsertDoctorAvailability[]): Promise<DoctorAvailability[]>;

  getMessages(userId1: string, userId2: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesRead(receiverId: string, senderId: string): Promise<void>;
  
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;

  getAdminMetrics(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findById(id);
    return user ? user.toJSON() as any as User : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email });
    return user ? user.toJSON() as any as User : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = new UserModel(insertUser);
    await user.save();
    return user.toJSON() as any as User;
  }

  async updateUserAvatar(id: string, avatar: string): Promise<User> {
    const user = await UserModel.findByIdAndUpdate(id, { avatar }, { new: true });
    if (!user) throw new Error("User not found");
    return user.toJSON() as any as User;
  }

  async getDoctors(): Promise<UserWithoutPassword[]> {
    const doctors = await UserModel.find({ role: "doctor" });
    return doctors.map(u => u.toJSON() as any as UserWithoutPassword);
  }

  async getPatients(): Promise<UserWithoutPassword[]> {
    const patients = await UserModel.find({ role: "student" });
    return patients.map(u => u.toJSON() as any as UserWithoutPassword);
  }

  async getAppointments(): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find();
    return appointments.map(a => a.toJSON() as any as Appointment);
  }

  async getAppointmentsByUser(userId: string, role: string): Promise<Appointment[]> {
    const query = role === "student" ? { studentId: userId } : { doctorId: userId };
    const appointments = await AppointmentModel.find(query);
    return appointments.map(a => a.toJSON() as any as Appointment);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const created = new AppointmentModel(appointment);
    await created.save();
    return created.toJSON() as any as Appointment;
  }

  async updateAppointment(id: string, status: "pending" | "approved" | "rejected" | "completed", notes?: string): Promise<Appointment> {
    const update: any = { status };
    if (notes !== undefined) update.notes = notes;
    const updated = await AppointmentModel.findByIdAndUpdate(id, update, { new: true });
    if (!updated) throw new Error("Appointment not found");
    return updated.toJSON() as any as Appointment;
  }

  async addAppointmentFeedback(id: string, rating: number, feedback: string): Promise<Appointment> {
    const updated = await AppointmentModel.findByIdAndUpdate(id, { rating, feedback }, { new: true });
    if (!updated) throw new Error("Appointment not found");
    return updated.toJSON() as any as Appointment;
  }

  async deleteAppointment(id: string): Promise<void> {
    await AppointmentModel.findByIdAndDelete(id);
  }

  async getMedicalRecordsByUser(userId: string, role: string): Promise<MedicalRecord[]> {
    const query = role === "student" ? { patientId: userId } : { doctorId: userId };
    const records = await MedicalRecordModel.find(query);
    return records.map(r => r.toJSON() as any as MedicalRecord);
  }

  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const created = new MedicalRecordModel(record);
    await created.save();
    return created.toJSON() as any as MedicalRecord;
  }

  async getDoctorAvailability(doctorId: string): Promise<DoctorAvailability[]> {
    const availability = await DoctorAvailabilityModel.find({ doctorId });
    return availability.map(a => a.toJSON() as any as DoctorAvailability);
  }

  async updateDoctorAvailability(doctorId: string, availability: InsertDoctorAvailability[]): Promise<DoctorAvailability[]> {
    await DoctorAvailabilityModel.deleteMany({ doctorId });
    if (availability.length === 0) return [];
    
    const docs = await DoctorAvailabilityModel.insertMany(
      availability.map(a => ({ ...a, doctorId }))
    );
    return (docs as any[]).map(d => d.toJSON() as any as DoctorAvailability);
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    const messages = await MessageModel.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }).sort({ timestamp: 1 });
    return messages.map(m => m.toJSON() as any as Message);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const created = new MessageModel(message);
    await created.save();
    return created.toJSON() as any as Message;
  }

  async markMessagesRead(receiverId: string, senderId: string): Promise<void> {
    await MessageModel.updateMany(
      { receiverId, senderId },
      { read: true }
    );
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const notifications = await NotificationModel.find({ userId }).sort({ timestamp: 1 });
    return notifications.map(n => n.toJSON() as any as Notification);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const created = new NotificationModel(notification);
    await created.save();
    return created.toJSON() as any as Notification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await NotificationModel.findByIdAndUpdate(id, { read: true });
  }

  async getAdminMetrics(): Promise<any> {
    const [totalStudents, totalDoctors, totalAppointments, totalRecords, allAppointments] = await Promise.all([
      UserModel.countDocuments({ role: "student" }),
      UserModel.countDocuments({ role: "doctor" }),
      AppointmentModel.countDocuments(),
      MedicalRecordModel.countDocuments(),
      AppointmentModel.find({}, 'status')
    ]);

    const appointmentsByStatus: Record<string, number> = {
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0
    };

    allAppointments.forEach(app => {
      const status = (app as any).status;
      if (appointmentsByStatus[status] !== undefined) {
        appointmentsByStatus[status]++;
      }
    });

    return {
      totalStudents,
      totalDoctors,
      totalAppointments,
      totalRecords,
      appointmentsByStatus
    };
  }
}

export const storage = new DatabaseStorage();
