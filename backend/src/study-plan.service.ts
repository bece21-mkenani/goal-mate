import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { NotificationService } from "./NotificationService";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_KEY!
);

/* === STUDY PLAN INTERFACE ===*/
export interface StudyPlan {
  id: string;
  user_id: string;
  topics: string[];
  schedule: Array<{
    day: number;
    time: string;
    subject: string;
    tasks: string[];
  }>;
  created_at: string;
}

/* === PLAN HISTORY INTERFACE ===*/
export interface PlanHistory {
  id: string;
  user_id: string;
  subjects: string[];
  schedule_count: number;
  created_at: string;
}

/*=== STUDY PLAN SERVICE ===*/
export class StudyPlanService {
  static async generatePlan(
    userId: string,
    subjects: string[],
    timeSlots: number[],
    startDate: string,
    accessToken: string
  ): Promise<StudyPlan> {
    try {
      const plan: StudyPlan = {
        id: uuidv4(),
        user_id: userId,
        topics: subjects,
        schedule: timeSlots.map((slot, index) => ({
          day: index + 1,
          time: `${slot} hours`,
          subject: subjects[index % subjects.length],
          tasks: [
            `Study ${subjects[index % subjects.length]} for ${slot} hours`,
            "Review key concepts and notes",
            "Complete practice problems",
            "Summarize what you learned",
          ],
        })),
        created_at: new Date().toISOString(),
      };

      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });

      /* 1. STORE STUDY PLAN METADATA ===*/
      const { data, error } = await supabase
        .from("study_plans")
        .insert([plan])
        .select()
        .single();

      if (error)
        throw new Error(`Failed to store study plan: ${error.message}`);

      /* 2. STORE INDIVIDUAL PLAN SESSIONS ===*/
      const sessionsToInsert = [];
      const planStartDate = new Date(startDate);

      for (const item of plan.schedule) {
        const sessionDate = new Date(planStartDate);
        sessionDate.setDate(planStartDate.getDate() + (item.day - 1));

        sessionsToInsert.push({
          plan_id: plan.id,
          user_id: userId,
          subject: item.subject,
          tasks: item.tasks,
          session_start_time: sessionDate.toISOString(),
        });
      }

      /* ==== 3. BULK INSERT PLAN SESIONS ====*/
      const { error: sessionsError } = await supabase
        .from("study_plan_sessions")
        .insert(sessionsToInsert);

      if (sessionsError) {
        throw new Error(
          `Failed to store plan sessions: ${sessionsError.message}`
        );
      }

      console.log("Generated Study Plan:", plan.id);
      return data;
    } catch (err: any) {
      console.error("Study Plan Generate Error:", err.message);
      throw new Error(`Failed to generate study plan: ${err.message}`);
    }
  }

  /*=== FETCHING PLAN HISTORY ===*/
  static async getPlanHistory(
    userId: string,
    accessToken: string
  ): Promise<PlanHistory[]> {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });

      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Get Plan History Error:", error);
        throw new Error(`Failed to fetch plan history: ${error.message}`);
      }

      const planHistory: PlanHistory[] = (data || []).map((plan) => ({
        id: plan.id,
        user_id: plan.user_id,
        subjects: plan.topics || [],
        schedule_count: plan.schedule?.length || 0,
        created_at: plan.created_at,
      }));

      console.log("Fetched Plan History:", {
        userId,
        count: planHistory.length,
      });
      return planHistory;
    } catch (err: any) {
      console.error("Get Plan History Error:", err.message);
      throw new Error(`Failed to fetch plan history: ${err.message}`);
    }
  }

  /*=== FETCHING PLAN BY ID ===*/
  static async getPlanById(
    planId: string,
    accessToken: string
  ): Promise<StudyPlan> {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });

      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (error) {
        console.error("Get Plan By ID Error:", error);
        throw new Error(`Failed to fetch study plan: ${error.message}`);
      }

      if (!data) {
        throw new Error("Study plan not found");
      }

      console.log("Fetched Study Plan:", { planId });
      return data;
    } catch (err: any) {
      console.error("Get Plan By ID Error:", err.message);
      throw new Error(`Failed to fetch study plan: ${err.message}`);
    }
  }

  /*=== FETCHING USER PLANS ===*/
  static async getUserPlans(
    userId: string,
    accessToken: string
  ): Promise<StudyPlan[]> {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });

      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Get User Plans Error:", error);
        throw new Error(`Failed to fetch user plans: ${error.message}`);
      }

      console.log("Fetched User Plans:", { userId, count: data?.length || 0 });
      return data || [];
    } catch (err: any) {
      console.error("Get User Plans Error:", err.message);
      throw new Error(`Failed to fetch user plans: ${err.message}`);
    }
  }

  /*==== CRON JOB FOR UPCOMING SESSIONS NOTIFICATIONS ====*/
  static async sendUpcomingSessionNotifications() {
    try {
      console.log("CronJob: Checking for upcoming study sessions...");
      const now = new Date();
      /*=== 1. ONE HOUR AHEAD TIME WINDOW ===*/
      const inOneHour = new Date(now.getTime() + 65 * 60 * 1000);

      /*==== FIND SESSIONS STARTING IN THE NEXT HOUR ====*/
      const { data: sessions, error } = await supabaseAdmin
        .from("study_plan_sessions")
        .select("id, user_id, subject")
        .gte("session_start_time", now.toISOString())
        .lte("session_start_time", inOneHour.toISOString())
        .eq("notification_sent", false);

      if (error) {
        console.error("CronJob Error (find sessions):", error.message);
        return;
      }

      if (!sessions || sessions.length === 0) {
        console.log("CronJob: No upcoming sessions found.");
        return;
      }

      console.log(`CronJob: Found ${sessions.length} sessions to notify.`);

      /*=== 2. SENDING NOFICATIONS ===*/
      const notificationsToSend = sessions.map((session) =>
        NotificationService.sendNotification(
          session.user_id,
          "Study Session Reminder",
          `Your session for "${session.subject}" is starting in one hour!`,
          "/study-plan"
        )
      );

      await Promise.all(notificationsToSend);

      /*=== 3.  MARKING NOTICATIONS AS SENT ===*/
      const sessionIds = sessions.map((s) => s.id);
      const { error: updateError } = await supabaseAdmin
        .from("study_plan_sessions")
        .update({ notification_sent: true })
        .in("id", sessionIds);

      if (updateError) {
        console.error("CronJob Error (update sent):", updateError.message);
      }

      console.log("CronJob: Sent all notifications.");
    } catch (err: any) {
      console.error("CronJob: Unhandled error:", err.message);
    }
  }
}
