# ✅ Tsa Kasi Deliveries - Quick Start Checklist

Use this checklist to get your Tsa Kasi Deliveries platform up and running!

---

## 📋 Pre-Flight Checklist

### System Requirements
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Code editor (VS Code recommended)
- [ ] Modern web browser
- [ ] Internet connection

---

## 🔧 Setup Steps

### 1. Install Dependencies
```powershell
# Option A: Use the setup script (recommended)
.\setup.ps1

# Option B: Manual installation
npm install
```
- [ ] Dependencies installed successfully
- [ ] No error messages

---

### 2. Set Up Supabase

#### Create Project
- [ ] Go to https://supabase.com/
- [ ] Sign up / Log in
- [ ] Click "New Project"
- [ ] Name: `tsa-kasi-deliveries`
- [ ] Set database password (save it!)
- [ ] Choose region: South Africa (Cape Town)
- [ ] Wait for project to be ready (~2 minutes)

#### Run Database Schema
- [ ] Open Supabase dashboard
- [ ] Click "SQL Editor" in sidebar
- [ ] Click "New query"
- [ ] Open `supabase/schema.sql` from your project
- [ ] Copy all SQL code
- [ ] Paste into Supabase SQL editor
- [ ] Click "Run" button
- [ ] Verify: "Success. No rows returned"

#### Create Storage Buckets
- [ ] Click "Storage" in Supabase sidebar
- [ ] Click "Create a new bucket"
- [ ] Name: `store-logos`
- [ ] Make it Public: ✅
- [ ] Click "Create bucket"
- [ ] Repeat for: `product-images` (also Public)

#### Get API Credentials
- [ ] Click "Settings" → "API" in Supabase
- [ ] Copy "Project URL"
- [ ] Copy "anon" "public" key
- [ ] Keep these safe!

---

### 3. Configure Environment Variables

- [ ] Open `.env.local` in your project
- [ ] Replace `your_supabase_url_here` with your Project URL
- [ ] Replace `your_supabase_anon_key_here` with your anon key
- [ ] Save the file

