-- Storage buckets for agent receipts and delivery photos

-- Create receipts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Create delivery-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Receipts bucket policies
CREATE POLICY "Agents can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('agent', 'admin')
  )
);

CREATE POLICY "Everyone can view receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'receipts');

CREATE POLICY "Admins can delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Delivery photos bucket policies
CREATE POLICY "Agents can upload delivery photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'delivery-photos' AND
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('agent', 'admin')
  )
);

CREATE POLICY "Everyone can view delivery photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'delivery-photos');

CREATE POLICY "Admins can delete delivery photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'delivery-photos' AND
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
