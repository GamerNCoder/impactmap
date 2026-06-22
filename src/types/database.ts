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
          full_name: string | null
          email: string | null
          avatar_url: string | null
          bio: string | null
          skills: string[] | null
          location: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          bio?: string | null
          skills?: string[] | null
          location?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          bio?: string | null
          skills?: string[] | null
          location?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          website: string | null
          email: string | null
          phone: string | null
          address: string | null
          location: string | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          location?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          location?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      opportunities: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string
          category: string
          skills_required: string[] | null
          location: string | null
          remote: boolean
          time_commitment: string | null
          start_date: string | null
          end_date: string | null
          deadline: string | null
          volunteers_needed: number | null
          volunteers_count: number
          status: string
          requirements: string | null
          benefits: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          description: string
          category: string
          skills_required?: string[] | null
          location?: string | null
          remote?: boolean
          time_commitment?: string | null
          start_date?: string | null
          end_date?: string | null
          deadline?: string | null
          volunteers_needed?: number | null
          volunteers_count?: number
          status?: string
          requirements?: string | null
          benefits?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          description?: string
          category?: string
          skills_required?: string[] | null
          location?: string | null
          remote?: boolean
          time_commitment?: string | null
          start_date?: string | null
          end_date?: string | null
          deadline?: string | null
          volunteers_needed?: number | null
          volunteers_count?: number
          status?: string
          requirements?: string | null
          benefits?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          opportunity_id: string
          user_id: string
          status: string
          cover_letter: string | null
          availability: string | null
          experience: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          user_id: string
          status?: string
          cover_letter?: string | null
          availability?: string | null
          experience?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          user_id?: string
          status?: string
          cover_letter?: string | null
          availability?: string | null
          experience?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      volunteer_hours: {
        Row: {
          id: string
          user_id: string
          opportunity_id: string
          date: string
          hours: number
          description: string | null
          verified: boolean
          verified_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          opportunity_id: string
          date: string
          hours: number
          description?: string | null
          verified?: boolean
          verified_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          opportunity_id?: string
          date?: string
          hours?: number
          description?: string | null
          verified?: boolean
          verified_by?: string | null
          created_at?: string
        }
      }
    }
  }
}
