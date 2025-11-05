import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://tfdghduqsaniszkvzyhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZGdoZHVxc2FuaXN6a3Z6eWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzIwMTcsImV4cCI6MjA3NDcwODAxN30.8ga6eiQymTcO3OZLGDe3WuAHkWcxgRA9ywG3xJ6QzNI';

// Admin client to bypass RLS
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY!);

// Web-Push Setup
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error(
    "CRITICAL ERROR: VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY are not set in .env"
  );
} else {
  webpush.setVapidDetails(
    'mailto:mphatsokenani0@gmail.com', 
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log("Web-push configured.");
}


export class NotificationService {

  /**
   * Saves a new push subscription for a user.
   * This is called by the frontend and uses RLS.
   */
  static async saveSubscription(userId: string, subscription: any, accessToken: string) {
    // This client uses the user's token to obey RLS
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        subscription_object: subscription
      });
      
    if (error) {
      console.error('Save Subscription Error:', error.message);
      throw new Error(`Failed to save subscription: ${error.message}`);
    }
    return data;
  }

  /**
   * Sends a notification to a specific user.
   * --- NOW CHECKS FOR 'premium' TIER ---
   */
  static async sendNotification(userId: string, title: string, body: string, url: string = '/') {
    
    // 1. Check if user is a 'premium' subscriber
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error(`Notify Error: Could not find user ${userId}`, profileError.message);
      return;
    }

    if (userProfile.subscription_tier !== 'premium') {
      console.log(`Notify: User ${userId} is 'free' tier. Notification not sent.`);
      return; 
    }

    // 2. User is 'premium', get their subscriptions
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription_object')
      .eq('user_id', userId);

    if (subError) {
      console.error('Notify Error: Get Subscriptions:', subError.message);
      return;
    }

    // 3. Prepare payload
    const payload = JSON.stringify({
      title,
      body,
      data: { urlToOpen: url }
    });

    // 4. Send to all devices
    const sendPromises = subscriptions.map(sub => {
      return webpush.sendNotification(sub.subscription_object, payload)
        .catch(err => {
          console.error(`Notification failed for ${userId}: ${err.message}`);
          if (err.statusCode === 410) {
            // TODO: Delete this expired subscription
          }
        });
    });

    await Promise.all(sendPromises);
    console.log(`Successfully sent 'premium' notification to ${userId}`);
  }

  /**
   * Provides the VAPID public key to the frontend.
   */
  static getVapidKey() {
    if (!vapidPublicKey) {
      throw new Error('VAPID Public Key is not configured.');
    }
    return vapidPublicKey;
  }
}