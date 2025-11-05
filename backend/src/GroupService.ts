import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// --- 1. Load .env variables ---
dotenv.config();

const supabaseUrl = 'https://tfdghduqsaniszkvzyhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZGdoZHVxc2FuaXN6a3Z6eWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzIwMTcsImV4cCI6MjA3NDcwODAxN30.8ga6eiQymTcO3OZLGDe3WuAHkWcxgRA9ywG3xJ6QzNI';

// --- 2. Create the Admin Client ---
// This client bypasses RLS and is used ONLY by the server
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY!);

if (!process.env.SUPABASE_SERVICE_KEY) {
  console.error("CRITICAL ERROR: SUPABASE_SERVICE_KEY is not set in .env file (needed by GroupService)");
}

export class GroupService {

  // Get all groups (uses user's token)
  static async getAllGroups(accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase.from('study_groups').select('*');
    if (error) throw error;
    return data;
  }

  // Get a single group's details (uses user's token)
  static async getGroupDetails(groupId: string, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase
      .from('study_groups')
      .select('*')
      .eq('id', groupId)
      .single();
    if (error) throw error;
    return data;
  }

  // Create a new group (uses user's token)
  static async createGroup(userId: string, name: string, description: string, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    
    // 1. Create the group
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .insert({ name, description, created_by: userId })
      .select()
      .single();
    if (groupError) throw groupError;

    // 2. Automatically add the creator as a member
    await this.joinGroup(userId, group.id, accessToken);
    
    return group;
  }

  // Join a group (uses user's token)
  static async joinGroup(userId: string, groupId: string, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId })
      .select();
    if (error) throw error;
    return data;
  }

  // Leave a group (uses user's token)
  static async leaveGroup(userId: string, groupId: string, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  }

  // Get chat history for a group (uses user's token)
  static async getGroupMessages(groupId: string, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    
    const { data, error } = await supabase
      .from('group_messages')
      .select(`
        id,
        content,
        created_at,
        user_id,
        users ( name) 
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);
      
    if (error) throw error;
    return data;
  }

  // --- THIS IS THE FIX ---
  // Save a message (uses ADMIN client to bypass RLS)
  static async saveMessage(userId: string, groupId: string, content: string) {
    // 3. Use supabaseAdmin here
    const { data, error } = await supabaseAdmin 
      .from('group_messages')
      .insert({ group_id: groupId, user_id: userId, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  static async getMyGroupIds(userId: string, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
      
    if (error) throw error;
    // Return a simple array of IDs
    return data.map(item => item.group_id);
  }
}