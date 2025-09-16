/*
# Teams Management Schema

1. New Tables
   - teams: Team information and project details
   - team_members: Junction table for team membership

2. Security
   - Enable RLS on all tables
   - Create policies for team access control
*/

CREATE TYPE team_status AS ENUM ('active', 'completed', 'on_hold', 'cancelled');

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  project_title text NOT NULL,
  project_description text,
  domain domain_type NOT NULL,
  technologies text[] DEFAULT '{}',
  status team_status DEFAULT 'active',
  team_lead_id uuid REFERENCES students(id) ON DELETE SET NULL,
  guide_id uuid REFERENCES guides(id) ON DELETE SET NULL,
  average_percentage numeric(5,2) DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  expected_end_date timestamptz,
  actual_end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update students table to reference teams
ALTER TABLE students 
ADD CONSTRAINT fk_students_team 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Team members can read their team"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE team_id = teams.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Guides can read assigned teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    guide_id IN (
      SELECT id FROM guides WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Principals can read all teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

CREATE POLICY "Team leads can update their team"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    team_lead_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Principals can manage all teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate team average percentage
CREATE OR REPLACE FUNCTION calculate_team_average()
RETURNS trigger AS $$
BEGIN
  UPDATE teams 
  SET average_percentage = (
    SELECT COALESCE(AVG(percentage), 0)
    FROM students 
    WHERE team_id = NEW.team_id
  )
  WHERE id = NEW.team_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update team average when student percentage changes
CREATE TRIGGER update_team_average_on_student_change
  AFTER UPDATE OF percentage ON students
  FOR EACH ROW 
  WHEN (NEW.team_id IS NOT NULL)
  EXECUTE FUNCTION calculate_team_average();