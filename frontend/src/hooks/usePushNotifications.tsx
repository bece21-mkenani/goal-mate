import { useState, useEffect } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

/*=== HELPER CONVERT VAPID KEY ===*/
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      console.log("Push Notifications: Supported!");
      setIsSupported(true);
      setPermission(Notification.permission);
      
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setIsSubscribed(!!subscription);
        });
      });
    } else {
      console.log("Push Notifications: NOT Supported.");
      setIsSupported(false);
    }
  }, []);

  const subscribeUser = async () => {
    console.log("--- Starting Subscription Process ---"); 
    setIsLoading(true);
    setError(null);

    /*=== GETTING VAPID KEY ===*/
    let vapidPublicKey = '';
    try {
      console.log("Subscribing: Step 1 - Getting VAPID key..."); 
      const response = await axios.get(`${apiUrl}/notifications/vapid-key`);
      vapidPublicKey = response.data.publicKey;
      console.log("Subscribing: Step 2 - Got VAPID key.");
    } catch (err: any) {
      console.error("Subscribing: FAILED at Step 1", err); 
      setError('Failed to contact server for subscription.');
      setIsLoading(false);
      return;
    }

    /*=== REQUEST PERMISSION & SUBSCRIBE ===*/
    if (permission === 'default') {
      console.log("Subscribing: Step 3 - Requesting permission..."); 
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      if (newPermission !== 'granted') {
        console.log("Subscribing: Permission was not granted."); 
        setError('Permission was not granted.');
        setIsLoading(false);
        return;
      }
    }

    if (permission === 'denied') {
      console.log("Subscribing: Permission is denied."); 
      setError('Permission is denied. Please change it in your browser settings.');
      setIsLoading(false);
      return;
    }

    /*=== SUBSCRIBE TO PUSH ===*/
    try {
      const registration = await navigator.serviceWorker.ready;
      
      console.log("Subscribing: Step 5 - Got service worker. Creating subscription...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log("Subscribing: Step 6 - Got subscription. Saving to backend..."); 
      // 4. Send subscription to our backend
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${apiUrl}/notifications/subscribe`,
        { subscription },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Subscribing: Step 7 - Saved to backend. Finished."); 
      setIsSubscribed(true);
    } catch (err: any) {
      console.error("Subscribing: FAILED at Step 4-7", err); 
      setError(err.message || 'Failed to subscribe.');
    } finally {
      console.log("--- Ending Subscription Process ---"); 
      setIsLoading(false);
    }
  };

  return {
    subscribeUser,
    isSubscribed,
    isSupported,
    permission,
    isLoading,
    error,
  };
};