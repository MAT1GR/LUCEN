// server/lib/db/services.ts
import bcrypt from "bcryptjs";
import { getDB, saveDatabase } from './connection.js';
import crypto from 'crypto';
import {
  Product,
  AdminUser,
  Order,
  Customer,
  SiteSettings,
  CartItem,
  CustomerOrder,
} from "../../types/index.js";
import { type Database, type QueryExecResult } from "sql.js";

// --- Helpers ---

const toObjects = (res: QueryExecResult[] | undefined): any[] => {
  if (!res || res.length === 0) return [];
  const [firstResult] = res;
  return firstResult.values.map(row => {
    const obj: any = {};
    firstResult.columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
};

const parseProduct = (row: any): Product => {
  let colors = [];
  try {
    if (row.colors) {
      colors = JSON.parse(row.colors);
    }
  } catch (e) {
    console.error(`Failed to parse colors for product ID ${row.id}:`, e);
  }

  let images = [];
  try {
    if (row.images) {
      images = JSON.parse(row.images);
    }
  } catch (e) {
    console.error(`Failed to parse images for product ID ${row.id}:`, e);
  }

  return {
    id: String(row.id),
    name: row.name,
    price: row.price,
    compare_at_price: row.compare_at_price,
    transfer_price: row.transfer_price,
    images: images,
    video: row.video,
    stock: Number(row.stock),
    colors: colors,
    isActive: Boolean(row.is_active),
  };
};


const parseOrder = (row: any): Order => ({
  id: String(row.id),
  customerId: String(row.customer_id),
  customerName: row.customer_name,
  customerEmail: row.customer_email,
  customerPhone: row.customer_phone,
  customerDocNumber: row.customer_doc_number,
  items: JSON.parse(row.items),
  total: row.total,
  status: row.status,
  shippingStreetName: row.shipping_street_name,
  shippingStreetNumber: row.shipping_street_number,
  shippingApartment: row.shipping_apartment,
  shippingDescription: row.shipping_description,
  shippingCity: row.shipping_city,
  shippingPostalCode: row.shipping_postal_code,
  shippingProvince: row.shipping_province,
  shippingCost: row.shipping_cost,
  shippingName: row.shipping_name,
  shippingDetails: row.shipping_details,
  paymentMethod: row.payment_method,
  createdAt: new Date(row.created_at),
  eventId: row.eventId, // Include eventId in the parsed order
});

const parseCustomer = (row: any): Customer => ({
  id: String(row.id),
  name: row.name,
  email: row.email,
  phone: row.phone,
  order_count: row.order_count,
  total_spent: row.total_spent,
  createdAt: new Date(row.created_at),
});


// --- Services ---

export const authService = {
  authenticateAdmin(username: string, password: string): Omit<AdminUser, 'password'> | null {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM admin_users WHERE username = :username");
    const user = stmt.getAsObject({ ':username': username }) as unknown as AdminUser | undefined;
    stmt.free();

    if (user && bcrypt.compareSync(password, user.password)) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },

  changeAdminPassword(username: string, oldPassword: string, newPassword: string): boolean {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM admin_users WHERE username = :username");
    const user = stmt.getAsObject({ ':username': username }) as unknown as AdminUser | undefined;
    stmt.free();

    if (user && bcrypt.compareSync(oldPassword, user.password)) {
      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
      db.run("UPDATE admin_users SET password = ? WHERE username = ?", [hashedNewPassword, username]);
      saveDatabase();
      return true;
    }
    return false;
  },
};

export const productService = {
  getAll(filters: { category?: string; minPrice?: number; maxPrice?: number; sortBy?: string; page?: number; limit?: number }) {
    const db = getDB();
    const { category, minPrice, maxPrice, sortBy, page = 1, limit = 9 } = filters;
    
    const whereClauses = ["is_active = 1"];
    const params: (string | number)[] = [];
    if (category) {
      // This part might need adjustment if category is removed from DB
      // whereClauses.push("category = ?");
      // params.push(category);
    }
    if (minPrice) {
      whereClauses.push("price >= ?");
      params.push(minPrice);
    }
    if (maxPrice) {
      whereClauses.push("price <= ?");
      params.push(maxPrice);
    }

    const where = `WHERE ${whereClauses.join(" AND ")}`;
    let orderBy = "ORDER BY id DESC";
    if (sortBy === "price-asc") orderBy = "ORDER BY price ASC";
    if (sortBy === "price-desc") orderBy = "ORDER BY price DESC";
    
    const countQuery = `SELECT COUNT(*) as total FROM products ${where}`;
    const totalResult = toObjects(db.exec(countQuery, params))[0] as { total: number };
    
    const offset = (page - 1) * limit;
    const paginatedQuery = `SELECT * FROM products ${where} ${orderBy} LIMIT ? OFFSET ?`;
    const paginatedProducts = toObjects(db.exec(paginatedQuery, [...params, limit, offset])).map(parseProduct);
    
    return {
      products: paginatedProducts,
      totalPages: Math.ceil(totalResult.total / limit),
      currentPage: page,
      totalProducts: totalResult.total,
    };
  },

  getById(id: string | number): Product | null {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM products WHERE id = ? AND is_active = 1");
    const row = stmt.getAsObject([id]);
    stmt.free();
    return row ? parseProduct(row) : null;
  },

  getAllAdmin(): Product[] {
    const db = getDB();
    try {
        const result = db.exec('SELECT * FROM products ORDER BY id DESC');
        const rows = toObjects(result);
        console.log(`[ProductService] getAllAdmin fetched ${rows.length} raw rows.`);
        return rows.map(parseProduct);
    } catch (error) {
        console.error("[ProductService] Error in getAllAdmin:", error);
        throw error;
    }
  },

  getNewest(limit: number): Product[] {
    const db = getDB();
    // Fetch active products with stock, ordered by creation date
    const rows = toObjects(db.exec('SELECT * FROM products WHERE is_active = 1 AND stock > 0 ORDER BY created_at DESC LIMIT ?', [limit]));
    return rows.map(parseProduct);
  },

  getBestsellers(): Product[] {
    // This logic might need to be re-evaluated as is_best_seller is removed.
    // For now, returning newest products as a placeholder.
    const db = getDB();
    const rows = toObjects(db.exec('SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC'));
    return rows.map(parseProduct);
  },

  create(product: Partial<Product> & { category?: string }): number {
    const db = getDB();
    const stmt = db.prepare(
      'INSERT INTO products (name, price, category, compare_at_price, transfer_price, images, video, stock, colors, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    );
    stmt.run([
      product.name,
      product.price,
      product.category || 'general',
      product.compare_at_price ?? null,
      product.transfer_price ?? null,
      JSON.stringify(product.images || []),
      product.video ?? null,
      product.stock ?? 0,
      JSON.stringify(product.colors || []),
      Number(product.isActive ?? true)
    ]);
    stmt.free();
    const id = toObjects(db.exec("SELECT last_insert_rowid() as id"))[0].id;
    saveDatabase();
    return id;
  },

  update(productId: string, product: Partial<Product>): boolean {
    const db = getDB();
    const stmt = db.prepare(
      'UPDATE products SET name = COALESCE(?, name), price = COALESCE(?, price), compare_at_price = COALESCE(?, compare_at_price), transfer_price = COALESCE(?, transfer_price), images = COALESCE(?, images), video = ?, stock = COALESCE(?, stock), colors = COALESCE(?, colors), is_active = COALESCE(?, is_active) WHERE id = ?'
    );
    stmt.run([
        product.name ?? null,
        product.price ?? null,
        product.compare_at_price ?? null,
        product.transfer_price ?? null,
        product.images ? JSON.stringify(product.images) : null,
        product.video, // Use direct value, allowing setting it to null
        product.stock ?? null,
        product.colors ? JSON.stringify(product.colors) : null,
        product.isActive !== undefined ? Number(product.isActive) : null,
        productId
    ]);
    stmt.free();
    const changes = db.getRowsModified();
    saveDatabase();
    return changes > 0;
  },

  updateOrder(items: { id: string; sort_order: number }[]): boolean {
    // This may no longer be relevant if sort_order is removed
    return true;
  },

  delete(productId: string): boolean {
    const db = getDB();
    db.run('DELETE FROM products WHERE id = ?', [productId]);
    const changes = db.getRowsModified();
    saveDatabase();
    return changes > 0;
  },
};

export const orderService = {

  create(orderData: any): string {

    const db = getDB();

    const orderId = crypto.randomUUID();



    // Handle different shapes of shipping data from controllers

    const shipping = orderData.shippingAddress || orderData.shippingInfo || {};

    

    const {

        customerId,

        customerName,

        customerEmail,

        customerPhone,

        customerDocNumber, // Puede venir undefined

        items,

        total,

        status,

        paymentMethod,

        shippingDetails, // Corrected from shipping_details to match JS conventions

        eventId, // Added for Meta Pixel deduplication

        createdAt = new Date()

    } = orderData;



    // --- CORRECCIÓN: Añadimos '|| null' para asegurar que no sea undefined ---

    const shippingStreetName = orderData.shippingStreetName || shipping.streetName || null;

    const shippingStreetNumber = orderData.shippingStreetNumber || shipping.streetNumber || null;

    const shippingApartment = orderData.shippingApartment || shipping.apartment || null;

    const shippingDescription = orderData.shippingDescription || shipping.description || null;

    const shippingCity = orderData.shippingCity || shipping.city || null;

    const shippingPostalCode = orderData.shippingPostalCode || shipping.postalCode || null;

    const shippingProvince = orderData.shippingProvince || shipping.province || null;

    

    const shippingCost = orderData.shippingCost ?? (orderData.shipping?.cost ?? 0);

    const shippingName = orderData.shippingName || (orderData.shipping?.name || 'No especificado');



    db.run(

      `INSERT INTO orders (id, customer_id, customer_name, customer_email, customer_phone, customer_doc_number, items, total, status, created_at, 

        shipping_street_name, shipping_street_number, shipping_apartment, shipping_description, shipping_city, shipping_postal_code, shipping_province, shipping_cost, shipping_name, shipping_details, payment_method, eventId)

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) `,

      [

        orderId,

        customerId,

        customerName,

        customerEmail,

        customerPhone,

        customerDocNumber || null, // Aseguramos null aquí también

        JSON.stringify(items),

        total,

        status,

        createdAt.toISOString(),

        shippingStreetName,

        shippingStreetNumber,

        shippingApartment,

        shippingDescription,

        shippingCity,

        shippingPostalCode,

        shippingProvince,

        shippingCost,

        shippingName,

        shippingDetails || null,

        paymentMethod || null,

        eventId || null // Add eventId to the query

      ]

    );

    saveDatabase();

    return orderId;

  },

  getAll(filters: { status?: string; searchTerm?: string; page?: number; limit?: number }): { orders: Order[], totalPages: number, currentPage: number, totalOrders: number } {
    const db = getDB();
    const { status, searchTerm, page = 1, limit = 15 } = filters;

    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (status) {
      whereClauses.push("status = ?");
      params.push(status);
    }

    if (searchTerm) {
      whereClauses.push("(id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)");
      const searchTermLike = `%${searchTerm}%`;
      params.push(searchTermLike, searchTermLike, searchTermLike);
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    
    const offset = (page - 1) * limit;

    const ordersQuery = `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const orders = toObjects(db.exec(ordersQuery, [...params, limit, offset])).map(parseOrder);

    const countQuery = `SELECT COUNT(*) as total FROM orders ${where}`;
    const totalResult = toObjects(db.exec(countQuery, params))[0] as { total: number };

    return {
      orders,
      totalPages: Math.ceil(totalResult.total / limit),
      currentPage: page,
      totalOrders: totalResult.total
    };
  },

  updateStatus(orderId: string, status: string): boolean {
    const db = getDB();
    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    const changes = db.getRowsModified();
    saveDatabase();
    return changes > 0;
  },

  getById(orderId: string): Order | null {
    const db = getDB();
    const stmt = db.prepare('SELECT * FROM orders WHERE id = ?');
    const row = stmt.getAsObject([orderId]);
    stmt.free();
    return row ? parseOrder(row) : null;
  },

  getByCustomerId(customerId: string): Order[] {
    const db = getDB();
    const rows = toObjects(db.exec('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [customerId]));
    return rows.map(parseOrder);
  },
};
  
export const customerService = {
  getAll(filters: { searchTerm?: string; page?: number; limit?: number }): { customers: Customer[], totalPages: number, currentPage: number, totalCustomers: number } {
    const db = getDB();
    const { searchTerm, page = 1, limit = 15 } = filters;

    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (searchTerm) {
      whereClauses.push("(name LIKE ? OR email LIKE ?)");
      const searchTermLike = `%${searchTerm}%`;
      params.push(searchTermLike, searchTermLike);
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    
    const offset = (page - 1) * limit;

    const customersQuery = `SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const customers = toObjects(db.exec(customersQuery, [...params, limit, offset])).map(parseCustomer);

    const countQuery = `SELECT COUNT(*) as total FROM customers ${where}`;
    const totalResult = toObjects(db.exec(countQuery, params))[0] as { total: number };
    
    return {
      customers,
      totalPages: Math.ceil(totalResult.total / limit),
      currentPage: page,
      totalCustomers: totalResult.total,
    };
  },

  findOrCreate(customerData: { email: string; name: string; phone: string; }): number {
    const db = getDB();
    const stmt = db.prepare('SELECT * FROM customers WHERE email = ?');
    const existingCustomer = stmt.getAsObject([customerData.email]);
    stmt.free();
    
    if (existingCustomer && existingCustomer.id) {
      db.run(
        'UPDATE customers SET order_count = order_count + 1 WHERE id = ?',
        [existingCustomer.id]
      );
      saveDatabase();
      return existingCustomer.id as number;
    } else {
      db.run(
        'INSERT INTO customers (name, email, phone, order_count, total_spent) VALUES (?, ?, ?, 1, 0)',
        [
          customerData.name,
          customerData.email,
          customerData.phone
        ]
      );
      const id = toObjects(db.exec("SELECT last_insert_rowid() as id"))[0].id;
      saveDatabase();
      return id;
    }
  },

  updateTotalSpent(customerId: string, amount: number): void {
    const db = getDB();
    db.run(
      'UPDATE customers SET total_spent = total_spent + ? WHERE id = ?',
      [amount, customerId]
    );
    saveDatabase();
  },

  getById(customerId: string): Customer | null {
    const db = getDB();
    const stmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    const row = stmt.getAsObject([customerId]);
    stmt.free();
    return row ? parseCustomer(row) : null;
  },
};

export const dashboardService = {
  getStats(): {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    orderStatusCounts: { [key: string]: number };
    productCount: number;
  } {
    const db = getDB();
    const revenue = toObjects(db.exec("SELECT SUM(total) as total FROM orders WHERE status = 'paid'"))[0];
    const orders = toObjects(db.exec("SELECT COUNT(*) as total FROM orders"))[0];
    const customers = toObjects(db.exec("SELECT COUNT(*) as total FROM customers"))[0];
    const products = toObjects(db.exec("SELECT COUNT(*) as total FROM products WHERE is_active = 1"))[0];

    const statusCountsResult = toObjects(db.exec("SELECT status, COUNT(*) as count FROM orders GROUP BY status"));

    const orderStatusCounts = statusCountsResult.reduce((acc: { [key: string]: number }, row: any) => {
        acc[row.status] = row.count;
        return acc;
    }, {});

    return {
      totalRevenue: revenue?.total || 0,
      totalOrders: orders?.total || 0,
      totalCustomers: customers?.total || 0,
      productCount: products?.total || 0,
      orderStatusCounts,
    };
  },

  getRecentOrders(): Order[] {
    const db = getDB();
    const rows = toObjects(db.exec('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5'));
    return rows.map(parseOrder);
  },

  getRecentCustomers(): Customer[] {
    const db = getDB();
    const rows = toObjects(db.exec('SELECT * FROM customers ORDER BY created_at DESC LIMIT 5'));
    return rows.map(parseCustomer);
  },
};

export const settingsService = {
  getAll(): SiteSettings {
    const db = getDB();
    const rows = toObjects(db.exec("SELECT key, value FROM site_settings")) as { key: string; value: string }[];
    return rows.reduce((acc, { key, value }) => {
      acc[key] = { value, type: "text" }; // Assuming type is always text
      return acc;
    }, {} as SiteSettings);
  },

  update(settings: { [key: string]: string }): void {
    const db = getDB();
    const stmt = db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)');
    for (const key in settings) {
      stmt.run([key, settings[key]]);
    }
    stmt.free();
    saveDatabase();
  },
};

export const notificationService = {
  subscribe(name: string, phone: string): boolean {
    const db = getDB();
    const trimmedPhone = phone.trim().replace(/\s/g, ''); // Also remove spaces within the number
    
    // Check if phone number already exists
    const stmt = db.prepare('SELECT id FROM drop_notifications WHERE phone = ?');
    const existing = stmt.getAsObject([trimmedPhone]);
    stmt.free();
    
    if (existing) {
      return false; // Already subscribed
    }

    // To satisfy the UNIQUE NOT NULL constraint on email, we create a placeholder.
    // This is a workaround for the database schema being out of sync with the UI.
    const placeholderEmail = `${trimmedPhone}@placeholder.denimrosario.com`;

    db.run(
      'INSERT INTO drop_notifications (name, phone, email) VALUES (?, ?, ?)', 
      [name, trimmedPhone, placeholderEmail]
    );
    saveDatabase();
    return true;
  },

  getAll(): { name: string, phone: string, email: string }[] {
    const db = getDB();
    const results = db.exec('SELECT * FROM drop_notifications ORDER BY created_at DESC');
    console.log('[DEBUG] Raw subscribers from DB:', JSON.stringify(results, null, 2));
    return toObjects(results);
  },
};

export const analyticsService = {
  log(eventName: string, eventData: any): void {
    const db = getDB();
    db.run(
      'INSERT INTO analytics_events (event_name, event_data) VALUES (?, ?)',
      [eventName, JSON.stringify(eventData)]
    );
    // No need to save the database on every event, as it's not critical
    // and would cause a performance bottleneck. It will be saved on graceful shutdown.
  },

  getFunnel(startDate: string, endDate: string): any {
    const db = getDB();
    const query = `
      SELECT 
        event_name, 
        COUNT(id) as count
      FROM analytics_events
      WHERE created_at BETWEEN ? AND ?
      GROUP BY event_name
    `;
    // Adjust endDate to be inclusive of the whole day
    const inclusiveEndDate = `${endDate} 23:59:59`;
    const results = toObjects(db.exec(query, [startDate, inclusiveEndDate]));
    
    // Format the results into a simple key-value object
    const funnel = results.reduce((acc, row) => {
      acc[row.event_name] = row.count;
      return acc;
    }, {});

    return funnel;
  },
};

export const cartService = {
  createOrUpdateAbandonedCart(email: string, cartItems: CartItem[]): number {
    const db = getDB();
    
    // Check if a pending cart for this email already exists
    const existingStmt = db.prepare("SELECT id FROM abandoned_carts WHERE email = ? AND status = 'pending'");
    const existingCart = existingStmt.getAsObject([email]);
    existingStmt.free();

    if (existingCart && existingCart.id) {
      // Update existing cart
      const stmt = db.prepare("UPDATE abandoned_carts SET cart_items = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?");
      stmt.run([JSON.stringify(cartItems), existingCart.id]);
      stmt.free();
      saveDatabase();
      return existingCart.id as number;
    } else {
      // Insert new cart
      const stmt = db.prepare("INSERT INTO abandoned_carts (email, cart_items) VALUES (?, ?)");
      stmt.run([email, JSON.stringify(cartItems)]);
      stmt.free();
      const id = toObjects(db.exec("SELECT last_insert_rowid() as id"))[0].id;
      saveDatabase();
      return id;
    }
  },

  getPendingAbandonedCarts(): any[] {
    const db = getDB();
    // Get carts older than 1 hour but less than 2 hours to avoid re-sending constantly
    const rows = toObjects(db.exec("SELECT * FROM abandoned_carts WHERE status = 'pending' AND created_at < datetime('now', '-1 hour') AND created_at > datetime('now', '-2 hour')"));
    return rows;
  },

  updateAbandonedCartStatus(cartId: number, status: string): boolean {
    const db = getDB();
    const stmt = db.prepare("UPDATE abandoned_carts SET status = ? WHERE id = ?");
    stmt.run([status, cartId]);
    stmt.free();
    const changes = db.getRowsModified();
    saveDatabase();
    return changes > 0;
  }
};