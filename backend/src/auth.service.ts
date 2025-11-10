import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

/*=== ADMIN USER ID ===*/
const ADMIN_USER_ID =process.env.AMIN_USER_ID!;

/*=== SUPABASE CLIENTS ===*/
const supabase = createClient(supabaseUrl, supabaseKey);

/*=== ADMIN CLIENT ===*/
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY!);

if (!process.env.SUPABASE_SERVICE_KEY) {
  console.error("CRITICAL ERROR: SUPABASE_SERVICE_KEY is not set in .env file");
}

/*=== AUTH SERVICE ===*/
export class AuthService {

  /* === SIGN UP ===*/
  static async signUp(email: string, password: string, name: string) {
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required for signup');
    }
    try {
      console.log('Starting signup process:', { email, name });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('No user returned from authentication');

      console.log('Auth user created:', { id: data.user.id, email: data.user.email });
      
      await AuthService.ensureUserProfile(data.user.id, email, name);

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || name,
          created_at: data.user.created_at,
        },
        session: data.session?.access_token || null,
      };
    } catch (err: any) {
      console.error('Signup failed:', err.message);
      throw err;
    }
  }
   /*=== SIGN IN ===*/
  static async signIn(email: string, password: string) {
    console.log('Starting signin process:', { email });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No user returned from authentication');

    console.log('User signed in:', { id: data.user.id, email: data.user.email });

    await AuthService.ensureUserProfile(
      data.user.id,
      data.user.email!,
      data.user.user_metadata?.name || 'User'
    );

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || 'User',
        created_at: data.user.created_at,
      },
      session: data.session?.access_token || null,
    };
  }
 /*=== GET USER DETAILS ===*/
  static async getUser(token: string) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No user found');
    const user = data.user;
    await AuthService.ensureUserProfile(
      user.id,
      user.email!,
      user.user_metadata?.name || 'User'
    );
    const { data: combinedData, error: combinedError } = await supabaseAdmin
      .from('users')
      .select(`
        name,
        subscription_tier,
        user_education_level (level)
      `)
      .eq('id', user.id)
      .single();

    if (combinedError) {
      console.error('Error fetching user profile/education level:', combinedError.message);
      throw new Error(combinedError.message);
    }
    
    const education = (combinedData as any)?.user_education_level;
    const isAdmin = user.id === ADMIN_USER_ID;
    return {
      id: user.id,
      email: user.email,
      name: combinedData?.name || user.user_metadata?.name || 'User',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      subscription_tier: combinedData?.subscription_tier || 'free',
      education_level: education?.level || null,
      is_admin: isAdmin
    };
  }

  /*=== CREATE USER PROFILE ===*/

  static async createUserProfile(userId: string, email: string, name: string) {
    try {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingUser) {
        console.log('User profile already exists, skipping creation.');
        return existingUser;
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([
          {
            id: userId,
            email,
            name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      console.log('User profile created in public.users:', data?.id);
      return data;
    } catch (err: any) {
      console.error('Failed to create user profile:', err.message);
      throw err;
    }
  }
/*=== ENSURE USER PROFILE EXISTS ===*/
  static async ensureUserProfile(userId: string, email: string, name: string) {
    try {
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingUser) {
        return;
      }

      if (fetchError && fetchError.code === 'PGRST116') {
        await AuthService.createUserProfile(userId, email, name);
      } else if (fetchError) {
        console.error('Error ensuring profile:', fetchError);
      } else {
        await AuthService.createUserProfile(userId, email, name);
      }
    } catch (err: any) {
      console.error('Critical error in ensureUserProfile:', err.message);
    }
  }

  /*===SIGN OUT ===*/
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }
}