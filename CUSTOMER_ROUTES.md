# Customer Routes - Quick Reference

## Public Routes (No Authentication Required)
- `/customer` - Landing page with features and sign up/login links
- `/customer/login` - Customer login page
- `/customer/signup` - Customer registration page

## Protected Routes (Authentication Required)

### Main Navigation
- `/customer/stores` - Browse all stores (main hub after login)
- `/customer/cart` - Shopping cart
- `/customer/orders` - Order tracking and history

### Store & Products
- `/customer/store/[id]` - View products from specific store
  - Example: `/customer/store/abc123`

### Custom Requests
- `/customer/custom-request` - Submit custom delivery request
- `/customer/custom-request?store=[id]` - Pre-select store for custom request
  - Example: `/customer/custom-request?store=abc123`

### Checkout
- `/customer/checkout` - Checkout and payment

### Success States
- `/customer/orders?success=true` - Shows success message after order placement

## Navigation Flow

```
Landing (/)
    ├── Sign Up (/customer/signup)
    │   └── → Stores (/customer/stores)
    │
    └── Login (/customer/login)
        └── → Stores (/customer/stores)

Stores (/customer/stores)
    ├── Store Detail (/customer/store/[id])
    │   ├── Add to Cart → Cart (/customer/cart)
    │   └── Custom Request (/customer/custom-request?store=[id])
    │
    ├── Custom Request (/customer/custom-request)
    │   └── → Orders (/customer/orders)
    │
    ├── Cart (/customer/cart)
    │   └── Checkout (/customer/checkout)
    │       └── → Orders (/customer/orders?success=true)
    │
    └── My Orders (/customer/orders)
```

## URL Parameters

### Custom Request
- `?store=[store_id]` - Pre-select a store

### Orders
- `?success=true` - Show success message after checkout

## Auto-Redirects

1. **If logged in:** `/customer` → `/customer/stores`
2. **If not logged in:** Protected routes → `/customer/login`
3. **After signup:** → `/customer/stores`
4. **After login:** → `/customer/stores`
5. **After custom request:** → `/customer/orders`
6. **After checkout:** → `/customer/orders?success=true`
7. **Empty cart on checkout:** → `/customer/cart`

## Header Navigation (Available on Most Pages)

- **Logo/Home** - Returns to `/customer/stores`
- **Cart** - Go to `/customer/cart` (shows badge with item count)
- **My Orders** - Go to `/customer/orders`
- **Logout** - Sign out and return to `/customer/login`

## Back Navigation

- From any page → "Back to Stores" link to `/customer/stores`
- From checkout → "Back to Cart" link to `/customer/cart`
- From store detail → "Back to Stores" link to `/customer/stores`
- From custom request → "Back to Stores" link to `/customer/stores`
