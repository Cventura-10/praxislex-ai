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
      ai_usage: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          id: string
          model_used: string | null
          operation_type: string
          request_metadata: Json | null
          response_metadata: Json | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model_used?: string | null
          operation_type: string
          request_metadata?: Json | null
          response_metadata?: Json | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model_used?: string | null
          operation_type?: string
          request_metadata?: Json | null
          response_metadata?: Json | null
          tokens_used?: number | null
          user_id?: string
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
      document_citations: {
        Row: {
          cited_text: string
          context_paragraph: string | null
          created_at: string | null
          document_id: string | null
          id: string
          jurisprudence_id: string | null
          position_in_doc: number | null
          similarity_score: number | null
        }
        Insert: {
          cited_text: string
          context_paragraph?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          jurisprudence_id?: string | null
          position_in_doc?: number | null
          similarity_score?: number | null
        }
        Update: {
          cited_text?: string
          context_paragraph?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          jurisprudence_id?: string | null
          position_in_doc?: number | null
          similarity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_citations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_citations_jurisprudence_id_fkey"
            columns: ["jurisprudence_id"]
            isOneToOne: false
            referencedRelation: "jurisprudence_embeddings"
            referencedColumns: ["id"]
          },
        ]
      }
      events_audit: {
        Row: {
          action: string
          actor_id: string | null
          changes: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
          payload_hash: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown | null
          payload_hash: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          payload_hash?: string
          user_agent?: string | null
        }
        Relationships: []
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
      jurisprudence_embeddings: {
        Row: {
          contenido: string
          created_at: string | null
          embedding: string | null
          fecha_sentencia: string | null
          id: string
          indexed_at: string | null
          materia: string
          numero_sentencia: string | null
          relevancia_score: number | null
          resumen: string | null
          sala: string | null
          tags: string[] | null
          titulo: string
          tribunal: string | null
          updated_at: string | null
          url_fuente: string | null
          user_id: string | null
        }
        Insert: {
          contenido: string
          created_at?: string | null
          embedding?: string | null
          fecha_sentencia?: string | null
          id?: string
          indexed_at?: string | null
          materia: string
          numero_sentencia?: string | null
          relevancia_score?: number | null
          resumen?: string | null
          sala?: string | null
          tags?: string[] | null
          titulo: string
          tribunal?: string | null
          updated_at?: string | null
          url_fuente?: string | null
          user_id?: string | null
        }
        Update: {
          contenido?: string
          created_at?: string | null
          embedding?: string | null
          fecha_sentencia?: string | null
          id?: string
          indexed_at?: string | null
          materia?: string
          numero_sentencia?: string | null
          relevancia_score?: number | null
          resumen?: string | null
          sala?: string | null
          tags?: string[] | null
          titulo?: string
          tribunal?: string | null
          updated_at?: string | null
          url_fuente?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      notification_preferences: {
        Row: {
          case_updates: boolean
          client_messages: boolean
          created_at: string
          deadline_reminders: boolean
          email_enabled: boolean
          hearing_reminders: boolean
          id: string
          in_app_enabled: boolean
          payment_reminders: boolean
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_advance_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          case_updates?: boolean
          client_messages?: boolean
          created_at?: string
          deadline_reminders?: boolean
          email_enabled?: boolean
          hearing_reminders?: boolean
          id?: string
          in_app_enabled?: boolean
          payment_reminders?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_advance_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          case_updates?: boolean
          client_messages?: boolean
          created_at?: string
          deadline_reminders?: boolean
          email_enabled?: boolean
          hearing_reminders?: boolean
          id?: string
          in_app_enabled?: boolean
          payment_reminders?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_advance_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          category: string
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          priority: string
          read_at: string | null
          related_id: string | null
          related_table: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          category: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          related_id?: string | null
          related_table?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          category?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          related_id?: string | null
          related_table?: string | null
          title?: string
          type?: string
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
      reminders: {
        Row: {
          channels: string[] | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_sent: boolean
          metadata: Json | null
          related_id: string | null
          related_table: string | null
          remind_at: string
          repeat_type: string | null
          repeat_until: string | null
          sent_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channels?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_sent?: boolean
          metadata?: Json | null
          related_id?: string | null
          related_table?: string | null
          remind_at: string
          repeat_type?: string | null
          repeat_until?: string | null
          sent_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channels?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_sent?: boolean
          metadata?: Json | null
          related_id?: string | null
          related_table?: string | null
          remind_at?: string
          repeat_type?: string | null
          repeat_until?: string | null
          sent_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
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
      saved_searches: {
        Row: {
          created_at: string | null
          entity_type: string
          filters: Json
          id: string
          is_favorite: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_type: string
          filters?: Json
          id?: string
          is_favorite?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_type?: string
          filters?: Json
          id?: string
          is_favorite?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      search_rate_limit: {
        Row: {
          search_count: number | null
          user_id: string
          window_start: string
        }
        Insert: {
          search_count?: number | null
          user_id: string
          window_start?: string
        }
        Update: {
          search_count?: number | null
          user_id?: string
          window_start?: string
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
      search_index: {
        Row: {
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          reference: string | null
          search_vector: unknown | null
          title: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation_token_secure: {
        Args: { p_client_id: string; p_token: string }
        Returns: {
          error_message: string
          success: boolean
        }[]
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      can_access_client: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      can_refresh_search_index: {
        Args: Record<PropertyKey, never>
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
      check_search_rate_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_token_rate_limit: {
        Args: { p_token_hash: string }
        Returns: boolean
      }
      cleanup_old_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_category?: string
          p_message: string
          p_metadata?: Json
          p_priority?: string
          p_related_id?: string
          p_related_table?: string
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
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
      get_monthly_ai_usage: {
        Args: { p_user_id?: string }
        Returns: {
          by_operation: Json
          operations_count: number
          total_cost: number
          total_tokens: number
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
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
      hash_payload: {
        Args: { data: Json }
        Returns: string
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
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
      log_audit_event: {
        Args: {
          p_action: string
          p_changes?: Json
          p_entity_id: string
          p_entity_type: string
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: string
      }
      log_token_validation: {
        Args: {
          p_ip_address?: string
          p_success: boolean
          p_token_hash: string
        }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      refresh_search_index: {
        Args: Record<PropertyKey, never>
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
      search_entities: {
        Args: {
          p_entity_types?: string[]
          p_limit?: number
          p_query: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          description: string
          entity_id: string
          entity_type: string
          rank: number
          reference: string
          title: string
        }[]
      }
      search_jurisprudence: {
        Args: {
          filter_materia?: string
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          contenido: string
          fecha_sentencia: string
          id: string
          materia: string
          numero_sentencia: string
          resumen: string
          similarity: number
          titulo: string
          tribunal: string
          url_fuente: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      verify_audit_integrity: {
        Args: { p_event_id: string }
        Returns: boolean
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
