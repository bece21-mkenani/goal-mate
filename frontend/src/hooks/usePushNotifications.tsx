import { useState, useEffect } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3036';

// Helper function (unchanged)
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
    // Check for browser support
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
    console.log("--- Starting Subscription Process ---"); // <-- NEW
    setIsLoading(true);
    setError(null);

    // 1. Get VAPID key
    let vapidPublicKey = '';
    try {
      console.log("Subscribing: Step 1 - Getting VAPID key..."); // <-- NEW
      const response = await axios.get(`${apiUrl}/notifications/vapid-key`);
      vapidPublicKey = response.data.publicKey;
      console.log("Subscribing: Step 2 - Got VAPID key."); // <-- NEW
    } catch (err: any) {
      console.error("Subscribing: FAILED at Step 1", err); // <-- NEW
      setError('Failed to contact server for subscription.');
      setIsLoading(false);
      return;
    }

    // 2. Ask user for permission
    if (permission === 'default') {
      console.log("Subscribing: Step 3 - Requesting permission..."); // <-- NEW
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      if (newPermission !== 'granted') {
        console.log("Subscribing: Permission was not granted."); // <-- NEW
        setError('Permission was not granted.');
        setIsLoading(false);
        return;
      }
    }

    if (permission === 'denied') {
      console.log("Subscribing: Permission is denied."); // <-- NEW
      setError('Permission is denied. Please change it in your browser settings.');
      setIsLoading(false);
      return;
    }

    // 3. Create the subscription
    try {
      console.log("Subscribing: Step 4 - Permission OK. Getting service worker..."); // <-- NEW
      const registration = await navigator.serviceWorker.ready;
      
      console.log("Subscribing: Step 5 - Got service worker. Creating subscription..."); // <-- NEW
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log("Subscribing: Step 6 - Got subscription. Saving to backend..."); // <-- NEW
      // 4. Send subscription to our backend
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${apiUrl}/notifications/subscribe`,
        { subscription },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Subscribing: Step 7 - Saved to backend. Finished."); // <-- NEW
      setIsSubscribed(true);
    } catch (err: any) {
      console.error("Subscribing: FAILED at Step 4-7", err); // <-- NEW
      setError(err.message || 'Failed to subscribe.');
    } finally {
      console.log("--- Ending Subscription Process ---"); // <-- NEW
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