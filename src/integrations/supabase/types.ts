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
      class_attendance: {
        Row: {
          class_date: string
          class_id: string
          confirmed_at: string
          confirmed_by: string
          enrollment_id: string
          id: string
          student_user_id: string
        }
        Insert: {
          class_date?: string
          class_id: string
          confirmed_at?: string
          confirmed_by: string
          enrollment_id: string
          id?: string
          student_user_id: string
        }
        Update: {
          class_date?: string
          class_id?: string
          confirmed_at?: string
          confirmed_by?: string
          enrollment_id?: string
          id?: string
          student_user_id?: string
        }
        Relationships: []
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          user_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          user_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          day_of_week: string
          id: string
          max_capacity: number | null
          time_slot: string
          title: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          day_of_week: string
          id?: string
          max_capacity?: number | null
          time_slot: string
          title?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          day_of_week?: string
          id?: string
          max_capacity?: number | null
          time_slot?: string
          title?: string | null
        }
        Relationships: []
      }
      collection_points: {
        Row: {
          address: string
          created_at: string
          id: string
          maps_url: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          maps_url?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          maps_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          donor_email: string | null
          donor_name: string | null
          id: string
          pix_key: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          pix_key?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          pix_key?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          id: string
          max_capacity: number | null
          time_slot: string | null
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          id?: string
          max_capacity?: number | null
          time_slot?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          id?: string
          max_capacity?: number | null
          time_slot?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          content: string
          cover_image: string | null
          created_at: string
          created_by: string | null
          id: string
          link_label: string | null
          link_url: string | null
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link_label?: string | null
          link_url?: string | null
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link_label?: string | null
          link_url?: string | null
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      parent_child_links: {
        Row: {
          child_user_id: string
          created_at: string
          id: string
          parent_user_id: string
          relationship: string
          status: string
        }
        Insert: {
          child_user_id: string
          created_at?: string
          id?: string
          parent_user_id: string
          relationship?: string
          status?: string
        }
        Update: {
          child_user_id?: string
          created_at?: string
          id?: string
          parent_user_id?: string
          relationship?: string
          status?: string
        }
        Relationships: []
      }
      pix_stats: {
        Row: {
          current_amount: number
          donor_count: number
          id: string
          month_goal: number
          month_label: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          current_amount?: number
          donor_count?: number
          id?: string
          month_goal?: number
          month_label?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          current_amount?: number
          donor_count?: number
          id?: string
          month_goal?: number
          month_label?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content_key: string
          id: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          content_key: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          content_key?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      sponsorship_children: {
        Row: {
          amount: number
          cause: string
          created_at: string
          description: string | null
          id: string
          name: string
          payment_link: string
          sponsored_at: string | null
          sponsored_by: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          cause: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          payment_link: string
          sponsored_at?: string | null
          sponsored_by?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          cause?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          payment_link?: string
          sponsored_at?: string | null
          sponsored_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sponsorship_sponsors: {
        Row: {
          child_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_sponsors_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_children"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_registrations: {
        Row: {
          address: string
          age: number
          birth_date: string
          created_at: string
          due_day: number
          guardian_authorized: boolean
          guardian_document: string | null
          guardian_name: string | null
          id: string
          is_minor: boolean
          monthly_amount: number | null
          payment_status: string
          phone: string
          start_date: string
          subscriber_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          age: number
          birth_date: string
          created_at?: string
          due_day: number
          guardian_authorized?: boolean
          guardian_document?: string | null
          guardian_name?: string | null
          id?: string
          is_minor?: boolean
          monthly_amount?: number | null
          payment_status?: string
          phone: string
          start_date?: string
          subscriber_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          age?: number
          birth_date?: string
          created_at?: string
          due_day?: number
          guardian_authorized?: boolean
          guardian_document?: string | null
          guardian_name?: string | null
          id?: string
          is_minor?: boolean
          monthly_amount?: number | null
          payment_status?: string
          phone?: string
          start_date?: string
          subscriber_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_enroll_classes: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_enroll_classes?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_enroll_classes?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_actions: {
        Row: {
          action_date: string
          created_at: string
          created_by: string | null
          description: string | null
          entry_fee: number
          id: string
          image_url: string | null
          location: string | null
          pix_key: string
          title: string
          updated_at: string
        }
        Insert: {
          action_date: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_fee?: number
          id?: string
          image_url?: string | null
          location?: string | null
          pix_key: string
          title: string
          updated_at?: string
        }
        Update: {
          action_date?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_fee?: number
          id?: string
          image_url?: string | null
          location?: string | null
          pix_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      volunteer_registrations: {
        Row: {
          action_id: string
          amount_paid: number
          created_at: string
          full_name: string
          id: string
          payment_status: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_id: string
          amount_paid?: number
          created_at?: string
          full_name: string
          id?: string
          payment_status?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_id?: string
          amount_paid?: number
          created_at?: string
          full_name?: string
          id?: string
          payment_status?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_registrations_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "volunteer_actions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_enroll_classes: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
