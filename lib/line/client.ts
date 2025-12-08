import { Client } from '@line/bot-sdk';
import { env } from '@/config/env';

const config = {
  channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: env.LINE_CHANNEL_SECRET,
};

export const lineClient = new Client(config);

export async function sendLineNotification(
  userId: string,
  message: string
) {
  try {
    await lineClient.pushMessage(userId, {
      type: 'text',
      text: message,
    });
  } catch (error) {
    console.error('Failed to send LINE notification:', error);
  }
}

export async function sendFlexMessage(
  userId: string,
  altText: string,
  flexContent: any
) {
  try {
    await lineClient.pushMessage(userId, {
      type: 'flex',
      altText,
      contents: flexContent,
    });
  } catch (error) {
    console.error('Failed to send Flex message:', error);
  }
}