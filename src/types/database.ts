
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "app_events": {
                  Row: {
                    "category": string,"created_at": string | null,"event_name": string,"id": string,"metadata": Json | null,"organization_id": string | null,"path": string | null,"resource_id": string | null,"resource_type": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"created_at"?: string | null,"event_name": string,"id"?: string,"metadata"?: Json | null,"organization_id"?: string | null,"path"?: string | null,"resource_id"?: string | null,"resource_type"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "category"?: string,"created_at"?: string | null,"event_name"?: string,"id"?: string,"metadata"?: Json | null,"organization_id"?: string | null,"path"?: string | null,"resource_id"?: string | null,"resource_type"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "app_events_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "app_events_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"applications": {
                  Row: {
                    "availability": string | null,"completed_at": string | null,"cover_letter": string | null,"created_at": string | null,"experience": string | null,"id": string,"no_show": boolean | null,"opportunity_id": string | null,"status": string | null,"supervisor_email": string | null,"supervisor_name": string | null,"supervisor_notes": string | null,"supervisor_title": string | null,"updated_at": string | null,"user_id": string | null,"verification_code": string | null,"verification_expires_at": string | null,"verified_at": string | null,"verified_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "availability"?: string | null,"completed_at"?: string | null,"cover_letter"?: string | null,"created_at"?: string | null,"experience"?: string | null,"id"?: string,"no_show"?: boolean | null,"opportunity_id"?: string | null,"status"?: string | null,"supervisor_email"?: string | null,"supervisor_name"?: string | null,"supervisor_notes"?: string | null,"supervisor_title"?: string | null,"updated_at"?: string | null,"user_id"?: string | null,"verification_code"?: string | null,"verification_expires_at"?: string | null,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Update: {
                    "availability"?: string | null,"completed_at"?: string | null,"cover_letter"?: string | null,"created_at"?: string | null,"experience"?: string | null,"id"?: string,"no_show"?: boolean | null,"opportunity_id"?: string | null,"status"?: string | null,"supervisor_email"?: string | null,"supervisor_name"?: string | null,"supervisor_notes"?: string | null,"supervisor_title"?: string | null,"updated_at"?: string | null,"user_id"?: string | null,"verification_code"?: string | null,"verification_expires_at"?: string | null,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "applications_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    }
                  ]
                },"community_groups": {
                  Row: {
                    "category": string | null,"created_at": string | null,"created_by": string,"description": string | null,"id": string,"is_public": boolean | null,"name": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string | null,"created_at"?: string | null,"created_by": string,"description"?: string | null,"id"?: string,"is_public"?: boolean | null,"name": string,"updated_at"?: string | null
                  }
                  Update: {
                    "category"?: string | null,"created_at"?: string | null,"created_by"?: string,"description"?: string | null,"id"?: string,"is_public"?: boolean | null,"name"?: string,"updated_at"?: string | null
                  }
                  Relationships: [

                  ]
                },"coordinator_requests": {
                  Row: {
                    "created_at": string | null,"id": string,"message": string | null,"organization_id": string,"reviewed_at": string | null,"reviewed_by": string | null,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"message"?: string | null,"organization_id": string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"message"?: string | null,"organization_id"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "coordinator_requests_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"event_checkins": {
                  Row: {
                    "checked_in_at": string,"distance_m": number | null,"id": string,"opportunity_id": string,"outside_window": boolean,"source": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checked_in_at"?: string,"distance_m"?: number | null,"id"?: string,"opportunity_id": string,"outside_window"?: boolean,"source"?: string,"user_id": string
                  }
                  Update: {
                    "checked_in_at"?: string,"distance_m"?: number | null,"id"?: string,"opportunity_id"?: string,"outside_window"?: boolean,"source"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_checkins_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    }
                  ]
                },"group_members": {
                  Row: {
                    "group_id": string,"id": string,"joined_at": string | null,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "group_id": string,"id"?: string,"joined_at"?: string | null,"role"?: string,"user_id": string
                  }
                  Update: {
                    "group_id"?: string,"id"?: string,"joined_at"?: string | null,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_members_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "community_groups"
      referencedColumns: ["id"]
    }
                  ]
                },"id_verification_submissions": {
                  Row: {
                    "attestation_text": string | null,"certificate_code": string | null,"created_at": string | null,"document_path": string,"document_type": string,"id": string,"legal_first_name": string,"legal_last_name": string,"rejection_reason": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"reviewer_attestation": string | null,"selfie_path": string | null,"status": string,"submitted_at": string | null,"updated_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attestation_text"?: string | null,"certificate_code"?: string | null,"created_at"?: string | null,"document_path": string,"document_type": string,"id"?: string,"legal_first_name": string,"legal_last_name": string,"rejection_reason"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"reviewer_attestation"?: string | null,"selfie_path"?: string | null,"status"?: string,"submitted_at"?: string | null,"updated_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "attestation_text"?: string | null,"certificate_code"?: string | null,"created_at"?: string | null,"document_path"?: string,"document_type"?: string,"id"?: string,"legal_first_name"?: string,"legal_last_name"?: string,"rejection_reason"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"reviewer_attestation"?: string | null,"selfie_path"?: string | null,"status"?: string,"submitted_at"?: string | null,"updated_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [

                  ]
                },"opportunities": {
                  Row: {
                    "benefits": string | null,"category": string,"created_at": string | null,"deadline": string | null,"description": string,"end_date": string | null,"facilities": (string)[] | null,"id": string,"image_url": string | null,"latitude": number | null,"location": string | null,"longitude": number | null,"organization_id": string | null,"posted_by": string | null,"remote": boolean | null,"requirements": string | null,"skills_required": (string)[] | null,"start_date": string | null,"status": string | null,"time_commitment": string | null,"title": string,"updated_at": string | null,"volunteers_count": number | null,"volunteers_needed": number | null,"wheelchair_accessible": boolean,"accessible_restroom": boolean,"sensory_friendly": boolean,"substance_free": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "benefits"?: string | null,"category": string,"created_at"?: string | null,"deadline"?: string | null,"description": string,"end_date"?: string | null,"facilities"?: (string)[] | null,"id"?: string,"image_url"?: string | null,"latitude"?: number | null,"location"?: string | null,"longitude"?: number | null,"organization_id"?: string | null,"posted_by"?: string | null,"remote"?: boolean | null,"requirements"?: string | null,"skills_required"?: (string)[] | null,"start_date"?: string | null,"status"?: string | null,"time_commitment"?: string | null,"title": string,"updated_at"?: string | null,"volunteers_count"?: number | null,"volunteers_needed"?: number | null,"wheelchair_accessible"?: boolean,"accessible_restroom"?: boolean,"sensory_friendly"?: boolean,"substance_free"?: boolean
                  }
                  Update: {
                    "benefits"?: string | null,"category"?: string,"created_at"?: string | null,"deadline"?: string | null,"description"?: string,"end_date"?: string | null,"facilities"?: (string)[] | null,"id"?: string,"image_url"?: string | null,"latitude"?: number | null,"location"?: string | null,"longitude"?: number | null,"organization_id"?: string | null,"posted_by"?: string | null,"remote"?: boolean | null,"requirements"?: string | null,"skills_required"?: (string)[] | null,"start_date"?: string | null,"status"?: string | null,"time_commitment"?: string | null,"title"?: string,"updated_at"?: string | null,"volunteers_count"?: number | null,"volunteers_needed"?: number | null,"wheelchair_accessible"?: boolean,"accessible_restroom"?: boolean,"sensory_friendly"?: boolean,"substance_free"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunities_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"org_api_keys": {
                  Row: {
                    "created_at": string | null,"created_by": string | null,"id": string,"key_hash": string,"key_prefix": string,"last_used_at": string | null,"name": string,"organization_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"created_by"?: string | null,"id"?: string,"key_hash": string,"key_prefix": string,"last_used_at"?: string | null,"name": string,"organization_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"created_by"?: string | null,"id"?: string,"key_hash"?: string,"key_prefix"?: string,"last_used_at"?: string | null,"name"?: string,"organization_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "org_api_keys_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"org_webhooks": {
                  Row: {
                    "active": boolean | null,"created_at": string | null,"events": (string)[],"id": string,"organization_id": string,"secret": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean | null,"created_at"?: string | null,"events"?: (string)[],"id"?: string,"organization_id": string,"secret": string,"url": string
                  }
                  Update: {
                    "active"?: boolean | null,"created_at"?: string | null,"events"?: (string)[],"id"?: string,"organization_id"?: string,"secret"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "org_webhooks_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"organization_members": {
                  Row: {
                    "created_at": string | null,"id": string,"organization_id": string,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"organization_id": string,"role"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"organization_id"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organization_members_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "address": string | null,"billing_email": string | null,"created_at": string | null,"created_by": string | null,"description": string | null,"email": string | null,"hour_valuation_usd": number | null,"id": string,"location": string | null,"logo_url": string | null,"name": string,"phone": string | null,"plan_tier": string | null,"updated_at": string | null,"verified": boolean | null,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"billing_email"?: string | null,"created_at"?: string | null,"created_by"?: string | null,"description"?: string | null,"email"?: string | null,"hour_valuation_usd"?: number | null,"id"?: string,"location"?: string | null,"logo_url"?: string | null,"name": string,"phone"?: string | null,"plan_tier"?: string | null,"updated_at"?: string | null,"verified"?: boolean | null,"website"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"billing_email"?: string | null,"created_at"?: string | null,"created_by"?: string | null,"description"?: string | null,"email"?: string | null,"hour_valuation_usd"?: number | null,"id"?: string,"location"?: string | null,"logo_url"?: string | null,"name"?: string,"phone"?: string | null,"plan_tier"?: string | null,"updated_at"?: string | null,"verified"?: boolean | null,"website"?: string | null
                  }
                  Relationships: [

                  ]
                },"pilot_requests": {
                  Row: {
                    "contact_name": string,"created_at": string,"email": string,"id": string,"message": string | null,"organization_name": string,"role": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_name": string,"created_at"?: string,"email": string,"id"?: string,"message"?: string | null,"organization_name": string,"role"?: string | null
                  }
                  Update: {
                    "contact_name"?: string,"created_at"?: string,"email"?: string,"id"?: string,"message"?: string | null,"organization_name"?: string,"role"?: string | null
                  }
                  Relationships: [

                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"bio": string | null,"created_at": string | null,"date_of_birth": string | null,"email": string | null,"full_name": string | null,"guardian_consent_at": string | null,"guardian_email": string | null,"guardian_name": string | null,"hours_goal": number | null,"id": string,"id_certificate_code": string | null,"id_verification_status": string | null,"is_platform_admin": boolean | null,"location": string | null,"marketing_consent": boolean | null,"phone": string | null,"preferred_categories": (string)[] | null,"referral_source": string | null,"skills": (string)[] | null,"terms_accepted_at": string | null,"terms_version": string | null,"updated_at": string | null,"volunteer_availability": (string)[] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string | null,"date_of_birth"?: string | null,"email"?: string | null,"full_name"?: string | null,"guardian_consent_at"?: string | null,"guardian_email"?: string | null,"guardian_name"?: string | null,"hours_goal"?: number | null,"id": string,"id_certificate_code"?: string | null,"id_verification_status"?: string | null,"is_platform_admin"?: boolean | null,"location"?: string | null,"marketing_consent"?: boolean | null,"phone"?: string | null,"preferred_categories"?: (string)[] | null,"referral_source"?: string | null,"skills"?: (string)[] | null,"terms_accepted_at"?: string | null,"terms_version"?: string | null,"updated_at"?: string | null,"volunteer_availability"?: (string)[] | null
                  }
                  Update: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string | null,"date_of_birth"?: string | null,"email"?: string | null,"full_name"?: string | null,"guardian_consent_at"?: string | null,"guardian_email"?: string | null,"guardian_name"?: string | null,"hours_goal"?: number | null,"id"?: string,"id_certificate_code"?: string | null,"id_verification_status"?: string | null,"is_platform_admin"?: boolean | null,"location"?: string | null,"marketing_consent"?: boolean | null,"phone"?: string | null,"preferred_categories"?: (string)[] | null,"referral_source"?: string | null,"skills"?: (string)[] | null,"terms_accepted_at"?: string | null,"terms_version"?: string | null,"updated_at"?: string | null,"volunteer_availability"?: (string)[] | null
                  }
                  Relationships: [

                  ]
                },"security_audit_log": {
                  Row: {
                    "action": string,"created_at": string | null,"id": string,"metadata": Json | null,"resource_id": string | null,"resource_type": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"created_at"?: string | null,"id"?: string,"metadata"?: Json | null,"resource_id"?: string | null,"resource_type"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"created_at"?: string | null,"id"?: string,"metadata"?: Json | null,"resource_id"?: string | null,"resource_type"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [

                  ]
                },"shared_posts": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string | null,"group_id": string | null,"id": string,"post_type": string | null,"share_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string | null,"group_id"?: string | null,"id"?: string,"post_type"?: string | null,"share_url"?: string | null
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string | null,"group_id"?: string | null,"id"?: string,"post_type"?: string | null,"share_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "shared_posts_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "community_groups"
      referencedColumns: ["id"]
    }
                  ]
                },"skill_competency_attempts": {
                  Row: {
                    "created_at": string | null,"id": string,"passed": boolean,"score_percent": number,"skill_key": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"passed": boolean,"score_percent": number,"skill_key": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"passed"?: boolean,"score_percent"?: number,"skill_key"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "skill_competency_attempts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"skill_competency_results": {
                  Row: {
                    "attempt_count": number,"best_score": number,"created_at": string | null,"id": string,"passed": boolean,"passed_at": string | null,"score_percent": number,"skill_key": string,"updated_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attempt_count"?: number,"best_score"?: number,"created_at"?: string | null,"id"?: string,"passed"?: boolean,"passed_at"?: string | null,"score_percent": number,"skill_key": string,"updated_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "attempt_count"?: number,"best_score"?: number,"created_at"?: string | null,"id"?: string,"passed"?: boolean,"passed_at"?: string | null,"score_percent"?: number,"skill_key"?: string,"updated_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "skill_competency_results_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"transfer_requests": {
                  Row: {
                    "amount_cents": number,"created_at": string | null,"currency": string,"id": string,"note": string | null,"recipient_id": string,"responded_at": string | null,"sender_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"created_at"?: string | null,"currency"?: string,"id"?: string,"note"?: string | null,"recipient_id": string,"responded_at"?: string | null,"sender_id": string,"status"?: string
                  }
                  Update: {
                    "amount_cents"?: number,"created_at"?: string | null,"currency"?: string,"id"?: string,"note"?: string | null,"recipient_id"?: string,"responded_at"?: string | null,"sender_id"?: string,"status"?: string
                  }
                  Relationships: [

                  ]
                },"user_badges": {
                  Row: {
                    "badge_key": string,"earned_at": string | null,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "badge_key": string,"earned_at"?: string | null,"id"?: string,"user_id": string
                  }
                  Update: {
                    "badge_key"?: string,"earned_at"?: string | null,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_badges_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"volunteer_hours": {
                  Row: {
                    "created_at": string | null,"date": string,"description": string | null,"hours": number,"id": string,"opportunity_id": string | null,"supervisor_email": string | null,"supervisor_name": string | null,"supervisor_notes": string | null,"supervisor_title": string | null,"user_id": string | null,"verification_code": string | null,"verification_expires_at": string | null,"verified": boolean | null,"verified_at": string | null,"verified_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"date": string,"description"?: string | null,"hours": number,"id"?: string,"opportunity_id"?: string | null,"supervisor_email"?: string | null,"supervisor_name"?: string | null,"supervisor_notes"?: string | null,"supervisor_title"?: string | null,"user_id"?: string | null,"verification_code"?: string | null,"verification_expires_at"?: string | null,"verified"?: boolean | null,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"date"?: string,"description"?: string | null,"hours"?: number,"id"?: string,"opportunity_id"?: string | null,"supervisor_email"?: string | null,"supervisor_name"?: string | null,"supervisor_notes"?: string | null,"supervisor_title"?: string | null,"user_id"?: string | null,"verification_code"?: string | null,"verification_expires_at"?: string | null,"verified"?: boolean | null,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "volunteer_hours_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    }
                  ]
                },"verification_requests": {
                  Row: {
                    "created_at": string | null,"id": string,"message": string | null,"organization_id": string,"requested_by": string,"reviewed_at": string | null,"reviewed_by": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"message"?: string | null,"organization_id": string,"requested_by": string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"message"?: string | null,"organization_id"?: string,"requested_by"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "verification_requests_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "verification_requests_requested_by_fkey"
      columns: ["requested_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "verification_requests_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"volunteer_reviews": {
                  Row: {
                    "application_id": string | null,"created_at": string | null,"id": string,"opportunity_id": string,"organization_id": string,"rating": number,"review_text": string,"reviewer_id": string,"updated_at": string | null,"volunteer_hours_id": string | null,"volunteer_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id"?: string | null,"created_at"?: string | null,"id"?: string,"opportunity_id": string,"organization_id": string,"rating": number,"review_text": string,"reviewer_id": string,"updated_at"?: string | null,"volunteer_hours_id"?: string | null,"volunteer_id": string
                  }
                  Update: {
                    "application_id"?: string | null,"created_at"?: string | null,"id"?: string,"opportunity_id"?: string,"organization_id"?: string,"rating"?: number,"review_text"?: string,"reviewer_id"?: string,"updated_at"?: string | null,"volunteer_hours_id"?: string | null,"volunteer_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "volunteer_reviews_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "volunteer_reviews_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "volunteer_reviews_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "volunteer_reviews_volunteer_hours_id_fkey"
      columns: ["volunteer_hours_id"]
isOneToOne: false
      referencedRelation: "volunteer_hours"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "can_claim_new_org":
{ Args: { "org_id": string }; Returns: boolean
                           },
"check_in_event":
{ Args: { "p_lat"?: number,"p_lon"?: number,"p_opportunity_id": string }; Returns: Json
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"haversine_m":
{ Args: { "lat1": number,"lat2": number,"lon1": number,"lon2": number }; Returns: number
                           },
"impact_summary":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"is_opportunity_manager":
{ Args: { "opp_id": string }; Returns: boolean
                           },
"is_org_manager":
{ Args: { "org_id": string }; Returns: boolean
                           },
"is_platform_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"reset_demo":
{ Args: { "p_student_email": string }; Returns: Json
                           },
"join_opportunity":
{ Args: { "p_opportunity_id": string }; Returns: Json
                           },
"leave_opportunity":
{ Args: { "p_opportunity_id": string }; Returns: Json
                           },
"my_profile":
{ Args: Record<PropertyKey, never>; Returns: {
              "avatar_url": string | null,
"bio": string | null,
"created_at": string | null,
"date_of_birth": string | null,
"email": string | null,
"full_name": string | null,
"guardian_consent_at": string | null,
"guardian_email": string | null,
"guardian_name": string | null,
"hours_goal": number | null,
"id": string,
"id_certificate_code": string | null,
"id_verification_status": string | null,
"is_platform_admin": boolean | null,
"location": string | null,
"marketing_consent": boolean | null,
"phone": string | null,
"preferred_categories": (string)[] | null,
"referral_source": string | null,
"skills": (string)[] | null,
"terms_accepted_at": string | null,
"terms_version": string | null,
"updated_at": string | null,
"volunteer_availability": (string)[] | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: false
        isSetofReturn: true
      } },
"record_checkin_location":
{ Args: { "p_lat": number,"p_lon": number,"p_opportunity_id": string }; Returns: Json
                           },
"verify_code":
{ Args: { "p_code": string }; Returns: Json
                           },
"verify_codes":
{ Args: { "p_codes": string[] }; Returns: Json[]
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {

          }
        }
} as const
