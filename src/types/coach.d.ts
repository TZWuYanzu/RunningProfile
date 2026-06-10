export type SSEEvent =
  | { type: 'token'; content: string }
  | { type: 'tool_call'; name: string; args: Record<string, unknown> }
  | { type: 'tool_result'; name: string; content: unknown }
  | { type: 'done'; message_id: number }
  | { type: 'memory_update'; changes: unknown[] }
  | { type: 'stream_end' };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallInfo[];
  timestamp: number;
}

export interface ToolCallInfo {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'calling' | 'done';
}

export interface DayPlan {
  id: number;
  date: string;
  type: string;
  title: string;
  intensity: string | null;
  status: string | null;
}

export interface MonthData {
  month: string;
  plans: DayPlan[];
}

export interface RacePlan {
  id: number;
  race_name: string;
  race_type: string;
  race_date: string;
  total_weeks: number;
  current_phase: string | null;
  status: string;
}

export interface DayDetail {
  date: string;
  plan: {
    id: number;
    type: string;
    title: string;
    description: string | null;
    target_distance_km: number | null;
    target_duration_min: number | null;
    target_elevation_m: number | null;
    target_hr_zone: string | null;
    target_pace: string | null;
    intensity: string | null;
    status: string | null;
    completion_pct: number | null;
    coach_feedback: string | null;
  } | null;
}

export interface GreetingResponse {
  should_greet: boolean;
  gap_hours?: number;
  message?: string;
}

export interface AthleteProfile {
  aerobic_base_score: number | null;
  climbing_ability_score: number | null;
  descent_ability_score: number | null;
  trail_efficiency_score: number | null;
  endurance_score: number | null;
  load_risk_score: number | null;
  current_mode: string | null;
  primary_goal: string | null;
  target_race: string | null;
  injury_history: string | null;
  running_experience_years: number | null;
  updated_at: string | null;
}

export interface Shoe {
  id: number;
  name: string;
  brand: string;
  usage: string;
  traits: string[];
  initial_km: number;
  total_km: number;
  total_runs: number;
  status: string;
  created_at: string;
}

export interface ShoeLog {
  id: number;
  activity_run_id: number | null;
  terrain: string;
  grip: string;
  cushion: string;
  stability: string;
  overall: string;
  notes: string | null;
  logged_at: string;
}

export interface DailyHealthRecord {
  date: string;
  resting_heart_rate: number | null;
  hrv_rmssd: number | null;
  hrv_baseline: number | null;
  fatigue_rate: number | null;
  training_load: number | null;
  sleep_score: number | null;
  sleep_duration_min: number | null;
  deep_sleep_min: number | null;
  light_sleep_min: number | null;
  rem_sleep_min: number | null;
}
