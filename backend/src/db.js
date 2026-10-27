const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const DB_FILE_PATH = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.resolve(__dirname, '../data/shopping_cart.db');

// Ensure parent directory exists
const dbDir = path.dirname(DB_FILE_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;

function getDbInstance() {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(DB_FILE_PATH, (err) => {
      if (err) {
        console.error(`[DB ERROR] Failed to connect to SQLite at ${DB_FILE_PATH}:`, err.message);
      } else {
        console.log(`[DB] Connected to SQLite database at: ${DB_FILE_PATH}`);
      }
    });

    // Enforce foreign key constraints
    dbInstance.run('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

// Promise-based query helpers
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDbInstance().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDbInstance().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDbInstance().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbExec(sql) {
  return new Promise((resolve, reject) => {
    getDbInstance().exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

const DEFAULT_PRODUCTS = [
  {
    name: 'DevOps Handbook & Cloud Architecture',
    description: 'Comprehensive guide to CI/CD pipelines, container orchestration, microservices, and site reliability engineering.',
    price: 49.99,
    stock: 35,
    category: 'Books',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80'
  },
  {
    name: 'Dockerized Developer Hoodie',
    description: 'Heavyweight organic fleece hoodie featuring embroidered container architecture and terminal syntax.',
    price: 69.99,
    stock: 20,
    category: 'Apparel',
    image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80'
  },
  {
    name: 'Kubernetes Pod Ceramic Mug',
    description: 'Matte black 16oz ceramic mug with container lifecycle cheatsheet and HTTP status reference.',
    price: 19.50,
    stock: 50,
    category: 'Accessories',
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80'
  },
  {
    name: 'Hot-Swap DevOps Mechanical Keyboard',
    description: 'Custom 75% mechanical keyboard with tactile switches, RGB backlight, and Linux PBT keycaps.',
    price: 139.00,
    stock: 12,
    category: 'Hardware',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80'
  },
  {
    name: 'YubiKey 5C NFC Security Key',
    description: 'FIDO2 and WebAuthn hardware token to secure root SSH, Git commit signing, and cloud consoles.',
    price: 55.00,
    stock: 45,
    category: 'Hardware',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80'
  },
  {
    name: 'Microservices Topology Desk Mat',
    description: 'Extended spill-resistant 900x400mm desk mat diagramming distributed tracing and API Gateway routing.',
    price: 29.99,
    stock: 28,
    category: 'Accessories',
    image_url: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=500&q=80'
  }
];

async function initDb(forceReset = false) {
  try {
    getDbInstance();

    if (forceReset) {
      console.log('[DB] Resetting database tables...');
      await dbExec(`
        DROP TABLE IF EXISTS order_items;
        DROP TABLE IF EXISTS orders;
        DROP TABLE IF EXISTS products;
      `);
    }

    // Initialize Schema
    await dbExec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock INTEGER NOT NULL CHECK(stock >= 0),
        category TEXT NOT NULL,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'COMPLETED',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    `);

    // Check if products exist; seed if empty
    const countRow = await dbGet('SELECT COUNT(*) AS total FROM products');
    if (countRow.total === 0) {
      console.log('[DB] Seeding 6 default catalog items...');
      for (const item of DEFAULT_PRODUCTS) {
        await dbRun(
          `INSERT INTO products (name, description, price, stock, category, image_url)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [item.name, item.description, item.price, item.stock, item.category, item.image_url]
        );
      }
      console.log('[DB] Default catalog seeded successfully.');
    } else {
      console.log(`[DB] Database ready with ${countRow.total} existing products.`);
    }

    return true;
  } catch (err) {
    console.error('[DB ERROR] Initialization failed:', err);
    throw err;
  }
}

module.exports = {
  getDbInstance,
  dbRun,
  dbGet,
  dbAll,
  dbExec,
  initDb,
  DB_FILE_PATH
};
