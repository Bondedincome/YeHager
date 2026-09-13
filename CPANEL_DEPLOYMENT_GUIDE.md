# YeHagere Luxury E-Commerce: cPanel Deployment Guide (Next.js + NestJS + PostgreSQL / pgMyAdmin)

This guide provides end-to-end instructions for deploying the decoupled architecture (**Next.js** frontend + **NestJS** backend + **PostgreSQL** via cPanel pgMyAdmin / phpPgAdmin).

---

## 1. Architecture Overview

- **Frontend (`/`)**: Next.js App Router (React 19 / Tailwind CSS) with centralized `apiClient` (`/app/lib/api.ts`).
  - Communicates with the NestJS backend via `NESTJS_BACKEND_URL` (or proxy fallback).
  - Can be hosted on your primary domain (e.g., `yehagere.com` or `www.yehagere.com`).
- **Backend (`/backend`)**: NestJS + TypeORM + Passport JWT + PostgreSQL.
  - Exposes REST API with Swagger documentation at `/api/docs`.
  - Can be hosted on a subdomain (e.g., `api.yehagere.com`).
- **Database**: PostgreSQL on cPanel, managed via **phpPgAdmin** / **pgMyAdmin**.
- **Authentication**: Stateless JSON Web Tokens (JWT) stored in secure cookies (`yehagere_auth_token`) and `Authorization: Bearer <token>` headers.

---

## 2. Step 1: Set Up PostgreSQL on cPanel

1. Log in to your **cPanel** dashboard.
2. Navigate to **Databases** > **PostgreSQL Databases**.
3. **Create Database**:
   - Enter database name: e.g. `yehagere_db` (full name will be `cpaneluser_yehagere_db`).
   - Click **Create Database**.
4. **Create Database User**:
   - Under *PostgreSQL Users*, enter username: e.g. `yehagere_user` (full name `cpaneluser_yehagere_user`).
   - Enter a strong password (save this securely).
   - Click **Create User**.
5. **Associate User to Database**:
   - Under *Add User to Database*, select your user and database.
   - Grant **ALL PRIVILEGES**.
   - Click **Submit**.
6. **Access pgMyAdmin / phpPgAdmin**:
   - In cPanel, under **Databases**, open **phpPgAdmin** to view tables, run SQL queries, or inspect data.

---

## 3. Step 2: Deploy the NestJS Backend (`/backend`)

### 3.1 Create Subdomain for API
1. In cPanel, go to **Domains** > **Domains** (or **Subdomains**).
2. Create `api.yehagere.com` pointing to document root `public_html/api` (or a directory outside public_html, e.g. `~/yehagere-backend`).

### 3.2 Upload Backend Code
1. Upload the contents of the `/backend` folder to your server (e.g., `~/yehagere-backend`).
2. Ensure the following files and folders are present:
   - `src/`
   - `package.json`
   - `tsconfig.json`
   - `tsconfig.build.json`
   - `nest-cli.json`
   - `app.js` (Passenger entrypoint)
   - `.env`

### 3.3 Configure Backend `.env`
Create or edit `.env` in the backend folder:
```env
# Application
NODE_ENV=production
PORT=3001
APP_PORT=3001
API_PREFIX=api/v1
FRONTEND_URL=https://yehagere.com

# PostgreSQL Database (from Step 1)
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=cpaneluser_yehagere_user
DB_PASSWORD=YourStrongDbPasswordHere
DB_NAME=cpaneluser_yehagere_db
DB_SYNCHRONIZE=true
DB_LOGGING=false

# Authentication
JWT_SECRET=super_secret_jwt_key_yehagere_luxury_2026_at_least_32_chars
JWT_EXPIRES_IN=7d

# Payment Gateways (Optional)
CHAPA_SECRET_KEY=
STRIPE_SECRET_KEY=
```

### 3.4 Set Up Node.js App in cPanel (Passenger)
1. In cPanel, open **Software** > **Setup Node.js App**.
2. Click **Create Application**:
   - **Node.js version**: Select `18.x`, `20.x`, or highest available.
   - **Application mode**: `Production`.
   - **Application root**: `yehagere-backend` (or the folder where backend code is placed).
   - **Application URL**: `api.yehagere.com`.
   - **Application startup file**: `app.js` (or `dist/main.js`).
3. Click **Create**.
4. In the top banner, copy the command to enter the virtual environment, e.g.:
   ```bash
   source /home/cpaneluser/nodevenv/yehagere-backend/20/bin/activate && cd /home/cpaneluser/yehagere-backend
   ```
5. Open **Terminal** in cPanel, paste the command, then run:
   ```bash
   npm install
   npm run build
   ```
6. Return to **Setup Node.js App** and click **Restart Application**.
7. Verify by opening `https://api.yehagere.com/api/docs` in your browser to view the interactive Swagger documentation.

---

## 4. Step 3: Deploy the Next.js Frontend

### 4.1 Upload Frontend Files
Upload the project files (excluding `/backend`, `.git`, and `node_modules`) to your frontend folder (e.g., `~/yehagere-frontend` or `public_html`).

### 4.2 Configure Frontend Environment Variables (`.env.production` or `.env.local`)
```env
NODE_ENV=production
PORT=3000
NESTJS_BACKEND_URL=https://api.yehagere.com/api/v1
NEXT_PUBLIC_SITE_URL=https://yehagere.com
JWT_SECRET=super_secret_jwt_key_yehagere_luxury_2026_at_least_32_chars
```

### 4.3 Set Up Node.js App in cPanel
1. In cPanel > **Setup Node.js App**, click **Create Application**:
   - **Node.js version**: `18.x` or `20.x`.
   - **Application mode**: `Production`.
   - **Application root**: `yehagere-frontend`.
   - **Application URL**: `yehagere.com`.
   - **Application startup file**: `server.js`.
2. Click **Create**.
3. In cPanel Terminal, enter the virtual environment:
   ```bash
   source /home/cpaneluser/nodevenv/yehagere-frontend/20/bin/activate && cd /home/cpaneluser/yehagere-frontend
   npm install
   npm run build
   ```
4. Click **Restart Application**.

---

## 5. Summary of Architecture Benefits

1. **Clean Decoupling**: Frontend (Next.js) handles SSR, styling, luxury animations, and catalog presentation; Backend (NestJS) handles relational models, TypeORM entities, JWT auth, and transactions.
2. **Zero Vendor Lock-in**: No Firebase or Supabase dependencies. All data is securely stored in your self-hosted PostgreSQL database on cPanel.
3. **cPanel Native**: Powered by Phusion Passenger with `app.js` and `server.js` startup scripts.
4. **pgMyAdmin Management**: Directly browse tables (`user`, `product`, `order`, `category`, `inquiry`) with full visual control.
