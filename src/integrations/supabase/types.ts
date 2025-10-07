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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_verifications: {
        Row: {
          created_at: string
          method: string | null
          user_id: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          method?: string | null
          user_id: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          method?: string | null
          user_id?: string
          verified_by?: string | null
        }
        Relationships: []
      }
      cases: {
        Row: {
          client_id: string | null
          created_at: string | null
          descripcion: string | null
          estado: string | null
          etapa_procesal: string | null
          id: string
          juzgado: string | null
          materia: string
          numero_expediente: string
          responsable: string | null
          titulo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          etapa_procesal?: string | null
          id?: string
          juzgado?: string | null
          materia: string
          numero_expediente: string
          responsable?: string | null
          titulo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          etapa_procesal?: string | null
          id?: string
          juzgado?: string | null
          materia?: string
          numero_expediente?: string
          responsable?: string | null
          titulo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_credits: {
        Row: {
          client_id: string | null
          concepto: string
          created_at: string | null
          fecha: string
          id: string
          interes: number | null
          monto: number
          notas: string | null
          referencia: string | null
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          concepto: string
          created_at?: string | null
          fecha?: string
          id?: string
          interes?: number | null
          monto: number
          notas?: string | null
          referencia?: string | null
          tipo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          concepto?: string
          created_at?: string | null
          fecha?: string
          id?: string
          interes?: number | null
          monto?: number
          notas?: string | null
          referencia?: string | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_credits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invitations: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          token: string
          token_hash: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          token: string
          token_hash?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          token?: string
          token_hash?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_invitations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          accepted_terms: boolean | null
          auth_user_id: string | null
          cedula_rnc_encrypted: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          id: string
          invitation_token: string | null
          invited_at: string | null
          nombre_completo: string
          telefono: string | null
          terms_accepted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_terms?: boolean | null
          auth_user_id?: string | null
          cedula_rnc_encrypted?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          invitation_token?: string | null
          invited_at?: string | null
          nombre_completo: string
          telefono?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_terms?: boolean | null
          auth_user_id?: string | null
          cedula_rnc_encrypted?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          invitation_token?: string | null
          invited_at?: string | null
          nombre_completo?: string
          telefono?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_access_audit: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deadlines: {
        Row: {
          case_id: string | null
          caso: string
          completado: boolean | null
          created_at: string | null
          fecha_vencimiento: string
          id: string
          prioridad: string | null
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          caso: string
          completado?: boolean | null
          created_at?: string | null
          fecha_vencimiento: string
          id?: string
          prioridad?: string | null
          tipo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          caso?: string
          completado?: boolean | null
          created_at?: string | null
          fecha_vencimiento?: string
          id?: string
          prioridad?: string | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          case_id: string | null
          categoria: string
          client_id: string | null
          concepto: string
          created_at: string | null
          fecha: string
          id: string
          itbis: number | null
          metodo_pago: string | null
          monto: number
          notas: string | null
          proveedor: string | null
          reembolsable: boolean | null
          reembolsado: boolean | null
          referencia: string | null
          subtotal: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          categoria: string
          client_id?: string | null
          concepto: string
          created_at?: string | null
          fecha?: string
          id?: string
          itbis?: number | null
          metodo_pago?: string | null
          monto: number
          notas?: string | null
          proveedor?: string | null
          reembolsable?: boolean | null
          reembolsado?: boolean | null
          referencia?: string | null
          subtotal?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          categoria?: string
          client_id?: string | null
          concepto?: string
          created_at?: string | null
          fecha?: string
          id?: string
          itbis?: number | null
          metodo_pago?: string | null
          monto?: number
          notas?: string | null
          proveedor?: string | null
          reembolsable?: boolean | null
          reembolsado?: boolean | null
          referencia?: string | null
          subtotal?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      hearings: {
        Row: {
          case_id: string | null
          caso: string
          created_at: string | null
          estado: string | null
          fecha: string
          hora: string
          id: string
          juzgado: string
          tipo: string
          ubicacion: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          caso: string
          created_at?: string | null
          estado?: string | null
          fecha: string
          hora: string
          id?: string
          juzgado: string
          tipo: string
          ubicacion?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          caso?: string
          created_at?: string | null
          estado?: string | null
          fecha?: string
          hora?: string
          id?: string
          juzgado?: string
          tipo?: string
          ubicacion?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hearings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string | null
          concepto: string
          created_at: string | null
          estado: string | null
          fecha: string
          id: string
          interes: number | null
          itbis: number | null
          monto: number
          numero_factura: string
          subtotal: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          concepto: string
          created_at?: string | null
          estado?: string | null
          fecha: string
          id?: string
          interes?: number | null
          itbis?: number | null
          monto: number
          numero_factura: string
          subtotal?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          concepto?: string
          created_at?: string | null
          estado?: string | null
          fecha?: string
          id?: string
          interes?: number | null
          itbis?: number | null
          monto?: number
          numero_factura?: string
          subtotal?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      law_firm_profile: {
        Row: {
          abogado_principal: string | null
          ciudad: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          eslogan: string | null
          id: string
          logo_url: string | null
          matricula_card: string | null
          nombre_firma: string
          provincia: string | null
          rnc: string | null
          sitio_web: string | null
          telefono: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          abogado_principal?: string | null
          ciudad?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          eslogan?: string | null
          id?: string
          logo_url?: string | null
          matricula_card?: string | null
          nombre_firma: string
          provincia?: string | null
          rnc?: string | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          abogado_principal?: string | null
          ciudad?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          eslogan?: string | null
          id?: string
          logo_url?: string | null
          matricula_card?: string | null
          nombre_firma?: string
          provincia?: string | null
          rnc?: string | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          contenido: string
          contenido_word: string | null
          created_at: string
          demandado_nombre: string | null
          demandante_nombre: string | null
          fecha_generacion: string
          id: string
          juzgado: string | null
          materia: string
          numero_expediente: string | null
          tipo_documento: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contenido: string
          contenido_word?: string | null
          created_at?: string
          demandado_nombre?: string | null
          demandante_nombre?: string | null
          fecha_generacion?: string
          id?: string
          juzgado?: string | null
          materia: string
          numero_expediente?: string | null
          tipo_documento: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contenido?: string
          contenido_word?: string | null
          created_at?: string
          demandado_nombre?: string | null
          demandante_nombre?: string | null
          fecha_generacion?: string
          id?: string
          juzgado?: string | null
          materia?: string
          numero_expediente?: string | null
          tipo_documento?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          aplicado_interes: number | null
          client_id: string | null
          concepto: string
          created_at: string | null
          fecha: string
          id: string
          invoice_id: string | null
          metodo_pago: string
          monto: number
          notas: string | null
          referencia: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aplicado_interes?: number | null
          client_id?: string | null
          concepto: string
          created_at?: string | null
          fecha?: string
          id?: string
          invoice_id?: string | null
          metodo_pago: string
          monto: number
          notas?: string | null
          referencia?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aplicado_interes?: number | null
          client_id?: string | null
          concepto?: string
          created_at?: string | null
          fecha?: string
          id?: string
          invoice_id?: string | null
          metodo_pago?: string
          monto?: number
          notas?: string | null
          referencia?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_role: Database["public"]["Enums"]["app_role"] | null
          old_role: Database["public"]["Enums"]["app_role"] | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      token_validation_attempts: {
        Row: {
          attempted_at: string
          id: string
          ip_address: string | null
          success: boolean
          token_hash: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          token_hash: string
        }
        Update: {
          attempted_at?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          token_hash?: string
        }
        Relationships: []
      }
      user_clients: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          rol: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          rol?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          rol?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      accept_invitation_token_secure: {
        Args: { p_client_id: string; p_token: string }
        Returns: {
          error_message: string
          success: boolean
        }[]
      }
      can_access_client: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      check_invitation_token_validity: {
        Args: { p_token: string }
        Returns: {
          client_email: string
          client_id: string
          error_message: string
          is_valid: boolean
        }[]
      }
      check_token_rate_limit: {
        Args: { p_token_hash: string }
        Returns: boolean
      }
      decrypt_cedula: {
        Args: { p_encrypted_cedula: string }
        Returns: string
      }
      encrypt_cedula: {
        Args: { p_cedula: string }
        Returns: string
      }
      generate_case_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_accessible_clients_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          nombre_completo: string
          updated_at: string
          user_id: string
        }[]
      }
      get_clients_masked: {
        Args: { p_user_id?: string }
        Returns: {
          auth_user_id: string
          cedula_rnc_masked: string
          created_at: string
          direccion_masked: string
          email_masked: string
          id: string
          nombre_completo: string
          telefono_masked: string
          updated_at: string
        }[]
      }
      get_firm_accounting_summary: {
        Args: { p_user_id?: string }
        Returns: {
          balance_neto: number
          total_gastos: number
          total_ingresos_facturas: number
          total_ingresos_pagos: number
          total_intereses_cobrados: number
          total_intereses_creditos: number
          total_itbis_gastos: number
          total_itbis_ingresos: number
          user_id: string
        }[]
      }
      get_my_client_data_masked: {
        Args: Record<PropertyKey, never>
        Returns: {
          accepted_terms: boolean
          cedula_rnc_masked: string
          created_at: string
          direccion_masked: string
          email_masked: string
          id: string
          nombre_completo: string
          telefono_masked: string
        }[]
      }
      has_admin_verification: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_invitation_token: {
        Args: { p_token: string }
        Returns: string
      }
      link_client_to_auth_user: {
        Args: {
          p_auth_user_id: string
          p_client_id: string
          p_invitation_token: string
        }
        Returns: boolean
      }
      log_token_validation: {
        Args: {
          p_ip_address?: string
          p_success: boolean
          p_token_hash: string
        }
        Returns: undefined
      }
      reveal_client_pii: {
        Args: { p_client_id: string }
        Returns: {
          cedula_rnc: string
          direccion: string
          email: string
          id: string
          nombre_completo: string
          telefono: string
        }[]
      }
      user_can_access_client: {
        Args: { p_client_id: string; p_user_id: string }
        Returns: boolean
      }
      user_owns_case: {
        Args: { p_case_id: string; p_user_id: string }
        Returns: boolean
      }
      user_owns_client: {
        Args: { p_client_id: string; p_user_id: string }
        Returns: boolean
      }
      user_owns_invoice: {
        Args: { p_invoice_id: string; p_user_id: string }
        Returns: boolean
      }
      validate_invitation_token: {
        Args: { p_token: string }
        Returns: {
          client_email: string
          client_id: string
          error_message: string
          is_valid: boolean
        }[]
      }
      validate_invitation_token_secure: {
        Args: { p_token: string }
        Returns: {
          client_email: string
          client_id: string
          error_message: string
          is_valid: boolean
        }[]
      }
      verify_invitation_token: {
        Args: { p_hash: string; p_token: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "free" | "pro" | "admin"
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
      app_role: ["free", "pro", "admin"],
    },
  },
} as const
