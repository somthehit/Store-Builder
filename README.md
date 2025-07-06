Create a full-stack SAAS platform where multiple users can sign up and create their own e-commerce store. The system must follow a multi-tenant architecture, where each store is accessed via a custom subdomain (e.g., store1.domain.com, store2.domain.com).

Frontend:

Use React with Vite.

Tailwind CSS for styling.

State management with Redux Toolkit or Zustand.

Use react-router-dom for routing.

Implement reusable UI Components (ProductCard, Navbar, Sidebar, DashboardLayout).

Authenticated dashboard (/dashboard) for store owners.

Public Storefront page (store.yoursaas.com) for visitors.

Backend:

Use Node.js with Express.js.

Use Sequelize ORM with support for raw SQL queries where needed.

Use Supabase (PostgreSQL) for the database (Seperate database for seperate store).

Setup multitenancy via subdomain routing middleware.

Use JWT-based authentication.

RESTful API routes (/api/users, /api/products, /api/orders, etc.)

Setup roles: admin, store_owner, customer.

Database Tables (Supabase PostgreSQL):

Users: id, name, email, password_hash, role

Stores: id, name, subdomain, ownerId (FK to Users)

Products: id, name, description, price, image_url, storeId (FK)

Orders: id, storeId, customerName, total, status

OrderItems: id, orderId, productId, quantity

Sessions: refreshToken, userId, expiry

Features:

User Registration/Login (JWT + refresh tokens)

Store creation with subdomain (dynamic routing)

Store dashboard for managing:

Products (Add/Edit/Delete)

Orders

Settings (store info, logo)

Public storefront:

View products

Add to cart

Checkout simulation (no payment gateway required initially)

Admin panel to manage all stores & users.

Advanced Features (Optional Bonus):

Webhooks for product updates

File uploads with Supabase Storage

Search & filter products

Pagination on product list

Dynamic SEO tags per store

Folder Structure:

arduino
Copy
Edit
project-root/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── config/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── redux/ or zustand/
│   │   ├── services/
│   │   ├── layouts/
│   │   └── App.tsx
│   └── vite.config.ts
│
└── README.md
Use .env files for DB credentials and JWT secrets. Configure subdomain routing in Express using req.subdomains. Use axios for API calls on the frontend. Deployment-ready code.

🛠 Required Technologies
Layer	Stack
Frontend	React + Vite + Tailwind
Backend	Node.js + Express
ORM	Sequelize + raw SQL
Database	Supabase PostgreSQL
Auth	JWT + Refresh Token
Storage	Supabase Storage (for images)
Hosting	Vercel (Frontend) + Render/RAILWAY (Backend)
Subdomain	Using Express middleware / NGINX proxy
Optional	Admin Panel, Store Analytics

🔑 Example Subdomain Logic (Express Middleware):
js
Copy
Edit
app.use((req, res, next) => {
  const subdomain = req.subdomains[0];
  if (subdomain) {
    req.tenant = subdomain;
  }
  next();
});
🔗 Sample Sequelize Raw Query:
js
Copy
Edit
const result = await sequelize.query(
  `SELECT * FROM products WHERE store_id = :storeId`,
  { replacements: { storeId }, type: QueryTypes.SELECT }
);
🔒 JWT Auth Flow
POST /api/auth/login → returns access & refresh token.

Use middleware authenticateJWT to protect routes.

Refresh token logic in POST /api/auth/refresh.

🔚 Bonus Tips
Add custom domain mapping (later phase).

Use React Query or SWR if you don’t want Redux.

For subdomain local dev, use lvh.me, e.g., store1.lvh.me.
