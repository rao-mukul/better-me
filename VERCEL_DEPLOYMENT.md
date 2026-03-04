# Vercel Deployment Guide

## Deploying to Vercel (Separate Frontend & Backend)

### Prerequisites
- A [Vercel account](https://vercel.com/signup)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) database
- [Vercel CLI](https://vercel.com/docs/cli) installed (optional): `npm i -g vercel`

---

## Part 1: Deploy Backend (API)

### Step 1: Deploy Backend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New... → Project"**
3. Import your repository: `rao-mukul/better-me`
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `server`
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

### Step 2: Add Backend Environment Variables

In the Vercel project settings, add these environment variables:

- `MONGODB_URI`: Your MongoDB connection string (from MongoDB Atlas)
- `NODE_ENV`: `production`
- `CLIENT_URL`: `*` (or your frontend URL after deploying)

### Step 3: Deploy

Click **"Deploy"** and wait for the deployment to complete.

Copy your backend URL (e.g., `https://your-backend.vercel.app`)

---

## Part 2: Deploy Frontend

### Step 1: Update Frontend Configuration

Before deploying, update `client/.env.production` with your backend URL:

```env
VITE_API_URL=https://your-backend.vercel.app/api
```

Commit and push this change to GitHub.

### Step 2: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New... → Project"**
3. Import the SAME repository again: `rao-mukul/better-me`
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Add Frontend Environment Variables

In the Vercel project settings, add:

- `VITE_API_URL`: `https://your-backend.vercel.app/api` (use your actual backend URL)

### Step 4: Deploy

Click **"Deploy"** and wait for the deployment to complete.

---

## Part 3: Update CORS Settings

After both are deployed, update your backend's `CLIENT_URL` environment variable:

1. Go to your backend project on Vercel
2. Go to **Settings → Environment Variables**
3. Update `CLIENT_URL` to your frontend URL (e.g., `https://your-frontend.vercel.app`)
4. Redeploy the backend

---

## MongoDB Atlas Setup

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with a password
3. Go to **Network Access** → Add IP Address → Allow Access from Anywhere (`0.0.0.0/0`)
4. Get your connection string from **Database → Connect → Connect your application**
5. Replace `<password>` with your actual password
6. Add the connection string as `MONGODB_URI` in Vercel

---

## Using Vercel CLI (Alternative Method)

You can also deploy using the CLI:

### Backend:
```bash
cd server
vercel --prod
```

### Frontend:
```bash
cd client
vercel --prod
```

---

## Troubleshooting

### Backend Issues

**500 Error on API calls:**
- Check Vercel logs in the dashboard
- Verify `MONGODB_URI` is set correctly
- Ensure MongoDB Atlas allows connections from anywhere

**CORS Errors:**
- Update `CLIENT_URL` environment variable with your frontend URL
- Redeploy backend after changing env vars

### Frontend Issues

**API calls fail:**
- Verify `VITE_API_URL` points to your backend URL
- Check browser console for errors
- Test backend health endpoint: `https://your-backend.vercel.app/api/health`

**Environment variables not working:**
- Remember: Vite env vars must start with `VITE_`
- Redeploy after adding/changing environment variables

---

## Local Development

### Backend:
```bash
cd server
npm install
npm run dev
```

### Frontend:
```bash
cd client
npm install
npm run dev
```

Make sure to create `.env` files in both directories (use `.env.example` as reference).

---

## Useful Commands

```bash
# View deployment logs
vercel logs [deployment-url]

# List all deployments
vercel ls

# Remove a deployment
vercel rm [deployment-url]
```

---

## Important Notes

- Vercel has a 10-second timeout for serverless functions on the free tier
- MongoDB Atlas free tier has 512MB storage limit
- Both deployments will be on separate URLs
- Environment variables are built into the deployment; changes require redeployment
