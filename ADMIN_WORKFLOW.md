# Admin Workflow Guide

## 🎯 Complete Admin User Journey

This guide shows you exactly how to use the Tsa Kasi admin portal.

---

## 📝 Step-by-Step Workflow

### 1️⃣ First Time Setup

**URL**: `http://localhost:3000`

**What you see**:
- Landing page with three buttons:
  - Admin Portal
  - Order Now (customer - not ready yet)
  - Driver Portal (not ready yet)

**Action**: Click "Admin Portal"

---

### 2️⃣ Create Your Admin Account

**URL**: `http://localhost:3000/admin/login`

**What you see**:
- Login form
- "Don't have an account? Sign up" link

**Action**: Click "Sign up"

**Fill in the signup form**:
```
Full Name:       [Your Name]
Email:           [admin@tsakasi.com]
Phone Number:    [081 234 5678]
Password:        [YourSecurePassword]
Confirm Password:[YourSecurePassword]
```

**Action**: Click "Sign Up"

**Result**: Redirected to login page

---

### 3️⃣ Login

**URL**: `http://localhost:3000/admin/login`

**Fill in**:
```
Email:    [admin@tsakasi.com]
Password: [YourSecurePassword]
```

**Action**: Click "Login"

**Result**: Redirected to dashboard

---

### 4️⃣ Dashboard Overview

**URL**: `http://localhost:3000/admin/dashboard`

**What you see**:

**Top Section - Statistics Cards**:
- 📦 Total Stores: 0
- 🛒 Active Orders: 0
- 👥 Active Agents: 0
- 💰 Today's Revenue: R0.00

**Quick Actions**:
- Manage Stores (orange button)
- View Orders (green button)
- Manage Agents (purple button)

**Left Sidebar**:
- Dashboard (active)
- Orders
- Stores
- Agents
- Reports
- Settings
- Logout

---

### 5️⃣ Add Your First Store

**Action**: Click "Stores" in sidebar OR "Manage Stores" button

**URL**: `http://localhost:3000/admin/stores`

**What you see**:
- Empty state with message: "No stores added yet"
- "+ Add Store" button

**Action**: Click "+ Add Store"

---

### 6️⃣ Add Store Wizard - Step 1: Basic Info

**Modal opens**: "Add New Store - Step 1 of 5"

**Fill in**:
```
Store Name:    [Mama Joyce Spaza]
Category:      [Spaza] (dropdown)
Phone Number:  [081 234 5678]
Description:   [Small spaza near Phagameng clinic selling groceries and airtime]
```

**Action**: Click "Next Step"

---

### 7️⃣ Add Store Wizard - Step 2: Address

**Fill in**:
```
Town:           [Modimolle] (dropdown)
Township/Area:  [Phagameng]
Street Address: [1037 Leseding Street]
GPS Latitude:   [-24.123456] (optional)
GPS Longitude:  [28.123456] (optional)
```

**💡 Tip**: GPS coordinates help with accurate delivery routing but are optional

**Action**: Click "Next Step"

---

### 8️⃣ Add Store Wizard - Step 3: Operating Hours

**Fill in**:
```
Open Time:      [08:00]
Close Time:     [20:00]
Operating Days: [Mon-Sun]
```

**Action**: Click "Next Step"

---

### 9️⃣ Add Store Wizard - Step 4: Store Photo

**Options**:
1. **Upload a photo**: Click "Choose File" and select store logo/photo
   - You'll see a preview of the image
   - Can click "Remove Image" to change it

2. **Skip**: Just click "Next Step" without uploading
   - System will use default store icon

**Action**: Upload photo (optional), then click "Next Step"

---

### 🔟 Add Store Wizard - Step 5: Products Setup

**You see two options**:

**Option A: "Add products manually now"**
- For stores with fixed menus (like restaurants)
- Customers can browse products like Mr D
- Click this to add products now

**Option B: "Skip – Add products later"**
- For informal stores without fixed menus
- Enables "Custom Orders Only" mode
- Customers type what they want, driver buys it
- Perfect for spazas!

---

### 1️⃣1️⃣ If You Chose "Add Products Now"

**Interface changes** to show product form:

**For each product, fill in**:
```
Product Name:  [Russian & Chips]
Price (R):     [35]
Category:      [Fast Food]
Product Image: [Upload photo]
```

**Action**: Click "+ Add Another Product" to add more

**When done**: Click "Save Store"

