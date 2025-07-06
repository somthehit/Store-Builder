# E-commerce SAAS Platform - Multi-Tenant Architecture

## Overview

This is a full-stack SAAS platform that enables multiple users to sign up and create their own e-commerce stores. The system uses a multi-tenant architecture where each store is accessible via custom subdomains. Built with modern web technologies including React, Node.js, PostgreSQL, and implements comprehensive store management features.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui components for consistent design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state, Zustand for client state
- **Authentication**: Context-based auth with protected routes
- **Component Library**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL via Neon Database with Drizzle ORM
- **Authentication**: Passport.js with local strategy and session management
- **Session Storage**: PostgreSQL-based session store with connect-pg-simple
- **Multi-tenancy**: Subdomain-based tenant isolation middleware
- **API Design**: RESTful API with role-based access control

### Database Schema
- **Users**: Core user management with roles (admin, store_owner, customer)
- **Stores**: Multi-tenant store entities with subdomain routing
- **Products**: Store-specific product catalog with inventory management
- **Orders**: Order processing with line items and status tracking
- **Sessions**: Secure session management with PostgreSQL storage

## Key Components

### Multi-Tenant Architecture
- **Subdomain Routing**: Each store accessible via `store.domain.com`
- **Tenant Isolation**: Middleware extracts subdomain to set tenant context
- **Data Segregation**: All queries filtered by store ownership
- **Security**: Role-based access control preventing cross-tenant data access

### Authentication System
- **Strategy**: Local authentication with encrypted passwords using scrypt
- **Session Management**: Express-session with PostgreSQL store
- **Role Management**: Three-tier role system (admin, store_owner, customer)
- **Authorization**: Middleware for route protection and store ownership validation

### Frontend State Management
- **Server State**: React Query for API calls, caching, and synchronization
- **Client State**: Zustand stores for auth, products, and stores
- **Form Handling**: React Hook Form with Zod validation
- **Real-time Updates**: Optimistic updates with proper error handling

### UI/UX Design
- **Design System**: shadcn/ui components with customizable themes
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dashboard Layout**: Sidebar navigation with role-based menu items
- **Component Architecture**: Reusable components for cards, forms, and layouts

## Data Flow

### User Registration & Store Creation
1. User registers via auth page with email/password
2. System creates user record with store_owner role
3. User creates store with unique subdomain
4. Store becomes accessible via custom subdomain

### Product Management
1. Store owners access dashboard at `/dashboard`
2. Navigate to store-specific management at `/store/:storeId`
3. CRUD operations for products with validation
4. Real-time inventory tracking and status management

### Order Processing
1. Customers visit store via subdomain
2. Browse products and add to cart
3. Place orders with customer information
4. Store owners manage orders through dashboard

### Admin Functions
1. Admin users access system-wide controls at `/admin`
2. Monitor all stores and users
3. System-wide analytics and management

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management and caching
- **passport**: Authentication middleware for Node.js
- **express-session**: Session management for Express
- **connect-pg-simple**: PostgreSQL session store

### UI/UX Libraries
- **@radix-ui/***: Unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Variant-based component styling
- **react-hook-form**: Form state management and validation
- **zod**: TypeScript-first schema validation

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **drizzle-kit**: Database migration and introspection tools
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon PostgreSQL with connection pooling
- **Environment Variables**: DATABASE_URL and SESSION_SECRET required
- **Build Process**: Vite for frontend, esbuild for backend

### Production Considerations
- **Subdomain Support**: DNS configuration for wildcard subdomains
- **Database Scaling**: Connection pooling with Neon serverless
- **Session Security**: Secure session configuration with production secrets
- **Static Assets**: Frontend built to dist/public for serving

### Build Commands
- `npm run dev`: Development server with TypeScript compilation
- `npm run build`: Production build for both frontend and backend
- `npm run start`: Production server execution
- `npm run db:push`: Database schema deployment

## Changelog

Changelog:
- July 05, 2025: Initial setup - Basic multi-tenant e-commerce platform with user authentication
- July 05, 2025: Enhanced platform with advanced features:
  - Added store customization (colors, fonts, themes, logos, custom CSS)
  - Implemented Nepali payment system support (eSewa, Khalti, IPSConnect, bank transfer, cash on delivery)
  - Created advanced order tracking with payment status and delivery management
  - Updated database schema with customization and payment tracking fields
  - Redesigned dashboard with modern gradient design and improved UX
  - Added comprehensive checkout flow with multiple payment options
  - Created store customization page with live preview functionality
  - Built advanced order tracking system with status timeline and carrier integration
- July 05, 2025: Implemented advanced recommendation engine system:
  - Built comprehensive recommendation engine with collaborative filtering, content-based, trending, and hybrid algorithms
  - Added customer behavior tracking for views, searches, cart actions, and purchases
  - Created recommendation analytics dashboard with performance metrics and insights
  - Implemented storefront page with personalized product recommendations
  - Added API endpoints for tracking customer behavior and generating recommendations
  - Extended database schema with 8 new tables for recommendation engine data
  - Built recommendation feedback loop to improve algorithm performance over time
- July 05, 2025: Migrated to multi-database architecture for enhanced data isolation:
  - Separated main database (users, stores) from store-specific databases (products, orders, customers)
  - Created separate schema files: shared/schema.ts (main) and shared/store-schema.ts (store-specific)
  - Updated database connection logic to support multiple databases per store
  - Enhanced data security with complete tenant isolation at database level
  - Each store now has its own dedicated database for better performance and scalability
  - Updated storage layer and recommendation engine to work with new architecture
  - Consolidated database management into single db.ts with MultiDatabaseManager class
- July 05, 2025: Implemented visitor account functionality for stores:
  - Added customer authentication system for store visitors (B2B2C model)
  - Enhanced customer schema with password, email uniqueness, and verification fields
  - Created customer registration, login, logout, and profile API endpoints
  - Built customer authentication UI components (CustomerAuthPage, StorefrontPage)
  - Implemented store-specific customer accounts with secure password hashing
  - Added customer authentication context and hooks for frontend integration
  - Visitors can now create accounts specific to individual stores for ordering and payment
  - Complete separation between store owner authentication and customer authentication

## User Preferences

Preferred communication style: Simple, everyday language.