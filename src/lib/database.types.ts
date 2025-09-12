export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'principal' | 'guide' | 'team_lead' | 'student'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'principal' | 'guide' | 'team_lead' | 'student'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'principal' | 'guide' | 'team_lead' | 'student'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id: string | null
          roll_number: string
          percentage: number
          original_percentage: number
          domain: string
          backlogs: number
          skills: string[]
          team_id: string | null
          is_team_lead: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          roll_number: string
          percentage?: number
          original_percentage: number
          domain: string
          backlogs?: number
          skills?: string[]
          team_id?: string | null
          is_team_lead?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          roll_number?: string
          percentage?: number
          original_percentage?: number
          domain?: string
          backlogs?: number
          skills?: string[]
          team_id?: string | null
          is_team_lead?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      guides: {
        Row: {
          id: string
          user_id: string | null
          department: string
          expertise: string[]
          max_teams: number
          current_teams: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          department: string
          expertise?: string[]
          max_teams?: number
          current_teams?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          department?: string
          expertise?: string[]
          max_teams?: number
          current_teams?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          project_title: string
          domain: string
          description: string
          team_lead_id: string | null
          guide_id: string | null
          status: 'active' | 'completed' | 'on_hold'
          average_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          project_title: string
          domain: string
          description?: string
          team_lead_id?: string | null
          guide_id?: string | null
          status?: 'active' | 'completed' | 'on_hold'
          average_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          project_title?: string
          domain?: string
          description?: string
          team_lead_id?: string | null
          guide_id?: string | null
          status?: 'active' | 'completed' | 'on_hold'
          average_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      weekly_logs: {
        Row: {
          id: string
          team_id: string
          week_number: number
          title: string
          description: string
          completed_tasks: string[]
          next_week_plans: string[]
          challenges: string[]
          submitted_by: string
          guide_approval: boolean
          guide_feedback: string
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          week_number: number
          title: string
          description: string
          completed_tasks?: string[]
          next_week_plans?: string[]
          challenges?: string[]
          submitted_by: string
          guide_approval?: boolean
          guide_feedback?: string
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          week_number?: number
          title?: string
          description?: string
          completed_tasks?: string[]
          next_week_plans?: string[]
          challenges?: string[]
          submitted_by?: string
          guide_approval?: boolean
          guide_feedback?: string
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          team_id: string
          name: string
          file_path: string
          file_size: number
          file_type: string
          document_type: 'proposal' | 'report' | 'presentation' | 'code' | 'other'
          uploaded_by: string
          description: string
          version: number
          is_latest: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          file_path: string
          file_size: number
          file_type: string
          document_type?: 'proposal' | 'report' | 'presentation' | 'code' | 'other'
          uploaded_by: string
          description?: string
          version?: number
          is_latest?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          document_type?: 'proposal' | 'report' | 'presentation' | 'code' | 'other'
          uploaded_by?: string
          description?: string
          version?: number
          is_latest?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      evaluations: {
        Row: {
          id: string
          team_id: string
          evaluator_id: string
          evaluation_type: 'weekly' | 'mid_term' | 'final' | 'presentation'
          technical_score: number | null
          innovation_score: number | null
          implementation_score: number | null
          presentation_score: number | null
          teamwork_score: number | null
          total_score: number
          feedback: string
          strengths: string[]
          improvements: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          evaluator_id: string
          evaluation_type: 'weekly' | 'mid_term' | 'final' | 'presentation'
          technical_score?: number | null
          innovation_score?: number | null
          implementation_score?: number | null
          presentation_score?: number | null
          teamwork_score?: number | null
          total_score?: number
          feedback?: string
          strengths?: string[]
          improvements?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          evaluator_id?: string
          evaluation_type?: 'weekly' | 'mid_term' | 'final' | 'presentation'
          technical_score?: number | null
          innovation_score?: number | null
          implementation_score?: number | null
          presentation_score?: number | null
          teamwork_score?: number | null
          total_score?: number
          feedback?: string
          strengths?: string[]
          improvements?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'principal' | 'guide' | 'team_lead' | 'student'
      team_status: 'active' | 'completed' | 'on_hold'
      document_type: 'proposal' | 'report' | 'presentation' | 'code' | 'other'
      evaluation_type: 'weekly' | 'mid_term' | 'final' | 'presentation'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}