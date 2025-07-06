import { pgTable, text, serial, integer, boolean, timestamp, decimal, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Store-specific tables that will be in separate databases per store
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  inventory: integer("inventory").notNull().default(0),
  category: text("category"),
  image: text("image"),
  status: text("status").default("active"), // active, inactive, out_of_stock
  
  // Nepali product specific fields
  weight: decimal("weight", { precision: 8, scale: 2 }), // in kg
  dimensions: text("dimensions"), // LxWxH in cm
  brand: text("brand"),
  tags: text("tags").array(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
  
  // Shipping details
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingZone: text("shipping_zone"), // Inside valley, Outside valley
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  
  // Payment details for Nepali payment systems
  paymentMethod: text("payment_method").notNull(), // esewa, khalti, ips_connect, bank_transfer, cod
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed, refunded
  paymentTransactionId: text("payment_transaction_id"),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
  
  // Delivery tracking
  courierService: text("courier_service"), // pathao, daraz, sundhara, etc.
  trackingNumber: text("tracking_number"),
  estimatedDelivery: timestamp("estimated_delivery"),
  deliveredAt: timestamp("delivered_at"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  zone: text("zone"), // Inside valley, Outside valley
  
  // Customer preferences
  preferredPaymentMethod: text("preferred_payment_method"),
  loyaltyPoints: integer("loyalty_points").default(0),
  isVerified: boolean("is_verified").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  lastOrderAt: timestamp("last_order_at"),
});

export const customerBehavior = pgTable("customer_behavior", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  sessionId: text("session_id").notNull(),
  action: text("action").notNull(), // view, add_to_cart, remove_from_cart, purchase, search
  productId: integer("product_id").references(() => products.id),
  searchQuery: text("search_query"),
  category: text("category"),
  timestamp: timestamp("timestamp").defaultNow(),
  
  // Additional context
  deviceType: text("device_type"), // mobile, desktop, tablet
  source: text("source"), // direct, social, search, referral
});

export const productViews = pgTable("product_views", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  viewDuration: integer("view_duration"), // in seconds
  timestamp: timestamp("timestamp").defaultNow(),
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  recommendationType: text("recommendation_type").notNull(), // collaborative, content_based, trending, hybrid
  score: decimal("score", { precision: 5, scale: 4 }).notNull(),
  reasons: text("reasons").array(),
  
  // Tracking
  shown: boolean("shown").default(false),
  clicked: boolean("clicked").default(false),
  purchased: boolean("purchased").default(false),
  shownAt: timestamp("shown_at"),
  clickedAt: timestamp("clicked_at"),
  purchasedAt: timestamp("purchased_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productCategoryMappings = pgTable("product_category_mappings", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  categoryId: integer("category_id").references(() => productCategories.id).notNull(),
});

export const productAttributes = pgTable("product_attributes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  attributeName: text("attribute_name").notNull(),
  attributeValue: text("attribute_value").notNull(),
});

export const customerPreferences = pgTable("customer_preferences", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  preferenceType: text("preference_type").notNull(), // category, brand, price_range, etc.
  preferenceValue: text("preference_value").notNull(),
  strength: decimal("strength", { precision: 5, scale: 4 }).default("1.0"), // preference strength 0-1
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  categoryMappings: many(productCategoryMappings),
  attributes: many(productAttributes),
  views: many(productViews),
  recommendations: many(recommendations),
  behaviorLogs: many(customerBehavior),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  behavior: many(customerBehavior),
  views: many(productViews),
  recommendations: many(recommendations),
  preferences: many(customerPreferences),
}));

export const customerBehaviorRelations = relations(customerBehavior, ({ one }) => ({
  customer: one(customers, {
    fields: [customerBehavior.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [customerBehavior.productId],
    references: [products.id],
  }),
}));

export const productViewsRelations = relations(productViews, ({ one }) => ({
  customer: one(customers, {
    fields: [productViews.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [productViews.productId],
    references: [products.id],
  }),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  customer: one(customers, {
    fields: [recommendations.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [recommendations.productId],
    references: [products.id],
  }),
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  parent: one(productCategories, {
    fields: [productCategories.parentId],
    references: [productCategories.id],
  }),
  children: many(productCategories),
  productMappings: many(productCategoryMappings),
}));

export const productCategoryMappingsRelations = relations(productCategoryMappings, ({ one }) => ({
  product: one(products, {
    fields: [productCategoryMappings.productId],
    references: [products.id],
  }),
  category: one(productCategories, {
    fields: [productCategoryMappings.categoryId],
    references: [productCategories.id],
  }),
}));

export const productAttributesRelations = relations(productAttributes, ({ one }) => ({
  product: one(products, {
    fields: [productAttributes.productId],
    references: [products.id],
  }),
}));

export const customerPreferencesRelations = relations(customerPreferences, ({ one }) => ({
  customer: one(customers, {
    fields: [customerPreferences.customerId],
    references: [customers.id],
  }),
}));

// Zod schemas for store-specific tables
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  lastOrderAt: true,
});

export const insertCustomerBehaviorSchema = createInsertSchema(customerBehavior).omit({
  id: true,
  timestamp: true,
});

export const insertProductViewSchema = createInsertSchema(productViews).omit({
  id: true,
  timestamp: true,
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
  shownAt: true,
  clickedAt: true,
  purchasedAt: true,
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
});

export const insertProductCategoryMappingSchema = createInsertSchema(productCategoryMappings).omit({
  id: true,
});

export const insertProductAttributeSchema = createInsertSchema(productAttributes).omit({
  id: true,
});

export const insertCustomerPreferenceSchema = createInsertSchema(customerPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type CustomerBehavior = typeof customerBehavior.$inferSelect;
export type InsertCustomerBehavior = z.infer<typeof insertCustomerBehaviorSchema>;
export type ProductView = typeof productViews.$inferSelect;
export type InsertProductView = z.infer<typeof insertProductViewSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type ProductCategoryMapping = typeof productCategoryMappings.$inferSelect;
export type InsertProductCategoryMapping = z.infer<typeof insertProductCategoryMappingSchema>;
export type ProductAttribute = typeof productAttributes.$inferSelect;
export type InsertProductAttribute = z.infer<typeof insertProductAttributeSchema>;
export type CustomerPreference = typeof customerPreferences.$inferSelect;
export type InsertCustomerPreference = z.infer<typeof insertCustomerPreferenceSchema>;