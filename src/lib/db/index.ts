
// src/lib/db/index.ts
// This file is now the single source of truth for the database connection.
// It does NOT contain "use server" and can be safely imported into server-side files.
import "dotenv/config";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// This will be initialized only once.
let dbInstance: ReturnType<typeof drizzle> | null = null;
let pgClient: ReturnType<typeof postgres> | null = null;

// The function now ensures a single instance is created and reused.
function initializeDb() {
    if (dbInstance) {
        return dbInstance;
    }
    
    if (!process.env.DATABASE_URL) {
        console.warn("DATABASE_URL is not set. Database operations will be disabled.");
        return null;
    }
    
    // Create the client only once.
    pgClient = postgres(process.env.DATABASE_URL);
    dbInstance = drizzle(pgClient, { schema, logger: false });
    
    return dbInstance;
}

// We export a getter function that returns the initialized instance.
export const getDbInstance = () => {
    return initializeDb();
};

// Optional: A function to gracefully close the connection if needed (e.g., during app shutdown)
export async function closeDbConnection() {
    if (pgClient) {
        await pgClient.end();
        pgClient = null;
        dbInstance = null;
        console.log("Database connection closed.");
    }
}
