/**
 * Database types generated from Supabase schema
 * Matches the structure of the initial_schema migration
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserTier = 'basic' | 'pro' | 'advanced';

/**
 * User preferences stored as JSONB
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: boolean;
  language?: string;
  [key: string]: Json | undefined;
}

/**
 * Database schema definition
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          tier: UserTier;
          created_at: string;
          preferences: UserPreferences;
        };
        Insert: {
          id?: string;
          email: string;
          tier?: UserTier;
          created_at?: string;
          preferences?: UserPreferences;
        };
        Update: {
          id?: string;
          email?: string;
          tier?: UserTier;
          created_at?: string;
          preferences?: UserPreferences;
        };
        Relationships: [];
      };
      scenarios: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          inputs: Json;
          results: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          inputs?: Json;
          results?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          inputs?: Json;
          results?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scenarios_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
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
}

/**
 * Type helpers for working with database tables
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/**
 * Specific table types for easier imports
 */
export type User = Tables<'users'>;
export type UserInsert = TablesInsert<'users'>;
export type UserUpdate = TablesUpdate<'users'>;

export type ScenarioRow = Tables<'scenarios'>;
export type ScenarioRowInsert = TablesInsert<'scenarios'>;
export type ScenarioRowUpdate = TablesUpdate<'scenarios'>;
