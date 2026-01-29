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

  // Run migrations to update existing schemas
  runMigrations();

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
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: payment_method column already exists.');
    } else {
      console.error('[DB] Migration for payment_method failed:', e);
      // Don't re-throw, allow other migrations to run
    }
  }

  try {
    // Migration 2: Create drop_notifications table if it doesn't exist
    console.log('[DB] Applying migration: Create drop_notifications table...');
    db.run(`
      CREATE TABLE IF NOT EXISTS drop_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[DB] Migration for drop_notifications table applied successfully.');
  } catch (e: any) {
    console.error('[DB] Migration for drop_notifications failed:', e);
    // Don't re-throw
  }

  try {
    // Migration 3: Add phone to drop_notifications table
    console.log('[DB] Applying migration: Add phone to drop_notifications...');
    db.run("ALTER TABLE drop_notifications ADD COLUMN phone TEXT");
    console.log('[DB] Migration applied successfully: added phone column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: phone column already exists.');
    } else {
      console.error('[DB] Migration for phone column failed:', e);
    }
  }

  try {
    // Migration 4: Add faqs to products table
    console.log('[DB] Applying migration: Add faqs to products...');
    db.run("ALTER TABLE products ADD COLUMN faqs TEXT DEFAULT '[]'");
    console.log('[DB] Migration applied successfully: added faqs column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: faqs column already exists.');
    } else {
      console.error('[DB] Migration for faqs column failed:', e);
    }
  }

  try {
    console.log('[DB] Migration: Adding sort_order to products...');
    db.run("ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 9999");
    console.log('[DB] Migration applied successfully: added sort_order column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: sort_order column already exists.');
    } else {
      console.error('[DB] Migration for sort_order column failed:', e);
    }
  }
  
  try {
    console.log('[DB] Migration: Adding brand to products...');
    db.run("ALTER TABLE products ADD COLUMN brand TEXT");
    console.log('[DB] Migration applied successfully: added brand column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: brand column already exists.');
    } else {
      console.error('[DB] Migration for brand column failed:', e);
    }
  }

  try {
    console.log('[DB] Migration: Adding short_description to products...');
    db.run("ALTER TABLE products ADD COLUMN short_description TEXT");
    console.log('[DB] Migration applied successfully: added short_description column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: short_description column already exists.');
    } else {
      console.error('[DB] Migration for short_description column failed:', e);
    }
  }

  try {
    console.log('[DB] Migration: Adding eventId to orders...');
    db.run("ALTER TABLE orders ADD COLUMN eventId TEXT");
    console.log('[DB] Migration applied successfully: added eventId column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: eventId column already exists.');
    } else {
      console.error('[DB] Migration for eventId column failed:', e);
    }
  }

  try {
    console.log('[DB] Migration: Adding is_active to products...');
    db.run("ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT 1");
    console.log('[DB] Migration applied successfully: added is_active column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: is_active column already exists.');
    } else {
      console.error('[DB] Migration for is_active column failed:', e);
    }
  }

  try {
    console.log('[DB] Migration: Creating reviews table...');
    db.run(`
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
      )
    `);
    console.log('[DB] Migration applied successfully: reviews table created.');
  } catch (e: any) {
    console.error('[DB] Migration for reviews table failed:', e);
  }

  try {
    console.log('[DB] Migration: Adding compare_at_price to products...');
    db.run("ALTER TABLE products ADD COLUMN compare_at_price REAL");
    console.log('[DB] Migration applied successfully: added compare_at_price column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: compare_at_price column already exists.');
    } else {
      console.error('[DB] Migration for compare_at_price column failed:', e);
    }
  }

  try {
    console.log('[DB] Migration: Adding stock to products...');
    db.run("ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0");
    console.log('[DB] Migration applied successfully: added stock column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: stock column already exists.');
    } else {
    console.log('[DB] Migration for stock column failed:', e);
    }
  }

  try {
    console.log('[DB] Migration: Adding transfer_price to products...');
    db.run("ALTER TABLE products ADD COLUMN transfer_price REAL");
    console.log('[DB] Migration applied successfully: added transfer_price column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: transfer_price column already exists.');
    } else {
      console.error('[DB] Migration for transfer_price column failed:', e);
    }
  }

  try {
    console.log('[DB] Migration: Adding colors to products...');
    db.run("ALTER TABLE products ADD COLUMN colors TEXT");
    console.log('[DB] Migration applied successfully: added colors column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: colors column already exists.');
    } else {
      console.error('[DB] Migration for colors column failed:', e);
    }
  }

  try {
    console.log('[DB] Migration: Adding images to products...');
    db.run("ALTER TABLE products ADD COLUMN images TEXT");
    console.log('[DB] Migration applied successfully: added images column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: images column already exists.');
    } else {
      console.error('[DB] Migration for images column failed:', e);
    }
  }

  try {
    console.log('[DB] Migration: Adding video to products...');
    db.run("ALTER TABLE products ADD COLUMN video TEXT");
    console.log('[DB] Migration applied successfully: added video column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: video column already exists.');
    } else {
      console.error('[DB] Migration for video column failed:', e);
    }
  }
  
  try {
    console.log('[DB] Migration: Adding created_at to products...');
    db.run("ALTER TABLE products ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
    console.log('[DB] Migration applied successfully: added created_at column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: created_at column already exists.');
    } else {
      console.error('[DB] Migration for created_at column failed:', e);
    }
  }

  try {
    console.log('[DB] Migration: Adding updated_at to products...');
    db.run("ALTER TABLE products ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
    console.log('[DB] Migration applied successfully: added updated_at column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: updated_at column already exists.');
    } else {
      console.error('[DB] Migration for updated_at column failed:', e);
    }
  }

  try {
    console.log('[DB] Migration: Adding nullable category to products...');
    db.run("ALTER TABLE products ADD COLUMN category TEXT");
    console.log('[DB] Migration applied successfully: added nullable category column.');
  } catch (e: any) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log('[DB] Migration skipped: category column already exists.');
    } else {
      console.error('[DB] Migration for category column failed:', e);
    }
  }
  
  saveDatabase();
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