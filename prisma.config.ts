import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from the current working directory where the command is run.
// This is the most robust way to ensure it's found.
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

console.log(`Attempting to load .env from: ${envPath}`);
console.log(`DATABASE_URL found: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
