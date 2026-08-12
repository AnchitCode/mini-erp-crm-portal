# Mini ERP + CRM Operations Portal

A full-stack enterprise resource planning (ERP) and customer relationship management (CRM) portal built for wholesale and distribution companies. This system manages customer relationships, tracks product inventory, records auditable stock movements, and securely processes sales challans using concurrency-safe database transactions.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

## Overview

Wholesale distribution involves tight coupling between sales operations and warehouse inventory. This application bridges that gap by providing a unified, role-based dashboard where sales teams can manage clients and issue challans, while warehouse teams can monitor stock alerts and log inventory movements. The backend prioritizes data integrity, ensuring that stock deductions are strictly atomic and fully auditable.

## 🌐 Live Production Links

- **Live Application (Frontend):** https://mini-erp-crm-portal-one.vercel.app
- **Live API Backend:** https://mini-erp-crm-api-q68t.onrender.com
- **API Health Check:** https://mini-erp-crm-api-q68t.onrender.com/api/health
- **Database:** Cloud PostgreSQL (Neon)

> **Note:** The backend is hosted on Render's free tier and may take a few seconds to wake up after a period of inactivity.

## Key Features

### Authentication & RBAC
* **JWT-based Authentication**: Stateless, secure user sessions.
* **Role-Based Access Control**: Strict access boundaries enforcing least-privilege principles across four distinct roles (Admin, Sales, Warehouse, Accounts).
* **Password Security**: Passwords are securely hashed via `bcryptjs`.

### Customer CRM
* **Lead & Contact Management**: Full CRUD operations for tracking customers (Retail, Wholesale, Distributor).
* **Search & Filter**: Paginated, server-side filtering for rapid customer lookups.
* **Activity Timeline**: Append-only follow-up notes to maintain a chronological history of client interactions.

### Product & Inventory
* **Catalog Management**: Real-time tracking of product SKUs, pricing, and categorizations.
* **Immutable Stock Audit Log**: All stock variations (IN/OUT) are permanently recorded with timestamps, user IDs, and justifications.
* **Low-Stock Visibility**: Automatic calculation and highlighting of products breaching minimum stock thresholds.

### Sales Challans (Core Engine)
* **Lifecycle State Machine**: Challans progress through `Draft` → `Confirmed` → `Cancelled` states.
* **Data Snapshots**: Line items capture historical product data (Name, SKU, Price) at the time of creation to insulate historical records from future catalog changes.
* **Concurrency-Safe Deductions**: Confirming a challan executes an atomic database transaction that unconditionally prevents stock from dropping below zero, automatically rejecting racing requests.
* **Reversible Operations**: Canceling a confirmed challan transactionally restores product stock and automatically generates an accompanying `IN` stock movement for the audit log.

### Dashboard & UX
* **Role-Tailored Overviews**: Sales sees CRM metrics; Warehouse sees low-stock alerts; Admins see a holistic business summary.
* **Responsive Polish**: A responsive React interface featuring global error boundaries, 404 handling, loading spinners, and toast notifications for asynchronous operations.

---

## Engineering Highlights

### Transactional & Atomic Stock Safety
The most critical business requirement is preventing negative inventory when multiple sales agents confirm challans simultaneously. 
Instead of relying on a naive `SELECT` followed by an `UPDATE` (which is vulnerable to race conditions), the backend uses **conditional atomic updates** via Prisma:

```typescript
await tx.product.updateMany({
  where: {
    id: item.productId,
    currentStock: { gte: item.quantity }, // Condition checked atomically at execution
  },
  data: { currentStock: { decrement: item.quantity } },
});
```
If this update affects zero rows, the transaction safely aborts and alerts the user of a stock conflict, guaranteeing 100% data integrity under heavy concurrency.

### Strong Typing & Validation
- **Zod Schemas**: Every API boundary is guarded by strict `zod` validation schemas.
- **Shared Contracts**: Frontend TypeScript interfaces directly mirror the backend Zod inference types, ensuring compile-time safety across the network boundary.

---

## Architecture

