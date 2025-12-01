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
      price INTEGER NOT NULL,
      images TEXT NOT NULL,
      video TEXT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      material TEXT NOT NULL,
      rise TEXT NOT NULL,
      rise_cm INTEGER,
      fit TEXT NOT NULL,
      waist_flat INTEGER,
      is_waist_stretchy BOOLEAN DEFAULT 0,
      length INTEGER,
      sizes TEXT NOT NULL,
      is_new BOOLEAN DEFAULT 0,
      is_best_seller BOOLEAN DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      faqs TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_product_category ON products (category);

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
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  db.exec(createTablesSQL);

<<<<<<< HEAD
  // --- Add faqs column to products table if it doesn't exist ---
  try {
    db.exec("ALTER TABLE products ADD COLUMN faqs TEXT DEFAULT '[]'");
    console.log("[DB] 'faqs' column added to 'products' table.");
  } catch (e) {
    // This will likely fail if the column already exists, which is fine.
    // console.log("[DB] 'faqs' column likely already exists.");
  }
=======
  // Run migrations to update existing schemas
  runMigrations();
>>>>>>> cafede2b106befa8c646dad7d360d62d909ba4a3

  // Seeding initial data
  seedInitialData();
  
  console.log("[DB] Schema initialized.");
  saveDatabase(); // Save after schema changes
}

function runMigrations() {
  const db = getDB();
  console.log("[DB] Running migrations...");
  try {
    // Migration 1: Add payment_method to orders table
    console.log('[DB] Applying migration: Add payment_method to orders...');
    db.run("ALTER TABLE orders ADD COLUMN payment_method TEXT");
    console.log('[DB] Migration applied successfully: added payment_method column.');
    saveDatabase(); // Save after a successful migration
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      // This is expected if the migration has already run, so we can ignore it.
      console.log('[DB] Migration skipped: payment_method column already exists.');
    } else {
      // If it's a different error, we should know about it.
      console.error('[DB] Migration failed:', e);
      throw e;
    }
  }
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
    ];
    const stmt = db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)");
    for (const [key, value] of settings) {
      stmt.run([key, value]);
    }
    stmt.free();
    console.log("✅ Default site settings created.");
  }
}