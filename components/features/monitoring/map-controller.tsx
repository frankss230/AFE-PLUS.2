'use client';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 15, { duration: 1.5 }); // บินไปหาพิกัดใหม่ สวยๆ
    }
  }, [lat, lng, map]);

  return null;
}