```mermaid
flowchart LR
    Browser[Browser / React UI]
    subgraph Frontend [React + Vite]
        UI[Components/Pages]
        APIClient[Axios API Client]
        UI --> APIClient
    end
    
    subgraph Backend [Node.js + Express]
        Auth[RBAC Middleware]
        Modules[Feature Controllers]
        Validation[Zod Validation]
        Auth --> Validation
        Validation --> Modules
    end
    
    subgraph Database [PostgreSQL]
        ORM[Prisma ORM]
        DB[(PostgreSQL)]
        ORM --> DB
    end

    Browser -->|JWT via HTTP| Frontend
    APIClient -->|REST API| Auth
    Modules --> ORM
```

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend UI** | React 18, Vite | Component-based, lightning-fast HMR builds |
| **Frontend Routing** | React Router v6 | Client-side routing and protected routes |
| **Backend Server** | Node.js, Express.js | High-performance asynchronous REST APIs |
| **Database ORM** | Prisma | Type-safe database queries and migrations |
| **Database** | PostgreSQL | Relational data integrity and ACID transactions |
| **Validation** | Zod | Runtime schema validation for all API inputs |
| **Testing** | Node:test | Native backend testing for concurrency logic |

---

## Database Design

```mermaid
erDiagram
    USER ||--o{ CHALLAN : creates
    USER ||--o{ STOCK_MOVEMENT : creates
    USER ||--o{ FOLLOW_UP_NOTE : creates
    
    CUSTOMER ||--o{ CHALLAN : has
    CUSTOMER ||--o{ FOLLOW_UP_NOTE : tracks
    
    PRODUCT ||--o{ CHALLAN_ITEM : included_in
    PRODUCT ||--o{ STOCK_MOVEMENT : logs
    
    CHALLAN ||--|{ CHALLAN_ITEM : contains
```

## Core Business Workflow: Challan Confirmation

The system's focal point is the sales transaction workflow. It ensures that stock is only deducted if available, and that every change leaves a permanent audit trail.

```mermaid
sequenceDiagram
    participant S as Sales User
    participant API as Backend API
    participant DB as PostgreSQL
    
    S->>API: PATCH /api/challans/:id/confirm
    activate API
    API->>DB: BEGIN TRANSACTION
    API->>DB: Verify Challan is 'Draft'
    API->>DB: Pre-validate stock levels
    
    alt Insufficient Stock
        API-->>DB: ROLLBACK
        API-->>S: 400 Bad Request (Insufficient Stock Error)
    else Sufficient Stock
        API->>DB: Atomic Update (currentStock >= requested)
        API->>DB: Create 'OUT' Stock Movements (Audit)
        API->>DB: Update Challan Status to 'Confirmed'
        API->>DB: COMMIT TRANSACTION
        API-->>S: 200 OK (Challan Confirmed)
    end
    deactivate API
```

---

## Role Matrix

Access is strictly enforced at both the React UI level and the Express route level.

| Role | Dashboard | Customers | Products | Stock Movements | Challans |
|---|---|---|---|---|---|
| **Admin** | Full Overview | Full Access | Full Access | Create / View | Create / Confirm / Cancel |
| **Sales** | CRM & Sales Stats | Full Access | Read-Only | No Access | Create / Confirm / Cancel |
| **Warehouse** | Inventory Stats | No Access | Full Access | Create / View | No Access |
| **Accounts** | Challan Stats | No Access | No Access | No Access | Read-Only |

---

## API Overview

*All routes (except login) require a valid `Authorization: Bearer <token>` header.*

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| **Auth** |
| `POST` | `/api/auth/login` | Authenticate and retrieve JWT | Public |
| `GET` | `/api/auth/me` | Fetch active user profile | Authenticated |
| **Dashboard** |
| `GET` | `/api/dashboard/stats` | Retrieve aggregated dashboard metrics | Authenticated |
| **Customers** |
| `GET` | `/api/customers` | List customers (paginated, filtered) | Admin, Sales |
| `POST` | `/api/customers` | Create a new customer lead/contact | Admin, Sales |
| `GET` | `/api/customers/:id` | Fetch customer timeline and details | Admin, Sales |
| `PUT` | `/api/customers/:id` | Update customer profile | Admin, Sales |
| `POST` | `/api/customers/:id/notes` | Append a follow-up note to customer | Admin, Sales |
| **Products** |
| `GET` | `/api/products` | List catalog and stock levels | Admin, Sales, Warehouse |
| `POST` | `/api/products` | Create a new product SKU | Admin, Warehouse |
| `PUT` | `/api/products/:id` | Update product catalog details | Admin, Warehouse |
| `GET` | `/api/products/:id` | Fetch product details & movement log | Admin, Sales, Warehouse |
| `POST` | `/api/products/:id/movements`| Manually record an IN/OUT movement | Admin, Warehouse |
| **Challans** |
| `GET` | `/api/challans` | List challans (paginated, filtered) | Admin, Sales, Accounts |
| `POST` | `/api/challans` | Draft a new sales challan | Admin, Sales |
| `GET` | `/api/challans/:id` | View challan line items and snapshots | Admin, Sales, Accounts |
| `PATCH`| `/api/challans/:id/confirm` | Confirm challan & atomic deduct stock | Admin, Sales |
| `PATCH`| `/api/challans/:id/cancel` | Cancel challan & restore stock | Admin, Sales |

