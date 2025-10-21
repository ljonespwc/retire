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
 * Province code for tax data
 */
export type ProvinceCode = 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NT' | 'NS' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

/**
 * Government benefit type
 */
export type BenefitType = 'CPP' | 'OAS';

/**
 * Tax credit type
 */
export type CreditType = 'BASIC_PERSONAL_AMOUNT' | 'AGE_AMOUNT';

/**
 * Database schema definition
 */
export interface Database {
  public: {
    Tables: {
      tax_years: {
        Row: {
          year: number;
          is_active: boolean;
          effective_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          year: number;
          is_active?: boolean;
          effective_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          year?: number;
          is_active?: boolean;
          effective_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      federal_tax_brackets: {
        Row: {
          id: string;
          year: number;
          bracket_index: number;
          income_limit: number | null;
          rate: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          year: number;
          bracket_index: number;
          income_limit?: number | null;
          rate: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          year?: number;
          bracket_index?: number;
          income_limit?: number | null;
          rate?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'federal_tax_brackets_year_fkey';
            columns: ['year'];
            isOneToOne: false;
            referencedRelation: 'tax_years';
            referencedColumns: ['year'];
          }
        ];
      };
      provincial_tax_brackets: {
        Row: {
          id: string;
          year: number;
          province_code: ProvinceCode;
          bracket_index: number;
          income_limit: number | null;
          rate: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          year: number;
          province_code: ProvinceCode;
          bracket_index: number;
          income_limit?: number | null;
          rate: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          year?: number;
          province_code?: ProvinceCode;
          bracket_index?: number;
          income_limit?: number | null;
          rate?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'provincial_tax_brackets_year_fkey';
            columns: ['year'];
            isOneToOne: false;
            referencedRelation: 'tax_years';
            referencedColumns: ['year'];
          }
        ];
      };
      government_benefits: {
        Row: {
          id: string;
          year: number;
          benefit_type: BenefitType;
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          year: number;
          benefit_type: BenefitType;
          data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          year?: number;
          benefit_type?: BenefitType;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'government_benefits_year_fkey';
            columns: ['year'];
            isOneToOne: false;
            referencedRelation: 'tax_years';
            referencedColumns: ['year'];
          }
        ];
      };
      rrif_minimums: {
        Row: {
          age: number;
          percentage: number;
          created_at: string;
        };
        Insert: {
          age: number;
          percentage: number;
          created_at?: string;
        };
        Update: {
          age?: number;
          percentage?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      tfsa_limits: {
        Row: {
          year: number;
          annual_limit: number;
          created_at: string;
        };
        Insert: {
          year: number;
          annual_limit: number;
          created_at?: string;
        };
        Update: {
          year?: number;
          annual_limit?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      tax_credits: {
        Row: {
          id: string;
          year: number;
          credit_type: CreditType;
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          year: number;
          credit_type: CreditType;
          data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          year?: number;
          credit_type?: CreditType;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tax_credits_year_fkey';
            columns: ['year'];
            isOneToOne: false;
            referencedRelation: 'tax_years';
            referencedColumns: ['year'];
          }
        ];
      };
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
