# Mini ERP + CRM Operations Portal

A full-stack ERP/CRM system for a wholesale/distribution company, managing customers, products, stock, sales challans, and basic CRM follow-ups.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js · TypeScript · Express.js |
| **Database** | PostgreSQL · Prisma ORM |
| **Frontend** | React · TypeScript · Vite |
| **Auth** | JWT (role-based access) |

## Project Structure

```
mini-erp-crm-portal/
├── server/          # Express.js REST API
│   ├── src/
│   │   ├── config/       # DB connection, environment config
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── modules/      # Feature modules (auth, customers, products, challans)
│   │   └── utils/        # Helpers, response formatters
│   └── prisma/           # Schema, migrations, seed
│
├── client/          # React + Vite frontend
│   └── src/
│       ├── api/          # API client functions
│       ├── components/   # Shared UI components
│       ├── context/      # Auth context
│       ├── hooks/        # Custom hooks
│       └── pages/        # Route-level pages
│
└── README.md
```

## Prerequisites

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x (local or cloud — e.g., Neon, Supabase)
- **npm** >= 9.x

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd mini-erp-crm-portal
```

### 2. Set up the backend

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and set your DATABASE_URL, JWT_SECRET, etc.

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed the database with demo data
npm run seed

# Start the development server
npm run dev
# Server runs on http://localhost:5000
```

### 3. Set up the frontend

```bash
cd client

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the development server
npm run dev
# Client runs on http://localhost:5173
```

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@erp.com | password123 |
| Sales | sales@erp.com | password123 |
| Warehouse | warehouse@erp.com | password123 |
| Accounts | accounts@erp.com | password123 |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login, returns JWT |
| `POST` | `/api/auth/register` | Register user (Admin only) |
| `GET` | `/api/auth/me` | Current user profile |
| `GET` | `/api/customers` | List customers (paginated, searchable) |
| `POST` | `/api/customers` | Create customer |
| `GET` | `/api/customers/:id` | Customer detail with notes |
| `PUT` | `/api/customers/:id` | Update customer |
| `POST` | `/api/customers/:id/notes` | Add follow-up note |
| `GET` | `/api/products` | List products (paginated, searchable) |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `POST` | `/api/products/:id/stock-movements` | Record stock movement |
| `GET` | `/api/products/:id/stock-movements` | Stock movement history |
| `GET` | `/api/challans` | List challans (paginated, filterable) |
| `POST` | `/api/challans` | Create challan with line items |
| `GET` | `/api/challans/:id` | Challan detail with snapshots |
| `PATCH` | `/api/challans/:id/confirm` | Confirm challan (deducts stock) |
| `PATCH` | `/api/challans/:id/cancel` | Cancel challan |

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Secret key for JWT signing | — |
| `JWT_EXPIRES_IN` | Token expiry duration | `24h` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |

### Client (`client/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full access to all modules |
| **Sales** | Customers, Challans |
| **Warehouse** | Products, Inventory, Stock |
| **Accounts** | Challans (view), Reports |

## Assumptions

1. This is an internal tool — no public registration. Only Admin can create users.
2. JWT tokens are stored in `localStorage` on the client (acceptable for internal tools).
3. Challan confirmation is transactional — all stock checks pass or the entire operation rolls back.
4. Product data is snapshotted into challan items at creation time, not at confirmation time.
5. Follow-up notes are append-only (no edit/delete).
6. Challan number format: `CH-YYYYMMDD-XXXX` (auto-generated, sequential).

## License

This project was built as part of a technical assessment.
