import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, options?: { data?: any }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers
export const db = {
  // Profiles
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  // Students
  getStudents: async () => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        profiles!inner(full_name, email),
        teams(name, project_title)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createStudent: async (studentData: any) => {
    const { data, error } = await supabase
      .from('students')
      .insert(studentData)
      .select(`
        *,
        profiles!inner(full_name, email)
      `)
      .single();
    return { data, error };
  },

  updateStudent: async (studentId: string, updates: any) => {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select(`
        *,
        profiles!inner(full_name, email),
        teams(name, project_title)
      `)
      .single();
    return { data, error };
  },

  getStudentByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        profiles!inner(full_name, email),
        teams(*)
      `)
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  // Guides
  getGuides: async () => {
    const { data, error } = await supabase
      .from('guides')
      .select(`
        *,
        profiles!inner(full_name, email)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createGuide: async (guideData: any) => {
    const { data, error } = await supabase
      .from('guides')
      .insert(guideData)
      .select(`
        *,
        profiles!inner(full_name, email)
      `)
      .single();
    return { data, error };
  },

  getGuideByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('guides')
      .select(`
        *,
        profiles!inner(full_name, email)
      `)
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  // Teams
  getTeams: async () => {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_lead:students!team_lead_id(*, profiles!inner(full_name, email)),
        guide:guides!guide_id(*, profiles!inner(full_name, email)),
        members:students!team_id(*, profiles!inner(full_name, email))
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createTeam: async (teamData: any) => {
    const { data, error } = await supabase
      .from('teams')
      .insert(teamData)
      .select(`
        *,
        team_lead:students!team_lead_id(*, profiles!inner(full_name, email)),
        members:students!team_id(*, profiles!inner(full_name, email))
      `)
      .single();
    return { data, error };
  },

  updateTeam: async (teamId: string, updates: any) => {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', teamId)
      .select(`
        *,
        team_lead:students!team_lead_id(*, profiles!inner(full_name, email)),
        guide:guides!guide_id(*, profiles!inner(full_name, email)),
        members:students!team_id(*, profiles!inner(full_name, email))
      `)
      .single();
    return { data, error };
  },

  assignStudentsToTeam: async (teamId: string, studentIds: string[], teamLeadId: string) => {
    // Update students to assign them to team
    const { error: updateError } = await supabase
      .from('students')
      .update({ team_id: teamId, is_team_lead: false })
      .in('id', studentIds);

    if (updateError) return { error: updateError };

    // Set team lead
    const { error: leadError } = await supabase
      .from('students')
      .update({ is_team_lead: true })
      .eq('id', teamLeadId);

    return { error: leadError };
  },

  // Weekly Logs
  getWeeklyLogs: async (teamId?: string) => {
    let query = supabase
      .from('weekly_logs')
      .select(`
        *,
        teams!inner(name, project_title),
        submitted_by_student:students!submitted_by(*, profiles!inner(full_name, email)),
        approved_by_guide:guides!approved_by(*, profiles!inner(full_name, email))
      `)
      .order('week_number', { ascending: false });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  createWeeklyLog: async (logData: any) => {
    const { data, error } = await supabase
      .from('weekly_logs')
      .insert(logData)
      .select(`
        *,
        teams!inner(name, project_title),
        submitted_by_student:students!submitted_by(*, profiles!inner(full_name, email))
      `)
      .single();
    return { data, error };
  },

  updateWeeklyLog: async (logId: string, updates: any) => {
    const { data, error } = await supabase
      .from('weekly_logs')
      .update(updates)
      .eq('id', logId)
      .select(`
        *,
        teams!inner(name, project_title),
        submitted_by_student:students!submitted_by(*, profiles!inner(full_name, email)),
        approved_by_guide:guides!approved_by(*, profiles!inner(full_name, email))
      `)
      .single();
    return { data, error };
  },

  // Documents
  getDocuments: async (teamId?: string) => {
    let query = supabase
      .from('documents')
      .select(`
        *,
        teams!inner(name, project_title),
        uploaded_by_student:students!uploaded_by(*, profiles!inner(full_name, email))
      `)
      .order('created_at', { ascending: false });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  createDocument: async (documentData: any) => {
    const { data, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select(`
        *,
        teams!inner(name, project_title),
        uploaded_by_student:students!uploaded_by(*, profiles!inner(full_name, email))
      `)
      .single();
    return { data, error };
  },

  // Evaluations
  getEvaluations: async (teamId?: string) => {
    let query = supabase
      .from('evaluations')
      .select(`
        *,
        teams!inner(name, project_title),
        evaluator:guides!evaluator_id(*, profiles!inner(full_name, email))
      `)
      .order('evaluation_date', { ascending: false });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  createEvaluation: async (evaluationData: any) => {
    const { data, error } = await supabase
      .from('evaluations')
      .insert(evaluationData)
      .select(`
        *,
        teams!inner(name, project_title),
        evaluator:guides!evaluator_id(*, profiles!inner(full_name, email))
      `)
      .single();
    return { data, error };
  }
};

// Storage helpers
export const storage = {
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    return { data, error };
  },

  downloadFile: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    return { data, error };
  },

  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  deleteFile: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { data, error };
  }
};