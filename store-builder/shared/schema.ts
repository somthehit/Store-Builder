import { pgTable, text, serial, integer, boolean, timestamp, decimal, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Main database tables (global, not store-specific)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("store_owner"), // admin, store_owner, customer
  createdAt: timestamp("created_at").defaultNow(),
});

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  description: text("description"),
  logo: text("logo"),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  
  // Business registration details
  panNumber: text("pan_number").notNull(),
  registrationNumber: text("registration_number").notNull(),
  registrationDate: timestamp("registration_date").notNull(),
  businessType: text("business_type").notNull(), // sole_proprietorship, partnership, private_limited, etc.
  address: text("address").notNull(),
  contactNumber: text("contact_number").notNull(),
  
  // Store customization fields
  primaryColor: text("primary_color").default("#3B82F6"),
  secondaryColor: text("secondary_color").default("#1E40AF"),
  fontFamily: text("font_family").default("Inter"),
  theme: text("theme").default("modern"), // modern, minimal, classic
  customCss: text("custom_css"),
  
  // Store status and trial
  status: text("status").default("trial"), // trial, active, suspended
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionType: text("subscription_type").default("free"), // free, basic, premium
  
  // Database connection for this store
  databaseUrl: text("database_url").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations - only for main database tables
export const usersRelations = relations(users, ({ many }) => ({
  stores: many(stores),
}));

export const storesRelations = relations(stores, ({ one }) => ({
  owner: one(users, { fields: [stores.ownerId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

// Legacy types for compatibility - will be removed after migration
export type SelectUser = User;