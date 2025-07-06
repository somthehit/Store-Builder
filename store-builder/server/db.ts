import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as mainSchema from "@shared/schema";
import * as storeSchema from "@shared/store-schema";
import { eq } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Main database connection for global data (users, stores, sessions)
export const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const mainDb = drizzle({ client: mainPool, schema: mainSchema });

// Store database connections cache
const storeDbConnections = new Map<string, ReturnType<typeof drizzle>>();
const storePools = new Map<string, Pool>();

// Database manager class for multi-tenant architecture
export class MultiDatabaseManager {
  
  /**
   * Get the main database connection (for users, stores, sessions)
   */
  getMainDb() {
    return mainDb;
  }

  /**
   * Create or get store database connection by store ID
   */
  async getStoreDb(storeId: number) {
    // First get the store's database URL from main database
    const [store] = await mainDb
      .select()
      .from(mainSchema.stores)
      .where(eq(mainSchema.stores.id, storeId));
    
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    return this.getStoreDbByUrl(store.databaseUrl);
  }

  /**
   * Create or get store database connection by database URL
   */
  getStoreDbByUrl(databaseUrl: string) {
    if (!storeDbConnections.has(databaseUrl)) {
      const storePool = new Pool({ connectionString: databaseUrl });
      const storeDb = drizzle({ client: storePool, schema: storeSchema });
      
      storeDbConnections.set(databaseUrl, storeDb);
      storePools.set(databaseUrl, storePool);
    }
    
    return storeDbConnections.get(databaseUrl)!;
  }

  /**
   * Create a new store database and return its connection
   */
  async createStoreDatabase(storeId: number): Promise<ReturnType<typeof drizzle>> {
    // For now, use the same database URL as main (in production, each store would have its own database)
    // This maintains the separation logic while using a single database in development
    const databaseUrl = process.env.DATABASE_URL!;
    
    // Update the store record with the database URL
    await mainDb
      .update(mainSchema.stores)
      .set({ databaseUrl })
      .where(eq(mainSchema.stores.id, storeId));

    return this.getStoreDbByUrl(databaseUrl);
  }

  /**
   * Close all database connections
   */
  async closeAllConnections() {
    // Close main pool
    await mainPool.end();
    
    // Close all store pools
    for (const pool of Array.from(storePools.values())) {
      await pool.end();
    }
    
    // Clear caches
    storeDbConnections.clear();
    storePools.clear();
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      mainDatabase: {
        connected: true,
        pool: mainPool
      },
      storeDatabases: {
        count: storeDbConnections.size,
        connections: Array.from(storeDbConnections.keys())
      }
    };
  }

  /**
   * Health check for all database connections
   */
  async healthCheck() {
    const results = {
      main: false,
      stores: [] as { url: string; healthy: boolean }[]
    };

    try {
      // Check main database
      await mainDb.select().from(mainSchema.users).limit(1);
      results.main = true;
    } catch (error) {
      console.error('Main database health check failed:', error);
    }

    // Check store databases
    for (const [url, db] of Array.from(storeDbConnections.entries())) {
      try {
        await db.select().from(storeSchema.products).limit(1);
        results.stores.push({ url, healthy: true });
      } catch (error) {
        console.error(`Store database health check failed for ${url}:`, error);
        results.stores.push({ url, healthy: false });
      }
    }

    return results;
  }
}

// Export singleton instance
export const dbManager = new MultiDatabaseManager();

// Legacy exports for compatibility
export const db = mainDb;
export const pool = mainPool;
export const getStoreDb = (databaseUrl: string) => dbManager.getStoreDbByUrl(databaseUrl);