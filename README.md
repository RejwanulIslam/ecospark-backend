# 🌿 EcoSpark Hub — Backend API

Express.js + TypeScript + Prisma + PostgreSQL

## 📋 Demo Credentials
- **Admin:** admin@ecospark.com / Admin@123456
- **Member:** member@ecospark.com / Member@123456
- **Stripe Test Card:** 4242 4242 4242 4242 · any future date · any CVC

---

## 🚀 Local Development

### 1. Clone & Install
```bash
git clone <your-backend-repo-url>
cd ecospark-backend
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
```
Fill in `.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecospark_db"
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### 3. Database Setup
```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4. Run
```bash
npm run dev
# Server: http://localhost:5000
```

---

## 🚀 Deployment on Vercel

### Step 1 — Setup Vercel CLI
If you haven't already, install the Vercel CLI:
```bash
npm i -g vercel
```

### Step 2 — Configure Environment Variables
You will need to add the following environment variables in your Vercel project settings (or provide them during `vercel env add`):
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `NODE_ENV` (set to `production`)
- `FRONTEND_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Step 3 — Deploy
Run the following command to deploy:
```bash
vercel --prod
```

### Step 4 — Seed Database (one-time)
If this is a fresh database, you'll need to seed it locally using the production `DATABASE_URL` or run a script.
```bash
DATABASE_URL="your-production-db-url" npm run prisma:seed
```

### Step 5 — Verify
Visit your provided Vercel URL, e.g.: `https://ecospark-backend.vercel.app/health`
Should return: `{"status":"ok","timestamp":"..."}`

---

## 🔗 API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me              (auth required)
PUT  /api/auth/profile         (auth required)
PUT  /api/auth/change-password (auth required)
```

### Ideas
```
GET    /api/ideas                (public)
GET    /api/ideas/top            (public)
GET    /api/ideas/:slug          (public/auth)
GET    /api/ideas/my             (auth)
POST   /api/ideas                (auth)
PUT    /api/ideas/:id            (auth, owner)
DELETE /api/ideas/:id            (auth, owner)
POST   /api/ideas/:id/submit     (auth, owner)
```

### Admin (admin only)
```
GET    /api/admin/stats
GET    /api/admin/ideas
PATCH  /api/admin/ideas/:id/approve
PATCH  /api/admin/ideas/:id/reject
GET    /api/admin/users
PATCH  /api/admin/users/:id/toggle-status
PATCH  /api/admin/users/:id/role
```

### Payment
```
POST /api/payment/create-intent  (auth)
POST /api/payment/confirm        (auth)
POST /api/payment/webhook        (Stripe)
GET  /api/payment/check/:ideaId  (auth)
GET  /api/payment/my-purchases   (auth)
```
