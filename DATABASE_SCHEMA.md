# Database Schema Reference

## Tables Overview

### 1. **users**
Stores all user accounts (customers, admins, drivers)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Unique email address |
| password_hash | TEXT | Hashed password |
| full_name | TEXT | User's full name |
| phone_number | TEXT | Contact number |
| role | TEXT | 'customer', 'admin', or 'driver' |
| status | TEXT | 'active', 'inactive', or 'suspended' |
| created_at | TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | Last update date |

---

### 2. **stores**
All stores (formal and informal)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Store name |
| category | TEXT | spaza, tuck_shop, takeaways, alcohol, groceries, restaurant, other |
| phone_number | TEXT | Store contact |
| description | TEXT | Store description |
| street_address | TEXT | Physical address |
| township | TEXT | Township/area name |
| town | TEXT | modimolle, phagameng, leseding, bela_bela |
| gps_latitude | DECIMAL | GPS coordinates |
| gps_longitude | DECIMAL | GPS coordinates |
| open_time | TIME | Opening time |
| close_time | TIME | Closing time |
| operating_days | TEXT | e.g., "Mon-Sun" |
| logo_url | TEXT | Store logo URL |
| status | TEXT | 'active', 'pending', or 'inactive' |
| custom_orders_only | BOOLEAN | True if no fixed menu |
| created_at | TIMESTAMP | Store creation date |
| updated_at | TIMESTAMP | Last update date |

---

### 3. **products**
Products for stores with menus

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| store_id | UUID | Foreign key to stores |
| name | TEXT | Product name |
| description | TEXT | Product description |
| price | DECIMAL | Product price |
| category | TEXT | Product category |
| image_url | TEXT | Product image URL |
| available | BOOLEAN | Stock availability |
| created_at | TIMESTAMP | Product creation date |
| updated_at | TIMESTAMP | Last update date |

---

### 4. **orders**
Customer orders

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| customer_id | UUID | Foreign key to users |
| store_id | UUID | Foreign key to stores |
| driver_id | UUID | Foreign key to users (driver) |
| order_type | TEXT | 'product_order' or 'custom_request' |
| custom_request_text | TEXT | Text for custom orders |
| total_amount | DECIMAL | Order total |
| delivery_fee | DECIMAL | Delivery charge |
| delivery_address | TEXT | Delivery address |
| delivery_township | TEXT | Delivery township |
| delivery_gps_latitude | DECIMAL | Delivery GPS |
| delivery_gps_longitude | DECIMAL | Delivery GPS |
| status | TEXT | pending, received, purchased, on_the_way, delivered, cancelled |
| payment_status | TEXT | pending, paid, failed, refunded |
| payment_method | TEXT | 'yoco' or 'cash' |
| proof_of_purchase_url | TEXT | Receipt photo URL |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMP | Order creation date |
| updated_at | TIMESTAMP | Last update date |

---

### 5. **order_items**
Individual items in orders

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | Foreign key to orders |
| product_id | UUID | Foreign key to products |
| product_name | TEXT | Product name snapshot |
| quantity | INTEGER | Quantity ordered |
| unit_price | DECIMAL | Price per unit |
| subtotal | DECIMAL | Line item total |
| created_at | TIMESTAMP | Item creation date |

---

## Indexes

For optimal query performance:

- `idx_stores_town` - ON stores(town)
- `idx_stores_status` - ON stores(status)
- `idx_products_store_id` - ON products(store_id)
- `idx_orders_customer_id` - ON orders(customer_id)
- `idx_orders_driver_id` - ON orders(driver_id)
- `idx_orders_status` - ON orders(status)
- `idx_order_items_order_id` - ON order_items(order_id)

---

## Relationships

```
users (1) ----< (many) orders [as customer]
users (1) ----< (many) orders [as driver]
stores (1) ----< (many) products
stores (1) ----< (many) orders
orders (1) ----< (many) order_items
products (1) ----< (many) order_items
```

---

## Common Queries

### Get all active stores in Modimolle
```sql
SELECT * FROM stores 
WHERE town = 'modimolle' 
AND status = 'active'
ORDER BY name;
```

### Get store with products
```sql
SELECT s.*, p.* 
FROM stores s
LEFT JOIN products p ON s.id = p.store_id
WHERE s.id = 'store-uuid'
AND p.available = true;
```

### Get customer orders with items
```sql
SELECT o.*, oi.*, s.name as store_name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN stores s ON o.store_id = s.id
WHERE o.customer_id = 'customer-uuid'
ORDER BY o.created_at DESC;
```

### Get driver's pending jobs
```sql
SELECT o.*, s.name as store_name, u.full_name as customer_name
FROM orders o
JOIN stores s ON o.store_id = s.id
JOIN users u ON o.customer_id = u.id
WHERE o.driver_id = 'driver-uuid'
AND o.status IN ('received', 'purchased', 'on_the_way')
ORDER BY o.created_at;
```

---

## Storage Buckets

### store-logos
- **Purpose**: Store logos and photos
- **Access**: Public
- **File Types**: Images (PNG, JPG, WebP)
- **Max Size**: 2MB recommended

### product-images
- **Purpose**: Product photos
- **Access**: Public
- **File Types**: Images (PNG, JPG, WebP)
- **Max Size**: 1MB recommended

---

## Data Validation Rules

### User Roles
- `customer` - Regular customers
- `admin` - System administrators
- `driver` - Delivery drivers/agents

### Store Categories
- `spaza` - Local spaza shops
- `tuck_shop` - Tuck shops
- `takeaways` - Fast food/takeaways
- `alcohol` - Liquor stores
- `groceries` - Grocery stores
- `restaurant` - Restaurants
- `other` - Other businesses

### Towns
- `modimolle` - Modimolle
- `phagameng` - Phagameng
- `leseding` - Leseding
- `bela_bela` - Bela-Bela

### Order Status Flow
1. `pending` - Order placed, waiting for driver
2. `received` - Driver accepted order
3. `purchased` - Driver bought items
4. `on_the_way` - Out for delivery
5. `delivered` - Completed
6. `cancelled` - Cancelled

### Payment Status
- `pending` - Awaiting payment
- `paid` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded
