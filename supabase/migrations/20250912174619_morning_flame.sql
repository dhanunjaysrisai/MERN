/*
  # Documents Management

  1. New Tables
    - `documents` - File uploads and document management
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `name` (text)
      - `file_path` (text) - Supabase storage path
      - `file_size` (bigint)
      - `file_type` (text)
      - `document_type` (enum: proposal, report, presentation, code, other)
      - `uploaded_by` (uuid, references profiles)
      - `description` (text)
      - `version` (integer)
      - `is_latest` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `documents` table
    - Add policies for team members and guides
*/

-- Create enum for document types
CREATE TYPE document_type AS ENUM ('proposal', 'report', 'presentation', 'code', 'other');

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  document_type document_type DEFAULT 'other',
  uploaded_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  description text DEFAULT '',
  version integer DEFAULT 1,
  is_latest boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies for documents
CREATE POLICY "Team members can read their team documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.team_id = documents.team_id AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM teams t
      JOIN guides g ON t.guide_id = g.id
      WHERE t.id = documents.team_id AND g.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

CREATE POLICY "Team members can upload documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.team_id = documents.team_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Document uploaders can update their documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Team leads can manage team documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.team_id = documents.team_id AND s.user_id = auth.uid() AND s.is_team_lead = true
    )
  );

-- Function to manage document versions
CREATE OR REPLACE FUNCTION manage_document_versions()
RETURNS trigger AS $$
BEGIN
  -- When inserting a new document with same name and type, update versions
  IF TG_OP = 'INSERT' THEN
    -- Set all previous versions of same document type to not latest
    UPDATE documents 
    SET is_latest = false 
    WHERE team_id = NEW.team_id 
      AND document_type = NEW.document_type 
      AND name = NEW.name 
      AND id != NEW.id;
    
    -- Set version number
    NEW.version = COALESCE(
      (SELECT MAX(version) + 1 
       FROM documents 
       WHERE team_id = NEW.team_id 
         AND document_type = NEW.document_type 
         AND name = NEW.name), 
      1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for document version management
CREATE TRIGGER manage_document_versions_trigger
  BEFORE INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION manage_document_versions();

-- Trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_team_id ON documents(team_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_is_latest ON documents(is_latest);