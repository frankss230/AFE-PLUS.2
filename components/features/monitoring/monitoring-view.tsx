'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Battery, Activity, Thermometer, User, Phone, ShieldCheck, AlertTriangle, Siren } from 'lucide-react';

// Map Setup
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useMap } from 'react-leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

function MapControllerComponent({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, map]);
  return null;
}
const MapController = dynamic(() => Promise.resolve(MapControllerComponent), { ssr: false });

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  isEmergency: boolean;
  emergencyType: string | null;
  location: { lat: number; lng: number; battery: number; updatedAt: Date } | null;
  caregiver: { firstName: string; lastName: string; phone: string | null } | null;
  health: { bpm: number; temp: number } | null;
}

export default function MonitoringView({ users }: { users: UserData[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showCaregiverPopup, setShowCaregiverPopup] = useState(false);
  
  // Leaflet Icon Fix
  useEffect(() => {
    (async () => {
        const L = (await import('leaflet')).default;
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    })();
  }, []);

  // Auto Refresh
  useEffect(() => {
    const interval = setInterval(() => { router.refresh(); }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  // Auto Select
  useEffect(() => {
    const focusId = searchParams.get('focusUser');
    if (focusId) {
        const id = parseInt(focusId);
        if (users.find(u => u.id === id)) setSelectedUserId(id);
    } else if (users.length > 0 && !selectedUserId) {
        setSelectedUserId(users[0].id);
    }
  }, [searchParams, users]);

  const currentUser = users.find(u => u.id === selectedUserId);
  const showMap = currentUser?.isEmergency || (searchParams.get('focusUser') === String(currentUser?.id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-170px)] min-h-[500px]">
      
      {/* --- LEFT: List --- */}
      <Card className="lg:col-span-1 flex flex-col overflow-hidden border-slate-200 shadow-sm">
        <div className="p-4 bg-white border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-blue-600" />
            รายชื่อผู้พึ่งพิง ({users.length}) 
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => {
                if (selectedUserId === user.id) setShowCaregiverPopup(true);
                else setSelectedUserId(user.id);
              }}
              className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                selectedUserId === user.id
                  ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100'
                  : 'bg-white border-transparent hover:bg-slate-50'
              } ${user.isEmergency ? 'bg-red-50 border-red-200 animate-pulse' : ''}`}
            >
              {user.isEmergency && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
              )}
              <Avatar className="h-10 w-10 border border-slate-200 bg-white">
                <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                  {user.firstName.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <p className={`font-bold text-sm truncate ${selectedUserId === user.id ? 'text-blue-700' : 'text-slate-700'}`}>
                        คุณ{user.firstName} {user.lastName}
                    </p>
                    {user.isEmergency && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                   <span className="flex items-center gap-1">
                     <Battery className={`h-3 w-3 ${user.location?.battery && user.location.battery < 20 ? 'text-red-500' : 'text-slate-400'}`} /> 
                     {user.location?.battery ?? '-'}%
                   </span>
                   {user.isEmergency ? (
                       <span className="text-red-600 font-bold flex items-center gap-1"><Siren className="h-3 w-3"/> ฉุกเฉิน!</span>
                   ) : (
                       <span className="text-green-600 flex items-center gap-1">● ปกติ</span>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* --- RIGHT: Map & Stats (Fixed Layout) --- */}
      <div className="lg:col-span-2 flex flex-col h-full gap-4 overflow-hidden">
        
        {/* 1. MAP / SHIELD AREA (ยืดหยุ่นตามพื้นที่เหลือ) */}
        <Card className="flex-1 min-h-0 overflow-hidden border-slate-200 relative shadow-sm rounded-xl bg-slate-50">
           {showMap && currentUser?.location ? (
             // 🚨 Mode: Emergency (Show Map)
             <MapContainer 
                center={[currentUser.location.lat, currentUser.location.lng]} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
             >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController lat={currentUser.location.lat} lng={currentUser.location.lng} />
                <Marker position={[currentUser.location.lat, currentUser.location.lng]}>
                   <Popup><div className="text-center font-bold text-red-600">จุดเกิดเหตุ!</div></Popup>
                </Marker>
             </MapContainer>
           ) : (
             // 🛡️ Mode: Normal (Show Shield)
             <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white">
                 <div className="p-6 bg-green-100 rounded-full mb-6 shadow-inner">
                      <ShieldCheck className="w-20 h-20 text-green-600" strokeWidth={1.5} />
                 </div>
                 <h3 className="text-2xl font-bold text-green-800 mb-2">สถานะปลอดภัย</h3>
                 <p className="text-slate-500 text-sm max-w-xs text-center">
                      ตำแหน่งปัจจุบันถูกซ่อนเพื่อความเป็นส่วนตัว<br/>ระบบจะแสดงแผนที่อัตโนมัติเมื่อมีเหตุฉุกเฉิน
                 </p>
             </div>
           )}
        </Card>

        {/* 2. STATUS BAR (Fix ด้านล่าง) */}
        <Card className="shrink-0 p-4 border-slate-200 bg-white shadow-sm">
           <div className="grid grid-cols-3 gap-4 divide-x divide-slate-100">
               <StatBox icon={<Activity />} label="ชีพจร" value={currentUser?.health?.bpm} unit="bpm" color="rose" />
               <StatBox icon={<Thermometer />} label="อุณหภูมิ" value={currentUser?.health?.temp} unit="°C" color="orange" />
               <StatBox icon={<Battery />} label="แบตเตอรี่" value={currentUser?.location?.battery} unit="%" color="slate" />
           </div>
        </Card>

      </div>

      {/* Popup Caregiver */}
      <Dialog open={showCaregiverPopup} onOpenChange={setShowCaregiverPopup}>
        <DialogContent className="sm:max-w-xs rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
           <div className="bg-slate-800 p-5 text-center text-white">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><Phone className="h-6 w-6"/></div>
              <DialogTitle>ผู้ดูแลหลัก</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">สำหรับ คุณ{currentUser?.firstName}</DialogDescription>
           </div>
           <div className="p-6 bg-white text-center space-y-4">
              <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">ชื่อ-สกุล</p>
                  <p className="text-lg font-bold text-slate-800">{currentUser?.caregiver?.firstName} {currentUser?.caregiver?.lastName}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-xs text-green-600 font-bold mb-1">เบอร์โทรศัพท์</p>
                  <p className="text-xl font-mono font-black text-green-700">{currentUser?.caregiver?.phone || '-'}</p>
              </div>
           </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function StatBox({ icon, label, value, unit, color }: any) {
    const colors: any = {
        rose: 'text-rose-500 bg-rose-50 border-rose-100',
        orange: 'text-orange-500 bg-orange-50 border-orange-100',
        slate: 'text-slate-500 bg-slate-50 border-slate-100'
    };

    return (
        <div className="flex flex-col items-center justify-center text-center">
            <div className={`flex items-center gap-2 mb-1 text-xs font-bold text-slate-500`}>
                <div className={`${colors[color].split(' ')[0]}`}>{icon}</div>
                {label}
            </div>
            <div className="flex items-baseline gap-1">
                <span className="font-black text-2xl text-slate-800">
                    {value || '-'}
                </span>
                <span className="text-xs font-medium text-slate-400">{unit}</span>
            </div>
        </div>
    )
}