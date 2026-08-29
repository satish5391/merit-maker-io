export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      advertisements: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          badge_text: string;
          image_url: string;
          cta_text: string;
          cta_link: string;
          placement: "hero_carousel" | "sidebar_banner" | "inline_card" | "floating_bar";
          is_external: boolean;
          is_active: boolean;
          banner_type: "standard" | "direct_image";
          gradient_theme: "blue_glow" | "purple_magic" | "sunset_amber" | "emerald_pro";
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          badge_text?: string;
          image_url?: string;
          cta_text?: string;
          cta_link?: string;
          placement?: "hero_carousel" | "sidebar_banner" | "inline_card" | "floating_bar";
          is_external?: boolean;
          is_active?: boolean;
          banner_type?: "standard" | "direct_image";
          gradient_theme?: "blue_glow" | "purple_magic" | "sunset_amber" | "emerald_pro";
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          badge_text?: string;
          image_url?: string;
          cta_text?: string;
          cta_link?: string;
          placement?: "hero_carousel" | "sidebar_banner" | "inline_card" | "floating_bar";
          is_external?: boolean;
          is_active?: boolean;
          banner_type?: "standard" | "direct_image";
          gradient_theme?: "blue_glow" | "purple_magic" | "sunset_amber" | "emerald_pro";
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      attempts: {
        Row: {
          accuracy: number;
          answers: Json;
          correct_count: number;
          created_at: string;
          id: string;
          user_id: string | null;
          max_score: number;
          score: number;
          skipped_count: number;
          student_name: string;
          test_id: string;
          time_taken_seconds: number;
          wrong_count: number;
          tab_switches_count: number;
          integrity_status: "clean" | "flagged";
          status: "in_progress" | "completed";
        };
        Insert: {
          accuracy?: number;
          answers?: Json;
          correct_count?: number;
          created_at?: string;
          id?: string;
          max_score?: number;
          score?: number;
          skipped_count?: number;
          student_name?: string;
          test_id: string;
          user_id?: string | null;
          time_taken_seconds?: number;
          wrong_count?: number;
          tab_switches_count?: number;
          integrity_status?: "clean" | "flagged";
          status?: "in_progress" | "completed";
        };
        Update: {
          accuracy?: number;
          answers?: Json;
          correct_count?: number;
          created_at?: string;
          id?: string;
          max_score?: number;
          score?: number;
          skipped_count?: number;
          student_name?: string;
          test_id?: string;
          user_id?: string | null;
          time_taken_seconds?: number;
          wrong_count?: number;
          tab_switches_count?: number;
          integrity_status?: "clean" | "flagged";
          status?: "in_progress" | "completed";
        };
        Relationships: [
          {
            foreignKeyName: "attempts_test_id_fkey";
            columns: ["test_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          body: string;
          correct_index: number;
          created_at: string;
          explanation: string;
          id: string;
          options: Json;
          position: number;
          section_id: string | null;
          test_id: string;
        };
        Insert: {
          body: string;
          correct_index?: number;
          created_at?: string;
          explanation?: string;
          id?: string;
          options?: Json;
          position?: number;
          section_id?: string | null;
          test_id: string;
        };
        Update: {
          body?: string;
          correct_index?: number;
          created_at?: string;
          explanation?: string;
          id?: string;
          options?: Json;
          position?: number;
          section_id?: string | null;
          test_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_test_id_fkey";
            columns: ["test_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id"];
          },
        ];
      };
      tests: {
        Row: {
          category: string;
          created_at: string;
          duration_minutes: number;
          id: string;
          max_attempts: number | null;
          negative_marks: number;
          positive_marks: number;
          subject: string;
          title: string;
          access_type: "free" | "paid" | "package_only";
          is_live: boolean;
          start_time: string | null;
          end_time: string | null;
          result_declaration_time: string | null;
        };
        Insert: {
          category?: string;
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          max_attempts?: number | null;
          negative_marks?: number;
          positive_marks?: number;
          subject?: string;
          title: string;
          access_type?: "free" | "paid" | "package_only";
          is_live?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          result_declaration_time?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          max_attempts?: number | null;
          negative_marks?: number;
          positive_marks?: number;
          subject?: string;
          title?: string;
          access_type?: "free" | "paid" | "package_only";
          is_live?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          result_declaration_time?: string | null;
        };
        Relationships: [];
      };
      user_purchases: {
        Row: {
          id: string;
          user_id: string;
          item_type: string;
          item_id: string;
          payment_id: string | null;
          amount_paid: number | null;
          payment_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_type: string;
          item_id: string;
          payment_id?: string | null;
          amount_paid?: number | null;
          payment_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_type?: string;
          item_id?: string;
          payment_id?: string | null;
          amount_paid?: number | null;
          payment_status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      package_tests: {
        Row: { id: string; package_id: string; test_id: string; created_at: string };
        Insert: { id?: string; package_id: string; test_id: string; created_at?: string };
        Update: { id?: string; package_id?: string; test_id?: string; created_at?: string };
        Relationships: [];
      };
      test_packages: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          price: number | null;
          discount_price: number | null;
          is_combo: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          category?: string;
          price?: number | null;
          discount_price?: number | null;
          is_combo?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          price?: number | null;
          discount_price?: number | null;
          is_combo?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      study_notes: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          file_url: string;
          is_free: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          category?: string;
          file_url: string;
          is_free?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          file_url?: string;
          is_free?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          avatar_url: string;
          has_free_pass: boolean;
          is_banned: boolean;
          free_pass_expires_at: string | null;
          created_at: string;
          joined_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          email?: string;
          phone: string;
          phone: string;
          phone?: string;
          avatar_url?: string;
          has_free_pass?: boolean;
          is_banned?: boolean;
          free_pass_expires_at?: string | null;
          created_at?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          avatar_url?: string;
          has_free_pass?: boolean;
          is_banned?: boolean;
          free_pass_expires_at?: string | null;
          created_at?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      user_notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          action_url: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          action_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          action_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      assigned_offers: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          coupon_code: string | null;
          discount_percent: number | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          coupon_code?: string | null;
          discount_percent?: number | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          coupon_code?: string | null;
          discount_percent?: number | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