**Your .env.local should look like:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_YOCO_PUBLIC_KEY=your_yoco_public_key_here
YOCO_SECRET_KEY=your_yoco_secret_key_here
```

---

### 4. Start Development Server

```powershell
npm run dev
```

- [ ] Server starts without errors
- [ ] See message: "Ready - started server on..."
- [ ] Port shown (usually 3000)

---

### 5. Test the Application

#### Access the Site
- [ ] Open browser
- [ ] Go to: http://localhost:3000
- [ ] See landing page with three buttons

#### Create Admin Account
- [ ] Click "Admin Portal"
- [ ] Click "Don't have an account? Sign up"
- [ ] Fill in:
  - [ ] Full Name
  - [ ] Email (e.g., admin@tsakasi.com)
  - [ ] Phone Number
  - [ ] Password (min 6 characters)
  - [ ] Confirm Password
- [ ] Click "Sign Up"
- [ ] Redirected to login page

#### Login
- [ ] Enter email
- [ ] Enter password
- [ ] Click "Login"
- [ ] See dashboard

#### Verify Dashboard
- [ ] Dashboard loads correctly
- [ ] See 4 stat cards (all showing 0)
- [ ] See Quick Actions section
- [ ] Sidebar shows your name
- [ ] All navigation links work

---

### 6. Add Your First Store

#### Navigate to Stores
- [ ] Click "Stores" in sidebar
- [ ] See "No stores added yet" message
- [ ] See "+ Add Store" button

#### Fill Store Wizard - Step 1
- [ ] Click "+ Add Store"
- [ ] Modal opens
- [ ] Fill Store Name (e.g., "Mama Joyce Spaza")
- [ ] Select Category (e.g., "Spaza")
- [ ] Enter Phone Number
- [ ] Add Description
- [ ] Click "Next Step"

#### Fill Store Wizard - Step 2
- [ ] Select Town (e.g., "Modimolle")
- [ ] Enter Township (e.g., "Phagameng")
- [ ] Enter Street Address
- [ ] (Optional) Add GPS coordinates
- [ ] Click "Next Step"

#### Fill Store Wizard - Step 3
- [ ] Set Open Time (e.g., 08:00)
- [ ] Set Close Time (e.g., 20:00)
- [ ] Verify Operating Days (Mon-Sun)
- [ ] Click "Next Step"

#### Fill Store Wizard - Step 4
- [ ] (Optional) Upload store logo
- [ ] Or skip to use default icon
- [ ] Click "Next Step"

#### Fill Store Wizard - Step 5
- [ ] Choose either:
  - [ ] "Add products manually now" OR
  - [ ] "Skip – Add products later"

**If adding products:**
- [ ] Fill product name
- [ ] Set price
- [ ] Enter category
- [ ] (Optional) Upload product image
- [ ] Click "+ Add Another Product" for more
- [ ] Click "Save Store"

**If skipping:**
- [ ] Verify "Custom Orders Only" message
- [ ] Click "Save Store"

#### Verify Store Created
- [ ] Modal closes
- [ ] Store appears in list
- [ ] Store card shows all details
- [ ] Status is "Active"
- [ ] Category badge shown
- [ ] Address and phone visible

---

### 7. Test Store Management

#### Search Stores
- [ ] Type store name in search box
- [ ] Results filter correctly

#### Filter by Status
- [ ] Change status dropdown
- [ ] Stores filter correctly

#### View Dashboard Stats
- [ ] Click "Dashboard"
- [ ] "Total Stores" now shows 1 (or more)

---

## 🎉 Success Criteria

You've successfully set up Tsa Kasi Deliveries if you can:
- ✅ Access the landing page
- ✅ Create and login as admin
- ✅ View the dashboard
- ✅ Add a store with all details
- ✅ See the store in the stores list
- ✅ Search and filter stores
- ✅ Navigate all admin sections

---

## 🐛 Troubleshooting

### Cannot connect to Supabase
**Problem**: Errors about Supabase connection

**Solutions**:
- [ ] Check `.env.local` has correct URL
- [ ] Verify anon key is correct
- [ ] Make sure Supabase project is active
- [ ] Restart dev server (Ctrl+C, then `npm run dev`)

---

### Images not uploading
**Problem**: Store logos or product images fail to upload

**Solutions**:
- [ ] Verify storage buckets exist
- [ ] Check buckets are set to "Public"
- [ ] Check file size (keep under 2MB)
- [ ] Verify file is an image (PNG, JPG, WebP)

---

### Login not working
**Problem**: Can't login after signup

**Solutions**:
- [ ] Check email and password are correct
- [ ] Clear browser localStorage (F12 → Application → Local Storage → Clear)
- [ ] Try creating new account with different email
- [ ] Check browser console for errors (F12)

---

### Database errors
**Problem**: Errors about missing tables

**Solutions**:
- [ ] Re-run the schema.sql in Supabase SQL Editor
- [ ] Check all tables were created (users, stores, products, orders, order_items)
- [ ] Verify no SQL errors in Supabase logs

---

### npm install fails
**Problem**: Dependencies won't install

**Solutions**:
- [ ] Update Node.js to version 18+
- [ ] Try: `npm install --legacy-peer-deps`
- [ ] Delete `node_modules` folder and try again
- [ ] Clear npm cache: `npm cache clean --force`

---

### Port already in use
**Problem**: Port 3000 is already in use

**Solutions**:
- [ ] Stop other apps using port 3000
- [ ] Or run on different port: `npm run dev -- -p 3001`
- [ ] Or kill process: `netstat -ano | findstr :3000` then `taskkill /PID [PID] /F`

---

## 📞 Need Help?

### Check Documentation
- [ ] README.md - Project overview
- [ ] SETUP_GUIDE.md - Detailed setup
- [ ] ADMIN_WORKFLOW.md - How to use admin portal
- [ ] DATABASE_SCHEMA.md - Database reference
- [ ] VISUAL_GUIDE.md - UI overview
- [ ] BUILD_SUMMARY.md - What's built

### Check Browser Console
- [ ] Press F12
- [ ] Click "Console" tab
- [ ] Look for error messages (red text)
- [ ] Copy error and search online

### Check Server Terminal
- [ ] Look at PowerShell where `npm run dev` is running
- [ ] Check for error messages
- [ ] Look for warnings

---

## 🚀 Next Steps After Setup

Once everything works:

### Add More Stores
- [ ] Add different store types (spaza, restaurant, tuck shop)
- [ ] Test both product and custom order modes
- [ ] Upload various images
- [ ] Test search and filters

### Explore Admin Portal
- [ ] Check all sidebar sections
- [ ] Familiarize with dashboard
- [ ] Test mobile view (resize browser)

### Plan Development
- [ ] Review BUILD_SUMMARY.md for next phases
- [ ] Decide: Customer portal OR Driver portal first
- [ ] Prepare test data (stores, products)

### Production Prep (Future)
- [ ] Implement proper password hashing
- [ ] Replace localStorage auth
- [ ] Set up proper environment variables
- [ ] Configure domain and hosting

---

## ✅ Final Checklist

Before moving to next phase, verify:
- [ ] All dependencies installed
- [ ] Supabase configured correctly
- [ ] Environment variables set
- [ ] Development server runs
- [ ] Admin signup/login works
- [ ] Dashboard loads
- [ ] Can add stores
- [ ] Can add products
- [ ] Images upload correctly
- [ ] Search/filter works
- [ ] All navigation works
- [ ] No console errors

---

## 🎊 Congratulations!

You now have a fully functional admin portal for Tsa Kasi Deliveries!

**You can now:**
- ✅ Manage stores (formal and informal)
- ✅ Add products with images
- ✅ Enable custom orders mode
- ✅ View business statistics
- ✅ Search and filter stores

**Ready to build the customer and driver portals!**

---

**Tsa Kasi Deliveries - Fast. Local. Kasi to Kasi.** 🏍️🍕📦
