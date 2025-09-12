/*
  # Project Guides Management

  1. New Tables
    - `guides` - Project guide information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `department` (text)
      - `expertise` (text array)
      - `max_teams` (integer)
      - `current_teams` (integer, computed)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `guides` table
    - Add policies for different user roles
*/

-- Create guides table
CREATE TABLE IF NOT EXISTS guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  department text NOT NULL,
  expertise text[] DEFAULT '{}',
  max_teams integer NOT NULL DEFAULT 3,
  current_teams integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- Policies for guides
CREATE POLICY "Guides can read own data"
  ON guides
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('principal', 'student', 'team_lead')
    )
  );

CREATE POLICY "Guides can update own data"
  ON guides
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Principals can manage all guides"
  ON guides
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_guides_updated_at
  BEFORE UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guides_user_id ON guides(user_id);
CREATE INDEX IF NOT EXISTS idx_guides_department ON guides(department);
CREATE INDEX IF NOT EXISTS idx_guides_is_active ON guides(is_active);