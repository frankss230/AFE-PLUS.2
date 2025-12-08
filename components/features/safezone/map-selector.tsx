'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Icon
const icon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={icon} />
  );
}

interface MapSelectorProps {
    lat: number;
    lng: number;
    r1: number;
    r2: number;
    onChange: (lat: number, lng: number) => void;
}

export default function MapSelector({ lat, lng, r1, r2, onChange }: MapSelectorProps) {
  const [mapType, setMapType] = useState<'street' | 'satellite'>('satellite');

  return (
    <div className="relative w-full h-full">

        <div className="absolute top-20 right-4 z-[1000] flex bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-gray-100">
            <button 
                onClick={() => setMapType('street')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                    mapType === 'street' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
            >
                แผนที่
            </button>
            <button 
                onClick={() => setMapType('satellite')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                    mapType === 'satellite' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
            >
                ดาวเทียม
            </button>
        </div>

        <MapContainer center={[lat, lng]} zoom={16} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            
            {mapType === 'satellite' ? (
                <TileLayer
                    attribution='Tiles &copy; Esri'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                />
            ) : (
                <TileLayer 
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                />
            )}
        
            <Circle center={[lat, lng]} radius={r2} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.08, weight: 1, dashArray: '5, 5' }} />
            <Circle center={[lat, lng]} radius={r1} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.15, weight: 2 }} />
            
            <LocationMarker position={[lat, lng]} setPosition={(pos) => onChange(pos[0], pos[1])} />
        </MapContainer>
    </div>
  );
}