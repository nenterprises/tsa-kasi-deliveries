# Tsa Kasi Deliveries - Deployment Guide

## 🚀 Deploy to Vercel (Frontend + API)

### Step 1: Create a Production Supabase Project

To keep your **local data separate from production data**, create a NEW Supabase project:

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Name it: `tsa-kasi-production` (or similar)
4. Choose a strong database password (save it!)
5. Select region: **South Africa (Johannesburg)** for best performance
6. Wait for the project to be created

### Step 2: Set Up Production Database Schema

1. In your NEW Supabase project, go to **SQL Editor**
2. Run these SQL files in order:
   - `supabase/schema.sql` - Main database schema
   - `supabase/migration.sql` - Migrations
   - `supabase/add_categories.sql` - Categories
   - `supabase/agent_profiles_migration.sql` - Agent profiles
   - `supabase/storage_policies.sql` - Storage policies

3. Copy the **Project URL** and **anon key** from:
   - Supabase Dashboard → Settings → API

### Step 3: Deploy to Vercel

#### Option A: Deploy via GitHub (Recommended)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/tsa-kasi-deliveries.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub

3. Click **"Add New Project"**

4. Import your repository

5. **Configure Environment Variables** (CRITICAL):
   
   Add these in Vercel's project settings:
   
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your **PRODUCTION** Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your **PRODUCTION** Supabase anon key |
   | `NEXT_PUBLIC_YOCO_PUBLIC_KEY` | Your Yoco public key |
   | `YOCO_SECRET_KEY` | Your Yoco secret key |

6. Click **Deploy**

#### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow prompts and add environment variables when asked

### Step 4: Configure Custom Domain (Optional)

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `tsakasi.co.za`)
3. Update DNS records as instructed

---

## 🔐 Environment Variables Summary

### Local Development (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://nmhtxpbcgrwazvzljslr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_key
NEXT_PUBLIC_YOCO_PUBLIC_KEY=pk_test_xxx
YOCO_SECRET_KEY=sk_test_xxx
```

### Production (Vercel Environment Variables)
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PRODUCTION_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
NEXT_PUBLIC_YOCO_PUBLIC_KEY=pk_live_xxx
YOCO_SECRET_KEY=sk_live_xxx
```

---

## ⚠️ Important Notes

1. **Data Separation**: Your local `.env.local` points to your dev Supabase. Vercel will use the production Supabase you set in environment variables. **They are completely separate databases**.

2. **Never commit `.env.local`**: It's already in `.gitignore`

3. **Seed Production Data**: After deploying, you may need to add stores/products to your production database via the admin panel

4. **Yoco Keys**: Use `pk_test_` keys for testing, `pk_live_` for production

---

## 🔄 Updating Production

After making changes locally:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically redeploy!

---

## 📊 Database Management

- **Local Data**: Managed in your development Supabase project
- **Production Data**: Managed in your production Supabase project
- **No overlap**: Changes in one don't affect the other

To copy specific data from local to production, export from local Supabase and import to production Supabase using their SQL Editor.
