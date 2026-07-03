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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      collections: {
        Row: {
          id: string;
          team_id: string;
          created_by: string;
          title: string;
          description: string | null;
          payment_instructions: string | null;
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
          payment_instructions?: string | null;
          amount: number;
          deadline?: string | null;
          slug?: string;
          status?: "active" | "closed" | "draft";
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          payment_instructions?: string | null;
          amount?: number;
          deadline?: string | null;
          slug?: string;
          status?: "active" | "closed" | "draft";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collections_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collections_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      collection_members: {
        Row: {
          id: string;
          collection_id: string;
          name: string;
          email: string | null;
          status: "pending" | "paid";
          created_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          name: string;
          email?: string | null;
          status?: "pending" | "paid";
          created_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          name?: string;
          email?: string | null;
          status?: "pending" | "paid";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collection_members_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };

      roster_members: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roster_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "payments_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_collection_member_id_fkey";
            columns: ["collection_member_id"];
            isOneToOne: false;
            referencedRelation: "collection_members";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
