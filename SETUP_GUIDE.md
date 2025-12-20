# Tsa Kasi Deliveries - Setup Guide

## 🚀 Quick Start Guide

This guide will help you set up and run your Tsa Kasi Deliveries MVP.

---

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js** 18+ installed ([Download here](https://nodejs.org/))
- **npm** or **yarn** package manager
- A **Supabase** account ([Sign up here](https://supabase.com/))
- A **Yoco** account for payments ([Sign up here](https://www.yoco.com/))

---

## 🔧 Step 1: Install Dependencies

Open PowerShell in your project directory and run:

```powershell
npm install
```

This will install all required packages including:
- Next.js 14
- React
- TailwindCSS
- Supabase client
- Lucide React icons

---

## 🗄️ Step 2: Set Up Supabase Database

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/)
2. Click "New Project"
3. Choose a name: `tsa-kasi-deliveries`
4. Set a strong database password
5. Choose a region close to South Africa (e.g., `South Africa (Cape Town)`)
6. Click "Create new project"

### 2.2 Run the Database Schema

1. In your Supabase dashboard, click on the **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to create all tables

### 2.3 Set Up Storage Buckets

1. Go to **Storage** in the Supabase dashboard
2. Click "Create a new bucket"
3. Create bucket: `store-logos` (set to Public)
4. Create another bucket: `product-images` (set to Public)

### 2.4 Get Your Supabase Credentials

1. Go to **Settings** → **API**
2. Copy your:
   - `Project URL`
   - `anon public` key

---

## 🔑 Step 3: Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_YOCO_PUBLIC_KEY=your_yoco_public_key_here
YOCO_SECRET_KEY=your_yoco_secret_key_here
```

---

## 💳 Step 4: Set Up Yoco (Optional - for payments)

1. Sign up at [yoco.com](https://www.yoco.com/)
2. Get your API keys from the developer portal
3. Add them to `.env.local`

> **Note**: For MVP testing, you can skip this step initially.

---

## ▶️ Step 5: Run the Development Server

In PowerShell, run:

```powershell
npm run dev
```

The application will start at: **http://localhost:3000**

---

## 👤 Step 6: Create Your First Admin Account

1. Open your browser and go to: **http://localhost:3000**
2. Click **"Admin Portal"**
3. Click **"Don't have an account? Sign up"**
4. Fill in your details:
   - Full Name: Your name
   - Email: admin@tsakasi.com
   - Phone: Your phone number
   - Password: Choose a strong password
5. Click **"Sign Up"**
6. You'll be redirected to the login page
7. Login with your new credentials

---

## 🏪 Step 7: Add Your First Store

1. After logging in, you'll see the **Dashboard**
2. Click **"Stores"** in the sidebar
3. Click **"+ Add Store"** button
4. Follow the 5-step wizard:

   **Step 1 - Basic Info:**
   - Store Name: e.g., "Mama Joyce Spaza"
   - Category: Select from dropdown
   - Phone Number: Store contact
   - Description: Brief description

   **Step 2 - Address:**
   - Town: Select (Modimolle/Phagameng/Leseding/Bela-Bela)
   - Township: e.g., "Phagameng"
   - Street Address: Full address
   - GPS: (Optional)

   **Step 3 - Operating Hours:**
   - Open Time: e.g., 08:00
   - Close Time: e.g., 20:00
   - Days: e.g., "Mon-Sun"

   **Step 4 - Store Photo:**
   - Upload a logo/photo (optional)

   **Step 5 - Products:**
   - Choose "Add products now" to create a menu
   - OR choose "Skip" for "Custom Orders Only" mode

5. Click **"Save Store"**

---

## 📱 Testing the Application

### Test Admin Features:
- ✅ View dashboard with stats
- ✅ Add/view stores
- ✅ Add products to stores
- ✅ Manage store information

### What's Working:
- **Admin authentication** (signup/login)
- **Store management** (full CRUD)
- **Product setup** (during store creation)
- **Custom orders mode** (for informal businesses)

### Coming Next:
- Customer interface
- Driver interface
- Order processing
- Payment integration
- Real-time tracking

---

## 🐛 Troubleshooting

### "Cannot connect to Supabase"
- Check your `.env.local` file has correct credentials
- Make sure Supabase project is active
- Verify API keys are correct

### "Images not uploading"
- Check storage buckets are created
- Verify buckets are set to "Public"
- Check file size limits

### "Login not working"
- Clear browser localStorage
- Check console for errors
- Verify database tables are created

### "npm install fails"
- Make sure you have Node.js 18+
- Try deleting `node_modules` and running again
- Use `npm install --legacy-peer-deps` if needed

---

## 🔐 Important Security Notes

**⚠️ BEFORE PRODUCTION:**

1. **Password Hashing**: The current implementation stores passwords as plain text for MVP testing. You MUST implement proper password hashing (bcrypt/argon2) before going live.

2. **Authentication**: Replace localStorage-based auth with proper JWT tokens or Supabase Auth.

3. **Environment Variables**: Never commit `.env.local` to git. Keep API keys secret.

4. **Storage Security**: Review storage bucket policies before production.

---

## 📂 Project Structure

```
tsa-kasi-deliveries/
├── app/
│   ├── admin/              ← Admin portal (complete)
│   │   ├── login/          ← Login page
│   │   ├── signup/         ← Signup page
│   │   ├── dashboard/      ← Dashboard
│   │   ├── stores/         ← Store management
│   │   ├── orders/         ← Orders (placeholder)
│   │   ├── agents/         ← Agents (placeholder)
│   │   ├── reports/        ← Reports (placeholder)
│   │   └── settings/       ← Settings (placeholder)
│   ├── page.tsx            ← Home page
│   └── globals.css
├── customer/               ← Customer UI (empty)
├── driver/                 ← Driver UI (empty)
├── lib/
│   └── supabase.ts        ← Supabase client
├── types/
│   └── index.ts           ← TypeScript types
├── supabase/
│   └── schema.sql         ← Database schema
└── .env.local             ← Environment variables
```

---

## 📞 Next Steps

Now that the admin portal is set up, you can:

1. ✅ Test the store management system
2. ✅ Add multiple stores and products
3. ⏭️ Start building the customer interface
4. ⏭️ Build the driver interface
5. ⏭️ Implement order processing
6. ⏭️ Integrate Yoco payments

---

## 💡 Tips

- **Test with real data**: Add actual stores from Modimolle/Bela-Bela
- **Mobile responsive**: All admin pages work on mobile
- **Custom orders**: Perfect for informal spazas without fixed menus
- **Photos**: Adding store/product photos improves customer experience

---

## 🎉 You're Ready!

Your Tsa Kasi Deliveries admin portal is now set up and ready to use. Start by adding stores and building your township marketplace!

**Questions?** Check the README.md or create an issue in your repository.
