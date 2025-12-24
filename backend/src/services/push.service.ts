import admin from 'firebase-admin';
import config from '../config/environment';
import logger from '../utils/logger';

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase(): void {
  try {
    // Check if Firebase credentials are configured
    if (
      !config.firebase?.projectId ||
      !config.firebase?.clientEmail ||
      !config.firebase?.privateKey
    ) {
      logger.warn('Firebase credentials not configured. Push notifications will be disabled.');
      return;
    }

    // Check for placeholder values
    if (
      config.firebase.projectId.includes('your-') ||
      config.firebase.clientEmail.includes('your-') ||
      config.firebase.privateKey.includes('Your_Private_Key_Here')
    ) {
      logger.warn('Firebase credentials contain placeholder values. Push notifications will be disabled.');
      return;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
      }),
    });

    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.warn('Failed to initialize Firebase Admin SDK. Push notifications will be disabled.');
    logger.debug('Firebase error details:', error);
  }
}

/**
 * Send a push notification to a single device
 */
export async function sendPushNotification(
  deviceToken: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!firebaseApp) {
    logger.debug('Firebase not initialized, skipping push notification');
    return false;
  }

  try {
    const message: admin.messaging.Message = {
      token: deviceToken,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'chat_messages',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.debug(`Push notification sent: ${response}`);
    return true;
  } catch (error: any) {
    // Handle invalid token error
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      logger.warn(`Invalid device token: ${deviceToken}`);
      // TODO: Remove invalid token from database
    } else {
      logger.error('Push notification error:', error);
    }
    return false;
  }
}

/**
 * Send push notifications to multiple devices
 */
export async function sendPushNotificationToMultiple(
  deviceTokens: string[],
  payload: PushNotificationPayload
): Promise<{ successCount: number; failureCount: number }> {
  if (!firebaseApp || deviceTokens.length === 0) {
    return { successCount: 0, failureCount: deviceTokens.length };
  }

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens: deviceTokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'chat_messages',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Log failed tokens
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          logger.warn(`Failed to send to token ${deviceTokens[idx]}: ${resp.error?.message}`);
        }
      });
    }

    logger.debug(
      `Push notifications sent: ${response.successCount} success, ${response.failureCount} failed`
    );

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    logger.error('Multicast push notification error:', error);
    return { successCount: 0, failureCount: deviceTokens.length };
  }
}

/**
 * Subscribe a device to a topic
 */
export async function subscribeToTopic(
  deviceToken: string,
  topic: string
): Promise<boolean> {
  if (!firebaseApp) {
    return false;
  }

  try {
    await admin.messaging().subscribeToTopic([deviceToken], topic);
    logger.debug(`Subscribed ${deviceToken} to topic: ${topic}`);
    return true;
  } catch (error) {
    logger.error('Subscribe to topic error:', error);
    return false;
  }
}

/**
 * Unsubscribe a device from a topic
 */
export async function unsubscribeFromTopic(
  deviceToken: string,
  topic: string
): Promise<boolean> {
  if (!firebaseApp) {
    return false;
  }

  try {
    await admin.messaging().unsubscribeFromTopic([deviceToken], topic);
    logger.debug(`Unsubscribed ${deviceToken} from topic: ${topic}`);
    return true;
  } catch (error) {
    logger.error('Unsubscribe from topic error:', error);
    return false;
  }
}

/**
 * Send a push notification to a topic
 */
export async function sendPushToTopic(
  topic: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!firebaseApp) {
    return false;
  }

  try {
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'chat_messages',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.debug(`Push notification sent to topic ${topic}: ${response}`);
    return true;
  } catch (error) {
    logger.error('Topic push notification error:', error);
    return false;
  }
}

export default {
  initializeFirebase,
  sendPushNotification,
  sendPushNotificationToMultiple,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendPushToTopic,
};
