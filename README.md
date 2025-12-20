# Tsa Kasi Deliveries
## Integrating McDonald's Modimolle

- Purpose: Allow customers to browse McDonald's items in our app, add to cart, and use our delivery flow.
- Approach: Mirror the menu in our own database. Do not scrape/embed McDonald's website directly (cross-origin/browser restrictions; potential terms-of-use violations).

### Quick Options
- Seed via Admin page: Visit `/admin/stores/seed-mcdonalds` (admin) and click "Seed Store + Menu" to insert the McDonald's Modimolle store and a starter menu. You can edit prices/items later in Admin.
- Seed via SQL: Run `supabase/seeds/mcdonalds_modimolle.sql` in Supabase SQL editor for the same result.
- Manual entry: In Admin → Stores → "Add Store", create McDonald's Modimolle and add products in Step 5.

### Customer Flow
- Customers open McDonald's Modimolle in `customer/stores`, browse items from `products`, and add to cart (`CartContext`).
- Checkout and delivery proceed through our existing customer flow.

### Notes
- Keep menu items and prices up to date with the local restaurant.
- If McDonald's provides an official API or data feed in the future, prefer that over manual mirroring.

**Fast. Local. Kasi to Kasi.**

## Overview

Tsa Kasi Deliveries is a township-focused delivery service based in Modimolle and Bela-Bela, dedicated to bringing fast-food, groceries, alcohol, and parcel delivery directly to communities that mainstream delivery platforms often overlook.

## Features

### MVP Implementation

**A. Customer Side (Core)**
- Account creation and login
- Browse stores (formal + informal)
- Browse products OR submit custom requests
- Shopping cart
- Checkout & payment
- Order tracking

**B. Agent/Driver Side (Core)**
- Login and job management
- View and accept/reject orders
- Update order status
- Upload proof-of-purchase

**C. Admin Portal**
- Dashboard with analytics
- Store management (add/edit formal and informal stores)
- Product management
- Order monitoring
- Agent management

## Tech Stack

- **Frontend**: React + Next.js 14 + TailwindCSS
- **Backend**: Node.js + Express (API routes via Next.js)
- **Database**: Supabase (PostgreSQL)
- **Payments**: Yoco Online
- **Storage**: Supabase Storage (for images)

## Project Structure

```
tsa-kasi-deliveries/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin portal
│   │   ├── login/         # Admin authentication
│   │   ├── signup/
│   │   ├── dashboard/     # Main dashboard
│   │   ├── stores/        # Store management
│   │   ├── orders/        # Order management
│   │   ├── agents/        # Agent management
│   │   ├── reports/       # Analytics
│   │   └── settings/      # Settings
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── customer/              # Customer UI (coming soon)
├── driver/                # Driver UI (coming soon)
├── lib/                   # Utilities
│   └── supabase.ts       # Supabase client
├── types/                 # TypeScript types
│   └── index.ts
├── supabase/             # Database schema
│   └── schema.sql
└── public/               # Static assets

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Yoco account (for payments)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_YOCO_PUBLIC_KEY=your_yoco_public_key
   YOCO_SECRET_KEY=your_yoco_secret_key
   ```

4. Set up Supabase database:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Create storage buckets: `store-logos` and `product-images`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses the following main tables:

- **users**: Admin, customer, and driver accounts
- **stores**: Formal and informal store listings
- **products**: Product catalog for stores
- **orders**: Customer orders
- **order_items**: Individual items in orders

See `supabase/schema.sql` for complete schema.

## Admin Portal Features

### Store Management

Admins can add stores with:
- Basic info (name, category, phone, description)
- Address (street, township, town, GPS coordinates)
- Operating hours
- Store logo/photo
- Product setup (immediate or "Custom Orders Only" mode)

### Custom Orders Only Mode

For informal businesses without fixed menus, the system supports:
- Customers can request any item via text
- Drivers manually purchase items
- Proof-of-purchase upload

## Development Roadmap

- [x] Project setup and configuration
- [x] Admin authentication
- [x] Admin dashboard
- [x] Store management (CRUD)
- [ ] Product management
- [ ] Customer interface
- [ ] Driver interface
- [ ] Order processing system
- [ ] Payment integration (Yoco)
- [ ] Real-time order tracking
- [ ] SMS/Email notifications

## License

Proprietary - Tsa Kasi Deliveries

## Contact

For questions or support, contact the Tsa Kasi team.

## Loading Overlay & Spinner

- Boot overlay: A neutral full-screen loader is injected in [app/layout.tsx](app/layout.tsx) as `#app-loader` with inline CSS so it appears immediately on first paint. It displays only a spinning ring and the text "Loading". A client-side remover runs on hydration and an inline DOMContentLoaded fallback script also removes it to prevent it ever sticking.
- Styles: Tweak inline rules in [app/layout.tsx](app/layout.tsx#L1) for overlay, and spinner utility styles in [app/globals.css](app/globals.css) for in-app spinners (variables `--spinner-fg`/`--spinner-bg`, keyframes, and reduced-motion handling).
- Spinner component: See [components/Spinner.tsx](components/Spinner.tsx). API: `size` (`'sm'|'md'|'lg'`), `label` (default "Loading"), `className`, and `variant` (`'ring'|'text'`, default `'ring'`).
- Usage example: Visit [app/examples/loading/page.tsx](app/examples/loading/page.tsx) while running the dev server.

Example usage:

```tsx
import Spinner from '@/components/Spinner'

export default function MyPage() {
   const isLoading = true
   return (
      <div>{isLoading ? <Spinner size="md" /> : <div>Loaded</div>}</div>
   )
}
```