---

## Project Structure

```text
mini-erp-crm-portal/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── api/                # Axios client & typed API wrappers
│   │   ├── components/         # Reusable UI (Layout, ErrorBoundary)
│   │   ├── context/            # Auth & Toast React Contexts
│   │   ├── pages/              # Route views (Dashboard, Customers, etc.)
│   │   └── App.tsx             # React Router configuration
│   └── .env                    # Client environment config
│
├── server/                     # Node.js + Express Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema & relationships
│   │   └── seed.ts             # Demo data population script
│   ├── src/
│   │   ├── config/             # DB initialization & env loading
│   │   ├── middleware/         # Auth verification & Error handlers
│   │   ├── modules/            # Domain logic (Controllers, Services, Zod schemas)
│   │   └── server.ts           # Express bootstrapper
│   └── tests/                  # Native node:test suite for business logic
│
└── README.md                   # Project documentation
```

---

## Getting Started

### Prerequisites
- **Node.js** (v18.x or higher)
- **PostgreSQL** (v14.x or higher — local or cloud hosted like Neon/Supabase)

### 1. Clone & Install
```bash
git clone <repository-url>
cd mini-erp-crm-portal

# Install Backend Dependencies
cd server
npm install

# Install Frontend Dependencies
cd ../client
npm install
```

### 2. Environment Configuration
**Backend (`server/.env`)**
```env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/minierp
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h
```

**Frontend (`client/.env`)**
```env
VITE_API_URL=http://localhost:5001/api
```

### 3. Database Setup & Seeding
From the `server/` directory, run:
```bash
npx prisma migrate dev --name init
npm run seed
```

### 4. Run the Application
Start the backend (from `server/`):
```bash
npm run dev
```

Start the frontend (from `client/`):
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`.

---

## Demo Accounts

The `npm run seed` command provisions the database with test data and the following pre-configured user accounts (Password for all: `password123`):

| Role | Email | Intended Usage |
|---|---|---|
| **Admin** | `admin@erp.com` | Full unrestricted testing |
| **Sales** | `sales@erp.com` | CRM & Challan testing |
| **Warehouse**| `warehouse@erp.com` | Inventory management testing |
| **Accounts** | `accounts@erp.com` | Read-only reporting testing |

> *Note: These credentials are strictly for local development and demonstration purposes.*

---

## Testing & Verification

The project includes strict verification checks:

1. **Backend Concurrency Tests**: The server leverages the native `node:test` runner to validate transactional safety and atomic stock deductions during race conditions.
   ```bash
   # From the server/ directory
   npx tsc --noEmit && npx tsx --test tests/*.test.ts
   ```
2. **TypeScript Compilation**: Both the client and server are strictly typed. The client build process (`npm run build`) runs `tsc -b` to guarantee zero type errors prior to bundling.

---

## Security Notes
- **API Guarding**: Broad Express middleware validates the presence and signature of the JWT, while route-specific middlewares assert the user's role array.
- **SQL Injection Prevention**: Prisma ORM is utilized exclusively, intrinsically protecting against SQL injection vulnerabilities.
- **Environment Isolation**: Database URIs and JWT secrets are injected via `dotenv` and never committed to source control.

---
*Developed as a demonstration of robust full-stack architecture, API design, and transactional database integrity.*
