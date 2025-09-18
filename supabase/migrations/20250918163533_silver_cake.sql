/*
  # Complete FYP Management System Schema

  1. Authentication & Profiles
    - Extended user profiles with roles
    - Automatic profile creation on signup
  
  2. Students Management
    - Student profiles with academic details
    - Skills and performance tracking
  
  3. Guides Management  
    - Guide profiles with expertise
    - Team capacity management
  
  4. Teams Management
    - Team formation and project details
    - Member assignments and leadership
  
  5. Weekly Logs
    - Progress tracking and submissions
    - Guide approval workflow
  
  6. Documents
    - File uploads with metadata
    - Version control and access management
  
  7. Evaluations
    - Assessment and grading system
    - Multiple evaluation types
  
  8. Security
    - Row Level Security on all tables
    - Role-based access control
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('principal', 'guide', 'team_lead', 'student');
CREATE TYPE team_status AS ENUM ('active', 'completed', 'on_hold', 'cancelled');
CREATE TYPE domain_type AS ENUM ('web-development', 'mobile-development', 'data-science', 'ai-ml', 'cybersecurity', 'blockchain', 'iot', 'cloud-computing');
CREATE TYPE department_type AS ENUM ('computer-science', 'information-technology', 'electronics', 'mechanical', 'electrical', 'civil');
CREATE TYPE document_type AS ENUM ('proposal', 'report', 'presentation', 'code', 'other');
CREATE TYPE evaluation_type AS ENUM ('weekly', 'mid_term', 'final', 'presentation');
CREATE TYPE grade_type AS ENUM ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  roll_number text UNIQUE NOT NULL,
  percentage numeric(5,2) DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  domain domain_type NOT NULL,
  backlogs integer DEFAULT 0 CHECK (backlogs >= 0),
  skills text[] DEFAULT '{}',
  academic_year text NOT NULL,
  department department_type NOT NULL,
  team_id uuid,
  is_team_lead boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Guides table
CREATE TABLE IF NOT EXISTS guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department department_type NOT NULL,
  expertise text[] DEFAULT '{}',
  max_teams integer DEFAULT 3 CHECK (max_teams > 0),
  current_teams integer DEFAULT 0 CHECK (current_teams >= 0),
  qualification text NOT NULL,
  experience integer DEFAULT 0 CHECK (experience >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Add foreign key constraint for students.team_id
ALTER TABLE students ADD CONSTRAINT fk_students_team 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- Weekly logs table
CREATE TABLE IF NOT EXISTS weekly_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  week_number integer NOT NULL CHECK (week_number > 0),
  title text NOT NULL,
  description text NOT NULL,
  completed_tasks text[] DEFAULT '{}',
  next_week_plans text[] DEFAULT '{}',
  challenges text[] DEFAULT '{}',
  submitted_by uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  guide_approval boolean DEFAULT false,
  guide_feedback text,
  approved_by uuid REFERENCES guides(id) ON DELETE SET NULL,
  approved_at timestamptz,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, week_number)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  type document_type NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  description text,
  version integer DEFAULT 1,
  is_latest boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  type evaluation_type NOT NULL,
  technical_score integer CHECK (technical_score >= 0 AND technical_score <= 100),
  innovation_score integer CHECK (innovation_score >= 0 AND innovation_score <= 100),
  implementation_score integer CHECK (implementation_score >= 0 AND implementation_score <= 100),
  presentation_score integer CHECK (presentation_score >= 0 AND presentation_score <= 100),
  teamwork_score integer CHECK (teamwork_score >= 0 AND teamwork_score <= 100),
  total_score numeric(5,2) DEFAULT ((technical_score + innovation_score + implementation_score + presentation_score + teamwork_score)::numeric / 5.0),
  grade grade_type,
  feedback text NOT NULL,
  suggestions text,
  evaluation_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, type, evaluator_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guides_updated_at BEFORE UPDATE ON guides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weekly_logs_updated_at BEFORE UPDATE ON weekly_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate team average percentage
CREATE OR REPLACE FUNCTION calculate_team_average()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.team_id IS NOT NULL THEN
    UPDATE teams 
    SET average_percentage = (
      SELECT COALESCE(AVG(percentage), 0)
      FROM students 
      WHERE team_id = NEW.team_id
    )
    WHERE id = NEW.team_id;
  END IF;
  
  IF OLD.team_id IS NOT NULL AND OLD.team_id != NEW.team_id THEN
    UPDATE teams 
    SET average_percentage = (
      SELECT COALESCE(AVG(percentage), 0)
      FROM students 
      WHERE team_id = OLD.team_id
    )
    WHERE id = OLD.team_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for team average calculation
CREATE TRIGGER update_team_average_on_student_change
  AFTER UPDATE OF percentage ON students
  FOR EACH ROW
  WHEN (NEW.team_id IS NOT NULL)
  EXECUTE FUNCTION calculate_team_average();

-- Function to calculate evaluation grade
CREATE OR REPLACE FUNCTION calculate_grade()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_score := (NEW.technical_score + NEW.innovation_score + NEW.implementation_score + NEW.presentation_score + NEW.teamwork_score)::numeric / 5.0;
  
  IF NEW.total_score >= 90 THEN NEW.grade := 'A+';
  ELSIF NEW.total_score >= 85 THEN NEW.grade := 'A';
  ELSIF NEW.total_score >= 80 THEN NEW.grade := 'B+';
  ELSIF NEW.total_score >= 75 THEN NEW.grade := 'B';
  ELSIF NEW.total_score >= 70 THEN NEW.grade := 'C+';
  ELSIF NEW.total_score >= 65 THEN NEW.grade := 'C';
  ELSIF NEW.total_score >= 50 THEN NEW.grade := 'D';
  ELSE NEW.grade := 'F';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for grade calculation
CREATE TRIGGER calculate_evaluation_grade
  BEFORE INSERT OR UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_grade();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Principals can read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);

-- RLS Policies for students
CREATE POLICY "Students can read own data" ON students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Students can update own data" ON students FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Principals can manage students" ON students FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);
CREATE POLICY "Principals and guides can read students" ON students FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ANY(ARRAY['principal', 'guide']))
);

-- RLS Policies for guides
CREATE POLICY "Guides can read own data" ON guides FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Guides can update own data" ON guides FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Everyone can read guides" ON guides FOR SELECT TO authenticated;
CREATE POLICY "Principals can manage guides" ON guides FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);

-- RLS Policies for teams
CREATE POLICY "Team members can read their team" ON teams FOR SELECT USING (
  EXISTS (SELECT 1 FROM students WHERE team_id = teams.id AND user_id = auth.uid())
);
CREATE POLICY "Team leads can update their team" ON teams FOR UPDATE USING (
  team_lead_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Guides can read assigned teams" ON teams FOR SELECT USING (
  guide_id IN (SELECT id FROM guides WHERE user_id = auth.uid())
);
CREATE POLICY "Principals can read all teams" ON teams FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);
CREATE POLICY "Principals can manage all teams" ON teams FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);

-- RLS Policies for weekly_logs
CREATE POLICY "Team members can read their team logs" ON weekly_logs FOR SELECT USING (
  team_id IN (SELECT team_id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Team members can create logs for their team" ON weekly_logs FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM students WHERE user_id = auth.uid()) AND
  submitted_by IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Team members can update their team logs before approval" ON weekly_logs FOR UPDATE USING (
  team_id IN (SELECT team_id FROM students WHERE user_id = auth.uid()) AND
  guide_approval = false
);
CREATE POLICY "Guides can read logs from assigned teams" ON weekly_logs FOR SELECT USING (
  team_id IN (SELECT id FROM teams WHERE guide_id IN (SELECT id FROM guides WHERE user_id = auth.uid()))
);
CREATE POLICY "Guides can approve logs from assigned teams" ON weekly_logs FOR UPDATE USING (
  team_id IN (SELECT id FROM teams WHERE guide_id IN (SELECT id FROM guides WHERE user_id = auth.uid()))
);
CREATE POLICY "Principals can read all logs" ON weekly_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);

-- RLS Policies for documents
CREATE POLICY "Team members can read their team documents" ON documents FOR SELECT USING (
  team_id IN (SELECT team_id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Team members can upload documents for their team" ON documents FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM students WHERE user_id = auth.uid()) AND
  uploaded_by IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Team members can update their team documents" ON documents FOR UPDATE USING (
  team_id IN (SELECT team_id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Guides can read documents from assigned teams" ON documents FOR SELECT USING (
  team_id IN (SELECT id FROM teams WHERE guide_id IN (SELECT id FROM guides WHERE user_id = auth.uid()))
);
CREATE POLICY "Principals can read all documents" ON documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);

-- RLS Policies for evaluations
CREATE POLICY "Team members can read their evaluations" ON evaluations FOR SELECT USING (
  team_id IN (SELECT team_id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Guides can read their evaluations" ON evaluations FOR SELECT USING (
  evaluator_id IN (SELECT id FROM guides WHERE user_id = auth.uid())
);
CREATE POLICY "Guides can create evaluations for assigned teams" ON evaluations FOR INSERT WITH CHECK (
  evaluator_id IN (SELECT id FROM guides WHERE user_id = auth.uid()) AND
  team_id IN (SELECT id FROM teams WHERE guide_id IN (SELECT id FROM guides WHERE user_id = auth.uid()))
);
CREATE POLICY "Guides can update their evaluations within 24 hours" ON evaluations FOR UPDATE USING (
  evaluator_id IN (SELECT id FROM guides WHERE user_id = auth.uid()) AND
  created_at > now() - interval '24 hours'
);
CREATE POLICY "Principals can read all evaluations" ON evaluations FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Team members can upload documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can read their team documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Guides can read assigned team documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM teams WHERE guide_id IN (
      SELECT id FROM guides WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Principals can read all documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);