export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string;
          instructor: "lukaah" | "estee";
          swimmer_name: string;
          swimmer_age: number;
          lesson_duration: number;
          parent_name: string;
          parent_email: string;
          parent_phone: string;
          notes: string | null;
          day_of_week: string[];
          lesson_time: string;
          second_day_time: string | null;
          week_start: string | null;
          month: string | null;
          total_lessons: number;
          price: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          instructor: string;
          swimmer_name: string;
          swimmer_age: number;
          lesson_duration: number;
          parent_name: string;
          parent_email: string;
          parent_phone: string;
          notes?: string | null;
          day_of_week: string[];
          lesson_time: string;
          second_day_time?: string | null;
          week_start?: string | null;
          month?: string | null;
          total_lessons: number;
          price: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          instructor?: string;
          swimmer_name?: string;
          swimmer_age?: number;
          lesson_duration?: number;
          parent_name?: string;
          parent_email?: string;
          parent_phone?: string;
          notes?: string | null;
          day_of_week?: string[];
          lesson_time?: string;
          second_day_time?: string | null;
          week_start?: string | null;
          month?: string | null;
          total_lessons?: number;
          price?: number;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
