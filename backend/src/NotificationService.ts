import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;


const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY!);

/* === WEB-PUSH CONFIGURATIN ===*/
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;

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


/*=== NOTIFICATION SERVICE ===*/
export class NotificationService {

  /*=== SAVING USER SUBSCRIPTION ===*/
  static async saveSubscription(userId: string, subscription: any, accessToken: string) {
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

/*=== SENDING NOFICATION === */
  static async sendNotification(userId: string, title: string, body: string, url: string = '/') {
    
    /*=== 1. CHECKING USER SUBSCRIPTION TIER ===*/
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

    /*=== 2. FETCHING USER SUBSCRIPTION ===*/
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription_object')
      .eq('user_id', userId);

    if (subError) {
      console.error('Notify Error: Get Subscriptions:', subError.message);
      return;
    }

    /* === 3. CRAFTING PAYLOAD ===*/
    const payload = JSON.stringify({
      title,
      body,
      data: { urlToOpen: url }
    });

    /* ==== 4. SENDING NOTIFICSTIONS TO ALL SUBSCRIPTIONS ====*/
    const sendPromises = subscriptions.map(sub => {
      return webpush.sendNotification(sub.subscription_object, payload)
        .catch(err => {
          console.error(`Notification failed for ${userId}: ${err.message}`);
          if (err.statusCode === 410) {

            //--TO BE IMPLEMENTED: Delete this expired subscription---------
          }
        });
    });

    await Promise.all(sendPromises);
    console.log(`Successfully sent 'premium' notification to ${userId}`);
  }
  
  /*=== GET VAPID PUBLIC KEY ===*/
  static getVapidKey() {
    if (!vapidPublicKey) {
      throw new Error('VAPID Public Key is not configured.');
    }
    return vapidPublicKey;
  }
}