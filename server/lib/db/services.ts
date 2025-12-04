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
  let faqs = [];
  try {
    if (row.faqs) {
      const parsedFaqs = JSON.parse(row.faqs);
      if (Array.isArray(parsedFaqs)) {
        faqs = parsedFaqs;
      }
    }
  } catch (e) {
    console.error(`Failed to parse FAQs for product ID ${row.id}:`, e);
    // Defaults to empty array if parsing fails
  }

  return {
    id: String(row.id),
    name: row.name,
    price: row.price,
    images: JSON.parse(row.images),
    video: row.video,
    category: row.category,
    description: row.description,
    material: row.material,
    rise: row.rise,
    rise_cm: row.rise_cm,
    fit: row.fit,
    waist_flat: row.waist_flat,
    isWaistStretchy: Boolean(row.is_waist_stretchy),
    length: row.length,
    sizes: JSON.parse(row.sizes),
    isNew: Boolean(row.is_new),
    isBestSeller: Boolean(row.is_best_seller),
    isActive: Boolean(row.is_active),
    faqs: faqs,
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
  getAll(filters: { category?: string; size?: string; minPrice?: number; maxPrice?: number; sortBy?: string; page?: number; limit?: number }) {
    const db = getDB();
    const { category, size, minPrice, maxPrice, sortBy, page = 1, limit = 9 } = filters;
    
    const whereClauses = ["is_active = 1"];
    const params: (string | number)[] = [];
    if (category) {
      whereClauses.push("category = ?");
      params.push(category);
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
    if (sortBy === "popular") orderBy = "ORDER BY is_best_seller DESC, id DESC";

    // Fetch all products matching WHERE clauses, without pagination for now
    const allProductsQuery = `SELECT * FROM products ${where} ${orderBy}`;
    const allProducts = toObjects(db.exec(allProductsQuery, params)).map(parseProduct);

    // Filter by size in application code
    const filteredBySize = size 
      ? allProducts.filter(p => p.sizes[size] && p.sizes[size].available && p.sizes[size].stock > 0)
      : allProducts;

    // Apply pagination manually
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredBySize.slice(offset, offset + limit);
    
    return {
      products: paginatedProducts,
      totalPages: Math.ceil(filteredBySize.length / limit),
      currentPage: page,
      totalProducts: filteredBySize.length,
    };
  },

  getById(id: string | number): Product | null {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM products WHERE id = ? AND is_active = 1");
    const row = stmt.getAsObject([id]);
    stmt.free();
    return row ? parseProduct(row) : null;
  },

  updateProductStock(items: CartItem[]): void {
    const db = getDB();
    for (const item of items) {
      const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
      const productRow = stmt.getAsObject([item.product.id]);
      stmt.free();

      if (productRow) {
        const sizes = JSON.parse(productRow.sizes as string);
        if (sizes[item.size] && sizes[item.size].stock >= item.quantity) {
          sizes[item.size].stock -= item.quantity;
          db.run('UPDATE products SET sizes = ? WHERE id = ?', [JSON.stringify(sizes), productRow.id]);
        } else {
          console.warn(`[Stock] Insufficient stock for product ${productRow.id}, size ${item.size}.`);
        }
      }
    }
    saveDatabase();
  },

  restoreProductStock(items: CartItem[]): void {
    const db = getDB();
    for (const item of items) {
      const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
      // Asegúrate de que el ID del producto se está pasando correctamente
      const productRow = stmt.getAsObject([item.product.id]);
      stmt.free();

      if (productRow) {
        const sizes = JSON.parse(productRow.sizes as string);
        // Asegúrate de que el talle (size) existe en el producto
        if (sizes[item.size]) {
          sizes[item.size].stock += item.quantity;
          db.run('UPDATE products SET sizes = ? WHERE id = ?', [JSON.stringify(sizes), productRow.id]);
        } else {
          console.warn(`[Stock Restore] Size ${item.size} not found for product ${item.product.id}.`);
        }
      } else {
        console.warn(`[Stock Restore] Product not found for ID ${item.product.id}.`);
      }
    }
    saveDatabase();
  },

  getAllAdmin(): Product[] {
    const db = getDB();
    const rows = toObjects(db.exec('SELECT * FROM products ORDER BY id DESC'));
    return rows.map(parseProduct);
  },

  getNewest(limit: number): Product[] {
    const db = getDB();
    const rows = toObjects(db.exec('SELECT * FROM products WHERE is_new = 1 AND is_active = 1 ORDER BY id DESC LIMIT ?', [limit]));
    return rows.map(parseProduct);
  },

  getBestsellers(): Product[] {
    const db = getDB();
    const rows = toObjects(db.exec('SELECT * FROM products WHERE is_best_seller = 1 AND is_active = 1 ORDER BY created_at DESC'));
    return rows.map(parseProduct);
  },

  create(product: Omit<Product, 'id' | 'isActive'>): number {
    const db = getDB();
    const stmt = db.prepare(
      'INSERT INTO products (name, price, images, video, category, description, material, rise, rise_cm, fit, waist_flat, is_waist_stretchy, length, sizes, is_new, is_best_seller, faqs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run([
      product.name,
      product.price,
      JSON.stringify(product.images),
      product.video ?? null,
      product.category,
      product.description,
      product.material,
      product.rise,
      product.rise_cm ?? null,
      product.fit,
      product.waist_flat ?? null,
      Number(product.isWaistStretchy),
      product.length ?? null,
      JSON.stringify(product.sizes),
      Number(product.isNew),
      Number(product.isBestSeller),
      product.faqs ? JSON.stringify(product.faqs) : '[]' // Store FAQs as JSON string
    ]);
    stmt.free();
    const id = toObjects(db.exec("SELECT last_insert_rowid() as id"))[0].id;
    saveDatabase();
    return id;
  },

  update(productId: string, product: Partial<Product>): boolean {
    const db = getDB();
    db.run(
      'UPDATE products SET name = COALESCE(?, name), price = COALESCE(?, price), images = COALESCE(?, images), video = COALESCE(?, video), category = COALESCE(?, category), description = COALESCE(?, description), material = COALESCE(?, material), rise = COALESCE(?, rise), rise_cm = COALESCE(?, rise_cm), fit = COALESCE(?, fit), waist_flat = COALESCE(?, waist_flat), is_waist_stretchy = COALESCE(?, is_waist_stretchy), length = COALESCE(?, length), sizes = COALESCE(?, sizes), is_new = COALESCE(?, is_new), is_best_seller = COALESCE(?, is_best_seller), is_active = COALESCE(?, is_active), faqs = COALESCE(?, faqs) WHERE id = ?',
      [
        product.name ?? null,
        product.price ?? null,
        product.images ? JSON.stringify(product.images) : null,
        product.video ?? null,
        product.category ?? null,
        product.description ?? null,
        product.material ?? null,
        product.rise ?? null,
        product.rise_cm ?? null,
        product.fit ?? null,
        product.waist_flat ?? null,
        product.isWaistStretchy !== undefined ? Number(product.isWaistStretchy) : null,
        product.length ?? null,
        product.sizes ? JSON.stringify(product.sizes) : null,
        product.isNew !== undefined ? Number(product.isNew) : null,
        product.isBestSeller !== undefined ? Number(product.isBestSeller) : null,
        product.isActive !== undefined ? Number(product.isActive) : null,
        product.faqs ? JSON.stringify(product.faqs) : null, // Store FAQs as JSON string
        productId
      ]
    );
    const changes = db.getRowsModified();
    saveDatabase();
    return changes > 0;
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
        shipping_street_name, shipping_street_number, shipping_apartment, shipping_description, shipping_city, shipping_postal_code, shipping_province, shipping_cost, shipping_name, shipping_details, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        paymentMethod || null
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
    const stmt = db.prepare('SELECT id FROM drop_notifications WHERE phone = ?');
    const existing = stmt.getAsObject([trimmedPhone]);
    stmt.free();
    if (existing) {
      return false;
    }
    db.run('INSERT INTO drop_notifications (name, phone) VALUES (?, ?)', [name, trimmedPhone]);
    saveDatabase();
    return true;
  },

  getAll(): { name: string, phone: string }[] {
    const db = getDB();
    const results = db.exec('SELECT name, phone, email FROM drop_notifications ORDER BY created_at DESC');
    console.log('[DEBUG] Raw subscribers from DB:', JSON.stringify(results, null, 2));
    // Select phone, but also email for backward compatibility in display if phone is null
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