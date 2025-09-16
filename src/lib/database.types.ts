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
          user_id: string
          roll_number: string
          percentage: number
          domain: 'web-development' | 'mobile-development' | 'data-science' | 'ai-ml' | 'cybersecurity' | 'blockchain' | 'iot' | 'cloud-computing'
          backlogs: number
          skills: string[]
          academic_year: string
          department: 'computer-science' | 'information-technology' | 'electronics' | 'mechanical' | 'electrical' | 'civil'
          team_id: string | null
          is_team_lead: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          roll_number: string
          percentage?: number
          domain: 'web-development' | 'mobile-development' | 'data-science' | 'ai-ml' | 'cybersecurity' | 'blockchain' | 'iot' | 'cloud-computing'
          backlogs?: number
          skills?: string[]
          academic_year: string
          department: 'computer-science' | 'information-technology' | 'electronics' | 'mechanical' | 'electrical' | 'civil'
          team_id?: string | null
          is_team_lead?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          roll_number?: string
          percentage?: number
          domain?: 'web-development' | 'mobile-development' | 'data-science' | 'ai-ml' | 'cybersecurity' | 'blockchain' | 'iot' | 'cloud-computing'
          backlogs?: number
          skills?: string[]
          academic_year?: string
          department?: 'computer-science' | 'information-technology' | 'electronics' | 'mechanical' | 'electrical' | 'civil'
          team_id?: string | null
          is_team_lead?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      guides: {
        Row: {
          id: string
          user_id: string
          department: 'computer-science' | 'information-technology' | 'electronics' | 'mechanical' | 'electrical' | 'civil'
          expertise: string[]
          max_teams: number
          current_teams: number
          qualification: string
          experience: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          department: 'computer-science' | 'information-technology' | 'electronics' | 'mechanical' | 'electrical' | 'civil'
          expertise?: string[]
          max_teams?: number
          current_teams?: number
          qualification: string
          experience?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          department?: 'computer-science' | 'information-technology' | 'electronics' | 'mechanical' | 'electrical' | 'civil'
          expertise?: string[]
          max_teams?: number
          current_teams?: number
          qualification?: string
          experience?: number
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          project_title: string
          project_description: string | null
          domain: 'web-development' | 'mobile-development' | 'data-science' | 'ai-ml' | 'cybersecurity' | 'blockchain' | 'iot' | 'cloud-computing'
          technologies: string[]
          status: 'active' | 'completed' | 'on_hold' | 'cancelled'
          team_lead_id: string | null
          guide_id: string | null
          average_percentage: number
          start_date: string
          expected_end_date: string | null
          actual_end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          project_title: string
          project_description?: string | null
          domain: 'web-development' | 'mobile-development' | 'data-science' | 'ai-ml' | 'cybersecurity' | 'blockchain' | 'iot' | 'cloud-computing'
          technologies?: string[]
          status?: 'active' | 'completed' | 'on_hold' | 'cancelled'
          team_lead_id?: string | null
          guide_id?: string | null
          average_percentage?: number
          start_date?: string
          expected_end_date?: string | null
          actual_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          project_title?: string
          project_description?: string | null
          domain?: 'web-development' | 'mobile-development' | 'data-science' | 'ai-ml' | 'cybersecurity' | 'blockchain' | 'iot' | 'cloud-computing'
          technologies?: string[]
          status?: 'active' | 'completed' | 'on_hold' | 'cancelled'
          team_lead_id?: string | null
          guide_id?: string | null
          average_percentage?: number
          start_date?: string
          expected_end_date?: string | null
          actual_end_date?: string | null
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
          guide_feedback: string | null
          approved_by: string | null
          approved_at: string | null
          attachments: Json
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
          guide_feedback?: string | null
          approved_by?: string | null
          approved_at?: string | null
          attachments?: Json
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
          guide_feedback?: string | null
          approved_by?: string | null
          approved_at?: string | null
          attachments?: Json
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          team_id: string
          name: string
          type: 'proposal' | 'report' | 'presentation' | 'code' | 'other'
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string
          description: string | null
          version: number
          is_latest: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          type: 'proposal' | 'report' | 'presentation' | 'code' | 'other'
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string
          description?: string | null
          version?: number
          is_latest?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          type?: 'proposal' | 'report' | 'presentation' | 'code' | 'other'
          file_path?: string
          file_size?: number
          mime_type?: string
          uploaded_by?: string
          description?: string | null
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
          type: 'weekly' | 'mid_term' | 'final' | 'presentation'
          technical_score: number
          innovation_score: number
          implementation_score: number
          presentation_score: number
          teamwork_score: number
          total_score: number
          grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
          feedback: string
          suggestions: string | null
          evaluation_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          evaluator_id: string
          type: 'weekly' | 'mid_term' | 'final' | 'presentation'
          technical_score: number
          innovation_score: number
          implementation_score: number
          presentation_score: number
          teamwork_score: number
          feedback: string
          suggestions?: string | null
          evaluation_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          evaluator_id?: string
          type?: 'weekly' | 'mid_term' | 'final' | 'presentation'
          technical_score?: number
          innovation_score?: number
          implementation_score?: number
          presentation_score?: number
          teamwork_score?: number
          feedback?: string
          suggestions?: string | null
          evaluation_date?: string
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
      domain_type: 'web-development' | 'mobile-development' | 'data-science' | 'ai-ml' | 'cybersecurity' | 'blockchain' | 'iot' | 'cloud-computing'
      department_type: 'computer-science' | 'information-technology' | 'electronics' | 'mechanical' | 'electrical' | 'civil'
      team_status: 'active' | 'completed' | 'on_hold' | 'cancelled'
      document_type: 'proposal' | 'report' | 'presentation' | 'code' | 'other'
      evaluation_type: 'weekly' | 'mid_term' | 'final' | 'presentation'
      grade_type: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}