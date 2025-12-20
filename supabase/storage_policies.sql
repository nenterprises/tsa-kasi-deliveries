-- Storage policies to allow public read for logos and product images, and authenticated writes
-- Run this in Supabase SQL Editor for your project

-- NOTE: Buckets must already exist: store-logos, product-images
-- If not, create them in the Storage UI first and mark them Public (for read).

-- Public READ (anon) for store-logos and product-images
DROP POLICY IF EXISTS "Public read: store-logos" ON storage.objects;
CREATE POLICY "Public read: store-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "Public read: product-images" ON storage.objects;
CREATE POLICY "Public read: product-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Authenticated WRITE for store-logos and product-images
DROP POLICY IF EXISTS "Auth write: store-logos" ON storage.objects;
CREATE POLICY "Auth write: store-logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "Auth update: store-logos" ON storage.objects;
CREATE POLICY "Auth update: store-logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-logos')
  WITH CHECK (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "Auth delete: store-logos" ON storage.objects;
CREATE POLICY "Auth delete: store-logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "Auth write: product-images" ON storage.objects;
CREATE POLICY "Auth write: product-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Auth update: product-images" ON storage.objects;
CREATE POLICY "Auth update: product-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Auth delete: product-images" ON storage.objects;
CREATE POLICY "Auth delete: product-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');
