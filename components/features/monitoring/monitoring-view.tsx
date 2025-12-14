// components/features/monitoring/monitoring-view.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, DirectionsRenderer } from '@react-google-maps/api';
import { Card } from '@/components/ui/card';
import { User, Phone, Thermometer, Heart, Battery, Siren, Map as MapIcon, Satellite } from 'lucide-react';

// สไตล์แผนที่ให้เต็มจอ
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem'
};

const centerDefault = { lat: 13.7563, lng: 100.5018 };

export default function MonitoringView({ users }: { users: any[] }) {
  // โหลด Google Maps Script
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP || ''
  });

  const [selectedUser, setSelectedUser] = useState<any>(users[0] || null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [directionsResponse, setDirectionsResponse] = useState<any>(null);

  // 1. หาเคสฉุกเฉินเพื่อ Focus
  useEffect(() => {
    const emergencyUser = users.find(u => u.isEmergency);
    if (emergencyUser) setSelectedUser(emergencyUser);
  }, [users]);

  // 2. คำนวณเส้นทาง (Routing) เมื่อมีคนรับเคส
  useEffect(() => {
    if (isLoaded && selectedUser?.isEmergency && selectedUser?.rescuer && selectedUser.status === 'ACKNOWLEDGED') {
        const directionsService = new google.maps.DirectionsService();
        
        directionsService.route({
            origin: { lat: selectedUser.rescuer.lat, lng: selectedUser.rescuer.lng }, // จุด จนท.
            destination: { lat: selectedUser.location.lat, lng: selectedUser.location.lng }, // จุด ผู้ประสบเหตุ
            travelMode: google.maps.TravelMode.DRIVING,
        }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                setDirectionsResponse(result);
            }
        });
    } else {
        setDirectionsResponse(null);
    }
  }, [isLoaded, selectedUser]);

  if (!isLoaded) return <div className="h-full flex items-center justify-center">Loading Operations Map...</div>;

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4 p-4">
      
      {/* 🟢 Sidebar รายชื่อ (ซ้าย) */}
      <Card className="w-1/4 flex flex-col overflow-hidden bg-white/90 backdrop-blur">
        <div className="p-4 bg-slate-50 border-b font-bold text-slate-700">รายชื่อผู้ใช้งาน</div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {users.map(user => (
                <div 
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 rounded-lg cursor-pointer border transition-all ${
                        selectedUser?.id === user.id ? 'bg-blue-50 border-blue-500 shadow-md' : 'hover:bg-slate-50 border-transparent'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-700">{user.firstName} {user.lastName}</div>
                        {user.isEmergency && (
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-slate-500 flex gap-2 mt-1">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500"/> {user.health.bpm}</span>
                        <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-orange-500"/> {user.health.temp}°C</span>
                    </div>
                </div>
            ))}
        </div>
      </Card>

      {/* 🗺️ Map Area (ขวา) */}
      <Card className="flex-1 relative overflow-hidden shadow-xl border-slate-300">
        
        {/* ปุ่มเปลี่ยนโหมดแผนที่ */}
        <div className="absolute top-4 right-4 z-10 flex gap-2 bg-white/90 p-1 rounded-lg shadow-lg backdrop-blur">
            <button 
                onClick={() => setMapType('roadmap')}
                className={`p-2 rounded-md ${mapType === 'roadmap' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
                <MapIcon size={20} />
            </button>
            <button 
                onClick={() => setMapType('satellite')}
                className={`p-2 rounded-md ${mapType === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
                <Satellite size={20} />
            </button>
        </div>

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={selectedUser?.location ? { lat: selectedUser.location.lat, lng: selectedUser.location.lng } : centerDefault}
          zoom={16}
          mapTypeId={mapType}
          options={{
              disableDefaultUI: true, // ปิดปุ่มรกๆ ของ Google
              zoomControl: true,
          }}
        >
          {/* 🔴 1. จุดผู้ประสบเหตุ (Victim) - Pulse Effect */}
          {selectedUser?.location && (
              <OverlayView
                position={{ lat: selectedUser.location.lat, lng: selectedUser.location.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                  <div className="relative flex items-center justify-center w-12 h-12 -translate-x-1/2 -translate-y-1/2">
                      {/* วงแหวนกระจาย (Ripple) */}
                      {selectedUser.isEmergency && (
                          <div className="absolute w-full h-full rounded-full bg-red-500 opacity-30 animate-ping"></div>
                      )}
                      {/* วงแหวนรอง */}
                      <div className={`absolute w-8 h-8 rounded-full opacity-50 ${selectedUser.isEmergency ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
                      {/* จุดแกนกลาง */}
                      <div className={`relative w-4 h-4 border-2 border-white rounded-full shadow-lg ${selectedUser.isEmergency ? 'bg-red-600' : 'bg-blue-600'}`}></div>
                      
                      {/* Label ชื่อ */}
                      <div className="absolute top-full mt-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm">
                          {selectedUser.firstName}
                      </div>
                  </div>
              </OverlayView>
          )}

          {/* 🔵 2. จุดผู้ช่วยเหลือ (Rescuer) - Police Light Effect */}
          {selectedUser?.status === 'ACKNOWLEDGED' && selectedUser?.rescuer && (
               <OverlayView
               position={{ lat: selectedUser.rescuer.lat, lng: selectedUser.rescuer.lng }}
               mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
             >
                 <div className="relative flex items-center justify-center w-12 h-12 -translate-x-1/2 -translate-y-1/2">
                     {/* เอฟเฟกต์ไฟไซเรน (Custom CSS Animation) */}
                     <div className="absolute w-full h-full rounded-full bg-blue-500 opacity-40 animate-[spin_1s_linear_infinite]"></div>
                     <div className="absolute w-10 h-10 rounded-full bg-red-500 opacity-30 animate-ping delay-75"></div>
                     
                     {/* จุดแกนกลาง (สลับสี) */}
                     <div className="relative w-5 h-5 border-2 border-white rounded-full shadow-lg bg-gradient-to-r from-red-600 to-blue-600 animate-pulse"></div>
                     
                     {/* Label จนท. */}
                     <div className="absolute bottom-full mb-2 bg-blue-900/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap border border-blue-400">
                         👮‍♂️ จนท. {selectedUser.rescuer.name}
                     </div>
                 </div>
             </OverlayView>
          )}

          {/* 🛣️ 3. เส้นทาง (Route Line) */}
          {directionsResponse && (
            <DirectionsRenderer
              directions={directionsResponse}
              options={{
                suppressMarkers: true, // ซ่อนหมุดเดิมของ Google (เพราะเราสร้างเองแล้ว)
                polylineOptions: {
                  strokeColor: "#3B82F6", // สีเส้นทาง (ฟ้า)
                  strokeWeight: 5,
                  strokeOpacity: 0.8,
                }
              }}
            />
          )}

        </GoogleMap>

        {/* 📟 Status Panel (ลอยอยู่ด้านล่าง) */}
        {selectedUser && (
            <div className="absolute bottom-6 left-6 right-6 z-10">
                <Card className="bg-white/95 backdrop-blur shadow-2xl p-4 border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase font-bold">สถานะ</span>
                                <span className={`font-bold text-lg ${selectedUser.isEmergency ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                                    {selectedUser.isEmergency ? '🚨 EMERGENCY' : '✅ NORMAL'}
                                </span>
                            </div>
                            <div className="h-10 w-[1px] bg-slate-200"></div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase font-bold">แบตเตอรี่</span>
                                <div className="flex items-center gap-1 font-mono text-lg">
                                    <Battery className={`w-5 h-5 ${selectedUser.location?.battery < 20 ? 'text-red-500' : 'text-green-500'}`} />
                                    {selectedUser.location?.battery}%
                                </div>
                            </div>
                        </div>

                        {/* ปุ่มรับเคส (ถ้าเป็นเหตุฉุกเฉิน) */}
                        {selectedUser.isEmergency && selectedUser.status !== 'ACKNOWLEDGED' && (
                             <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-red-500/30 transition-all flex items-center gap-2 animate-bounce">
                                <Siren className="w-5 h-5" />
                                รับเคสทันที
                             </button>
                        )}
                         
                        {selectedUser.status === 'ACKNOWLEDGED' && (
                            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold border border-blue-200 flex items-center gap-2">
                                👮‍♂️ เจ้าหน้าที่กำลังเดินทาง
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        )}

      </Card>
    </div>
  );
}