import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://tfdghduqsaniszkvzyhl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZGdoZHVxc2FuaXN6a3Z6eWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzIwMTcsImV4cCI6MjA3NDcwODAxN30.0hR3x9i4K1yXj3y0j2Qz7b2Qz7b2Qz7b2Qz7b2Qz7b2Qz';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export class AIService {
  static async generateResponse(userId: string, message: string, accessToken: string): Promise<string> {
    try {
      console.log('AI Key Loaded:', process.env.GOOGLE_AI_API_KEY ? '[LOADED]' : 'MISSING');
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        }
      });
      
      const prompt = `You are Goal Mate, a helpful AI tutor for students. Respond to the user's message in an engaging, encouraging way. Keep responses concise (3-4sentences) and educational. User message: "${message}"`;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });

      const newMessage = {
        content: message,
        created_at: new Date().toISOString(),
        sender: 'user' as const,
      };
      const aiResponse = {
        content: response,
        created_at: new Date().toISOString(),
        sender: 'ai' as const,
      };

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, messages')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Fetch Session Error:', error);
        throw new Error(`Failed to fetch session: ${error.message}`);
      }

      if (!data) {
        const { data: newSession, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert([{ user_id: userId, messages: [newMessage, aiResponse] }])
          .select()
          .single();

        if (sessionError) {
          console.error('Create AI Session Error:', sessionError);
          throw new Error(`Failed to create AI chat session: ${sessionError.message}`);
        }
        console.log('Created AI Session:', newSession);
        return response;
      }

      const updatedMessages = [...(data.messages || []), newMessage, aiResponse];
      const { data: updatedSession, error: updateError } = await supabase
        .from('chat_sessions')
        .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update AI Session Error:', updateError);
        throw new Error(`Failed to store AI response: ${updateError.message}`);
      }
      console.log('Updated AI Session:', updatedSession);

      return response;
    } catch (err: any) {
      console.error('AI Generate Error:', err.message);
      
      // Enhanced error handling for quota issues
      if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('exceeded')) {
        throw new Error('AI service quota exceeded. Please try again in a few moments or contact support.');
      }
      
      throw new Error(`Failed to generate AI response: ${err.message}`);
    }
  }
}