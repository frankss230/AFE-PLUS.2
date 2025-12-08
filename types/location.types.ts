export interface Location {
  id: number;
  userId: number;
  caregiverId: number;
  latitude: number;
  longitude: number;
  distance: number;
  battery: number;
  status: number;
  timestamp: Date;
}

export interface LocationUpdate {
  caregiverId: number;
  latitude: number;
  longitude: number;
  battery: number;
}