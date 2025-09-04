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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          asset_type: string
          contribution_monthly_cents: number | null
          created_at: string | null
          current_value_cents: number
          growth_rate_pa: number | null
          id: string
          name: string
          scenario_id: string
          updated_at: string | null
        }
        Insert: {
          asset_type: string
          contribution_monthly_cents?: number | null
          created_at?: string | null
          current_value_cents?: number
          growth_rate_pa?: number | null
          id?: string
          name: string
          scenario_id: string
          updated_at?: string | null
        }
        Update: {
          asset_type?: string
          contribution_monthly_cents?: number | null
          created_at?: string | null
          current_value_cents?: number
          growth_rate_pa?: number | null
          id?: string
          name?: string
          scenario_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      loans: {
        Row: {
          allow_redraw: boolean | null
          created_at: string
          id: string
          io_years: number | null
          offset_contrib_monthly_cents: number | null
          offset_start_cents: number | null
          property_id: string
          rate_pa: number
          start_balance_cents: number
          start_date: string
          term_years: number | null
          updated_at: string
        }
        Insert: {
          allow_redraw?: boolean | null
          created_at?: string
          id?: string
          io_years?: number | null
          offset_contrib_monthly_cents?: number | null
          offset_start_cents?: number | null
          property_id: string
          rate_pa: number
          start_balance_cents: number
          start_date: string
          term_years?: number | null
          updated_at?: string
        }
        Update: {
          allow_redraw?: boolean | null
          created_at?: string
          id?: string
          io_years?: number | null
          offset_contrib_monthly_cents?: number | null
          offset_start_cents?: number | null
          property_id?: string
          rate_pa?: number
          start_balance_cents?: number
          start_date?: string
          term_years?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          id: string
          is_primary: boolean | null
          name: string
          salary_current_cents: number | null
          salary_growth_pa: number | null
          scenario_id: string
          super_current_cents: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          salary_current_cents?: number | null
          salary_growth_pa?: number | null
          scenario_id: string
          super_current_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          salary_current_cents?: number | null
          salary_growth_pa?: number | null
          scenario_id?: string
          super_current_cents?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      plan_events: {
        Row: {
          amount_cents: number | null
          created_at: string
          event_date: string
          id: string
          kind: string
          meta_json: Json | null
          scenario_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          event_date: string
          id?: string
          kind: string
          meta_json?: Json | null
          scenario_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          event_date?: string
          id?: string
          kind?: string
          meta_json?: Json | null
          scenario_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_events_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          becomes_ip_on: string | null
          becomes_ppor_on: string | null
          costs_fixed_pa_cents: number | null
          created_at: string
          depreciation_capital_pa_cents: number | null
          depreciation_plant_pa_cents: number | null
          id: string
          insurance_pa_cents: number | null
          land_tax_pa_cents: number | null
          maintenance_pct_of_value: number | null
          name: string
          purchase_date: string
          purchase_price_cents: number
          rates_pa_cents: number | null
          rent_pw_cents: number | null
          sold_on: string | null
          strata_pa_cents: number | null
          updated_at: string
          user_id: string
          vacancy_weeks_pa: number | null
          value_growth_pa: number | null
          value_now_cents: number
        }
        Insert: {
          becomes_ip_on?: string | null
          becomes_ppor_on?: string | null
          costs_fixed_pa_cents?: number | null
          created_at?: string
          depreciation_capital_pa_cents?: number | null
          depreciation_plant_pa_cents?: number | null
          id?: string
          insurance_pa_cents?: number | null
          land_tax_pa_cents?: number | null
          maintenance_pct_of_value?: number | null
          name: string
          purchase_date: string
          purchase_price_cents: number
          rates_pa_cents?: number | null
          rent_pw_cents?: number | null
          sold_on?: string | null
          strata_pa_cents?: number | null
          updated_at?: string
          user_id: string
          vacancy_weeks_pa?: number | null
          value_growth_pa?: number | null
          value_now_cents: number
        }
        Update: {
          becomes_ip_on?: string | null
          becomes_ppor_on?: string | null
          costs_fixed_pa_cents?: number | null
          created_at?: string
          depreciation_capital_pa_cents?: number | null
          depreciation_plant_pa_cents?: number | null
          id?: string
          insurance_pa_cents?: number | null
          land_tax_pa_cents?: number | null
          maintenance_pct_of_value?: number | null
          name?: string
          purchase_date?: string
          purchase_price_cents?: number
          rates_pa_cents?: number | null
          rent_pw_cents?: number | null
          sold_on?: string | null
          strata_pa_cents?: number | null
          updated_at?: string
          user_id?: string
          vacancy_weeks_pa?: number | null
          value_growth_pa?: number | null
          value_now_cents?: number
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          created_at: string
          horizon_years: number | null
          id: string
          name: string
          notes: string | null
          start_date: string
          stress_borrow_cap_down_pct: number | null
          stress_growth_haircut_pct: number | null
          stress_rate_bump_pct: number | null
          stress_vacancy_weeks: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          horizon_years?: number | null
          id?: string
          name: string
          notes?: string | null
          start_date: string
          stress_borrow_cap_down_pct?: number | null
          stress_growth_haircut_pct?: number | null
          stress_rate_bump_pct?: number | null
          stress_vacancy_weeks?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          horizon_years?: number | null
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          stress_borrow_cap_down_pct?: number | null
          stress_growth_haircut_pct?: number | null
          stress_rate_bump_pct?: number | null
          stress_vacancy_weeks?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          id: string
          inflation_cpi_pa: number | null
          living_expenses_pa_cents: number | null
          medicare_levy_pct: number | null
          name: string
          other_investments_cents: number | null
          retirement_age: number | null
          return_portfolio_pa: number | null
          return_super_pa: number | null
          salary_current_cents: number | null
          salary_growth_pa: number | null
          savings_current_cents: number | null
          state_code: string | null
          super_current_cents: number | null
          tax_marginal_rate: number | null
          updated_at: string
          user_id: string
          wage_growth_pa: number | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          id?: string
          inflation_cpi_pa?: number | null
          living_expenses_pa_cents?: number | null
          medicare_levy_pct?: number | null
          name: string
          other_investments_cents?: number | null
          retirement_age?: number | null
          return_portfolio_pa?: number | null
          return_super_pa?: number | null
          salary_current_cents?: number | null
          salary_growth_pa?: number | null
          savings_current_cents?: number | null
          state_code?: string | null
          super_current_cents?: number | null
          tax_marginal_rate?: number | null
          updated_at?: string
          user_id: string
          wage_growth_pa?: number | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          id?: string
          inflation_cpi_pa?: number | null
          living_expenses_pa_cents?: number | null
          medicare_levy_pct?: number | null
          name?: string
          other_investments_cents?: number | null
          retirement_age?: number | null
          return_portfolio_pa?: number | null
          return_super_pa?: number | null
          salary_current_cents?: number | null
          salary_growth_pa?: number | null
          savings_current_cents?: number | null
          state_code?: string | null
          super_current_cents?: number | null
          tax_marginal_rate?: number | null
          updated_at?: string
          user_id?: string
          wage_growth_pa?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
