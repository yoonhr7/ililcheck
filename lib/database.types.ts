export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          email: string | null;
          display_name: string | null;
          provider: string;
          role: "master" | "manager" | "user" | null;
          created_at: string;
          last_login_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          username: string;
          email?: string | null;
          display_name?: string | null;
          provider?: string;
          role?: "master" | "manager" | "user" | null;
          created_at?: string;
          last_login_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          email?: string | null;
          display_name?: string | null;
          provider?: string;
          role?: "master" | "manager" | "user" | null;
          created_at?: string;
          last_login_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          user_id: string;
          username: string | null;
          email: string | null;
          display_name: string | null;
          provider: string;
          role: string;
          created_at: string;
          last_login_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username?: string | null;
          email?: string | null;
          display_name?: string | null;
          provider?: string;
          role?: string;
          created_at?: string;
          last_login_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string | null;
          email?: string | null;
          display_name?: string | null;
          provider?: string;
          role?: string;
          created_at?: string;
          last_login_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string;
          start_date: string;
          end_date: string | null;
          progress: number;
          days_remaining: number | null;
          category: "personal" | "work";
          completed_tasks: number | null;
          total_tasks: number | null;
          completed_todos: number | null;
          total_todos: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color: string;
          start_date: string;
          end_date?: string | null;
          progress?: number;
          days_remaining?: number | null;
          category?: "personal" | "work";
          completed_tasks?: number | null;
          total_tasks?: number | null;
          completed_todos?: number | null;
          total_todos?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          start_date?: string;
          end_date?: string | null;
          progress?: number;
          days_remaining?: number | null;
          category?: "personal" | "work";
          completed_tasks?: number | null;
          total_tasks?: number | null;
          completed_todos?: number | null;
          total_todos?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          title: string;
          status: "todo" | "in_progress" | "completed" | "on_hold";
          progress: number;
          due_date: string | null;
          start_date: string | null;
          completed_date: string | null;
          order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          title: string;
          status?: "todo" | "in_progress" | "completed" | "on_hold";
          progress?: number;
          due_date?: string | null;
          start_date?: string | null;
          completed_date?: string | null;
          order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          title?: string;
          status?: "todo" | "in_progress" | "completed" | "on_hold";
          progress?: number;
          due_date?: string | null;
          start_date?: string | null;
          completed_date?: string | null;
          order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      todos: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          title: string;
          status:
            | "todo"
            | "in_progress"
            | "completed"
            | "on_hold"
            | "postponed";
          progress: number;
          due_date: string | null;
          start_date: string | null;
          completed_date: string | null;
          order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id: string;
          title: string;
          status?:
            | "todo"
            | "in_progress"
            | "completed"
            | "on_hold"
            | "postponed";
          progress?: number;
          due_date?: string | null;
          start_date?: string | null;
          completed_date?: string | null;
          order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string;
          title?: string;
          status?:
            | "todo"
            | "in_progress"
            | "completed"
            | "on_hold"
            | "postponed";
          progress?: number;
          due_date?: string | null;
          start_date?: string | null;
          completed_date?: string | null;
          order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      issues: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          title: string;
          description: string;
          status: "open" | "in_progress" | "resolved" | "closed";
          priority: "low" | "medium" | "high" | "critical";
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          title: string;
          description: string;
          status?: "open" | "in_progress" | "resolved" | "closed";
          priority?: "low" | "medium" | "high" | "critical";
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          title?: string;
          description?: string;
          status?: "open" | "in_progress" | "resolved" | "closed";
          priority?: "low" | "medium" | "high" | "critical";
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
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
  };
}
