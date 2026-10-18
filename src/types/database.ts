export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_events: {
        Row: {
          id: string
          user_id: string | null
          organization_id: string | null
          event_name: string
          category: string
          path: string | null
          resource_type: string | null
          resource_id: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          organization_id?: string | null
          event_name: string
          category: string
          path?: string | null
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          organization_id?: string | null
          event_name?: string
          category?: string
          path?: string | null
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
      }
      applications: {
        Row: {
          availability: string | null
          completed_at: string | null
          cover_letter: string | null
          created_at: string | null
          experience: string | null
          id: string
          no_show: boolean | null
          opportunity_id: string | null
          status: string | null
          supervisor_email: string | null
          supervisor_name: string | null
          supervisor_notes: string | null
          supervisor_title: string | null
          updated_at: string | null
          user_id: string | null
          verification_code: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          availability?: string | null
          completed_at?: string | null
          cover_letter?: string | null
          created_at?: string | null
          experience?: string | null
          id?: string
          no_show?: boolean | null
          opportunity_id?: string | null
          status?: string | null
          supervisor_email?: string | null
          supervisor_name?: string | null
          supervisor_notes?: string | null
          supervisor_title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_code?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          availability?: string | null
          completed_at?: string | null
          cover_letter?: string | null
          created_at?: string | null
          experience?: string | null
          id?: string
          no_show?: boolean | null
          opportunity_id?: string | null
          status?: string | null
          supervisor_email?: string | null
          supervisor_name?: string | null
          supervisor_notes?: string | null
          supervisor_title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_code?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
      }
      opportunities: {
        Row: {
          benefits: string | null
          category: string
          created_at: string | null
          deadline: string | null
          description: string
          end_date: string | null
          facilities: string[] | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          location: string | null
          organization_id: string | null
          posted_by: string | null
          remote: boolean | null
          requirements: string | null
          skills_required: string[] | null
          start_date: string | null
          status: string | null
          time_commitment: string | null
          title: string
          updated_at: string | null
          volunteers_count: number | null
          volunteers_needed: number | null
        }
        Insert: {
          benefits?: string | null
          category: string
          created_at?: string | null
          deadline?: string | null
          description: string
          end_date?: string | null
          facilities?: string[] | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          location?: string | null
          organization_id?: string | null
          posted_by?: string | null
          remote?: boolean | null
          requirements?: string | null
          skills_required?: string[] | null
          start_date?: string | null
          status?: string | null
          time_commitment?: string | null
          title: string
          updated_at?: string | null
          volunteers_count?: number | null
          volunteers_needed?: number | null
        }
        Update: {
          benefits?: string | null
          category?: string
          created_at?: string | null
          deadline?: string | null
          description?: string
          end_date?: string | null
          facilities?: string[] | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          location?: string | null
          organization_id?: string | null
          posted_by?: string | null
          remote?: boolean | null
          requirements?: string | null
          skills_required?: string[] | null
          start_date?: string | null
          status?: string | null
          time_commitment?: string | null
          title?: string
          updated_at?: string | null
          volunteers_count?: number | null
          volunteers_needed?: number | null
        }
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string | null
          verified: boolean | null
          website: string | null
          billing_email: string | null
          plan_tier: string | null
          hour_valuation_usd: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          billing_email?: string | null
          plan_tier?: string | null
          hour_valuation_usd?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          billing_email?: string | null
          plan_tier?: string | null
          hour_valuation_usd?: number | null
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          hours_goal: number | null
          guardian_name: string | null
          guardian_email: string | null
          guardian_consent_at: string | null
          email: string | null
          full_name: string | null
          id: string
          id_verification_status: string | null
          id_certificate_code: string | null
          is_platform_admin: boolean | null
          location: string | null
          marketing_consent: boolean | null
          phone: string | null
          preferred_categories: string[] | null
          referral_source: string | null
          skills: string[] | null
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string | null
          volunteer_availability: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          hours_goal?: number | null
          guardian_name?: string | null
          guardian_email?: string | null
          guardian_consent_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          id_verification_status?: string | null
          id_certificate_code?: string | null
          is_platform_admin?: boolean | null
          location?: string | null
          marketing_consent?: boolean | null
          phone?: string | null
          preferred_categories?: string[] | null
          referral_source?: string | null
          skills?: string[] | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string | null
          volunteer_availability?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          hours_goal?: number | null
          guardian_name?: string | null
          guardian_email?: string | null
          guardian_consent_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          id_verification_status?: string | null
          id_certificate_code?: string | null
          is_platform_admin?: boolean | null
          location?: string | null
          marketing_consent?: boolean | null
          phone?: string | null
          preferred_categories?: string[] | null
          referral_source?: string | null
          skills?: string[] | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string | null
          volunteer_availability?: string[] | null
        }
      }
      id_verification_submissions: {
        Row: {
          attestation_text: string | null
          certificate_code: string | null
          created_at: string | null
          document_path: string
          document_type: string
          id: string
          legal_first_name: string
          legal_last_name: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_attestation: string | null
          selfie_path: string | null
          status: string
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attestation_text?: string | null
          certificate_code?: string | null
          created_at?: string | null
          document_path: string
          document_type: string
          id?: string
          legal_first_name: string
          legal_last_name: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_attestation?: string | null
          selfie_path?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attestation_text?: string | null
          certificate_code?: string | null
          created_at?: string | null
          document_path?: string
          document_type?: string
          id?: string
          legal_first_name?: string
          legal_last_name?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_attestation?: string | null
          selfie_path?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
      }
      coordinator_requests: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          message: string | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          message?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          message?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string | null
        }
      }
      community_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          created_by: string
          is_public: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string | null
          created_by: string
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string | null
          created_by?: string
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          joined_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string
          joined_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string
          joined_at?: string | null
        }
      }
      forum_threads: {
        Row: {
          id: string
          group_id: string | null
          author_id: string
          title: string
          pinned: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          group_id?: string | null
          author_id: string
          title: string
          pinned?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string | null
          author_id?: string
          title?: string
          pinned?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      forum_posts: {
        Row: {
          id: string
          thread_id: string
          author_id: string
          body: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          thread_id: string
          author_id: string
          body: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          thread_id?: string
          author_id?: string
          body?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      shared_posts: {
        Row: {
          id: string
          group_id: string | null
          author_id: string
          body: string
          share_url: string | null
          post_type: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          group_id?: string | null
          author_id: string
          body: string
          share_url?: string | null
          post_type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string | null
          author_id?: string
          body?: string
          share_url?: string | null
          post_type?: string | null
          created_at?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          is_group: boolean | null
          title: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          is_group?: boolean | null
          title?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          is_group?: boolean | null
          title?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      conversation_members: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          last_read_at: string | null
          joined_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          last_read_at?: string | null
          joined_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          last_read_at?: string | null
          joined_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          body: string
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          body?: string
          created_at?: string | null
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_key: string
          earned_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          badge_key: string
          earned_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          badge_key?: string
          earned_at?: string | null
        }
      }
      skill_competency_results: {
        Row: {
          id: string
          user_id: string
          skill_key: string
          score_percent: number
          passed: boolean
          passed_at: string | null
          attempt_count: number
          best_score: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          skill_key: string
          score_percent: number
          passed?: boolean
          passed_at?: string | null
          attempt_count?: number
          best_score?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          skill_key?: string
          score_percent?: number
          passed?: boolean
          passed_at?: string | null
          attempt_count?: number
          best_score?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      skill_competency_attempts: {
        Row: {
          id: string
          user_id: string
          skill_key: string
          score_percent: number
          passed: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          skill_key: string
          score_percent: number
          passed: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          skill_key?: string
          score_percent?: number
          passed?: boolean
          created_at?: string | null
        }
      }
      org_api_keys: {
        Row: {
          id: string
          organization_id: string
          name: string
          key_hash: string
          key_prefix: string
          created_by: string | null
          created_at: string | null
          last_used_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          key_hash: string
          key_prefix: string
          created_by?: string | null
          created_at?: string | null
          last_used_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          key_hash?: string
          key_prefix?: string
          created_by?: string | null
          created_at?: string | null
          last_used_at?: string | null
        }
      }
      org_webhooks: {
        Row: {
          id: string
          organization_id: string
          url: string
          events: string[]
          secret: string
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          url: string
          events?: string[]
          secret: string
          active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          url?: string
          events?: string[]
          secret?: string
          active?: boolean | null
          created_at?: string | null
        }
      }
      transfer_requests: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          amount_cents: number
          currency: string
          note: string | null
          status: string
          created_at: string | null
          responded_at: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          amount_cents: number
          currency?: string
          note?: string | null
          status?: string
          created_at?: string | null
          responded_at?: string | null
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          amount_cents?: number
          currency?: string
          note?: string | null
          status?: string
          created_at?: string | null
          responded_at?: string | null
        }
      }
      security_audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
      }
      volunteer_hours: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          hours: number
          id: string
          opportunity_id: string | null
          supervisor_email: string | null
          supervisor_name: string | null
          supervisor_notes: string | null
          supervisor_title: string | null
          user_id: string | null
          verification_code: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          hours: number
          id?: string
          opportunity_id?: string | null
          supervisor_email?: string | null
          supervisor_name?: string | null
          supervisor_notes?: string | null
          supervisor_title?: string | null
          user_id?: string | null
          verification_code?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          hours?: number
          id?: string
          opportunity_id?: string | null
          supervisor_email?: string | null
          supervisor_name?: string | null
          supervisor_notes?: string | null
          supervisor_title?: string | null
          user_id?: string | null
          verification_code?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
      }
      volunteer_reviews: {
        Row: {
          application_id: string | null
          created_at: string | null
          id: string
          opportunity_id: string
          organization_id: string
          rating: number
          review_text: string
          reviewer_id: string
          updated_at: string | null
          volunteer_hours_id: string | null
          volunteer_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          id?: string
          opportunity_id: string
          organization_id: string
          rating: number
          review_text: string
          reviewer_id: string
          updated_at?: string | null
          volunteer_hours_id?: string | null
          volunteer_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          id?: string
          opportunity_id?: string
          organization_id?: string
          rating?: number
          review_text?: string
          reviewer_id?: string
          updated_at?: string | null
          volunteer_hours_id?: string | null
          volunteer_id?: string
        }
      }
    }
  }
}
