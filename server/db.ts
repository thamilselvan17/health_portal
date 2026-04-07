import dotenv from "dotenv";
import * as schema from "@shared/schema";

dotenv.config();

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });
