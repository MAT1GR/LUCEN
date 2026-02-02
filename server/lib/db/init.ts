// server/lib/db/init.ts
import bcrypt from "bcryptjs";
import { getDB, saveDatabase } from "./connection.js";

export function initializeSchema() {
  console.log("[DB] Initializing schema...");
  const db = getDB();

  const createTablesSQL = `
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      material TEXT NOT NULL,
      rise TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT,
      compare_at_price REAL,
      transfer_price REAL,
      images TEXT,
      video TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      colors TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_product_category ON products (name);

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image TEXT,
      is_active BOOLEAN DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      customer_doc_number TEXT,
      items TEXT NOT NULL,
      total INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      shipping_street_name TEXT,
      shipping_street_number TEXT,
      shipping_apartment TEXT,
      shipping_description TEXT,
      shipping_city TEXT,
      shipping_postal_code TEXT,
      shipping_province TEXT,
      shipping_cost INTEGER,
      shipping_name TEXT,
      shipping_details TEXT,
      payment_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      order_count INTEGER DEFAULT 0,
      total_spent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS drop_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      event_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      is_approved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  db.exec(createTablesSQL);

  // Seeding initial data
  seedInitialData();
  
  console.log("[DB] Schema initialized.");
  saveDatabase(); // Save after schema changes
}

function seedInitialData() {
  const db = getDB();

  // Seed admin user
  const adminCheck = db.prepare("SELECT COUNT(*) as count FROM admin_users");
  adminCheck.step();
  const adminRow = adminCheck.getAsObject() as { count: number };
  const adminExists = adminRow ? adminRow.count === 1 : false;
  adminCheck.free();

  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    db.run(
      `INSERT INTO admin_users (username, password, email, role) VALUES (?, ?, ?, ?)`,
      ["grigomati@gmail.com", hashedPassword, "admin@rosariodenim.com", "super_admin"]
    );
    console.log("✅ Default admin user created.");
  }

  // Seed site settings
  const settingsCheck = db.prepare("SELECT COUNT(*) as count FROM site_settings");
  settingsCheck.step();
  const settingsRow = settingsCheck.getAsObject() as { count: number };
  const settingsExist = settingsRow ? settingsRow.count > 0 : false;
  settingsCheck.free();

  if (!settingsExist) {
    const settings = [
      ["site_name", "Rosario Denim"],
      ["contact_email", "hola@rosariodenim.com"],
      ["contact_phone", "+54 9 341 123-4567"],
      ["contact_whatsapp", "543413981584"],
    ];
    const stmt = db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)");
    for (const [key, value] of settings) {
      stmt.run([key, value]);
    }
    stmt.free();
    console.log("✅ Default site settings created.");
  }
}