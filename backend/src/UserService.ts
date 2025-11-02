// services/UserService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfdghduqsaniszkvzyhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZGdoZHVxc2FuaXN6a3Z6eWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzIwMTcsImV4cCI6MjA3NDcwODAxN30.8ga6eiQymTcO3OZLGDe3WuAHkWcxgRA9ywG3xJ6QzNI';

const supabase = createClient(supabaseUrl, supabaseKey);


export interface UserStatistics {
  id: string;
  user_id: string;
  total_points: number;
  day_streak: number;
  last_active_date: string;
    total_study_time: number;
    subjects_studied: string[];
  achievements_earned: string[];
    total_sessions: number; // <-- Added new field created_at: string;
  updated_at: string;
}

export interface Achievement {
 id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  condition_type: string; // e.g., 'points', 'streak', 'sessions', 'subjects'
  condition_value: number;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject: string;
  duration: number; // in minutes
  points_earned: number;
  created_at: string;
}

export class UserService {
  static async getUserStatistics(userId: string, accessToken: string): Promise<UserStatistics> {
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    let { data: statistics, error } = await supabaseAuth
      .from('user_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !statistics) {
      console.log('No stats found, creating new entry.');
      const { data: newStats, error: createError } = await supabaseAuth
        .from('user_statistics')
        .insert([{ user_id: userId, total_sessions: 0 }]) // Ensure new field is initialized
        .select()
        .single();

      if (createError) throw new Error(`Failed to create user statistics: ${createError.message}`);
      statistics = newStats;
    }

    return statistics;
  }

  static async getAchievements(accessToken: string): Promise<Achievement[]> {
    // This implementation is fine as-is
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabaseAuth
      .from('achievements')
      .select('*')
      .order('points', { ascending: true });
    if (error) throw new Error(`Failed to fetch achievements: ${error.message}`);
    return data || [];
  }

  static async recordStudySession(
    userId: string, 
    subject: string, 
    duration: number, // Duration in minutes from the frontend
    accessToken: string
  ): Promise<void> {
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    // Calculate points (1 point per minute + bonus for 30+ mins)
    const pointsEarned = duration + (duration >= 30 ? 10 : 0);

    // 1. Record session
    const { error: sessionError } = await supabaseAuth
      .from('study_sessions')
      .insert([{ user_id: userId, subject, duration, points_earned: pointsEarned }]);

    if (sessionError) throw new Error(`Failed to record study session: ${sessionError.message}`);

    // 2. Update user statistics
    await this.updateUserStatistics(userId, subject, pointsEarned, duration, accessToken);
  }

  // --- PRIVATE METHODS ---

  /**
   * This is the core logic. It updates stats and then checks for new achievements.
   */
  private static async updateUserStatistics(
    userId: string, 
    subject: string, 
    pointsEarned: number, 
    duration: number,
    accessToken: string
  ): Promise<void> {
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const stats = await this.getUserStatistics(userId, accessToken);
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate streak
    let newStreak = stats.day_streak;
    if (stats.last_active_date) {
      const lastActive = new Date(stats.last_active_date);
      const currentDate = new Date(today);
      const dayDiff = Math.floor((currentDate.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        newStreak = stats.day_streak + 1; // Consecutive day
      } else if (dayDiff > 1) {
        newStreak = 1; // Streak broken
      }
      // if dayDiff === 0, streak stays the same
    } else {
      newStreak = 1; // First session
    }

    // Update subjects studied
    const updatedSubjects = stats.subjects_studied.includes(subject) 
      ? stats.subjects_studied 
      : [...stats.subjects_studied, subject];

    // Prepare update payload
    const newStats = {
      total_points: stats.total_points + pointsEarned,
      day_streak: newStreak,
      last_active_date: today,
      total_study_time: stats.total_study_time + duration,
      subjects_studied: updatedSubjects,
      total_sessions: stats.total_sessions + 1, // <-- Increment total_sessions
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseAuth
      .from('user_statistics')
      .update(newStats)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to update user statistics: ${error.message}`);

    // 3. NEW STEP: Check for achievements after stats are updated
    await this.checkAndAwardAchievements(supabaseAuth, userId, { ...stats, ...newStats });
  }

  /**
   * NEW: Checks if the user's new stats qualify for any unearned achievements.
   */
  private static async checkAndAwardAchievements(
    supabase: SupabaseClient, 
    userId: string,
    updatedStats: UserStatistics
  ): Promise<void> {
    try {
      // 1. Get all achievements
      const { data: allAchievements, error: achError } = await supabase
        .from('achievements')
        .select('*');
      if (achError) throw achError;

      // 2. Filter for achievements the user does NOT have
      const unearnedAchievements = allAchievements.filter(
        (ach: Achievement) => !updatedStats.achievements_earned.includes(ach.id)
      );

      const newAchievementsToAward: string[] = [];

      // 3. Check conditions
      for (const ach of unearnedAchievements) {
        let conditionMet = false;
        switch (ach.condition_type) {
          case 'points':
            if (updatedStats.total_points >= ach.condition_value) conditionMet = true;
            break;
          case 'streak':
            if (updatedStats.day_streak >= ach.condition_value) conditionMet = true;
            break;
          case 'sessions':
            if (updatedStats.total_sessions >= ach.condition_value) conditionMet = true;
            break;
          case 'subjects':
            if (updatedStats.subjects_studied.length >= ach.condition_value) conditionMet = true;
            break;
          case 'time': // Assuming 'time' is total_study_time in minutes
             if (updatedStats.total_study_time >= ach.condition_value) conditionMet = true;
             break;
        }

        if (conditionMet) {
          newAchievementsToAward.push(ach.id);
        }
      }

      // 4. Update user stats if new achievements were earned
      if (newAchievementsToAward.length > 0) {
        const updatedAchievementList = [...updatedStats.achievements_earned, ...newAchievementsToAward];
        
        const { error: updateError } = await supabase
          .from('user_statistics')
          .update({ achievements_earned: updatedAchievementList })
          .eq('user_id', userId);
        
        if (updateError) throw updateError;
        console.log(`Awarded ${newAchievementsToAward.length} new achievements to user ${userId}`);
      }
    } catch (err: any) {
      console.error(`Error checking/awarding achievements: ${err.message}`);
    }
  }
}