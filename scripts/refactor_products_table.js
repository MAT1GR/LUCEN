import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('--- Starting Products Table Refactor Migration ---');

    const SQL = await initSqlJs({
      locateFile: file => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
    });

    const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
    
    if (!fs.existsSync(dbPath)) {
      console.error('Database file not found at:', dbPath);
      console.error('Please ensure the server has been run at least once to create the database.');
      return;
    }

    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    console.log('Step 1: Check for existing tables...');
    
    const tableExistsResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='products'");
    if (tableExistsResult.length === 0) {
      console.log('"products" table not found. No migration needed.');
      return;
    }

    console.log('Step 2: Creating a new temporary table "products_new"...');
    
    const createNewTableSql = `
      CREATE TABLE products_new (
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
        created_at DATETIME,
        updated_at DATETIME
      );
    `;
    db.run(createNewTableSql);
    console.log('  -> "products_new" table created successfully.');

    console.log('Step 3: Copying data from "products" to "products_new"...');

    const pragmaRes = db.exec("PRAGMA table_info(products);");
    const existingColumns = pragmaRes[0].values.map(row => row[1]);
    
    const sharedColumns = [
      'id', 'name', 'price', 'category', 'compare_at_price', 
      'transfer_price', 'images', 'video', 'stock', 'colors', 
      'is_active', 'created_at', 'updated_at'
    ].filter(col => existingColumns.includes(col));

    const descriptionValue = existingColumns.includes('description') ? 'description' : "'' AS description";
    const materialValue = existingColumns.includes('material') ? 'material' : "'' AS material";
    const riseValue = existingColumns.includes('rise') ? 'rise' : "'' AS rise";

    const insertSql = `
      INSERT INTO products_new (
        ${sharedColumns.join(', ')},
        description,
        material,
        rise
      )
      SELECT
        ${sharedColumns.join(', ')},
        ${descriptionValue},
        ${materialValue},
        ${riseValue}
      FROM products;
    `;
    
    db.run(insertSql);
    console.log('  -> Data copied successfully.');


    console.log('Step 4: Dropping the old "products" table...');
    db.run('DROP TABLE products');
    console.log('  -> Old table dropped.');

    console.log('Step 5: Renaming "products_new" to "products"...');
    db.run('ALTER TABLE products_new RENAME TO products');
    console.log('  -> Table renamed.');

    console.log('Step 6: Saving the updated database...');
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
    console.log('  -> Database saved successfully.');

    console.log('--- Migration Completed Successfully! ---');

  } catch (error) {
    console.error('--- MIGRATION FAILED ---');
    console.error('An error occurred:', error);
    console.error('Your database may be in an inconsistent state. Please check the logs.');
  }
}

runMigration();
