export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          created_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: "owner" | "treasurer" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: "owner" | "treasurer" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: "owner" | "treasurer" | "member";
          created_at?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          team_id: string;
          created_by: string;
          title: string;
          description: string | null;
          amount: number;
          deadline: string | null;
          slug: string;
          status: "active" | "closed" | "draft";
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          amount: number;
          deadline?: string | null;
          slug: string;
          status?: "active" | "closed" | "draft";
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          amount?: number;
          deadline?: string | null;
          slug?: string;
          status?: "active" | "closed" | "draft";
          created_at?: string;
        };
      };
      collection_members: {
        Row: {
          id: string;
          collection_id: string;
          name: string;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          name: string;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          name?: string;
          email?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          collection_id: string;
          collection_member_id: string | null;
          payer_name: string;
          payer_email: string | null;
          amount: number;
          status: "pending" | "paid" | "failed";
          payment_method: "card" | "swish" | "manual";
          stripe_payment_intent_id: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          collection_member_id?: string | null;
          payer_name: string;
          payer_email?: string | null;
          amount: number;
          status?: "pending" | "paid" | "failed";
          payment_method?: "card" | "swish" | "manual";
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          collection_member_id?: string | null;
          payer_name?: string;
          payer_email?: string | null;
          amount?: number;
          status?: "pending" | "paid" | "failed";
          payment_method?: "card" | "swish" | "manual";
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
