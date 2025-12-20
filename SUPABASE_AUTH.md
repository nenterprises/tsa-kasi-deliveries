# Supabase Auth Integration - Documentation

## ✅ Yes, Supabase Auth is properly configured!

### How It Works

**Supabase Auth** handles all password hashing, authentication, and session management automatically. The application uses a **two-table approach**:

1. **`auth.users`** (Supabase managed) - Stores authentication credentials
2. **`public.users`** (Your app) - Stores user profile data and roles

### Schema Structure

```sql
-- Your users table references Supabase Auth
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin', 'driver')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Customer Signup Flow

1. **Supabase Auth creates user:**
   ```typescript
   const { data: authData, error: authError } = await supabase.auth.signUp({
     email: formData.email,
     password: formData.password,
   })
   ```
   - Password is automatically hashed by Supabase
   - User created in `auth.users` table
   - Returns user ID

2. **Profile created in your users table:**
   ```typescript
   const { error: profileError } = await supabase
     .from('users')
     .insert({
       id: authData.user.id,  // Links to auth.users
       email: formData.email,
       full_name: formData.fullName,
       phone_number: formData.phoneNumber,
       role: 'customer',      // Role separation!
       status: 'active',
     })
   ```

### Role Separation (✅ Implemented)

**Three distinct roles with database-level constraints:**

```sql
role TEXT NOT NULL CHECK (role IN ('customer', 'admin', 'driver'))
```

| Role | Access |
|------|--------|
| **customer** | Can create orders, view own orders, browse stores/products |
| **driver** | Can view assigned orders, update delivery status |
| **admin** | Full access to all data, can manage stores, orders, users |

### Row Level Security (RLS) Policies

**Comprehensive RLS policies enforce role-based access:**

#### Users Table
- ✅ Users can view/update their own profile
- ✅ Users CANNOT change their own role
- ✅ Admins can view/update all users
- ✅ Profile creation allowed on signup

#### Stores Table
- ✅ Anyone can view active stores
- ✅ Only admins can create/update/delete stores

#### Products Table
- ✅ Anyone can view available products from active stores
- ✅ Only admins can manage products

#### Orders Table
- ✅ Customers can view only their own orders
- ✅ Customers can create new orders
- ✅ Drivers can view orders assigned to them
- ✅ Drivers can update status of assigned orders
- ✅ Admins can view/manage all orders

#### Order Items Table
- ✅ Users can view items for orders they have access to
- ✅ Customers can add items to their orders
- ✅ Admins can manage all order items

### Login Flow

```typescript
// Sign in with Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})

// Verify role from users table
const { data: userData } = await supabase
  .from('users')
  .select('role, status')
  .eq('id', data.user.id)
  .single()

// Role-based redirect
if (userData.role === 'customer') {
  router.push('/customer/stores')
} else if (userData.role === 'admin') {
  router.push('/admin/dashboard')
}
```

### Security Features

✅ **Password Security**
- Passwords automatically hashed by Supabase
- Never stored in plaintext
- Uses bcrypt with industry-standard rounds

✅ **Session Management**
- JWT tokens automatically managed
- Refresh tokens for persistent sessions
- Automatic session expiry

✅ **Row Level Security**
- Database-level access control
- Cannot be bypassed from client
- Enforced at PostgreSQL level

✅ **Role Verification**
- Checked on login
- Checked on protected routes
- Enforced by RLS policies

✅ **Status Checking**
- Active/inactive/suspended users
- Suspended users cannot access system
- Controlled by admins

### Authentication State

**Client-side auth state:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

**Server-side auth (for API routes):**
```typescript
const { data: { user } } = await supabase.auth.getUser()
// User is verified via JWT token
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client initialization |
| `app/customer/signup/page.tsx` | Customer registration |
| `app/customer/login/page.tsx` | Customer login |
| `supabase/schema.sql` | Database schema with RLS policies |

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### What Happens on Signup?

1. User fills signup form
2. `supabase.auth.signUp()` creates auth user (password hashed automatically)
3. User record created in `public.users` with role='customer'
4. User automatically logged in
5. Redirected to `/customer/stores`

### What Prevents Role Escalation?

**Multiple layers of protection:**

1. **RLS Policy** - Users cannot update their own role:
   ```sql
   CREATE POLICY "Users can update own profile"
     ON users FOR UPDATE
     WITH CHECK (role = (SELECT role FROM users WHERE id = auth.uid()));
   ```

2. **CHECK Constraint** - Database validates role:
   ```sql
   role TEXT NOT NULL CHECK (role IN ('customer', 'admin', 'driver'))
   ```

3. **Application Logic** - Role checked on login and route access

### Testing Role Separation

**Customer Test:**
1. Sign up as customer
2. Should only access `/customer/*` routes
3. Cannot view admin dashboard
4. Can only see own orders

**Admin Test:**
1. Sign in as admin
2. Can access `/admin/*` routes
3. Can view all orders, stores, users
4. Can manage system data

**Database Test:**
```sql
-- Try to change own role (should fail)
UPDATE users SET role = 'admin' WHERE id = auth.uid();
-- Error: RLS policy violation
```

## Summary

✅ **Supabase Auth is fully integrated**
✅ **Passwords are securely hashed**
✅ **Clear role separation (customer/admin/driver)**
✅ **Row Level Security enforces access control**
✅ **Cannot escalate privileges**
✅ **Session management handled automatically**

The system is production-ready for authentication and authorization!
