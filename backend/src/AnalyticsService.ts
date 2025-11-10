import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();


const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

/*=========== ANALYTICS SERVICE ===========*/
export class AnalyticsService {


  /*=== FETCHING SUBJECT BREAKDOWN ===========*/

  static async getSubjectBreakdown(userId: string, accessToken: string): Promise<any> {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

   /*=== FETCHING DATA FROM RPC FUNCTION ===*/
    const { data, error } = await supabase.rpc('get_subject_breakdown', { user_id_param: userId });

    if (error) {
      console.error('Subject Breakdown Error:', error.message);
      throw new Error(`Failed to get subject breakdown: ${error.message}`);
    }

    return data;
  }
/*=== FETCHING THE TIME SERIES DATA FROM RPC FUNCTION ===*/

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