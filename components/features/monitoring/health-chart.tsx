'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Battery, Activity, Thermometer, User, Phone, Map as MapIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';


const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const MapController = dynamic(
  () => import('./map-controller'), 
  { ssr: false }
);


interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  lineId: string | null;
  location: {
    lat: number;
    lng: number;
    battery: number;
    updatedAt: Date;
  } | null;
  caregiver: {
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null;
  health: {
    bpm: number;
    temp: number;
  } | null;
}

export default function MonitoringView({ users }: { users: UserData[] }) {
  const searchParams = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showCaregiverPopup, setShowCaregiverPopup] = useState(false);

  
  useEffect(() => {
    const focusId = searchParams.get('focusUser');
    if (focusId) {
      const id = parseInt(focusId);
      if (users.find(u => u.id === id)) {
        setSelectedUserId(id);
      }
    } else if (users.length > 0 && !selectedUserId) {
      
      setSelectedUserId(users[0].id);
    }
  }, [searchParams, users]);

  
  const currentUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      
      {}
      <Card className="lg:col-span-1 flex flex-col overflow-hidden border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <h2 className="font-bold text-slate-700">รายชื่อผู้สูงอายุ ({users.length})</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => {
                setSelectedUserId(user.id);
                
                setShowCaregiverPopup(true);
              }}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                selectedUserId === user.id
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <Avatar className="h-10 w-10 border border-slate-200">
                <AvatarFallback className="bg-slate-200 text-slate-600">
                  {user.firstName.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <p className={`font-semibold text-sm ${selectedUserId === user.id ? 'text-blue-700' : 'text-slate-700'}`}>
                   คุณ{user.firstName} {user.lastName}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                   <span className="flex items-center gap-1">
                     <Battery className="h-3 w-3" /> {user.location?.battery ?? '-'}%
                   </span>
                   {user.location ? (
                       <span className="text-green-600">● ออนไลน์</span>
                   ) : (
                       <span className="text-slate-400">○ ออฟไลน์</span>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {}
      <div className="lg:col-span-2 flex flex-col gap-6 h-full">
        
        {}
        <Card className="flex-1 overflow-hidden border-slate-200 relative z-0">
           {currentUser?.location ? (
             <MapContainer 
                center={[currentUser.location.lat, currentUser.location.lng]} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
             >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {}
                <MapController lat={currentUser.location.lat} lng={currentUser.location.lng} />

                <Marker position={[currentUser.location.lat, currentUser.location.lng]}>
                   <Popup>
                      <div className="text-center">
                        <b>{currentUser.firstName}</b><br/>
                        แบตเตอรี่: {currentUser.location.battery}%
                      </div>
                   </Popup>
                </Marker>
             </MapContainer>
           ) : (
             <div className="flex h-full items-center justify-center bg-slate-100 text-slate-400">
                <div className="text-center">
                   <MapIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                   <p>ไม่พบพิกัดตำแหน่งล่าสุด</p>
                </div>
             </div>
           )}
        </Card>

        {}
        <Card className="p-4 border-slate-200 bg-white shrink-0">
           {currentUser ? (
              <div className="flex items-center justify-around text-center divide-x divide-slate-100">
                  
                  {}
                  <div className="flex-1 px-2">
                     <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                        <Battery className="h-4 w-4" /> แบตเตอรี่
                     </p>
                     <p className="text-xl font-bold text-slate-800">{currentUser.location?.battery ?? 0}%</p>
                  </div>

                  {}
                  <div className="flex-1 px-2">
                     <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                        <Activity className="h-4 w-4 text-red-500" /> ชีพจร
                     </p>
                     <p className="text-xl font-bold text-slate-800">{currentUser.health?.bpm ?? '-'} <span className="text-xs font-normal">bpm</span></p>
                  </div>

                  {}
                  <div className="flex-1 px-2">
                     <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                        <Thermometer className="h-4 w-4 text-orange-500" /> อุณหภูมิ
                     </p>
                     <p className="text-xl font-bold text-slate-800">{currentUser.health?.temp ?? '-'} <span className="text-xs font-normal">°C</span></p>
                  </div>

              </div>
           ) : (
              <p className="text-center text-slate-400 text-sm">กรุณาเลือกรายชื่อผู้สูงอายุ</p>
           )}
        </Card>

      </div>

      {}
      <Dialog open={showCaregiverPopup} onOpenChange={setShowCaregiverPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                ข้อมูลผู้ดูแล
            </DialogTitle>
            <DialogDescription>
                ผู้ดูแลของ คุณ{currentUser?.firstName} {currentUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-4 py-4">
             <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
             </div>
             <div className="flex-1 space-y-1">
                <p className="font-medium text-slate-900 leading-none">
                    {currentUser?.caregiver?.firstName || "ไม่ระบุ"} {currentUser?.caregiver?.lastName || ""}
                </p>
                <p className="text-sm text-slate-500">
                    Primary Caregiver
                </p>
             </div>
          </div>
          
          <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
             <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="h-4 w-4" />
                <span>{currentUser?.caregiver?.phone || "ไม่มีเบอร์โทรศัพท์"}</span>
             </div>
             {currentUser?.caregiver?.phone && (
                 <a href={`tel:${currentUser.caregiver.phone}`} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600">
                    โทรออก
                 </a>
             )}
          </div>

        </DialogContent>
      </Dialog>

    </div>
  );
}