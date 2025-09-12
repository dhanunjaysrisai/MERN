import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth helpers
export const signUp = async (email: string, password: string, userData: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Profile helpers
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

// Students helpers
export const getStudents = async () => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      profiles:user_id (
        full_name,
        email
      ),
      teams:team_id (
        name,
        project_title
      )
    `)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createStudent = async (studentData: any) => {
  const { data, error } = await supabase
    .from('students')
    .insert(studentData)
    .select()
    .single();
  return { data, error };
};

// Teams helpers
export const getTeams = async () => {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      students!team_id (
        *,
        profiles:user_id (
          full_name,
          email
        )
      ),
      guides:guide_id (
        *,
        profiles:user_id (
          full_name,
          email
        )
      )
    `)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createTeam = async (teamData: any) => {
  const { data, error } = await supabase
    .from('teams')
    .insert(teamData)
    .select()
    .single();
  return { data, error };
};

// Guides helpers
export const getGuides = async () => {
  const { data, error } = await supabase
    .from('guides')
    .select(`
      *,
      profiles:user_id (
        full_name,
        email
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createGuide = async (guideData: any) => {
  const { data, error } = await supabase
    .from('guides')
    .insert(guideData)
    .select()
    .single();
  return { data, error };
};

// Weekly logs helpers
export const getWeeklyLogs = async (teamId?: string) => {
  let query = supabase
    .from('weekly_logs')
    .select(`
      *,
      teams:team_id (
        name,
        project_title
      ),
      profiles:submitted_by (
        full_name,
        email
      )
    `);
  
  if (teamId) {
    query = query.eq('team_id', teamId);
  }
  
  const { data, error } = await query.order('week_number', { ascending: false });
  return { data, error };
};

export const createWeeklyLog = async (logData: any) => {
  const { data, error } = await supabase
    .from('weekly_logs')
    .insert(logData)
    .select()
    .single();
  return { data, error };
};

export const approveWeeklyLog = async (logId: string, feedback?: string) => {
  const { data, error } = await supabase
    .from('weekly_logs')
    .update({ 
      guide_approval: true,
      guide_feedback: feedback || ''
    })
    .eq('id', logId)
    .select()
    .single();
  return { data, error };
};

// Documents helpers
export const getDocuments = async (teamId?: string) => {
  let query = supabase
    .from('documents')
    .select(`
      *,
      teams:team_id (
        name,
        project_title
      ),
      profiles:uploaded_by (
        full_name,
        email
      )
    `);
  
  if (teamId) {
    query = query.eq('team_id', teamId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
};

export const uploadDocument = async (file: File, teamId: string, documentType: string, description?: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${teamId}/${Date.now()}.${fileExt}`;
  
  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file);
  
  if (uploadError) {
    return { data: null, error: uploadError };
  }
  
  // Create document record
  const { data, error } = await supabase
    .from('documents')
    .insert({
      team_id: teamId,
      name: file.name,
      file_path: uploadData.path,
      file_size: file.size,
      file_type: file.type,
      document_type: documentType,
      description: description || '',
      uploaded_by: (await getCurrentUser()).user?.id
    })
    .select()
    .single();
  
  return { data, error };
};

// Evaluations helpers
export const getEvaluations = async (teamId?: string) => {
  let query = supabase
    .from('evaluations')
    .select(`
      *,
      teams:team_id (
        name,
        project_title
      ),
      profiles:evaluator_id (
        full_name,
        email
      )
    `);
  
  if (teamId) {
    query = query.eq('team_id', teamId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
};

export const createEvaluation = async (evaluationData: any) => {
  const { data, error } = await supabase
    .from('evaluations')
    .insert(evaluationData)
    .select()
    .single();
  return { data, error };
};