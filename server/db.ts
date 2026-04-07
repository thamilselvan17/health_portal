import dotenv from "dotenv";
import * as schema from "@shared/schema";

dotenv.config();

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";

// On Vercel serverless, the project root is read-only; use /tmp instead
const dbPath = process.env.VERCEL
  ? path.join("/tmp", "sqlite.db")
  : "sqlite.db";

let sqlite: InstanceType<typeof Database>;
try {
  sqlite = new Database(dbPath);
  console.log(`Database opened successfully at: ${dbPath}`);
} catch (err) {
  console.error(`FATAL: Failed to open database at ${dbPath}:`, err);
  throw err;
}

export const db = drizzle(sqlite, { schema });

// Auto-create tables (needed on Vercel where DB is ephemeral)
try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'doctor')),
      avatar TEXT
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      date INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'completed')),
      notes TEXT,
      rating INTEGER,
      feedback TEXT
    );
    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      date INTEGER NOT NULL,
      diagnosis TEXT NOT NULL,
      prescription TEXT,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS doctor_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
      read INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      related_id INTEGER,
      timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
      read INTEGER NOT NULL DEFAULT 0
    );
  `);
  console.log("Database tables created/verified successfully");
} catch (err) {
  console.error("FATAL: Failed to create database tables:", err);
  throw err;
}
