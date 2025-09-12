/*
  # Weekly Logs Management

  1. New Tables
    - `weekly_logs` - Weekly progress logs submitted by teams
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `week_number` (integer)
      - `title` (text)
      - `description` (text)
      - `completed_tasks` (text array)
      - `next_week_plans` (text array)
      - `challenges` (text array)
      - `submitted_by` (uuid, references profiles)
      - `guide_approval` (boolean)
      - `guide_feedback` (text)
      - `approved_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `weekly_logs` table
    - Add policies for team members and guides
*/

-- Create weekly_logs table
CREATE TABLE IF NOT EXISTS weekly_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  week_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  completed_tasks text[] DEFAULT '{}',
  next_week_plans text[] DEFAULT '{}',
  challenges text[] DEFAULT '{}',
  submitted_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  guide_approval boolean DEFAULT false,
  guide_feedback text DEFAULT '',
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique week per team
  UNIQUE(team_id, week_number)
);

-- Enable RLS
ALTER TABLE weekly_logs ENABLE ROW LEVEL SECURITY;

-- Policies for weekly_logs
CREATE POLICY "Team members can read their team logs"
  ON weekly_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.team_id = weekly_logs.team_id AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM teams t
      JOIN guides g ON t.guide_id = g.id
      WHERE t.id = weekly_logs.team_id AND g.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

CREATE POLICY "Team members can create logs for their team"
  ON weekly_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.team_id = weekly_logs.team_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Team leads can update their team logs"
  ON weekly_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.team_id = weekly_logs.team_id AND s.user_id = auth.uid() AND s.is_team_lead = true
    ) AND guide_approval = false
  );

CREATE POLICY "Guides can approve logs for their teams"
  ON weekly_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN guides g ON t.guide_id = g.id
      WHERE t.id = weekly_logs.team_id AND g.user_id = auth.uid()
    )
  );

-- Function to set approved_at timestamp
CREATE OR REPLACE FUNCTION set_approved_at()
RETURNS trigger AS $$
BEGIN
  IF NEW.guide_approval = true AND OLD.guide_approval = false THEN
    NEW.approved_at = now();
  ELSIF NEW.guide_approval = false THEN
    NEW.approved_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for approved_at
CREATE TRIGGER set_weekly_log_approved_at
  BEFORE UPDATE ON weekly_logs
  FOR EACH ROW EXECUTE FUNCTION set_approved_at();

-- Trigger for updated_at
CREATE TRIGGER update_weekly_logs_updated_at
  BEFORE UPDATE ON weekly_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_weekly_logs_team_id ON weekly_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_weekly_logs_submitted_by ON weekly_logs(submitted_by);
CREATE INDEX IF NOT EXISTS idx_weekly_logs_week_number ON weekly_logs(week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_logs_guide_approval ON weekly_logs(guide_approval);