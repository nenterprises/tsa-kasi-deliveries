# 🚀 Bulk Product Import - Quick Guide

## Method 1: Google Sheets + SQL Formula (RECOMMENDED)

### Step 1: Create Google Sheet

Create a new Google Sheet with these columns:

| store_name | product_name | price | category | description | available |
|------------|--------------|-------|----------|-------------|-----------|
| McDonald's Modimolle | Big Mac | 45.90 | Burgers | Classic burger | TRUE |
| McDonald's Modimolle | McChicken | 39.90 | Burgers | Chicken burger | TRUE |

### Step 2: Add SQL Generation Formula

In column G (or next empty column), add this formula in G2:

```
="INSERT INTO products (store_id, name, price, category, description, available) VALUES ((SELECT id FROM stores WHERE name = '"&A2&"'), '"&SUBSTITUTE(B2,"'","''")&"', "&C2&", '"&D2&"', '"&SUBSTITUTE(E2,"'","''")&"', "&IF(F2=TRUE,"true","false")&");"
```

Then drag the formula down for all rows.

### Step 3: Copy Generated SQL

1. Select all cells in column G (the generated SQL)
2. Copy them
3. Open Supabase Dashboard → SQL Editor
4. Paste and click "Run"

✅ All products imported in seconds!

---

## Method 2: Direct SQL File (For Devs)

See example: `scripts/seed-mcdonalds-menu.sql`

Edit the file with your products, then run in Supabase SQL Editor.

---

## Tips for Fast Data Entry

### Getting Menu Data Quickly:

1. **From website:** Copy-paste from store's online menu
2. **From menu board:** Take photo, use ChatGPT to extract items
3. **From POS:** Export if they have digital menus

### Categories to Use:
- Burgers
- Chicken
- Breakfast
- Sides
- Drinks
- Desserts
- Combos/Meals
- Specials

### Price Format:
- Use decimals: `45.90` not `45.9` or `R45.90`
- No currency symbols
- No spaces

### Descriptions:
- Keep short: "Classic beef burger"
- Can be empty if you want

---

## Example Workflow (15 mins per store)

**McDonald's Modimolle:**

1. Open Google Sheets template ✓
2. Fill in 20-30 popular items first (burgers, combos, drinks)
3. Copy generated SQL → Run in Supabase
4. Test: Check store menu page
5. Add more items later if needed

**Don't need ALL 150 items for pilot!** Start with 30 bestsellers.

---

## Troubleshooting

**Error: "duplicate key value"**
- Product already exists, skip it or change the name

**Error: "invalid input syntax for type numeric"**
- Check price column has numbers only (no R or currency symbols)

**Error: "store_id not found"**
- Store doesn't exist yet, create it in Admin → Stores first

**Single quotes breaking SQL**
- Formula handles this with SUBSTITUTE function
- Don't remove it!

---

## Quick Reference: Google Sheets Formula

For column G2 (drag down):
```
="INSERT INTO products (store_id, name, price, category, description, available) VALUES ((SELECT id FROM stores WHERE name = '"&A2&"', '"&SUBSTITUTE(B2,"'","''")&"', "&C2&", '"&D2&"', '"&SUBSTITUTE(E2,"'","''")&"', "&IF(F2=TRUE,"true","false")&");"
```

**Formula Breakdown:**
- `A2` = store_name
- `B2` = product_name (with quote escaping)
- `C2` = price (numeric)
- `D2` = category
- `E2` = description (with quote escaping)
- `F2` = available (TRUE/FALSE → true/false)
