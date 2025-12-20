-- Storage policies for agent profile photos

-- 1. Create the storage bucket for agent profiles (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-profiles',
  'agent-profiles',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow agents to upload their own profile photos
CREATE POLICY "Agents can upload own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agent-profiles' 
  AND (storage.foldername(name))[1] = 'agent-photos'
  AND (
    -- Check if the filename starts with the user's ID
    (storage.filename(name)) LIKE auth.uid()::text || '-%'
  )
);

-- 3. Allow agents to update their own profile photos
CREATE POLICY "Agents can update own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agent-profiles'
  AND (storage.filename(name)) LIKE auth.uid()::text || '-%'
)
WITH CHECK (
  bucket_id = 'agent-profiles'
  AND (storage.filename(name)) LIKE auth.uid()::text || '-%'
);

-- 4. Allow agents to delete their own profile photos
CREATE POLICY "Agents can delete own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agent-profiles'
  AND (storage.filename(name)) LIKE auth.uid()::text || '-%'
);

-- 5. Allow public read access to all profile photos
CREATE POLICY "Public can view agent profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agent-profiles');

-- 6. Allow admins full access to agent profile photos
CREATE POLICY "Admins can manage all agent profile photos"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'agent-profiles'
  AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'agent-profiles'
  AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
