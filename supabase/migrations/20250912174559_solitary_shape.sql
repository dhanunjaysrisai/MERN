/*
  # Add Foreign Key Constraints

  1. Changes
    - Add foreign key constraint for students.team_id -> teams.id
    - Add foreign key constraint for teams.team_lead_id -> students.id
    - Update guide current_teams count when teams are assigned

  2. Functions
    - Function to update guide team counts
    - Function to calculate team average percentage
*/

-- Add foreign key constraints
ALTER TABLE students 
ADD CONSTRAINT fk_students_team_id 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE teams 
ADD CONSTRAINT fk_teams_team_lead_id 
FOREIGN KEY (team_lead_id) REFERENCES students(id) ON DELETE SET NULL;

-- Function to update guide team counts
CREATE OR REPLACE FUNCTION update_guide_team_count()
RETURNS trigger AS $$
BEGIN
  -- Update old guide count (if exists)
  IF OLD.guide_id IS NOT NULL THEN
    UPDATE guides 
    SET current_teams = (
      SELECT COUNT(*) FROM teams WHERE guide_id = OLD.guide_id
    )
    WHERE id = OLD.guide_id;
  END IF;
  
  -- Update new guide count (if exists)
  IF NEW.guide_id IS NOT NULL THEN
    UPDATE guides 
    SET current_teams = (
      SELECT COUNT(*) FROM teams WHERE guide_id = NEW.guide_id
    )
    WHERE id = NEW.guide_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for guide team count updates
CREATE TRIGGER update_guide_team_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_guide_team_count();

-- Function to calculate team average percentage
CREATE OR REPLACE FUNCTION calculate_team_average()
RETURNS trigger AS $$
BEGIN
  -- Update team average when student is added/removed/updated
  IF TG_OP = 'DELETE' THEN
    UPDATE teams 
    SET average_percentage = (
      SELECT COALESCE(AVG(original_percentage), 0)
      FROM students 
      WHERE team_id = OLD.team_id
    )
    WHERE id = OLD.team_id;
    RETURN OLD;
  ELSE
    UPDATE teams 
    SET average_percentage = (
      SELECT COALESCE(AVG(original_percentage), 0)
      FROM students 
      WHERE team_id = NEW.team_id
    )
    WHERE id = NEW.team_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for team average calculation
CREATE TRIGGER calculate_team_average_trigger
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION calculate_team_average();