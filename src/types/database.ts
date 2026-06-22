export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          college_id: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          college_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "abuse_reports_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abuse_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abuse_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_invitations: {
        Row: {
          college_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role: string
        }
        Update: {
          college_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_invitations_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alumni_connections: {
        Row: {
          alumni_id: string | null
          created_at: string
          id: string
          requester_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          alumni_id?: string | null
          created_at?: string
          id?: string
          requester_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          alumni_id?: string | null
          created_at?: string
          id?: string
          requester_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alumni_connections_alumni_id_fkey"
            columns: ["alumni_id"]
            isOneToOne: false
            referencedRelation: "alumni_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumni_connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumni_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alumni_profiles: {
        Row: {
          created_at: string
          current_company: string | null
          current_location: string | null
          current_role: string | null
          graduation_year: number | null
          id: string
          is_mentor: boolean | null
          linkedin_url: string | null
          open_to_connect: boolean | null
          stories: string[] | null
        }
        Insert: {
          created_at?: string
          current_company?: string | null
          current_location?: string | null
          current_role?: string | null
          graduation_year?: number | null
          id: string
          is_mentor?: boolean | null
          linkedin_url?: string | null
          open_to_connect?: boolean | null
          stories?: string[] | null
        }
        Update: {
          created_at?: string
          current_company?: string | null
          current_location?: string | null
          current_role?: string | null
          graduation_year?: number | null
          id?: string
          is_mentor?: boolean | null
          linkedin_url?: string | null
          open_to_connect?: boolean | null
          stories?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "alumni_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string | null
          body: string | null
          category: string | null
          college_id: string | null
          created_at: string
          id: string
          is_urgent: boolean | null
          title: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          category?: string | null
          college_id?: string | null
          created_at?: string
          id?: string
          is_urgent?: boolean | null
          title: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          category?: string | null
          college_id?: string | null
          created_at?: string
          id?: string
          is_urgent?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          banner_url: string | null
          category: string
          college_id: string | null
          contact_email: string | null
          created_at: string
          description: string | null
          id: string
          is_official: boolean
          lead_name: string | null
          logo_url: string | null
          member_count: number
          name: string
        }
        Insert: {
          banner_url?: string | null
          category?: string
          college_id?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_official?: boolean
          lead_name?: string | null
          logo_url?: string | null
          member_count?: number
          name: string
        }
        Update: {
          banner_url?: string | null
          category?: string
          college_id?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_official?: boolean
          lead_name?: string | null
          logo_url?: string | null
          member_count?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_submissions: {
        Row: {
          code: string
          college_id: string | null
          id: string
          language: string
          memory_mb: number | null
          problem_id: string
          runtime_ms: number | null
          status: string
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          code: string
          college_id?: string | null
          id?: string
          language: string
          memory_mb?: number | null
          problem_id: string
          runtime_ms?: number | null
          status?: string
          submitted_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          college_id?: string | null
          id?: string
          language?: string
          memory_mb?: number | null
          problem_id?: string
          runtime_ms?: number | null
          status?: string
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coding_submissions_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coding_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          accent_color: string | null
          city: string
          created_at: string
          email_domain: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
        }
        Insert: {
          accent_color?: string | null
          city: string
          created_at?: string
          email_domain: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
        }
        Update: {
          accent_color?: string | null
          city?: string
          created_at?: string
          email_domain?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          post_id: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          post_id?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          banner_url: string | null
          category: string
          college_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_private: boolean
          member_count: number
          name: string
        }
        Insert: {
          banner_url?: string | null
          category?: string
          college_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_private?: boolean
          member_count?: number
          name: string
        }
        Update: {
          banner_url?: string | null
          category?: string
          college_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_private?: boolean
          member_count?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      confessions: {
        Row: {
          _author_id_audit: string | null
          college_id: string | null
          content: string
          created_at: string
          id: string
          is_flagged: boolean
          likes_count: number
        }
        Insert: {
          _author_id_audit?: string | null
          college_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_flagged?: boolean
          likes_count?: number
        }
        Update: {
          _author_id_audit?: string | null
          college_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_flagged?: boolean
          likes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "confessions__author_id_audit_fkey"
            columns: ["_author_id_audit"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confessions_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_registrations: {
        Row: {
          contest_id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          contest_id: string
          registered_at?: string
          user_id: string
        }
        Update: {
          contest_id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_likes: {
        Row: {
          created_at: string
          id: string
          is_super: boolean | null
          liked_id: string | null
          liker_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_super?: boolean | null
          liked_id?: string | null
          liker_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_super?: boolean | null
          liked_id?: string | null
          liker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dating_likes_liked_id_fkey"
            columns: ["liked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_likes_liker_id_fkey"
            columns: ["liker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_matches: {
        Row: {
          id: string
          matched_at: string
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          id?: string
          matched_at?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          id?: string
          matched_at?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dating_matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_profiles: {
        Row: {
          bio: string | null
          created_at: string
          gender: string | null
          id: string
          interests: string[] | null
          is_active: boolean
          looking_for: string | null
          photos: string[] | null
          show_to: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean
          looking_for?: string | null
          photos?: string[] | null
          show_to?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean
          looking_for?: string | null
          photos?: string[] | null
          show_to?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dating_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_swipes: {
        Row: {
          created_at: string
          direction: string | null
          liked: boolean
          swiped_id: string
          swiped_on_id: string | null
          swiper_id: string
        }
        Insert: {
          created_at?: string
          direction?: string | null
          liked: boolean
          swiped_id: string
          swiped_on_id?: string | null
          swiper_id: string
        }
        Update: {
          created_at?: string
          direction?: string | null
          liked?: boolean
          swiped_id?: string
          swiped_on_id?: string | null
          swiper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dating_swipes_swiped_id_fkey"
            columns: ["swiped_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_swipes_swiped_on_id_fkey"
            columns: ["swiped_on_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_verification_requests: {
        Row: {
          branch: string | null
          college_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          id_card_url: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          roll_number: string | null
          status: string
          user_id: string
          year: string | null
        }
        Insert: {
          branch?: string | null
          college_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          id_card_url: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roll_number?: string | null
          status?: string
          user_id: string
          year?: string | null
        }
        Update: {
          branch?: string | null
          college_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          id_card_url?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          roll_number?: string | null
          status?: string
          user_id?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dating_verification_requests_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      election_votes: {
        Row: {
          candidate_id: string
          election_id: string
          voted_at: string
          voter_id: string
        }
        Insert: {
          candidate_id: string
          election_id?: string
          voted_at?: string
          voter_id: string
        }
        Update: {
          candidate_id?: string
          election_id?: string
          voted_at?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "election_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendee_count: number
          banner_url: string | null
          category: string
          club_id: string | null
          college_id: string | null
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          organizer_id: string | null
          registration_link: string | null
          start_time: string
          title: string
          venue: string | null
        }
        Insert: {
          attendee_count?: number
          banner_url?: string | null
          category?: string
          club_id?: string | null
          college_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          organizer_id?: string | null
          registration_link?: string | null
          start_time: string
          title: string
          venue?: string | null
        }
        Update: {
          attendee_count?: number
          banner_url?: string | null
          category?: string
          club_id?: string | null
          college_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          organizer_id?: string | null
          registration_link?: string | null
          start_time?: string
          title?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_papers: {
        Row: {
          college_id: string | null
          course_code: string | null
          created_at: string
          downloads: number
          exam_type: string | null
          exam_year: number | null
          file_url: string
          id: string
          pages: number | null
          semester: string | null
          subject: string
          uploader_id: string | null
        }
        Insert: {
          college_id?: string | null
          course_code?: string | null
          created_at?: string
          downloads?: number
          exam_type?: string | null
          exam_year?: number | null
          file_url: string
          id?: string
          pages?: number | null
          semester?: string | null
          subject: string
          uploader_id?: string | null
        }
        Update: {
          college_id?: string | null
          course_code?: string | null
          created_at?: string
          downloads?: number
          exam_type?: string | null
          exam_year?: number | null
          file_url?: string
          id?: string
          pages?: number | null
          semester?: string | null
          subject?: string
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_papers_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_papers_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_rooms: {
        Row: {
          college_id: string | null
          created_at: string
          hostel_name: string
          id: string
          is_seeking_roommate: boolean
          occupant_id: string | null
          room_number: string | null
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          hostel_name: string
          id?: string
          is_seeking_roommate?: boolean
          occupant_id?: string | null
          room_number?: string | null
        }
        Update: {
          college_id?: string | null
          created_at?: string
          hostel_name?: string
          id?: string
          is_seeking_roommate?: boolean
          occupant_id?: string | null
          room_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostel_rooms_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_rooms_occupant_id_fkey"
            columns: ["occupant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_applications: {
        Row: {
          applied_at: string
          company: string | null
          id: string
          internship_id: string
          notes: string | null
          role: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          applied_at?: string
          company?: string | null
          id?: string
          internship_id: string
          notes?: string | null
          role?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          applied_at?: string
          company?: string | null
          id?: string
          internship_id?: string
          notes?: string | null
          role?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internship_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          apply_link: string | null
          college_id: string | null
          company: string
          created_at: string
          deadline: string | null
          description: string | null
          duration: string | null
          id: string
          location: string | null
          posted_by: string | null
          stipend: string | null
          title: string
          type: string
        }
        Insert: {
          apply_link?: string | null
          college_id?: string | null
          company: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          posted_by?: string | null
          stipend?: string | null
          title: string
          type?: string
        }
        Update: {
          apply_link?: string | null
          college_id?: string | null
          company?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          posted_by?: string | null
          stipend?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "internships_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internships_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found: {
        Row: {
          category: string
          college_id: string | null
          created_at: string
          date_occurred: string | null
          description: string | null
          id: string
          images: string[] | null
          location: string | null
          reporter_id: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          category: string
          college_id?: string | null
          created_at?: string
          date_occurred?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          location?: string | null
          reporter_id?: string | null
          status?: string
          title: string
          type: string
        }
        Update: {
          category?: string
          college_id?: string | null
          created_at?: string
          date_occurred?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          location?: string | null
          reporter_id?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          category: string
          college_id: string | null
          condition: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          price: number
          seller_id: string | null
          status: string
          title: string
        }
        Insert: {
          category: string
          college_id?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          price: number
          seller_id?: string | null
          status?: string
          title: string
        }
        Update: {
          category?: string
          college_id?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          price?: number
          seller_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_items_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          bio: string | null
          college_id: string | null
          company: string | null
          created_at: string
          expertise: string[] | null
          headline: string
          id: string
          is_active: boolean | null
          linkedin_url: string | null
          rating: number | null
          role: string | null
          sessions_count: number | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          college_id?: string | null
          company?: string | null
          created_at?: string
          expertise?: string[] | null
          headline: string
          id?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          rating?: number | null
          role?: string | null
          sessions_count?: number | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          college_id?: string | null
          company?: string | null
          created_at?: string
          expertise?: string[] | null
          headline?: string
          id?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          rating?: number | null
          role?: string | null
          sessions_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentors_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship: {
        Row: {
          areas: string[]
          created_at: string
          description: string | null
          id: string
          is_open: boolean
          mentee_id: string | null
          mentor_id: string | null
          title: string
        }
        Insert: {
          areas?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_open?: boolean
          mentee_id?: string | null
          mentor_id?: string | null
          title: string
        }
        Update: {
          areas?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_open?: boolean
          mentee_id?: string | null
          mentor_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_sessions: {
        Row: {
          created_at: string
          id: string
          mentee_id: string | null
          mentor_id: string | null
          notes: string | null
          scheduled_at: string | null
          status: string | null
          topic: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mentee_id?: string | null
          mentor_id?: string | null
          notes?: string | null
          scheduled_at?: string | null
          status?: string | null
          topic?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mentee_id?: string | null
          mentor_id?: string | null
          notes?: string | null
          scheduled_at?: string | null
          status?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_sessions_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          college_id: string | null
          course_code: string | null
          created_at: string
          description: string | null
          downloads: number
          file_type: string | null
          file_url: string
          id: string
          likes: number
          semester: string | null
          subject: string
          title: string
          uploader_id: string | null
          year: number | null
        }
        Insert: {
          college_id?: string | null
          course_code?: string | null
          created_at?: string
          description?: string | null
          downloads?: number
          file_type?: string | null
          file_url: string
          id?: string
          likes?: number
          semester?: string | null
          subject: string
          title: string
          uploader_id?: string | null
          year?: number | null
        }
        Update: {
          college_id?: string | null
          course_code?: string | null
          created_at?: string
          description?: string | null
          downloads?: number
          file_type?: string | null
          file_url?: string
          id?: string
          likes?: number
          semester?: string | null
          subject?: string
          title?: string
          uploader_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_registrations: {
        Row: {
          company: string | null
          ctc_offered: string | null
          drive_id: string
          id: string
          registered_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          company?: string | null
          ctc_offered?: string | null
          drive_id: string
          id?: string
          registered_at?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          company?: string | null
          ctc_offered?: string | null
          drive_id?: string
          id?: string
          registered_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "placement_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      placements: {
        Row: {
          college_id: string | null
          company: string
          created_at: string
          id: string
          is_verified: boolean
          offer_type: string
          package_lpa: number | null
          role: string
          student_id: string | null
          year: number
        }
        Insert: {
          college_id?: string | null
          company: string
          created_at?: string
          id?: string
          is_verified?: boolean
          offer_type?: string
          package_lpa?: number | null
          role: string
          student_id?: string | null
          year: number
        }
        Update: {
          college_id?: string | null
          company?: string
          created_at?: string
          id?: string
          is_verified?: boolean
          offer_type?: string
          package_lpa?: number | null
          role?: string
          student_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "placements_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_log: {
        Row: {
          action: string
          created_at: string
          id: string
          points: number
          ref_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          points: number
          ref_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          points?: number
          ref_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          option_idx: number
          poll_id: string
          user_id: string
          voted_at: string
        }
        Insert: {
          option_idx: number
          poll_id: string
          user_id: string
          voted_at?: string
        }
        Update: {
          option_idx?: number
          poll_id?: string
          user_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          college_id: string | null
          created_at: string
          creator_id: string | null
          ends_at: string | null
          id: string
          options: Json
          question: string
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          creator_id?: string | null
          ends_at?: string | null
          id?: string
          options?: Json
          question: string
        }
        Update: {
          college_id?: string | null
          created_at?: string
          creator_id?: string | null
          ends_at?: string | null
          id?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          college_id: string | null
          comments_count: number
          community_id: string | null
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          is_flagged: boolean
          likes_count: number
          media_urls: string[] | null
          post_type: string
        }
        Insert: {
          author_id?: string | null
          college_id?: string | null
          comments_count?: number
          community_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_flagged?: boolean
          likes_count?: number
          media_urls?: string[] | null
          post_type?: string
        }
        Update: {
          author_id?: string | null
          college_id?: string | null
          comments_count?: number
          community_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_flagged?: boolean
          likes_count?: number
          media_urls?: string[] | null
          post_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepted_terms_at: string | null
          avatar_url: string | null
          bio: string | null
          branch: string | null
          college_id: string | null
          created_at: string
          email: string
          full_name: string
          hostel: string | null
          id: string
          is_suspended: boolean
          is_verified: boolean
          phone: string | null
          policy_version: string | null
          role: string
          roll_number: string | null
          updated_at: string
          username: string | null
          year: number | null
        }
        Insert: {
          accepted_terms_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          branch?: string | null
          college_id?: string | null
          created_at?: string
          email: string
          full_name?: string
          hostel?: string | null
          id: string
          is_suspended?: boolean
          is_verified?: boolean
          phone?: string | null
          policy_version?: string | null
          role?: string
          roll_number?: string | null
          updated_at?: string
          username?: string | null
          year?: number | null
        }
        Update: {
          accepted_terms_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          branch?: string | null
          college_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          hostel?: string | null
          id?: string
          is_suspended?: boolean
          is_verified?: boolean
          phone?: string | null
          policy_version?: string | null
          role?: string
          roll_number?: string | null
          updated_at?: string
          username?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_log: {
        Row: {
          action: string
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_logs: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_role: string | null
          old_role: string | null
          target_user: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_role?: string | null
          old_role?: string | null
          target_user?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_role?: string | null
          old_role?: string | null
          target_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_audit_logs_target_user_fkey"
            columns: ["target_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          applied_at: string
          description: string | null
          version: string
        }
        Insert: {
          applied_at?: string
          description?: string | null
          version: string
        }
        Update: {
          applied_at?: string
          description?: string | null
          version?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          college_id: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          college_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_pitches: {
        Row: {
          ask: string | null
          college_id: string | null
          created_at: string
          founder_id: string | null
          id: string
          name: string
          problem: string | null
          sector: string | null
          solution: string | null
          stage: string | null
          status: string | null
          traction: string | null
        }
        Insert: {
          ask?: string | null
          college_id?: string | null
          created_at?: string
          founder_id?: string | null
          id?: string
          name: string
          problem?: string | null
          sector?: string | null
          solution?: string | null
          stage?: string | null
          status?: string | null
          traction?: string | null
        }
        Update: {
          ask?: string | null
          college_id?: string | null
          created_at?: string
          founder_id?: string | null
          id?: string
          name?: string
          problem?: string | null
          sector?: string | null
          solution?: string | null
          stage?: string | null
          status?: string | null
          traction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_pitches_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_pitches_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          group_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          college_id: string | null
          created_at: string
          creator_id: string | null
          description: string | null
          id: string
          max_members: number | null
          meeting_time: string | null
          subject: string
          venue: string | null
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          max_members?: number | null
          meeting_time?: string | null
          subject: string
          venue?: string | null
        }
        Update: {
          college_id?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          max_members?: number | null
          meeting_time?: string | null
          subject?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_groups_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          accepted: boolean
          accepted_at: string
          created_at: string | null
          id: string
          ip_address: string | null
          policy_version: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accepted: boolean
          accepted_at?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          policy_version: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accepted?: boolean
          accepted_at?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          policy_version?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_points: {
        Row: {
          college_id: string | null
          last_active: string | null
          level: number
          streak_days: number
          total: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          college_id?: string | null
          last_active?: string | null
          level?: number
          streak_days?: number
          total?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          college_id?: string | null
          last_active?: string | null
          level?: number
          streak_days?: number
          total?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_confession_audit: {
        Row: {
          _author_id_audit: string | null
          author_email: string | null
          author_name: string | null
          college_id: string | null
          content: string | null
          created_at: string | null
          id: string | null
          is_flagged: boolean | null
          likes_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "confessions__author_id_audit_fkey"
            columns: ["_author_id_audit"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confessions_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_rate_limit: {
        Args: { p_action: string; p_limit: number; p_window: string }
        Returns: boolean
      }
      increment_post_likes: { Args: { post_id: string }; Returns: undefined }
      is_active_user: { Args: { p_uid: string }; Returns: boolean }
      is_college_admin: { Args: { p_uid: string }; Returns: boolean }
      is_student: { Args: { p_uid: string }; Returns: boolean }
      is_super_admin: { Args: { p_uid: string }; Returns: boolean }
      my_college_id: { Args: never; Returns: string }
      owner_email: { Args: never; Returns: string }
      post_confession: { Args: { p_content: string }; Returns: string }
      purge_rate_limit_log: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      toggle_post_like: {
        Args: { p_post_id: string; p_user_id: string }
        Returns: Json
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
