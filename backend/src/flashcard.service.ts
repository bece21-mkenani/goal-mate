import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = 'https://tfdghduqsaniszkvzyhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZGdoZHVxc2FuaXN6a3Z6eWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzIwMTcsImV4cCI6MjA3NDcwODAxN30.8ga6eiQymTcO3OZLGDe3WuAHkWcxgRA9ywG3xJ6QzNI';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export class FlashcardService {
  static async generateFlashcards(userId: string, subject: string, count: number, accessToken: string): Promise<any[]> {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User authentication error:', userError);
        throw new Error('User not authenticated');
      }
      const authenticatedUserId = user.id;
      console.log('Authenticated user ID:', authenticatedUserId);
      const flashcards = await this.generateFlashcardsWithAI(authenticatedUserId, subject, count);
      const { data, error } = await supabase
        .from('flashcards')
        .insert(flashcards)
        .select();

      if (error) {
        console.error('Store Flashcards Error:', error);
        if (error.code === '23503') { 
          throw new Error('User profile not found. Please complete your profile setup.');
        }
        
        throw new Error(`Failed to store flashcards: ${error.message}`);
      }

      console.log('Generated Flashcards:', { userId: authenticatedUserId, count, subject });
      return data || flashcards;
    } catch (err: any) {
      console.error('Flashcard Generate Error:', err.message);
      throw new Error(`Failed to generate flashcards: ${err.message}`);
    }
  }

  private static async generateFlashcardsWithAI(userId: string, subject: string, count: number): Promise<any[]> {
    try {
      console.log('Generating flashcards with AI for subject:', subject);
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        }
      });

      const prompt = `
        You are Goal Mate, an AI tutor creating educational flashcards.
        
        Create ${count} high-quality flashcards about "${subject}".
        
        Requirements:
        - Each flashcard should have a clear FRONT (question/term/concept) and BACK (answer/definition/explanation)
        - Make the content educational and accurate
        - Cover different aspects of the subject
        - Questions should be clear and answers should be informative but concise
        - Make it suitable for students learning this subject
        
        Format your response as a JSON array where each item has:
        - "front": the question/term (string)
        - "back": the answer/definition (string)
        
        Example:
        [
          {
            "front": "What is photosynthesis?",
            "back": "The process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen."
          },
          {
            "front": "What are the reactants of photosynthesis?",
            "back": "Carbon dioxide, water, and light energy."
          }
        ]
        
        Return ONLY the JSON array, no additional text.
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      let flashcardsData;
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          flashcardsData = JSON.parse(jsonMatch[0]);
        } else {
          flashcardsData = JSON.parse(response);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', response);
        return this.generateMockFlashcards(userId, subject, count);
      }
      return flashcardsData.map((card: any, index: number) => ({
        id: uuidv4(),
        user_id: userId,
        subject: subject,
        front: card.front || `Question ${index + 1} about ${subject}`,
        back: card.back || `Answer ${index + 1} explaining ${subject} concept`,
        created_at: new Date().toISOString(),
      }));

    } catch (error: any) {
      console.error('AI Flashcard Generation Error:', error.message);
      return this.generateMockFlashcards(userId, subject, count);
    }
  }

  private static generateMockFlashcards(userId: string, subject: string, count: number): any[] {
    console.log('Using mock flashcards as fallback');
    return Array.from({ length: count }, (_, index) => ({
      id: uuidv4(),
      user_id: userId,
      subject: subject,
      front: `What is an important concept about ${subject}?`,
      back: `This is a key concept in ${subject} that helps understand the subject better.`,
      created_at: new Date().toISOString(),
    }));
  }
}