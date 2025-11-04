import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfdghduqsaniszkvzyhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZGdoZHVxc2FuaXN6a3Z6eWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzIwMTcsImV4cCI6MjA3NDcwODAxN30.8ga6eiQymTcO3OZLGDe3WuAHkWcxgRA9ywG3xJ6QzNI';

export class AnalyticsService {


  /* Fetches study time grouped by subject for a pie chart. */

  static async getSubjectBreakdown(userId: string, accessToken: string): Promise<any> {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    // Using an RPC (Remote Procedure Call)
    const { data, error } = await supabase.rpc('get_subject_breakdown', { user_id_param: userId });

    if (error) {
      console.error('Subject Breakdown Error:', error.message);
      throw new Error(`Failed to get subject breakdown: ${error.message}`);
    }

    return data;
  }

     // Fetches study time over the last 7 days for a bar chart.

  static async getTimeSeries(userId: string, accessToken: string): Promise<any> {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

   
    const { data, error } = await supabase.rpc('get_weekly_study_activity', { user_id_param: userId });
    
    if (error) {
      console.error('Time Series Error:', error.message);
      throw new Error(`Failed to get time series: ${error.message}`);
    }

    return data;
  }
}