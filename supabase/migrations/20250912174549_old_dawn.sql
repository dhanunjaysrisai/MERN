/*
  # Teams Management

  1. New Tables
    - `teams` - Team information and project details
      - `id` (uuid, primary key)
      - `name` (text)
      - `project_title` (text)
      - `domain` (text)
      - `description` (text)
      - `team_lead_id` (uuid, references students)
      - `guide_id` (uuid, references guides)
      - `status` (enum: active, completed, on_hold)
      - `average_percentage` (decimal, computed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `teams` table
    - Add policies for different user roles
*/

-- Create enum for team status
CREATE TYPE team_status AS ENUM ('active', 'completed', 'on_hold');

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  project_title text NOT NULL,
  domain text NOT NULL,
  description text DEFAULT '',
  team_lead_id uuid,
  guide_id uuid REFERENCES guides(id) ON DELETE SET NULL,
  status team_status DEFAULT 'active',
  average_percentage decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Policies for teams
CREATE POLICY "Team members can read their team"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.team_id = teams.id AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM guides g
      WHERE g.id = teams.guide_id AND g.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

CREATE POLICY "Team leads can update their team"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.team_id = teams.id AND s.user_id = auth.uid() AND s.is_team_lead = true
    )
  );

CREATE POLICY "Guides can update their assigned teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guides g
      WHERE g.id = teams.guide_id AND g.user_id = auth.uid()
    )
  );

CREATE POLICY "Principals can manage all teams"
  ON teams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

-- Add foreign key constraint for team_lead_id (after students table exists)
-- This will be added in a later migration

-- Trigger for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teams_guide_id ON teams(guide_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_lead_id ON teams(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_teams_domain ON teams(domain);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);