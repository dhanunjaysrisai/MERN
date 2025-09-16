/*
# Weekly Logs Schema

1. New Tables
   - weekly_logs: Weekly progress reports from teams

2. Security
   - Enable RLS with team-based access control
*/

-- Weekly logs table
CREATE TABLE IF NOT EXISTS weekly_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  week_number integer NOT NULL CHECK (week_number > 0),
  title text NOT NULL,
  description text NOT NULL,
  completed_tasks text[] DEFAULT '{}',
  next_week_plans text[] DEFAULT '{}',
  challenges text[] DEFAULT '{}',
  submitted_by uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  guide_approval boolean DEFAULT false,
  guide_feedback text,
  approved_by uuid REFERENCES guides(id) ON DELETE SET NULL,
  approved_at timestamptz,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, week_number)
);

-- Enable RLS
ALTER TABLE weekly_logs ENABLE ROW LEVEL SECURITY;

-- Weekly logs policies
CREATE POLICY "Team members can read their team logs"
  ON weekly_logs FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create logs for their team"
  ON weekly_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM students WHERE user_id = auth.uid()
    ) AND
    submitted_by IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update their team logs before approval"
  ON weekly_logs FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM students WHERE user_id = auth.uid()
    ) AND
    guide_approval = false
  );

CREATE POLICY "Guides can read logs from assigned teams"
  ON weekly_logs FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE guide_id IN (
        SELECT id FROM guides WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Guides can approve logs from assigned teams"
  ON weekly_logs FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE guide_id IN (
        SELECT id FROM guides WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Principals can read all logs"
  ON weekly_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_weekly_logs_updated_at
  BEFORE UPDATE ON weekly_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();