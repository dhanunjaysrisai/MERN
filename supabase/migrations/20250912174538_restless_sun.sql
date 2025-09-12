/*
  # Students Management

  1. New Tables
    - `students` - Student academic information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `roll_number` (text, unique)
      - `percentage` (decimal)
      - `original_percentage` (decimal) - stores original before backlog adjustment
      - `domain` (text)
      - `backlogs` (integer)
      - `skills` (text array)
      - `team_id` (uuid, references teams, nullable)
      - `is_team_lead` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `students` table
    - Add policies for different user roles
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  roll_number text UNIQUE NOT NULL,
  percentage decimal(5,2) NOT NULL DEFAULT 0,
  original_percentage decimal(5,2) NOT NULL,
  domain text NOT NULL,
  backlogs integer NOT NULL DEFAULT 0,
  skills text[] DEFAULT '{}',
  team_id uuid, -- Will reference teams table
  is_team_lead boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policies for students
CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('principal', 'guide')
    )
  );

CREATE POLICY "Students can update own data"
  ON students
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Principals can manage all students"
  ON students
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

-- Function to auto-adjust percentage based on backlogs
CREATE OR REPLACE FUNCTION adjust_percentage_for_backlogs()
RETURNS trigger AS $$
BEGIN
  -- Store original percentage
  NEW.original_percentage = NEW.percentage;
  
  -- Set percentage to 0 if student has backlogs
  IF NEW.backlogs > 0 THEN
    NEW.percentage = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for percentage adjustment
CREATE TRIGGER adjust_student_percentage
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION adjust_percentage_for_backlogs();

-- Trigger for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_team_id ON students(team_id);
CREATE INDEX IF NOT EXISTS idx_students_domain ON students(domain);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);