export const ALERT_TYPES = {
  SAFEZONE: 'safezone',
  HEARTRATE: 'heartrate',
  TEMPERATURE: 'temperature',
  FALL: 'fall',
  BATTERY: 'battery',
  SOS: 'sos',
} as const;

export const ALERT_THRESHOLDS = {
  HEARTRATE_MIN: 50,
  HEARTRATE_MAX: 120,
  TEMPERATURE_MIN: 36.0,
  TEMPERATURE_MAX: 37.5,
  BATTERY_LOW: 20,
  SAFEZONE_RADIUS_LV1: 100,
  SAFEZONE_RADIUS_LV2: 500,
}

export const USER_STATUS = {
  ADMIN: 1,
  USER: 2,
  CAREGIVER: 3,
} as const;