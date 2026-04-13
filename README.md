# Arik E-Commerce Platform

A full-stack fashion e-commerce application built with **Next.js 16**, **MongoDB**, **Tailwind CSS**, and **Socket.io**. It ships two distinct interfaces: a customer-facing storefront and an admin dashboard, all within a single Next.js project.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Environment Variables](#environment-variables)
4. [Getting Started](#getting-started)
5. [Authentication](#authentication)
6. [Role System](#role-system)
7. [Middleware & Route Protection](#middleware--route-protection)
8. [Database Models](#database-models)
9. [API Routes](#api-routes)
10. [Store (Customer Facing)](#store-customer-facing)
11. [Admin Dashboard](#admin-dashboard)
12. [Real-Time Features](#real-time-features)
13. [Loyalty Points System](#loyalty-points-system)
14. [Login Credentials](#login-credentials)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | MongoDB via Mongoose |
| Auth | JWT (jose) + OAuth (Google, GitHub, Discord) |
| Styling | Tailwind CSS v4 |
| Real-time | Socket.io |
| Image Storage | Cloudinary |
| Server | Custom Express + Next.js hybrid (`server.ts`) |
| Charts | Chart.js + react-chartjs-2 |
| Password Hashing | bcryptjs |

---

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx                  # Root layout — wraps all pages, mounts NotificationProvider
│   ├── page.tsx                    # Root redirect → /store
│   ├── globals.css
│   │
│   ├── login/                      # Admin login page (/login)
│   │   └── page.tsx
│   │
│   ├── api/                        # All Next.js API route handlers
│   │   ├── auth/
│   │   │   ├── login/route.ts      # POST — email/password login
│   │   │   ├── register/route.ts   # POST — new user registration
│   │   │   ├── logout/             # Logout (clears cookie)
│   │   │   ├── me/route.ts         # GET — current session + loyalty points
│   │   │   ├── google/             # GET — redirect to Google OAuth
│   │   │   │   └── callback/       # GET — handle Google OAuth callback
│   │   │   ├── github/             # GET — redirect to GitHub OAuth
│   │   │   │   └── callback/       # GET — handle GitHub OAuth callback
│   │   │   └── discord/            # GET — redirect to Discord OAuth
│   │   │       └── callback/       # GET — handle Discord OAuth callback
│   │   ├── products/
│   │   │   ├── route.ts            # GET (list/filter) | POST (admin: create)
│   │   │   └── [id]/route.ts       # GET | PATCH (admin) | DELETE (admin)
│   │   ├── cart/
│   │   │   └── route.ts            # GET | POST (add) | PATCH (qty) | DELETE (remove)
│   │   ├── orders/
│   │   │   ├── route.ts            # GET (all/mine) | POST (place order)
│   │   │   └── [id]/route.ts       # GET | PATCH (status) | DELETE — admin only
│   │   ├── reviews/
│   │   │   ├── route.ts            # POST — submit review
│   │   │   ├── delete/route.ts     # DELETE — remove own review
│   │   │   └── [productId]/route.ts # GET — fetch reviews for a product
│   │   ├── users/
│   │   │   ├── route.ts            # GET — list users (superadmin only)
│   │   │   └── [id]/route.ts       # PATCH (block/unblock) | DELETE — superadmin only
│   │   ├── dashboard/
│   │   │   └── stats/route.ts      # GET — dashboard KPIs, charts, best sellers
│   │   └── upload/
│   │       └── route.ts            # POST — Cloudinary image upload
│   │
│   ├── store/                      # Customer storefront
│   │   ├── page.tsx                # Homepage (Hero, Brands, Products, etc.)
│   │   ├── login/page.tsx          # Customer sign in / sign up + OAuth
│   │   ├── cart/
│   │   │   ├── page.tsx            # Cart page shell
│   │   │   └── CartClient.tsx      # Interactive cart UI
│   │   ├── checkout/
│   │   │   ├── page.tsx            # Checkout page shell
│   │   │   └── CheckoutClient.tsx  # Checkout form + order placement
│   │   ├── product/[id]/
│   │   │   ├── page.tsx            # Server component — fetches product + session
│   │   │   └── ProductDetailClient.tsx  # Interactive product detail UI
│   │   ├── category/[slug]/
│   │   │   ├── page.tsx            # Category page shell
│   │   │   └── CategoryClient.tsx  # Filtered product grid
│   │   ├── order-success/page.tsx  # Post-checkout confirmation
│   │   └── components/             # Store-specific UI components
│   │       ├── Navbar.tsx
│   │       ├── Hero.tsx
│   │       ├── Brands.tsx
│   │       ├── ProductSection.tsx
│   │       ├── ProductCard.tsx
│   │       ├── BrowseByStyle.tsx
│   │       ├── HappyCustomers.tsx
│   │       ├── ReviewSection.tsx
│   │       ├── Newsletter.tsx
│   │       └── Footer.tsx
│   │
│   └── dashboard/                  # Admin dashboard (admin + superadmin only)
│       ├── layout.tsx              # Dashboard shell — Sidebar + Topbar
│       ├── page.tsx                # Overview — stats, charts, best sellers
│       ├── products/
│       │   ├── page.tsx            # Product grid + Add Product modal
│       │   └── [id]/page.tsx       # Single product edit/delete
│       ├── orders/
│       │   ├── page.tsx            # Orders table with status filter
│       │   └── [id]/page.tsx       # Order detail + status update
│       └── users/
│           └── page.tsx            # User management (superadmin only)
│
├── components/                     # Dashboard-specific shared components
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── StatCard.tsx
│   ├── SaleGraph.tsx               # Chart.js sales graph (weekly/monthly/yearly)
│   ├── BestSellers.tsx
│   ├── RecentOrders.tsx
│   ├── CategoryStock.tsx
│   ├── AddProductModal.tsx
│   ├── ProductCard.tsx
│   ├── NotificationProvider.tsx    # Socket.io client — listens for review notifications
│   └── NotificationToast.tsx
│
├── lib/
│   ├── db.ts                       # MongoDB connection with Next.js hot-reload caching
│   ├── auth.ts                     # JWT sign/verify/getSession helpers
│   └── models/
│       ├── User.ts
│       ├── Product.ts
│       ├── Cart.ts
│       ├── Order.ts
│       └── Review.ts
│
├── middleware.ts                   # Route protection (JWT verification)
├── server.ts                       # Custom Express + Socket.io + Next.js server
├── next.config.ts
└── .env.local                      # Environment variables
```

---

## Environment Variables

Create `frontend/.env.local` with the following keys:

```env
# MongoDB
MONGODB_URI=<your MongoDB Atlas connection string>

# JWT
JWT_SECRET=<your secret key>

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>

# App URL (used for OAuth redirect URIs)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Google OAuth
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>

# GitHub OAuth
GITHUB_CLIENT_ID=<client id>
GITHUB_CLIENT_SECRET=<client secret>

# Discord OAuth
DISCORD_CLIENT_ID=<client id>
DISCORD_CLIENT_SECRET=<client secret>
```

---

## Getting Started

```bash
cd frontend
npm install

# Development (custom Express + Socket.io server)
npm run dev

# Production build
npm run build
npm run start
```

The app runs on **http://localhost:3000** by default.  
The Socket.io server runs on **http://localhost:4000**.

---

## Authentication

### Local Auth (Email + Password)

| Action | Endpoint | Method |
|---|---|---|
| Register | `/api/auth/register` | POST |
| Login | `/api/auth/login` | POST |
| Logout | `/api/auth/logout` | GET/POST |
| Current user | `/api/auth/me` | GET |

On success, a `auth_token` **httpOnly cookie** is set (7-day expiry, HS256 JWT).

The JWT payload contains:
```ts
{
  userId: string,
  email: string,
  role: "user" | "admin" | "superadmin",
  name: string,
  avatar?: string
}
```

### OAuth (Social Login)

All OAuth flows follow the same pattern:

1. User clicks a social button → redirected to `/api/auth/{provider}`
2. Provider redirects back to `/api/auth/{provider}/callback`
3. Callback exchanges the code for a token, fetches the user profile
4. If the email exists in DB, the provider is linked to that account
5. If not, a new `user` role account is created
6. JWT cookie is set and user is redirected to `/store`

| Provider | Initiate | Callback |
|---|---|---|
| Google | `/api/auth/google` | `/api/auth/google/callback` |
| GitHub | `/api/auth/github` | `/api/auth/github/callback` |
| Discord | `/api/auth/discord` | `/api/auth/discord/callback` |

> OAuth login is available on the **store login page only** (`/store/login`). The admin login page (`/login`) is email/password only.

---

## Role System

| Role | Access |
|---|---|
| `user` | Store, cart, checkout, orders, reviews |
| `admin` | Dashboard (products, orders) — cannot access `/dashboard/users` |
| `superadmin` | Full dashboard access including user management |

Admins and superadmins **cannot** use the cart or place orders.

---

## Middleware & Route Protection

`frontend/middleware.ts` runs on every matched request:

```
/dashboard/*         → requires admin or superadmin JWT
/dashboard/users/*   → requires superadmin JWT specifically
/store/cart/*        → requires any valid JWT
/store/checkout/*    → requires any valid JWT
```

Unauthenticated dashboard requests redirect to `/login`.  
Unauthenticated cart/checkout requests redirect to `/store/login`.

---

## Database Models

### User
```
name, email, password (hashed), role, avatar,
provider (local|google|github|discord), providerId,
isBlocked, loyaltyPoints, timestamps
```

### Product
```
name, description, price, originalPrice, discountPercent,
category, style, images[], colors[], sizes[], colorImages{},
stock, sales, rating, reviews,
isNewArrival, isTopSelling, loyaltyOnly, hybrid, timestamps
```

### Cart
```
user (ref), items[{ product (ref), quantity, price }], timestamps
```
One cart per user. Price is snapshotted at the time of adding.

### Order
```
orderId (unique string), user (ref),
items[{ product (ref), name, quantity, price }],
totalAmount, status (pending|processing|delivered|cancelled|returned),
timestamps
```

### Review
```
product (ref), user (ref), rating (1–5), comment, timestamps
Unique index: (product, user) — one review per user per product
```

---

## API Routes

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Email/password login |
| POST | `/api/auth/register` | — | Create new user account |
| GET | `/api/auth/me` | User | Get current session + loyalty points |
| GET | `/api/auth/google` | — | Start Google OAuth |
| GET | `/api/auth/google/callback` | — | Google OAuth callback |
| GET | `/api/auth/github` | — | Start GitHub OAuth |
| GET | `/api/auth/github/callback` | — | GitHub OAuth callback |
| GET | `/api/auth/discord` | — | Start Discord OAuth |
| GET | `/api/auth/discord/callback` | — | Discord OAuth callback |

### Products
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | — | List all products (supports `?category=` filter) |
| POST | `/api/products` | Admin | Create a product |
| GET | `/api/products/[id]` | — | Get single product |
| PATCH | `/api/products/[id]` | Admin | Update product fields |
| DELETE | `/api/products/[id]` | Admin | Delete product |

Category filter also supports dress styles: `casual`, `formal`, `party`, `gym`.

### Cart
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/cart` | User | Get current user's cart |
| POST | `/api/cart` | User | Add item to cart |
| PATCH | `/api/cart` | User | Update item quantity |
| DELETE | `/api/cart` | User | Remove item from cart |

### Orders
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | User | Place order from cart (clears cart, awards points) |
| GET | `/api/orders` | User/Admin | Users see own orders; admins see all |
| GET | `/api/orders/[id]` | Admin | Get order detail |
| PATCH | `/api/orders/[id]` | Admin | Update order status |
| DELETE | `/api/orders/[id]` | Admin | Delete order |

A flat **$15 delivery fee** is added to every order total.

### Reviews
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/reviews` | User | Submit a review (one per product per user) |
| DELETE | `/api/reviews/delete` | User | Delete own review |
| GET | `/api/reviews/[productId]` | — | Get all reviews for a product |

After each review create/delete, the product's `rating` and `reviews` count are recalculated automatically.

### Users (Superadmin only)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | Superadmin | List all users (supports `?role=` filter) |
| PATCH | `/api/users/[id]` | Superadmin | Block or unblock a user |
| DELETE | `/api/users/[id]` | Superadmin | Permanently delete a user |

### Dashboard
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | Admin | KPIs, sales graph data, best sellers, category stock |

### Upload
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload` | Admin | Upload image to Cloudinary, returns URL |

---

## Store (Customer Facing)

All store pages live under `/store`.

| Path | Description |
|---|---|
| `/store` | Homepage — Hero, Brands, New Arrivals, Top Selling, Browse by Style, Reviews, Newsletter |
| `/store/login` | Sign in / Sign up + Google, GitHub, Discord OAuth |
| `/store/product/[id]` | Product detail — images, color/size picker, add to cart, reviews tab |
| `/store/category/[slug]` | Filtered product grid by category or style |
| `/store/cart` | Cart with quantity controls, promo code (20% off), order summary |
| `/store/checkout` | Checkout form — places order via `POST /api/orders` |
| `/store/order-success` | Confirmation page shown after successful order |

### Store Navigation Flow
```
/store → browse products → /store/product/[id] → add to cart
       → /store/cart → /store/checkout → /store/order-success
```

### Loyalty-Only Products
Products with `loyaltyOnly: true` are locked behind a **500 loyalty points** threshold. Users with fewer points see a lock UI instead of the add-to-cart button.

---

## Admin Dashboard

All dashboard pages live under `/dashboard` and require `admin` or `superadmin` role.

| Path | Description |
|---|---|
| `/dashboard` | Overview — stat cards, revenue, sales graph, best sellers, category stock, recent orders |
| `/dashboard/products` | Product grid — add, view, edit, delete products |
| `/dashboard/products/[id]` | Single product detail with edit/delete |
| `/dashboard/orders` | Orders table — filter by status, paginated (10/page), click to view detail |
| `/dashboard/orders/[id]` | Order detail — update status (pending → processing → delivered, etc.) |
| `/dashboard/users` | User management — block/unblock/delete (superadmin only) |

### Dashboard Layout
```
┌─────────────┬──────────────────────────────────┐
│   Sidebar   │  Topbar                          │
│  (nav links)│──────────────────────────────────│
│             │  <page content>                  │
│             │                                  │
│             ├──────────────────────────────────│
│             │  Footer                          │
└─────────────┴──────────────────────────────────┘
```

### Sales Graph
The `SaleGraph` component fetches `/api/dashboard/stats` and renders a Chart.js bar chart with three views: **Weekly** (last 7 days), **Monthly** (last 6 months), **Yearly** (last 5 years).

---

## Real-Time Features

The project uses a custom `server.ts` that wraps Next.js inside an Express server and attaches a **Socket.io** instance to `global.__io`.

### Events

| Event | Direction | Trigger |
|---|---|---|
| `new_review` | Server → clients in `product:{id}` room | A review is submitted |
| `delete_review` | Server → clients in `product:{id}` room | A review is deleted |
| `review_notification` | Server → all clients | Any new review (for admin toasts) |

Clients join a product room by emitting `join_product` with the product ID.  
The `NotificationProvider` component connects to the Socket.io server and displays toast notifications for incoming reviews.

---

## Loyalty Points System

- Users earn **10 points per $1 spent** (delivery fee excluded) when placing an order.
- Points are stored on the `User` document (`loyaltyPoints` field).
- Products marked `loyaltyOnly: true` require **500+ points** to add to cart.
- Current points are returned by `GET /api/auth/me` and displayed on the product page.

---

## Login Credentials

### Admin Login (`/login`)

> Used to access the dashboard. Email/password only.

| Role | Email | Password |
|---|---|---|
| superadmin | *(set directly in MongoDB)* | *(set directly in MongoDB)* |
| admin | *(set directly in MongoDB)* | *(set directly in MongoDB)* |

To create an admin account manually, insert a document into the `users` collection with `role: "admin"` or `role: "superadmin"` and a bcrypt-hashed password. Example using MongoDB shell:

```js
db.users.insertOne({
  name: "Super Admin",
  email: "superadmin@example.com",
  password: "<bcrypt hash of your password>",
  role: "superadmin",
  provider: "local",
  isBlocked: false,
  loyaltyPoints: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

You can generate a bcrypt hash with:
```bash
node -e "const b=require('bcryptjs'); b.hash('yourpassword',10).then(console.log)"
```

### Store Login (`/store/login`)

Regular customers register through the store login page using email/password or OAuth (Google, GitHub, Discord). All self-registered accounts receive the `user` role automatically.

### Blocked Accounts

If a user's `isBlocked` field is `true`, login returns a `403` error regardless of correct credentials.
