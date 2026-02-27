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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          created_at: string
          deadline: string
          description: string | null
          grade: number | null
          id: string
          priority: string
          status: string
          subject_id: string
          subtasks: Json | null
          title: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_type?: string
          created_at?: string
          deadline: string
          description?: string | null
          grade?: number | null
          id?: string
          priority?: string
          status?: string
          subject_id: string
          subtasks?: Json | null
          title: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          deadline?: string
          description?: string | null
          grade?: number | null
          id?: string
          priority?: string
          status?: string
          subject_id?: string
          subtasks?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          present: boolean
          subject_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          present?: boolean
          subject_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          present?: boolean
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          current_semester: number
          id: string
          name: string
          target_attendance: number
          target_grade: number
          updated_at: string
          user_id: string
          weekly_hours: number
        }
        Insert: {
          created_at?: string
          current_semester?: number
          id?: string
          name: string
          target_attendance?: number
          target_grade?: number
          updated_at?: string
          user_id: string
          weekly_hours?: number
        }
        Update: {
          created_at?: string
          current_semester?: number
          id?: string
          name?: string
          target_attendance?: number
          target_grade?: number
          updated_at?: string
          user_id?: string
          weekly_hours?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          current_value: number
          id: string
          subject_id: string | null
          target_value: number
          type: string
          updated_at: string
          user_id: string
          week_start: string | null
        }
        Insert: {
          created_at?: string
          current_value?: number
          id?: string
          subject_id?: string | null
          target_value?: number
          type?: string
          updated_at?: string
          user_id: string
          week_start?: string | null
        }
        Update: {
          created_at?: string
          current_value?: number
          id?: string
          subject_id?: string | null
          target_value?: number
          type?: string
          updated_at?: string
          user_id?: string
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      group_links: {
        Row: {
          created_at: string
          group_id: string
          id: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          title: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_links_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_polls: {
        Row: {
          closed: boolean
          created_at: string
          created_by: string
          group_id: string
          id: string
          options: Json
          question: string
          votes: Json
        }
        Insert: {
          closed?: boolean
          created_at?: string
          created_by: string
          group_id: string
          id?: string
          options?: Json
          question: string
          votes?: Json
        }
        Update: {
          closed?: boolean
          created_at?: string
          created_by?: string
          group_id?: string
          id?: string
          options?: Json
          question?: string
          votes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "group_polls_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean
          created_at: string
          created_by: string
          deadline: string | null
          group_id: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean
          created_at?: string
          created_by: string
          deadline?: string | null
          group_id: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean
          created_at?: string
          created_by?: string
          deadline?: string | null
          group_id?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          description: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          subject_id: string | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
          week_number: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          subject_id?: string | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          week_number?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          category: string
          checklist: Json | null
          color: string | null
          content: string
          created_at: string
          font_size: string | null
          id: string
          pinned: boolean
          sort_order: number | null
          subject_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          checklist?: Json | null
          color?: string | null
          content?: string
          created_at?: string
          font_size?: string | null
          id?: string
          pinned?: boolean
          sort_order?: number | null
          subject_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          checklist?: Json | null
          color?: string | null
          content?: string
          created_at?: string
          font_size?: string | null
          id?: string
          pinned?: boolean
          sort_order?: number | null
          subject_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          description: string | null
          external_reference: string | null
          id: string
          mp_payment_id: string
          payer_email: string | null
          payment_method: string | null
          payment_type: string | null
          status: string
          status_detail: string | null
          transaction_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_reference?: string | null
          id?: string
          mp_payment_id: string
          payer_email?: string | null
          payment_method?: string | null
          payment_type?: string | null
          status?: string
          status_detail?: string | null
          transaction_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_reference?: string | null
          id?: string
          mp_payment_id?: string
          payer_email?: string | null
          payment_method?: string | null
          payment_type?: string | null
          status?: string
          status_detail?: string | null
          transaction_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academic_status: string | null
          avatar_url: string | null
          course: string | null
          created_at: string
          current_semester: number | null
          display_name: string | null
          email: string | null
          id: string
          referral_code: string | null
          referred_by: string | null
          target_attendance: number | null
          target_grade: number | null
          updated_at: string
          user_id: string
          weekly_hours_goal: number | null
        }
        Insert: {
          academic_status?: string | null
          avatar_url?: string | null
          course?: string | null
          created_at?: string
          current_semester?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          target_attendance?: number | null
          target_grade?: number | null
          updated_at?: string
          user_id: string
          weekly_hours_goal?: number | null
        }
        Update: {
          academic_status?: string | null
          avatar_url?: string | null
          course?: string | null
          created_at?: string
          current_semester?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          target_attendance?: number | null
          target_grade?: number | null
          updated_at?: string
          user_id?: string
          weekly_hours_goal?: number | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          reward_granted: boolean
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          reward_granted?: boolean
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_granted?: boolean
          status?: string
        }
        Relationships: []
      }
      study_groups: {
        Row: {
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          leader_id: string
          name: string
          subject_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          leader_id: string
          name: string
          subject_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          leader_id?: string
          name?: string
          subject_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_groups_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          created_at: string
          id: string
          location: string
          name: string
          professor: string
          schedules: Json
          type: string
          updated_at: string
          user_id: string
          workload: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          location?: string
          name: string
          professor?: string
          schedules?: Json
          type?: string
          updated_at?: string
          user_id: string
          workload?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          professor?: string
          schedules?: Json
          type?: string
          updated_at?: string
          user_id?: string
          workload?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          mp_payer_email: string | null
          mp_subscription_id: string | null
          status: string
          trial_end: string
          trial_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_payer_email?: string | null
          mp_subscription_id?: string | null
          status?: string
          trial_end?: string
          trial_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_payer_email?: string | null
          mp_subscription_id?: string | null
          status?: string
          trial_end?: string
          trial_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_referrer_by_code: { Args: { _code: string }; Returns: string }
      find_user_by_email: { Args: { _email: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      process_referral_rewards: {
        Args: { _referrer_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
