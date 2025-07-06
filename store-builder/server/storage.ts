import { users, stores, sessions, type User, type Store, type InsertUser, type InsertStore } from "@shared/schema";
import { 
  products, orders, orderItems, customers, customerBehavior, productViews, recommendations, 
  productCategories, productCategoryMappings, productAttributes, customerPreferences,
  type Product, type Order, type OrderItem, type Customer, type CustomerBehavior, type ProductView, 
  type Recommendation, type ProductCategory, type ProductCategoryMapping, type ProductAttribute, 
  type CustomerPreference, type InsertProduct, type InsertOrder, type InsertOrderItem, 
  type InsertCustomer, type InsertCustomerBehavior, type InsertProductView, type InsertRecommendation,
  type InsertProductCategory, type InsertProductCategoryMapping, type InsertProductAttribute, 
  type InsertCustomerPreference
} from "@shared/store-schema";
import { dbManager, mainDb } from "./db";
import { eq, and } from "drizzle-orm";
import ConnectPgSimple from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

export interface IStorage {
  // User methods (main database)
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Store methods (main database)
  getStore(id: number): Promise<Store | undefined>;
  getStoreBySubdomain(subdomain: string): Promise<Store | undefined>;
  getStoresByOwner(ownerId: number): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: Partial<InsertStore>): Promise<Store | undefined>;
  deleteStore(id: number): Promise<boolean>;
  
  // Product methods (store database)
  getProduct(storeId: number, id: number): Promise<Product | undefined>;
  getProductsByStore(storeId: number): Promise<Product[]>;
  createProduct(storeId: number, product: InsertProduct): Promise<Product>;
  updateProduct(storeId: number, id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(storeId: number, id: number): Promise<boolean>;
  
  // Order methods (store database)
  getOrder(storeId: number, id: number): Promise<Order | undefined>;
  getOrdersByStore(storeId: number): Promise<Order[]>;
  createOrder(storeId: number, order: InsertOrder): Promise<Order>;
  updateOrder(storeId: number, id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Order item methods (store database)
  getOrderItems(storeId: number, orderId: number): Promise<OrderItem[]>;
  createOrderItem(storeId: number, orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Customer methods (store database)
  getCustomer(storeId: number, id: number): Promise<Customer | undefined>;
  getCustomerByEmail(storeId: number, email: string): Promise<Customer | undefined>;
  createCustomer(storeId: number, customer: InsertCustomer): Promise<Customer>;
  authenticateCustomer(storeId: number, email: string, password: string): Promise<Customer | null>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    const ConnectPgStore = ConnectPgSimple(session);
    this.sessionStore = new ConnectPgStore({
      pool: pool,
      tableName: "sessions",
    });
  }

  // Helper method to get store database
  private async getStoreDatabase(storeId: number) {
    return await dbManager.getStoreDb(storeId);
  }

  // User methods (main database)
  async getUser(id: number): Promise<User | undefined> {
    const mainDb = dbManager.getMainDb();
    const [user] = await mainDb.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const mainDb = dbManager.getMainDb();
    const [user] = await mainDb.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const mainDb = dbManager.getMainDb();
    const [user] = await mainDb
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Store methods (main database)
  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await mainDb.select().from(stores).where(eq(stores.id, id));
    return store || undefined;
  }

  async getStoreBySubdomain(subdomain: string): Promise<Store | undefined> {
    const [store] = await mainDb.select().from(stores).where(eq(stores.subdomain, subdomain));
    return store || undefined;
  }

  async getStoresByOwner(ownerId: number): Promise<Store[]> {
    return await mainDb.select().from(stores).where(eq(stores.ownerId, ownerId));
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const [store] = await mainDb
      .insert(stores)
      .values(insertStore)
      .returning();
    return store;
  }

  async updateStore(id: number, updateStore: Partial<InsertStore>): Promise<Store | undefined> {
    const [store] = await mainDb
      .update(stores)
      .set(updateStore)
      .where(eq(stores.id, id))
      .returning();
    return store || undefined;
  }

  async deleteStore(id: number): Promise<boolean> {
    const result = await mainDb.delete(stores).where(eq(stores.id, id));
    return result.rowCount > 0;
  }

  // Product methods (store database)
  async getProduct(storeId: number, id: number): Promise<Product | undefined> {
    const storeDb = await this.getStoreDatabase(storeId);
    const [product] = await storeDb.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsByStore(storeId: number): Promise<Product[]> {
    const storeDb = await this.getStoreDatabase(storeId);
    return await storeDb.select().from(products);
  }

  async createProduct(storeId: number, insertProduct: InsertProduct): Promise<Product> {
    const storeDb = await this.getStoreDatabase(storeId);
    const [product] = await storeDb
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(storeId: number, id: number, updateProduct: Partial<InsertProduct>): Promise<Product | undefined> {
    const databaseUrl = await this.getStoreDatabaseUrl(storeId);
    const storeDb = getStoreDb(databaseUrl);
    const [product] = await storeDb
      .update(products)
      .set(updateProduct)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(storeId: number, id: number): Promise<boolean> {
    const databaseUrl = await this.getStoreDatabaseUrl(storeId);
    const storeDb = getStoreDb(databaseUrl);
    const result = await storeDb.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  // Order methods (store database)
  async getOrder(storeId: number, id: number): Promise<Order | undefined> {
    const databaseUrl = await this.getStoreDatabaseUrl(storeId);
    const storeDb = getStoreDb(databaseUrl);
    const [order] = await storeDb.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByStore(storeId: number): Promise<Order[]> {
    const databaseUrl = await this.getStoreDatabaseUrl(storeId);
    const storeDb = getStoreDb(databaseUrl);
    return await storeDb.select().from(orders);
  }

  async createOrder(storeId: number, insertOrder: InsertOrder): Promise<Order> {
    const databaseUrl = await this.getStoreDatabaseUrl(storeId);
    const storeDb = getStoreDb(databaseUrl);
    const [order] = await storeDb
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updateOrder(storeId: number, id: number, updateOrder: Partial<InsertOrder>): Promise<Order | undefined> {
    const databaseUrl = await this.getStoreDatabaseUrl(storeId);
    const storeDb = getStoreDb(databaseUrl);
    const [order] = await storeDb
      .update(orders)
      .set(updateOrder)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Order item methods (store database)
  async getOrderItems(storeId: number, orderId: number): Promise<OrderItem[]> {
    const databaseUrl = await this.getStoreDatabaseUrl(storeId);
    const storeDb = getStoreDb(databaseUrl);
    return await storeDb.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(storeId: number, insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const databaseUrl = await this.getStoreDatabaseUrl(storeId);
    const storeDb = getStoreDb(databaseUrl);
    const [orderItem] = await storeDb
      .insert(orderItems)
      .values(insertOrderItem)
      .returning();
    return orderItem;
  }

  // Customer methods (store database)
  async getCustomer(storeId: number, id: number): Promise<Customer | undefined> {
    const databaseUrl = await this.getStoreDatabaseUrl(storeId);
    const storeDb = getStoreDb(databaseUrl);
    const [customer] = await storeDb.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByEmail(storeId: number, email: string): Promise<Customer | undefined> {
    const databaseUrl = await this.getStoreDatabaseUrl(storeId);
    const storeDb = getStoreDb(databaseUrl);
    const [customer] = await storeDb.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async createCustomer(storeId: number, insertCustomer: InsertCustomer): Promise<Customer> {
    const storeDb = await this.getStoreDatabase(storeId);
    const [customer] = await storeDb
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async authenticateCustomer(storeId: number, email: string, password: string): Promise<Customer | null> {
    const storeDb = await this.getStoreDatabase(storeId);
    const [customer] = await storeDb
      .select()
      .from(customers)
      .where(eq(customers.email, email));
    
    if (!customer || !customer.password) {
      return null;
    }

    // Import scrypt for password comparison
    const crypto = await import('crypto');
    const util = await import('util');
    const scrypt = util.promisify(crypto.scrypt);
    
    try {
      const [salt, storedHash] = customer.password.split(':');
      const derivedKey = await scrypt(password, salt, 32) as Buffer;
      
      if (storedHash === derivedKey.toString('hex')) {
        return customer;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

export const storage = new DatabaseStorage();