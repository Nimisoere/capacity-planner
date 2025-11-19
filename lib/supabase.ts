import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations that need elevated permissions
export const createServerSupabaseClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Database types
export interface Database {
  public: {
    Tables: {
      schedules: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          planning_period: {
            startDate: string;
            numberOfWeeks: number;
          };
          week_config: Array<{
            id: string;
            name: string;
            workingDays: number;
          }>;
          people: Array<{
            id: number;
            name: string;
          }>;
          holidays: Record<string, number>;
          fr_schedule: Record<string, number>;
          fr_capacity_days: number;
          projects: Array<{
            id: number;
            name: string;
            startWeek: string;
            endWeek: string;
            assignments: Array<{
              personId: number;
              daysPerWeek: number;
            }>;
          }>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['schedules']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['schedules']['Insert']>;
      };
    };
  };
}
