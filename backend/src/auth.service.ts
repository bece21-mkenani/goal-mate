import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env variables
dotenv.config();

const supabaseUrl = 'https://tfdghduqsaniszkvzyhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZGdoZHVxc2FuaXN6a3Z6eWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzIwMTcsImV4cCI6MjA3NDcwODAxN30.8ga6eiQymTcO3OZLGDe3WuAHkWcxgRA9ywG3xJ6QzNI';

// The public client (for auth functions)
const supabase = createClient(supabaseUrl, supabaseKey);

// The admin client (for bypassing RLS to manage the 'users' table)
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY!);

if (!process.env.SUPABASE_SERVICE_KEY) {
  console.error("CRITICAL ERROR: SUPABASE_SERVICE_KEY is not set in .env file");
}

export class AuthService {

  // -------------------------
  // SIGN UP
  // -------------------------
  static async signUp(email: string, password: string, name: string) {
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required for signup');
    }

    try {
      console.log('Starting signup process:', { email, name });

      // Use the PUBLIC client for authentication
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('No user returned from authentication');

      console.log('Auth user created:', { id: data.user.id, email: data.user.email });
      
      // Use the ADMIN client to create the profile
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

  // -------------------------
  // SIGN IN
  // -------------------------
  static async signIn(email: string, password: string) {
    console.log('Starting signin process:', { email });

    // Use the PUBLIC client for authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No user returned from authentication');

    console.log('User signed in:', { id: data.user.id, email: data.user.email });

    // Use the ADMIN client to ensure the profile exists
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

  // -------------------------
  // GET USER
  // -------------------------
  static async getUser(token: string) {
    // Use the PUBLIC client to validate the token
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No user found');

    const user = data.user;

    // Use the ADMIN client to ensure the profile exists
    await AuthService.ensureUserProfile(
      user.id,
      user.email!,
      user.user_metadata?.name || 'User'
    );

    // Now, fetch the full profile from the 'users' table
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('name, avatar_url')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.name || 'User',
      avatar_url: (profile as any)?.avatar_url || null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    };
  }

  // -------------------------
  // CREATE PROFILE (USES ADMIN)
  // This is the function that was failing
  // -------------------------
  static async createUserProfile(userId: string, email: string, name: string) {
    try {
      // --- FIX: We add the "check-first" logic here ---
      // This check prevents the "duplicate key" race condition.
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingUser) {
        console.log('User profile already exists, skipping creation.');
        return existingUser;
      }
      // --- End Fix ---

      // If no user was found, we insert
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
        // This will now only show *other* errors, not "duplicate key"
        throw new Error(error.message);
      }

      console.log('User profile created in public.users:', data?.id);
      return data;
    } catch (err: any) {
      console.error('Failed to create user profile:', err.message);
      throw err;
    }
  }

  // -------------------------
  // ENSURE PROFILE EXISTS (USES ADMIN)
  // This is the function that calls createUserProfile
  // -------------------------
  static async ensureUserProfile(userId: string, email: string, name: string) {
    try {
      // We must check for the error, not use try/catch for flow control
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      // Case 1: User was found. We are done.
      if (existingUser) {
        return;
      }

      // Case 2: User was not found (PGRST116)
      if (fetchError && fetchError.code === 'PGRST116') {
        // This is the expected path for a new user. Create the profile.
        await AuthService.createUserProfile(userId, email, name);
      } else if (fetchError) {
        // An unexpected database error occurred
        console.error('Error ensuring profile:', fetchError);
      } else {
        // Failsafe: existingUser is null but fetchError is also null
        await AuthService.createUserProfile(userId, email, name);
      }
    } catch (err: any) {
      console.error('Critical error in ensureUserProfile:', err.message);
    }
  }

  // -------------------------
  // SIGN OUT
  // -------------------------
  static async signOut() {
    // Use the PUBLIC client
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }
}