# Deployment Notes: Mini ERP + CRM Portal

## 1. Backend Deployment (Render)

The Express/Node.js backend is prepared for deployment on [Render](https://render.com) using a Web Service.

### Configuration on Render:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `DATABASE_URL`: Your production Neon PostgreSQL connection string
  - `JWT_SECRET`: A secure, randomly generated 64-character secret
  - `JWT_EXPIRES_IN`: `24h`
  - `CORS_ORIGIN`: Your deployed Vercel frontend URL (e.g., `https://mini-erp-crm.vercel.app`)

*Note: Render automatically sets and handles the `PORT` environment variable.*

## 2. Frontend Deployment (Vercel)

The React/Vite frontend is prepared for deployment on [Vercel](https://vercel.com).

### Configuration on Vercel:
- **Framework Preset**: Vite
- **Build Command**: `npm run build` (Automatically detected by Vercel)
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Your deployed Render backend URL (e.g., `https://mini-erp-backend.onrender.com/api`)

*Note: A `vercel.json` file has been provided in the `client/` directory to automatically rewrite all paths to `index.html`, which handles React Router SPA behaviors gracefully.*

## 3. Database Deployment (Neon / PostgreSQL)

The project leverages Prisma ORM. No manual database setup is required beyond provisioning the Postgres instance.

1. Ensure the `DATABASE_URL` is configured in your backend environment variables.
2. The deployment build process natively supports Prisma. Run `npx prisma migrate deploy` during the backend deployment pipeline if needed, or simply let the application start as Prisma pushes schemas natively during `npm run start` if configured that way.
3. For initial data (Demo accounts), you may manually run: `npx prisma db seed` on the deployed environment.

## 4. Known Deployment Limitations

- The free tier of Render spins down after 15 minutes of inactivity. Initial requests after inactivity may take 30-50 seconds to complete. The Vercel frontend may experience a short loading state during this cold boot.
