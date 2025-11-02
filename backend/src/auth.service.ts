import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfdghduqsaniszkvzyhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZGdoZHVxc2FuaXN6a3Z6eWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzIwMTcsImV4cCI6MjA3NDcwODAxN30.8ga6eiQymTcO3OZLGDe3WuAHkWcxgRA9ywG3xJ6QzNI';

const supabase = createClient(supabaseUrl, supabaseKey);

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

  // -------------------------
  // SIGN IN
  // -------------------------
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

  // -------------------------
  // GET USER
  // -------------------------
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

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || 'User',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    };
  }

  // -------------------------
  // CREATE PROFILE
  // -------------------------
  static async createUserProfile(userId: string, email: string, name: string) {
    try {
      // Check if profile already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingUser) return existingUser;

      // Insert profile
      const { data, error } = await supabase
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

      if (error) throw new Error(error.message);

      console.log('User profile created in public.users:', data?.id);
      return data;
    } catch (err: any) {
      console.error('Failed to create user profile:', err.message);
      throw err;
    }
  }

  // -------------------------
  // ENSURE PROFILE EXISTS
  // -------------------------
  static async ensureUserProfile(userId: string, email: string, name: string) {
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingUser) {
        await AuthService.createUserProfile(userId, email, name);
      }
    } catch (err) {
      // Ignore if not found; log other errors
      if ((err as any).code !== 'PGRST116') {
        console.error('Error ensuring profile:', err);
      }
    }
  }

  // -------------------------
  // SIGN OUT
  // -------------------------
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }
}
