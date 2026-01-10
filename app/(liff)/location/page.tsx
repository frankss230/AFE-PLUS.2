'use client';

import { useSearchParams } from 'next/navigation';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useEffect, useCallback } from 'react';

const containerStyle = { width: '100%', height: '100%' };
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  zoomControl: true,
};

const CAREGIVER_ICON_URL = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
const DEPENDENT_ICON_URL = "https://maps.google.com/mapfiles/kml/shapes/man.png";

export default function LocationPage() {
  const searchParams = useSearchParams();
  
  const targetLat = parseFloat(searchParams.get('lat') || '0');
  const targetLng = parseFloat(searchParams.get('lng') || '0');
  const dependentId = searchParams.get('id');
  const mode = searchParams.get('mode') || 'navigate';
  const isNavigationMode = mode === 'navigate';

  const [dependentInfo, setDependentInfo] = useState({ 
    name: 'กำลังโหลด...', 
    phone: '', 
    battery: 0 
  });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP || ""
  });

  const [myLocation, setMyLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  const [showDependentInfo, setShowDependentInfo] = useState(true);
  const [showCaregiverInfo, setShowCaregiverInfo] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    if (dependentId) {
      fetch(`/api/dependent/info?id=${dependentId}`)
        .then(res => res.json())
        .then(response => {
            console.log(" API Response:", response);

            const data = response.data || response.result || response;

            const profile = data.dependentProfile || data;

            if (profile) {
                const firstName = profile.firstName || '';
                const lastName = profile.lastName || '';
                const fullName = (firstName || lastName) 
                    ? `คุณ${firstName} ${lastName}`.trim()
                    : 'ผู้ที่มีภาวะพึ่งพิง';

                setDependentInfo({
                    name: fullName,
                    phone: profile.phone || '1669',
                    battery: (typeof profile.battery === 'number') ? profile.battery : 0
                });
            }
        })
        .catch(err => {
            console.error(" Fetch Error:", err);
            setDependentInfo(prev => ({ ...prev, name: 'ไม่สามารถโหลดข้อมูลได้' }));
        });
    }
  }, [dependentId]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setMyLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (err) => setGpsError("กรุณาเปิด GPS"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsError("Browser ไม่รองรับ GPS");
    }
  }, []);

  const directionsCallback = useCallback((result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (status === 'OK' && result) setDirections(prev => prev ? prev : result);
  }, []);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAP) return <div className="p-4 text-red-500">Error: Missing API Key</div>;
  if (!isLoaded) return <div className="flex items-center justify-center h-screen">กำลังโหลดแผนที่...</div>;

  const targetLocation = { lat: targetLat, lng: targetLng };
  const googleMapsAppUrl = `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}&travelmode=driving`;

  return (
    <div className="relative w-screen h-screen">
      
      {isNavigationMode && !myLocation && !gpsError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 px-4 py-2 rounded-full shadow-md text-sm font-bold animate-pulse">
          กำลังค้นหาตำแหน่งของคุณ...
        </div>
      )}

      <button
        onClick={() => setMapType(prev => prev === 'roadmap' ? 'hybrid' : 'roadmap')}
        className="absolute top-4 right-4 z-50 bg-white px-4 py-2 rounded-full shadow-lg font-bold text-sm border border-gray-200"
      >
        {mapType === 'roadmap' ? 'ดาวเทียม' : 'แผนที่'}
      </button>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={targetLocation}
        zoom={15}
        options={mapOptions}
        mapTypeId={mapType}
      >
        {isNavigationMode && myLocation && (
          <DirectionsService
            options={{ origin: myLocation, destination: targetLocation, travelMode: google.maps.TravelMode.DRIVING }}
            callback={directionsCallback}
          />
        )}

        {isNavigationMode && directions && (
          <DirectionsRenderer options={{ directions: directions, suppressMarkers: true, polylineOptions: { strokeColor: "#0088FF", strokeWeight: 6 } }} />
        )}

        {isNavigationMode && myLocation && (
          <Marker position={myLocation} icon={CAREGIVER_ICON_URL} zIndex={1} onClick={() => setShowCaregiverInfo(!showCaregiverInfo)}>
             {showCaregiverInfo && (
              <InfoWindow position={myLocation} onCloseClick={() => setShowCaregiverInfo(false)}>
                <div className="p-1 font-bold text-blue-600 text-xs">ตำแหน่งของคุณ</div>
              </InfoWindow>
            )}
          </Marker>
        )}

        <Marker
          position={targetLocation}
          animation={google.maps.Animation.DROP}
          zIndex={10}
          icon={{ url: DEPENDENT_ICON_URL, scaledSize: new google.maps.Size(40, 40), anchor: new google.maps.Point(20, 20) }}
          onClick={() => setShowDependentInfo(!showDependentInfo)}
        />

          {showDependentInfo && (
            <InfoWindow position={targetLocation} onCloseClick={() => setShowDependentInfo(false)} options={{ pixelOffset: new google.maps.Size(0, -45) }}>
              <div style={{ padding: '8px', maxWidth: '220px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#111' }}>
                   {dependentInfo.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                     แบตเตอรี่: <span style={{ color: dependentInfo.battery < 20 ? 'red' : 'green', fontWeight:'bold' }}>{dependentInfo.battery}%</span>
                </p>
                <a href={`tel:${dependentInfo.phone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#28a745', color: 'white', padding: '8px 12px', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
                   โทรหา
                </a>
                <a href={googleMapsAppUrl} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign:'center', fontSize: '12px', color: '#0088FF', fontWeight:'bold', textDecoration: 'none' }}>
                  เปิดใน Google Maps App 
                </a>
              </div>
            </InfoWindow>
          )}
      </GoogleMap>
    </div>
  );
}