# Mapbox Integration Setup Guide

## 🗺️ Overview

Mapbox has been integrated to provide accurate GPS & location services for:
- Address autocomplete with autocomplete suggestions
- GPS coordinate conversion (geocoding & reverse geocoding)
- Distance calculation for delivery fees
- Location-based features

## 📋 Prerequisites

1. **Mapbox Account** (Free tier: 100,000 requests/month)
   - Sign up at: https://account.mapbox.com/auth/signup/
   - Create a new token with default public scopes

## 🔧 Setup Steps

### Step 1: Add Mapbox Token to Environment Variables

Add this to your `.env.local` file:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

**How to get your token:**
1. Go to https://account.mapbox.com/
2. Navigate to "Access tokens"
3. Copy your default public token OR create a new one
4. Paste it in `.env.local`

### Step 2: Run Database Migration

Run the SQL file in your Supabase SQL Editor:

```bash
# File: supabase/add_gps_coordinates.sql
```

This adds the following columns to your database:
- `orders`: GPS coordinates and detailed address fields
- `stores`: GPS coordinates for accurate distance calculation

### Step 3: Install Dependencies

```bash
npm install
```

Packages installed:
- `mapbox-gl`: Mapbox GL JS library
- `react-map-gl`: React wrapper for Mapbox
- `@mapbox/mapbox-gl-geocoder`: Geocoding plugin

### Step 4: Restart Development Server

```bash
npm run dev
```

## ✨ Features Implemented

### 1. Address Autocomplete (Checkout Page)
- **File**: `app/customer/checkout/AddressAutocomplete.tsx`
- **Features**:
  - Real-time address search as you type
  - South Africa-specific results
  - GPS coordinate extraction
  - "Use current location" button
  - Keyboard navigation (arrow keys, Enter, Escape)

### 2. Geocoding API Routes
- **Forward Geocoding**: `/api/mapbox/geocode/forward` (address → GPS)
- **Reverse Geocoding**: `/api/mapbox/geocode/reverse` (GPS → address)
- **Search**: `/api/mapbox/search` (autocomplete search)

### 3. Utility Functions
- **File**: `lib/mapbox.ts`
- **Functions**:
  - `searchAddresses()`: Search for addresses
  - `forwardGeocode()`: Convert address to GPS
  - `reverseGeocode()`: Convert GPS to address
  - `calculateDistance()`: Calculate km between two points
  - `calculateDeliveryFee()`: Dynamic pricing based on distance
  - `isWithinServiceArea()`: Check if address is in delivery zone

### 4. Dynamic Delivery Fees
Automatically calculated based on distance:
- ≤ 2km: R15
- ≤ 5km: R25
- ≤ 10km: R40
- ≤ 15km: R60
- >15km: R60 + R5/km

## 📊 Database Schema

New columns in `orders` table:
```sql
delivery_address_formatted TEXT
delivery_gps_lat DECIMAL(10, 8)
delivery_gps_lng DECIMAL(11, 8)
delivery_street TEXT
delivery_street_number TEXT
delivery_locality TEXT
delivery_region TEXT
delivery_postal_code TEXT
delivery_special_instructions TEXT
delivery_distance_km DECIMAL(6, 2)
```

New columns in `stores` table:
```sql
gps_latitude DECIMAL(10, 8)
gps_longitude DECIMAL(11, 8)
```

## 🎯 How It Works

### Customer Checkout Flow:
1. Customer starts typing address in checkout
2. Mapbox searches South African addresses in real-time
3. Customer selects address from dropdown
4. GPS coordinates are automatically extracted
5. Distance calculated from store to delivery address
6. Delivery fee automatically updated
7. All address data saved to order (including GPS)

### Benefits:
- **Accurate Addresses**: No more typos or unclear addresses
- **GPS Coordinates**: Drivers get exact location
- **Fair Pricing**: Distance-based delivery fees
- **Service Area**: Can limit to specific areas
- **Future Ready**: Enable GPS tracking, route optimization

## 🚀 Future Enhancements

These features can be added later:

### 1. Interactive Map View
Show delivery location on a map before checkout

### 2. Driver GPS Tracking
Real-time tracking of driver location during delivery

### 3. Route Optimization
Calculate best route for driver

### 4. Service Area Restrictions
Automatically reject orders outside delivery zone

### 5. Multiple Pickup Points
Support for multiple stores in one order with route planning

## 💰 Cost Estimates

**Mapbox Free Tier**: 100,000 requests/month
**Typical Usage** (1000 orders/month):
- Address searches: ~3,000 requests (typing triggers search)
- Geocoding: ~1,000 requests
- **Total: ~4,000 requests/month** (well within free tier)

**Paid Tier** (if you exceed):
- $0.50 per 1,000 requests after free tier

## 🔒 Security Best Practices

1. **Token Restrictions**:
   - Go to Mapbox dashboard
   - Edit your token
   - Add URL restrictions (e.g., `yourwebsite.com/*`)
   - This prevents unauthorized use

2. **Rate Limiting**:
   - Implemented debouncing (300ms) in autocomplete
   - Prevents excessive API calls

3. **Error Handling**:
   - Graceful fallbacks if API fails
   - Default delivery fee if distance calc fails

## 🧪 Testing

Test the address autocomplete:
1. Go to checkout page
2. Start typing an address like "Modimolle Mall"
3. Watch suggestions appear
4. Click a suggestion
5. See GPS coordinates and delivery fee update

## 📱 Mobile Compatibility

- "Use current location" button works on mobile devices
- Requests location permission from user
- Falls back to manual entry if denied

## 🐛 Troubleshooting

### "Mapbox token not configured" error:
- Check `.env.local` has `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- Restart dev server after adding env variable

### No address suggestions:
- Check browser console for errors
- Verify token is valid on Mapbox dashboard
- Check network tab for API request/response

### Distance calculation not working:
- Make sure stores have GPS coordinates
- Run `add_gps_coordinates.sql` migration
- Default coordinates set for Modimolle stores

## 📚 Resources

- [Mapbox Documentation](https://docs.mapbox.com/)
- [Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides/)
- [React Map GL](https://visgl.github.io/react-map-gl/)

## ✅ Next Steps

1. Get Mapbox token and add to `.env.local`
2. Run database migration
3. Test checkout address autocomplete
4. Optionally: Add interactive map component
5. Optionally: Implement driver GPS tracking

---

**Status**: ✅ Core features implemented and ready to use!
