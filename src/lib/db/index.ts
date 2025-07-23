// This file is now the single source of truth for the database connection.
// It does NOT contain "use server" and can be safely imported into server-side files.
import "dotenv/config";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function getDb() {
    if (!process.env.DATABASE_URL) {
        // In a real production environment, you would want to handle this more gracefully.
        // For this prototype, we'll simulate a null database when no URL is provided.
        // This allows the app to build and run without a database connection.
        console.warn("DATABASE_URL is not set. Database operations will fail.");
        return null;
    }
    const client = postgres(process.env.DATABASE_URL);
    return drizzle(client, { schema, logger: false });
}

// We export a getter function instead of the db instance directly.
export const getDbInstance = () => getDb();
