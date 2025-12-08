export interface LINEProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LINEWebhookEvent {
  type: string;
  timestamp: number;
  source: {
    type: string;
    userId?: string;
  };
  replyToken?: string;
  message?: {
    type: string;
    text?: string;
  };
}