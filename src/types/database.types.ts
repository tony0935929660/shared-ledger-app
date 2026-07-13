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
      categories: {
        Row: {
          id: string
          ledger_id: string
          name: string
          transaction_type: 'income' | 'expense' | 'capital'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          ledger_id: string
          name: string
          transaction_type: 'income' | 'expense' | 'capital'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          ledger_id?: string
          name?: string
          transaction_type?: 'income' | 'expense' | 'capital'
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      ledger_members: {
        Row: {
          ledger_id: string
          member_id: string
          role: 'owner' | 'member'
          joined_at: string
        }
        Insert: {
          ledger_id: string
          member_id: string
          role: 'owner' | 'member'
          joined_at?: string
        }
        Update: {
          ledger_id?: string
          member_id?: string
          role?: 'owner' | 'member'
          joined_at?: string
        }
        Relationships: []
      }
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
      transaction_attachments: {
        Row: {
          id: string
          transaction_id: string
          storage_path: string
          original_name: string
          mime_type: string
          size_bytes: number
          created_by: string
          created_at: string
          deleted_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          transaction_id: string
          storage_path: string
          original_name: string
          mime_type: string
          size_bytes: number
          created_by: string
          created_at?: string
          deleted_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          transaction_id?: string
          storage_path?: string
          original_name?: string
          mime_type?: string
          size_bytes?: number
          created_by?: string
          created_at?: string
          deleted_by?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          ledger_id: string
          type: 'income' | 'expense' | 'capital'
          title: string
          amount: string
          category_id: string
          transaction_date: string
          note: string | null
          payment_method: 'company' | 'member_advance' | null
          advance_member_id: string | null
          returned_at: string | null
          returned_by: string | null
          created_by: string
          created_at: string
          deleted_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          ledger_id: string
          type: 'income' | 'expense' | 'capital'
          title: string
          amount: string
          category_id: string
          transaction_date: string
          note?: string | null
          payment_method?: 'company' | 'member_advance' | null
          advance_member_id?: string | null
          returned_at?: string | null
          returned_by?: string | null
          created_by: string
          created_at?: string
          deleted_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          ledger_id?: string
          type?: 'income' | 'expense' | 'capital'
          title?: string
          amount?: string
          category_id?: string
          transaction_date?: string
          note?: string | null
          payment_method?: 'company' | 'member_advance' | null
          advance_member_id?: string | null
          returned_at?: string | null
          returned_by?: string | null
          created_by?: string
          created_at?: string
          deleted_by?: string | null
          deleted_at?: string | null
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
      create_transaction_with_attachments: {
        Args: {
          p_type: 'income' | 'expense' | 'capital'
          p_title: string
          p_amount: string
          p_category_id: string
          p_transaction_date: string
          p_note: string | null
          p_payment_method: 'company' | 'member_advance' | null
          p_advance_member_id: string | null
          p_attachments: Json
        }
        Returns: string
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
