export type PillType = 'combined' | 'progestin_12h' | 'progestin_3h';

export interface PillSettings {
  id?: string;
  user_id?: string;
  pill_name: string;
  pill_type: PillType;
  tolerance_hours: number;
  scheduled_time: string; // HH:mm format e.g. "20:00"
  pack_active_days: number; // e.g. 21, 24, 28
  pack_break_days: number; // e.g. 7, 4, 0
  cycle_start_date: string; // YYYY-MM-DD
  reminders_enabled: boolean;
  remind_at_pill_time: boolean;
  remind_after_30m: boolean;
  remind_after_60m: boolean;
  partner_email?: string;
  partner_notify_after_hours?: number;
}

export type PillLogStatus =
  | 'taken'
  | 'delayed'
  | 'missed'
  | 'break_day'
  | 'placebo_taken'
  | 'placebo_skipped';

export interface PillLog {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  status: PillLogStatus;
  scheduled_at?: string; // ISO
  taken_at?: string; // ISO
  delay_minutes: number;
  pill_number_in_pack?: number;
  notes?: string;
}

export type MoodType = 'great' | 'good' | 'neutral' | 'sad' | 'anxious' | 'irritable';
export type BleedingType = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

export interface SymptomLog {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  mood?: MoodType;
  bleeding?: BleedingType;
  symptoms: string[]; // e.g. ['cramps', 'headache', 'nausea', 'bloating', 'breast_tenderness', 'fatigue', 'acne']
  notes?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  timezone: string;
}

export interface DayStatus {
  date: string; // YYYY-MM-DD
  dayNumberInPack: number; // 1 to (active + break)
  isBreakDay: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  log?: PillLog;
  symptoms?: SymptomLog;
}
