/*
# Documents Management Schema

1. New Tables
   - documents: File uploads and document management

2. Security
   - Enable RLS with team-based access control
   - Storage policies for file access
*/

CREATE TYPE document_type AS ENUM ('proposal', 'report', 'presentation', 'code', 'other');

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type document_type NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  description text,
  version integer DEFAULT 1,
  is_latest boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Team members can read their team documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can upload documents for their team"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM students WHERE user_id = auth.uid()
    ) AND
    uploaded_by IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update their team documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Guides can read documents from assigned teams"
  ON documents FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE guide_id IN (
        SELECT id FROM guides WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Principals can read all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Team members can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can read their team documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Guides can read documents from assigned teams"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM teams WHERE guide_id IN (
      SELECT id FROM guides WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Principals can read all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'principal'
  )
);