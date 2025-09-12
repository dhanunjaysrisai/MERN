/*
  # Storage Setup for File Uploads

  1. Storage Buckets
    - `documents` - For project documents, reports, presentations
    - `avatars` - For user profile pictures

  2. Storage Policies
    - Team members can upload documents to their team folder
    - Users can upload their own avatars
    - Public read access for avatars
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('documents', 'documents', false),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for documents bucket
CREATE POLICY "Team members can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM students s
    JOIN teams t ON s.team_id = t.id
    WHERE s.user_id = auth.uid() 
    AND (storage.foldername(name))[1] = t.id::text
  )
);

CREATE POLICY "Team members can read their team documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    EXISTS (
      SELECT 1 FROM students s
      JOIN teams t ON s.team_id = t.id
      WHERE s.user_id = auth.uid() 
      AND (storage.foldername(name))[1] = t.id::text
    ) OR
    EXISTS (
      SELECT 1 FROM guides g
      JOIN teams t ON g.id = t.guide_id
      WHERE g.user_id = auth.uid() 
      AND (storage.foldername(name))[1] = t.id::text
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'principal'
    )
  )
);

CREATE POLICY "Document uploaders can update their documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  owner = auth.uid()
);

CREATE POLICY "Document uploaders can delete their documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  owner = auth.uid()
);

-- Policies for avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can read avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  owner = auth.uid()
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  owner = auth.uid()
);