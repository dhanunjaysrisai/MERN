/*
# Evaluations Schema

1. New Tables
   - evaluations: Team evaluations by guides

2. Security
   - Enable RLS with guide-based access control
*/

CREATE TYPE evaluation_type AS ENUM ('weekly', 'mid_term', 'final', 'presentation');
CREATE TYPE grade_type AS ENUM ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F');

-- Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  evaluator_id uuid REFERENCES guides(id) ON DELETE CASCADE NOT NULL,
  type evaluation_type NOT NULL,
  technical_score integer CHECK (technical_score >= 0 AND technical_score <= 100),
  innovation_score integer CHECK (innovation_score >= 0 AND innovation_score <= 100),
  implementation_score integer CHECK (implementation_score >= 0 AND implementation_score <= 100),
  presentation_score integer CHECK (presentation_score >= 0 AND presentation_score <= 100),
  teamwork_score integer CHECK (teamwork_score >= 0 AND teamwork_score <= 100),
  total_score numeric(5,2) GENERATED ALWAYS AS (
    (technical_score + innovation_score + implementation_score + presentation_score + teamwork_score) / 5.0
  ) STORED,
  grade grade_type,
  feedback text NOT NULL,
  suggestions text,
  evaluation_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, type, evaluator_id)
);

-- Enable RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Evaluations policies
CREATE POLICY "Team members can read their evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Guides can create evaluations for assigned teams"
  ON evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    evaluator_id IN (
      SELECT id FROM guides WHERE user_id = auth.uid()
    ) AND
    team_id IN (
      SELECT id FROM teams WHERE guide_id IN (
        SELECT id FROM guides WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Guides can read their evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    evaluator_id IN (
      SELECT id FROM guides WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Guides can update their evaluations within 24 hours"
  ON evaluations FOR UPDATE
  TO authenticated
  USING (
    evaluator_id IN (
      SELECT id FROM guides WHERE user_id = auth.uid()
    ) AND
    created_at > now() - interval '24 hours'
  );

CREATE POLICY "Principals can read all evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

-- Function to calculate grade based on total score
CREATE OR REPLACE FUNCTION calculate_grade()
RETURNS trigger AS $$
BEGIN
  NEW.grade := CASE
    WHEN NEW.total_score >= 90 THEN 'A+'::grade_type
    WHEN NEW.total_score >= 85 THEN 'A'::grade_type
    WHEN NEW.total_score >= 80 THEN 'B+'::grade_type
    WHEN NEW.total_score >= 75 THEN 'B'::grade_type
    WHEN NEW.total_score >= 70 THEN 'C+'::grade_type
    WHEN NEW.total_score >= 65 THEN 'C'::grade_type
    WHEN NEW.total_score >= 50 THEN 'D'::grade_type
    ELSE 'F'::grade_type
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate grade
CREATE TRIGGER calculate_evaluation_grade
  BEFORE INSERT OR UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION calculate_grade();

-- Add updated_at trigger
CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();