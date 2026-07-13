export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          display_name: string
          email: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          email: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          email?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      ledgers: {
        Row: {
          id: string
          name: string
          currency: string
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          currency?: string
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          currency?: string
          created_at?: string
          created_by?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      bootstrap_first_ledger: {
        Args: { p_ledger_name?: string }
        Returns: string | null
      }
      mark_transaction_returned: {
        Args: { p_transaction_id: string; p_returned_at: string }
        Returns: undefined
      }
      soft_delete_transaction: {
        Args: { p_transaction_id: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
