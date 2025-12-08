export type AlertType = 'safezone' | 'heartrate' | 'temperature' | 'fall' | 'battery' | 'sos';

export interface Alert {
  id: number;
  type: AlertType;
  caregiverId: number;
  userId: number;
  message: string;
  latitude?: number;
  longitude?: number;
  value?: number;
  timestamp: Date;
  isRead: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: number;
}

export interface CreateAlertData {
  type: AlertType;
  caregiverId: number;
  userId: number;
  message: string;
  latitude?: number;
  longitude?: number;
  value?: number;
}