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
          full_name: string | null
          avatar_url: string | null
          timezone: string
          created_at: string
          updated_at: string
          study_goal_minutes: number
          streak_count: number
          total_study_minutes: number
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string
          icon: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      todos: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          description: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'todo' | 'in_progress' | 'done'
          due_date: string | null
          scheduled_date: string | null
          order_index: number
          tags: string[]
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['todos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['todos']['Insert']>
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          duration_minutes: number
          session_type: 'pomodoro' | 'manual' | 'stopwatch'
          notes: string | null
          date: string
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['study_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['study_sessions']['Insert']>
      }
      notes: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          content: string
          tags: string[]
          is_pinned: boolean
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notes']['Insert']>
      }
      mistakes: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          subject: string
          topic: string
          description: string
          root_cause: string | null
          fix: string | null
          category: 'concept' | 'calculation' | 'careless' | 'time' | 'other'
          severity: 'low' | 'medium' | 'high'
          is_revised: boolean
          next_revision: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['mistakes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['mistakes']['Insert']>
      }
      exams: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          subject: string
          exam_date: string
          prep_status: number
          notes: string | null
          syllabus: string[]
          color: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['exams']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['exams']['Insert']>
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['friendships']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['friendships']['Insert']>
      }
    }
    Views: {}
    Functions: {}
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Todo = Database['public']['Tables']['todos']['Row']
export type StudySession = Database['public']['Tables']['study_sessions']['Row']
export type Note = Database['public']['Tables']['notes']['Row']
export type Mistake = Database['public']['Tables']['mistakes']['Row']
export type Exam = Database['public']['Tables']['exams']['Row']
export type Friendship = Database['public']['Tables']['friendships']['Row']

export type Priority = Todo['priority']
export type TodoStatus = Todo['status']
export type MistakeCategory = Mistake['category']
export type SessionType = StudySession['session_type']
