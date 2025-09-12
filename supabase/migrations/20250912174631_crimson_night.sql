/*
  # Evaluations Management

  1. New Tables
    - `evaluations` - Team evaluations and grading
      - `id` (uuid, primary key)
      - `team_id` (uuid, references teams)
      - `evaluator_id` (uuid, references profiles)
      - `evaluation_type` (enum: weekly, mid_term, final)
      - `technical_score` (integer, 0-100)
      - `innovation_score` (integer, 0-100)
      - `implementation_score` (integer, 0-100)
      - `presentation_score` (integer, 0-100)
      - `teamwork_score` (integer, 0-100)
      - `total_score` (decimal, computed)
      - `feedback` (text)
      - `strengths` (text array)
      - `improvements` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `evaluations` table
    - Add policies for guides and principals
*/

-- Create enum for evaluation types
CREATE TYPE evaluation_type AS ENUM ('weekly', 'mid_term', 'final', 'presentation');

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  evaluator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  evaluation_type evaluation_type NOT NULL,
  technical_score integer CHECK (technical_score >= 0 AND technical_score <= 100),
  innovation_score integer CHECK (innovation_score >= 0 AND innovation_score <= 100),
  implementation_score integer CHECK (implementation_score >= 0 AND implementation_score <= 100),
  presentation_score integer CHECK (presentation_score >= 0 AND presentation_score <= 100),
  teamwork_score integer CHECK (teamwork_score >= 0 AND teamwork_score <= 100),
  total_score decimal(5,2) DEFAULT 0,
  feedback text DEFAULT '',
  strengths text[] DEFAULT '{}',
  improvements text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique evaluation type per team per evaluator
  UNIQUE(team_id, evaluator_id, evaluation_type)
);

-- Enable RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Policies for evaluations
CREATE POLICY "Team members can read their evaluations"
  ON evaluations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.team_id = evaluations.team_id AND s.user_id = auth.uid()
    ) OR
    evaluator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

CREATE POLICY "Guides can create evaluations for their teams"
  ON evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN guides g ON t.guide_id = g.id
      WHERE t.id = evaluations.team_id AND g.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

CREATE POLICY "Evaluators can update their evaluations"
  ON evaluations
  FOR UPDATE
  TO authenticated
  USING (evaluator_id = auth.uid());

-- Function to calculate total score
CREATE OR REPLACE FUNCTION calculate_total_score()
RETURNS trigger AS $$
BEGIN
  NEW.total_score = (
    COALESCE(NEW.technical_score, 0) +
    COALESCE(NEW.innovation_score, 0) +
    COALESCE(NEW.implementation_score, 0) +
    COALESCE(NEW.presentation_score, 0) +
    COALESCE(NEW.teamwork_score, 0)
  ) / 5.0;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for total score calculation
CREATE TRIGGER calculate_evaluation_total_score
  BEFORE INSERT OR UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION calculate_total_score();

-- Trigger for updated_at
CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_team_id ON evaluations(team_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_id ON evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_type ON evaluations(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_evaluations_total_score ON evaluations(total_score);