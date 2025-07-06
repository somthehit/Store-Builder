import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertStoreSchema, Store, User } from "@shared/schema";
import { insertProductSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/store-schema";
import { recommendationEngine } from "./recommendation-engine";
import { z } from "zod";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User;
      store?: Store;
      tenant?: string;
    }
  }
}

// Middleware to extract subdomain and set tenant
function subdomainMiddleware(req: any, res: any, next: any) {
  const subdomain = req.subdomains[0];
  if (subdomain) {
    req.tenant = subdomain;
  }
  next();
}

// Middleware to authenticate requests
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Middleware to check store ownership
async function requireStoreOwnership(req: any, res: any, next: any) {
  const storeId = parseInt(req.params.storeId);
  const store = await storage.getStore(storeId);
  
  if (!store) {
    return res.status(404).json({ message: "Store not found" });
  }
  
  if (store.ownerId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  
  req.store = store;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Apply subdomain middleware
  app.use(subdomainMiddleware);

  // Store routes
  app.get("/api/stores", requireAuth, async (req, res) => {
    try {
      const stores = await storage.getStoresByOwner(req.user.id);
      res.json(stores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.post("/api/stores", requireAuth, async (req, res) => {
    try {
      const validatedData = insertStoreSchema.parse({
        ...req.body,
        ownerId: req.user.id,
      });
      
      // Check if subdomain already exists
      const existingStore = await storage.getStoreBySubdomain(validatedData.subdomain);
      if (existingStore) {
        return res.status(400).json({ message: "Subdomain already exists" });
      }
      
      const store = await storage.createStore(validatedData);
      res.status(201).json(store);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create store" });
    }
  });

  app.get("/api/stores/:storeId", requireAuth, requireStoreOwnership, async (req, res) => {
    res.json(req.store);
  });

  app.put("/api/stores/:storeId", requireAuth, requireStoreOwnership, async (req, res) => {
    try {
      const validatedData = insertStoreSchema.partial().parse(req.body);
      const updatedStore = await storage.updateStore(req.store.id, validatedData);
      res.json(updatedStore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update store" });
    }
  });

  app.delete("/api/stores/:storeId", requireAuth, requireStoreOwnership, async (req, res) => {
    try {
      await storage.deleteStore(req.store.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete store" });
    }
  });

  // Product routes
  app.get("/api/stores/:storeId/products", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const products = await storage.getProductsByStore(storeId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/stores/:storeId/products", requireAuth, requireStoreOwnership, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse({
        ...req.body,
        storeId: req.store.id,
      });
      
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get("/api/products/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.put("/api/products/:productId", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const store = await storage.getStore(product.storeId);
      if (!store || (store.ownerId !== req.user.id && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateProduct(productId, validatedData);
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:productId", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const store = await storage.getStore(product.storeId);
      if (!store || (store.ownerId !== req.user.id && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteProduct(productId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Order routes
  app.get("/api/stores/:storeId/orders", requireAuth, requireStoreOwnership, async (req, res) => {
    try {
      const orders = await storage.getOrdersByStore(req.store.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/stores/:storeId/orders", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const validatedData = insertOrderSchema.parse({
        ...req.body,
        storeId,
      });
      
      const order = await storage.createOrder(validatedData);
      
      // Create order items
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          const validatedItem = insertOrderItemSchema.parse({
            ...item,
            orderId: order.id,
          });
          await storage.createOrderItem(validatedItem);
        }
      }
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/:orderId", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const store = await storage.getStore(order.storeId);
      if (!store || (store.ownerId !== req.user.id && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const items = await storage.getOrderItems(orderId);
      res.json({ ...order, items });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.put("/api/orders/:orderId", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const store = await storage.getStore(order.storeId);
      if (!store || (store.ownerId !== req.user.id && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertOrderSchema.partial().parse(req.body);
      const updatedOrder = await storage.updateOrder(orderId, validatedData);
      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Public storefront routes (for subdomain access)
  app.get("/api/storefront", async (req, res) => {
    try {
      // Get subdomain from tenant (real subdomain) or query parameter (for testing)
      const subdomain = req.tenant || req.query.subdomain;
      
      if (!subdomain) {
        return res.status(400).json({ message: "Subdomain required" });
      }
      
      const store = await storage.getStoreBySubdomain(subdomain as string);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      const products = await storage.getProductsByStore(store.id);
      res.json({ store, products });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch storefront" });
    }
  });

  // Catch-all route for subdomain storefront
  app.get("*", async (req, res, next) => {
    // Only handle subdomain requests (not API routes)
    if (req.tenant && !req.path.startsWith("/api")) {
      // Serve the storefront page for subdomain requests
      res.sendFile(path.resolve(import.meta.dirname, "client", "index.html"));
    } else {
      next();
    }
  });

  // Admin routes
  app.get("/api/admin/stores", requireAuth, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // For admin, get all stores (this would need a new storage method)
      res.json({ message: "Admin functionality not fully implemented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin data" });
    }
  });

  // Store by subdomain route for storefront
  app.get('/api/stores/by-subdomain/:subdomain', async (req, res) => {
    try {
      const subdomain = req.params.subdomain;
      const store = await storage.getStoreBySubdomain(subdomain);
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      res.json(store);
    } catch (error) {
      console.error("Error fetching store by subdomain:", error);
      res.status(500).json({ message: "Failed to fetch store" });
    }
  });

  // Customer API routes
  app.post('/api/customers', async (req, res) => {
    try {
      const { email, name, storeId } = req.body;
      
      if (!email || !name || !storeId) {
        return res.status(400).json({ error: 'email, name, and storeId are required' });
      }

      // Check if customer already exists
      const existingCustomer = await storage.getCustomerByEmail(email, storeId);
      if (existingCustomer) {
        return res.json(existingCustomer);
      }

      const customer = await storage.createCustomer({
        email,
        name,
        storeId,
      });

      res.json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  });

  app.get('/api/customers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({ error: 'Failed to fetch customer' });
    }
  });

  // Recommendation Engine API routes
  app.post('/api/recommendations', async (req, res) => {
    try {
      const { storeId, customerId, sessionId, limit, excludeProductIds, type } = req.body;
      
      if (!storeId || !sessionId) {
        return res.status(400).json({ error: 'storeId and sessionId are required' });
      }

      const recommendations = await recommendationEngine.generateRecommendations({
        storeId,
        customerId,
        sessionId,
        limit,
        excludeProductIds,
        type
      });

      res.json(recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  });

  app.post('/api/track-behavior', async (req, res) => {
    try {
      const { customerId, sessionId, storeId, productId, action, searchQuery, timeSpent, metadata } = req.body;
      
      if (!sessionId || !storeId || !action) {
        return res.status(400).json({ error: 'sessionId, storeId, and action are required' });
      }

      await recommendationEngine.trackBehavior({
        customerId,
        sessionId,
        storeId,
        productId,
        action,
        searchQuery,
        timeSpent,
        metadata
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking behavior:', error);
      res.status(500).json({ error: 'Failed to track behavior' });
    }
  });

  app.post('/api/track-product-view', async (req, res) => {
    try {
      const { productId, customerId, sessionId, viewDuration, referrer } = req.body;
      
      if (!productId || !sessionId) {
        return res.status(400).json({ error: 'productId and sessionId are required' });
      }

      await recommendationEngine.trackProductView({
        productId,
        customerId,
        sessionId,
        viewDuration,
        referrer
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking product view:', error);
      res.status(500).json({ error: 'Failed to track product view' });
    }
  });

  app.post('/api/track-recommendation-feedback', async (req, res) => {
    try {
      const { customerId, sessionId, productId, action } = req.body;
      
      if (!sessionId || !productId || !action) {
        return res.status(400).json({ error: 'sessionId, productId, and action are required' });
      }

      await recommendationEngine.trackRecommendationFeedback({
        customerId,
        sessionId,
        productId,
        action
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking recommendation feedback:', error);
      res.status(500).json({ error: 'Failed to track recommendation feedback' });
    }
  });

  app.get('/api/recommendation-analytics/:storeId', requireAuth, async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const days = parseInt(req.query.days as string) || 30;
      
      if (!storeId) {
        return res.status(400).json({ error: 'Invalid store ID' });
      }

      const analytics = await recommendationEngine.getRecommendationAnalytics(storeId, days);
      res.json(analytics);
    } catch (error) {
      console.error('Error getting recommendation analytics:', error);
      res.status(500).json({ error: 'Failed to get recommendation analytics' });
    }
  });

  app.put('/api/customer-preferences/:customerId', async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      
      if (!customerId) {
        return res.status(400).json({ error: 'Invalid customer ID' });
      }

      await recommendationEngine.updateCustomerPreferences(customerId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating customer preferences:', error);
      res.status(500).json({ error: 'Failed to update customer preferences' });
    }
  });

  // Customer authentication endpoints for store visitors
  app.post('/api/customer/register', subdomainMiddleware, async (req: any, res: any) => {
    try {
      const { name, email, password, phone, address, city, zone } = req.body;
      
      if (!req.store) {
        return res.status(400).json({ error: 'Store not found' });
      }

      // Check if customer already exists
      const existingCustomer = await storage.getCustomerByEmail(req.store.id, email);
      if (existingCustomer) {
        return res.status(400).json({ error: 'Customer already exists with this email' });
      }

      // Hash password
      const crypto = await import('crypto');
      const util = await import('util');
      const scrypt = util.promisify(crypto.scrypt);
      
      const salt = crypto.randomBytes(16).toString('hex');
      const derivedKey = await scrypt(password, salt, 32) as Buffer;
      const hashedPassword = `${salt}:${derivedKey.toString('hex')}`;

      const customerData = {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        city,
        zone,
        isVerified: false
      };

      const customer = await storage.createCustomer(req.store.id, customerData);
      
      // Remove password from response
      const { password: _, ...customerResponse } = customer;
      
      res.json({
        success: true,
        customer: customerResponse,
        message: 'Account created successfully'
      });
    } catch (error) {
      console.error('Customer registration error:', error);
      res.status(500).json({ error: 'Failed to create customer account' });
    }
  });

  app.post('/api/customer/login', subdomainMiddleware, async (req: any, res: any) => {
    try {
      const { email, password } = req.body;
      
      if (!req.store) {
        return res.status(400).json({ error: 'Store not found' });
      }

      const customer = await storage.authenticateCustomer(req.store.id, email, password);
      
      if (!customer) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Store customer in session
      req.session.customerId = customer.id;
      req.session.storeId = req.store.id;

      // Remove password from response
      const { password: _, ...customerResponse } = customer;
      
      res.json({
        success: true,
        customer: customerResponse,
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Customer login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  app.post('/api/customer/logout', (req: any, res: any) => {
    req.session.customerId = null;
    req.session.storeId = null;
    res.json({ success: true, message: 'Logged out successfully' });
  });

  app.get('/api/customer/me', subdomainMiddleware, async (req: any, res: any) => {
    try {
      if (!req.session.customerId || !req.store) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const customer = await storage.getCustomer(req.store.id, req.session.customerId);
      
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Remove password from response
      const { password: _, ...customerResponse } = customer;
      
      res.json(customerResponse);
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({ error: 'Failed to get customer info' });
    }
  });

  // Public storefront API endpoints
  app.get('/api/store/current', subdomainMiddleware, async (req: any, res: any) => {
    try {
      if (!req.store) {
        return res.status(404).json({ error: 'Store not found' });
      }
      
      // Return public store information
      const storeInfo = {
        id: req.store.id,
        name: req.store.name,
        description: req.store.description,
        subdomain: req.store.subdomain,
        primaryColor: req.store.primaryColor,
        secondaryColor: req.store.secondaryColor,
        fontFamily: req.store.fontFamily,
        theme: req.store.theme,
        logo: req.store.logo,
      };
      
      res.json(storeInfo);
    } catch (error) {
      console.error('Get current store error:', error);
      res.status(500).json({ error: 'Failed to get store information' });
    }
  });

  app.get('/api/storefront/products', subdomainMiddleware, async (req: any, res: any) => {
    try {
      if (!req.store) {
        return res.status(404).json({ error: 'Store not found' });
      }

      const products = await storage.getProductsByStore(req.store.id);
      
      // Only return active products for public view
      const activeProducts = products.filter(product => product.status === 'active' && product.inventory > 0);
      
      res.json(activeProducts);
    } catch (error) {
      console.error('Get storefront products error:', error);
      res.status(500).json({ error: 'Failed to get products' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