---

### 1️⃣2️⃣ If You Chose "Skip Products"

**You see confirmation**:
```
🛒 Custom Orders Only Mode

This store will appear with "Custom Orders Only" tag.
Customers can request any item they want, and drivers
will purchase it manually.
```

**Action**: Click "Save Store"

---

### 1️⃣3️⃣ Store Successfully Added!

**Result**:
- Modal closes
- You're back at Stores page
- Your new store appears in the list!

**Store card shows**:
- ✅ Store name
- ✅ Status badge (Active)
- ✅ Category badge
- ✅ Description
- ✅ Address with 📍 icon
- ✅ Phone number with 📞 icon
- ✅ Operating hours with 🕐 icon
- ✅ "Custom Orders Only" tag (if applicable)
- ✅ Two buttons: "Edit Store" | "View Products"

---

### 1️⃣4️⃣ Add More Stores

**Repeat the process** to add different types of stores:

**Examples**:
1. **Frida's Kitchen** (Takeaways)
   - Category: Takeaways
   - Products: Chicken & chips, Burgers, etc.

2. **Tshabalala Tuck Shop** (Tuck Shop)
   - Category: Tuck Shop
   - Custom Orders Only mode

3. **Debonairs Pizza** (Restaurant)
   - Category: Restaurant
   - Full product catalog with images

4. **Uncle Joe's Bottle Store** (Alcohol)
   - Category: Alcohol
   - Products or Custom Orders

---

### 1️⃣5️⃣ Using Search and Filters

**Back at Stores page**, you can:

**Search**:
- Type in search box: "Mama Joyce"
- Filters stores by name or description

**Filter by Status**:
- Dropdown: "All Statuses"
- Options: Active, Pending, Inactive

---

### 1️⃣6️⃣ View Dashboard Statistics

**Action**: Click "Dashboard" in sidebar

**Now you see**:
- Total Stores: 4 (or however many you added)
- Active Orders: 0 (will show when orders come in)
- Active Agents: 0 (will show when drivers register)
- Today's Revenue: R0.00 (will update with sales)

---

## 🎨 Understanding Store Types

### Formal Businesses (with products):
**Examples**: Debonairs, KFC, Local restaurants
- Fixed menu
- Products with prices
- Photos of food
- Customers browse and add to cart

**Setup**:
- Choose "Add products manually now"
- Add all menu items
- Upload product photos

---

### Informal Businesses (custom orders):
**Examples**: Spazas, street vendors, home kitchens
- No fixed menu
- Products change daily
- Customers request what they need

**Setup**:
- Choose "Skip – Add products later"
- Store gets "Custom Orders Only" tag
- Customers type: "2 loaves bread + milk"
- Driver goes to store and buys it

---

## 📱 Mobile Experience

The admin portal works great on mobile:
- Click hamburger menu (☰) to open sidebar
- All forms are mobile-responsive
- Touch-friendly buttons
- Easy navigation

---

## 🔐 Security Notes

**Logout**:
- Click "Logout" at bottom of sidebar
- Clears your session
- Returns to login page

**Session**:
- Stays logged in until you logout
- Automatically redirects to login if session expires

---

## 🎯 Quick Reference

### Common Tasks:

**Add a store**: Stores → + Add Store → Fill wizard → Save

**View stores**: Click "Stores" in sidebar

**Search stores**: Use search box on Stores page

**Filter stores**: Use status dropdown

**View stats**: Click "Dashboard"

**Logout**: Sidebar → Logout

---

## 💡 Pro Tips

1. **Add photos**: Stores with photos look more professional
2. **Accurate addresses**: Helps drivers find locations
3. **GPS coordinates**: Optional but useful for routing
4. **Custom orders mode**: Perfect for spazas without fixed menus
5. **Categories**: Help customers find what they need
6. **Operating hours**: Prevents orders outside business hours

---

## 🎉 You're All Set!

You now know how to:
- ✅ Create an admin account
- ✅ Login to the portal
- ✅ Add stores (formal and informal)
- ✅ Add products
- ✅ Use custom orders mode
- ✅ Search and filter stores
- ✅ View dashboard statistics

**Next**: Once customer and driver portals are built, you'll be able to:
- See customer orders come in
- Assign drivers
- Track deliveries
- Monitor revenue

---

**Happy managing! 🚀**

Tsa Kasi Deliveries - Fast. Local. Kasi to Kasi. 🏍️
