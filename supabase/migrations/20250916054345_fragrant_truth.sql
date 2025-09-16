/*
# Authentication and User Management Schema

1. New Tables
   - profiles: Extended user profiles with roles
   - students: Student-specific information
   - guides: Guide-specific information

2. Security
   - Enable RLS on all tables
   - Create policies for role-based access
   - Set up user registration triggers
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('principal', 'guide', 'team_lead', 'student');
CREATE TYPE domain_type AS ENUM (
  'web-development',
  'mobile-development', 
  'data-science',
  'ai-ml',
  'cybersecurity',
  'blockchain',
  'iot',
  'cloud-computing'
);
CREATE TYPE department_type AS ENUM (
  'computer-science',
  'information-technology',
  'electronics',
  'mechanical',
  'electrical',
  'civil'
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
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
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  roll_number text UNIQUE NOT NULL,
  percentage numeric(5,2) CHECK (percentage >= 0 AND percentage <= 100) DEFAULT 0,
  domain domain_type NOT NULL,
  backlogs integer DEFAULT 0 CHECK (backlogs >= 0),
  skills text[] DEFAULT '{}',
  academic_year text NOT NULL,
  department department_type NOT NULL,
  team_id uuid DEFAULT NULL,
  is_team_lead boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Guides table
CREATE TABLE IF NOT EXISTS guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  department department_type NOT NULL,
  expertise text[] DEFAULT '{}',
  max_teams integer DEFAULT 3 CHECK (max_teams > 0),
  current_teams integer DEFAULT 0 CHECK (current_teams >= 0),
  qualification text NOT NULL,
  experience integer DEFAULT 0 CHECK (experience >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Principals can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

-- Students policies
CREATE POLICY "Students can read own data"
  ON students FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Students can update own data"
  ON students FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Principals and guides can read students"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('principal', 'guide')
    )
  );

CREATE POLICY "Principals can manage students"
  ON students FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

-- Guides policies
CREATE POLICY "Guides can read own data"
  ON guides FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Guides can update own data"
  ON guides FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Everyone can read guides"
  ON guides FOR SELECT
  TO authenticated;

CREATE POLICY "Principals can manage guides"
  ON guides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'principal'
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guides_updated_at
  BEFORE UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();