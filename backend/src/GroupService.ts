import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_KEY!
);

if (!process.env.SUPABASE_SERVICE_KEY) {
  console.error(
    "CRITICAL ERROR: SUPABASE_SERVICE_KEY is not set in .env file (needed by GroupService)"
  );
}

/*=== GROUP SERVICE ===*/
export class GroupService {
  static async getAllGroups(accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase
      .from("study_groups")
      .select("*")
      .order("is_admin_group", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  }
  /*=== GRT GROUP DETAILS ===*/
  static async getGroupDetails(groupId: string, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase
      .from("study_groups")
      .select("*")
      .eq("id", groupId)
      .single();
    if (error) throw error;
    return data;
  }

  /*=== CREATE GROUP ===*/
  static async createGroup(
    userId: string,
    name: string,
    description: string,
    accessToken: string
  ) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: group, error: groupError } = await supabase
      .from("study_groups")
      .insert({ name, description, created_by: userId })
      .select()
      .single();
    if (groupError) throw groupError;

    await this.joinGroup(userId, group.id, accessToken);

    return group;
  }

  /*=== JOIN GROUP ===*/
  static async joinGroup(userId: string, groupId: string, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: userId })
      .select();
    if (error) throw error;
    return data;
  }

  /*=== LEAVE GROUP ===*/
  static async leaveGroup(
    userId: string,
    groupId: string,
    accessToken: string
  ) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: group, error: groupError } = await supabase
      .from("study_groups")
      .select("is_admin_group")
      .eq("id", groupId)
      .single();

    if (groupError) throw groupError;
    if (group.is_admin_group) {
      throw new Error("You cannot leave the admin group.");
    }

    const { data, error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
    if (error) throw error;
    return data;
  }
  /*=== GET GROUP MESSAGES ===*/
  static async getGroupMessages(
    groupId: string,
    roomName: string,
    accessToken: string
  ) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data, error } = await supabase
      .from("group_messages")
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        room_name,
        reactions,
        file_url,
        users ( name ) 
      `
      )
      .eq("group_id", groupId)
      .eq("room_name", roomName)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) throw error;
    return data;
  }

  /* ===SAVE GROUP MESSAGE ===*/
  static async saveMessage(
    userId: string,
    groupId: string,
    roomName: string,
    content: string,
    fileUrl: string | null
  ) {
    const { data, error } = await supabaseAdmin
      .from("group_messages")
      .insert({
        group_id: groupId,
        user_id: userId,
        content: content,
        room_name: roomName,
        file_url: fileUrl,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /*=== GET MY GROUP IDS ===*/
  static async getMyGroupIds(userId: string, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (error) throw error;
    return data.map((item) => item.group_id);
  }
  /*=== GET IDS FOR ALL GROUP MEMBERS ===*/
  static async getGroupMembers(groupId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (error) {
      console.error(`GetGroupMembers Error: ${error.message}`);
      return [];
    }
    return data.map((item) => item.user_id);
  }

  /*=== GET GROUP ROOMS ===*/
  static async getGroupRooms(groupId: string, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase
      .from("group_rooms")
      .select("*")
      .eq("group_id", groupId)
      .order("room_name", { ascending: true });
    if (error) throw error;
    return data;
  }

  /*=== CREATE GROUP  ROOMS ===*/
  static async getUserEducationLevel(userId: string, accessToken: string) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase
      .from("user_education_level")
      .select("level")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  }

  /*=== SAVE USER EDUCTION LEVEL ===*/
  static async saveUserEducationLevel(
    userId: string,
    level: string,
    accessToken: string
  ) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    /* CHECKING IF USER LEVEL ALREADY EXISTS*/
    const existingData = await this.getUserEducationLevel(userId, accessToken);
    if (existingData && existingData.level) {
      throw new Error("Education level is already set and cannot be changed.");
    }

    /*INSRTING NEW LEVEL*/
    const { data, error } = await supabase
      .from("user_education_level")
      .insert({ user_id: userId, level: level })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /*=== UPDATE USER EDUCATION LEVEL ADMIN ONLY ===*/
  static async updateUserEducationLevelAdmin(userId: string, level: string) {
    const { data, error } = await supabaseAdmin
      .from("user_education_level")
      .upsert({ user_id: userId, level: level }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /*=== ADD READ RECEIPT ===*/
  static async addReadReceipt(
    messageId: number,
    userId: string,
    accessToken: string
  ) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { error } = await supabase
      .from("group_read_receipts")
      .upsert({ message_id: messageId, user_id: userId });

    if (error) throw error;
    return { success: true };
  }

  /* === ADD REACTION TO MESSAGE ===*/

  static async addReaction(messageId: number, userId: string, emoji: string) {
    /*=== FETCH CURRENT REACTIONS ===*/
    const { data: msg, error: fetchError } = await supabaseAdmin
      .from("group_messages")
      .select("reactions")
      .eq("id", messageId)
      .single();

    if (fetchError) throw fetchError;

    /*=== MODIFY REACTIONS OBJECT ===*/
    let reactions = (msg.reactions || {}) as { [key: string]: string[] };

    if (reactions[emoji]) {
      const userHasReacted = reactions[emoji].includes(userId);
      if (userHasReacted) {
        reactions[emoji] = reactions[emoji].filter(
          (uid: string) => uid !== userId
        );
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        reactions[emoji].push(userId);
      }
    } else {
      reactions[emoji] = [userId];
    }

    /*=== UPDATE REACTIONS IN DB ===*/
    const { data, error: updateError } = await supabaseAdmin
      .from("group_messages")
      .update({ reactions: reactions })
      .eq("id", messageId)
      .select("id, reactions")
      .single();

    if (updateError) throw updateError;
    return data;
  }
}
