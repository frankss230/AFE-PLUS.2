'use client';

import { useState, useEffect } from 'react';
import liff from '@line/liff';
import dynamic from 'next/dynamic';
import { Save, Loader2, MapPin, Minus, Plus } from 'lucide-react';
import { getElderlySafetySettings, updateSafezone, toggleGpsMode } from '@/actions/safety-settings.actions'; // ✅ ต้องเพิ่ม toggleGpsMode ใน actions ด้วย
import { toast } from 'sonner';
import LiffGuard from '@/components/auth/liff-guard';
import { Switch } from '@/components/ui/switch'; 

// Load Map
const MapSelector = dynamic(() => import('@/components/features/safezone/map-selector'), { 
    ssr: false, 
    loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div> 
});

export default function SafezoneSettingPage() {
  return <LiffGuard><SafezoneContent /></LiffGuard>;
}

function SafezoneContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingGps, setTogglingGps] = useState(false); // State สำหรับ Loading ตอนกดสวิตช์
  
  // State ข้อมูล
  const [lineId, setLineId] = useState('');
  const [lv1, setLv1] = useState(100);
  const [lv2, setLv2] = useState(500);
  const [lat, setLat] = useState(13.7563);
  const [lng, setLng] = useState(100.5018);
  const [isGpsOn, setIsGpsOn] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setLineId(profile.userId);
            
            const res = await getElderlySafetySettings(profile.userId);
            
            if (res.success && res.data) {
                setLv1(res.data.safezone.radiusLv1 || 100);
                setLv2(res.data.safezone.radiusLv2 || 500);
                if (res.data.safezone.latitude) {
                    setLat(res.data.safezone.latitude);
                    setLng(res.data.safezone.longitude);
                }
                setIsGpsOn(res.data.isGpsEnabled ?? true);
            }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // ✅ ฟังก์ชันสำหรับกดสวิตช์ GPS แล้วอัปเดตทันที
  const handleGpsToggle = async (checked: boolean) => {
    // เปลี่ยนค่าใน UI ก่อนเพื่อให้ดูเร็ว
    setIsGpsOn(checked);
    setTogglingGps(true);

    // ยิง API ไปอัปเดต Database ทันที
    const res = await toggleGpsMode(lineId, checked);
    
    if (!res.success) {
        // ถ้าพัง ให้ดีดค่ากลับ
        setIsGpsOn(!checked);
        toast.error("เกิดข้อผิดพลาดในการเปลี่ยนโหมด GPS");
    } else {
        toast.success(checked ? "เปิด GPS แล้ว" : "ปิด GPS แล้ว");
    }
    setTogglingGps(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // ปุ่มบันทึกจะอัปเดตแค่ค่า Safezone (ส่วน GPS อัปเดตไปแล้วตอนกดสวิตช์)
    // แต่ส่งค่า isGpsOn ไปด้วยก็ได้เพื่อความชัวร์
    const res = await updateSafezone(lineId, lv1, lv2, lat, lng, isGpsOn);
    if (res.success) {
        toast.success("บันทึกเรียบร้อย");
        setTimeout(() => liff.closeWindow(), 1000);
    } else {
        toast.error("บันทึกไม่สำเร็จ");
    }
    setSaving(false);
  };

  const adjustVal = (setter: any, val: number, delta: number) => setter(Math.max(10, val + delta));
  
  const handleInput = (setter: any, val: string) => {
      const num = parseInt(val);
      if (!isNaN(num)) setter(num);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-green-600" /></div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden relative font-sans">
      
      {/* Header (ลอย) */}
      <div className="absolute top-0 left-0 w-full z-20 p-4 pointer-events-none">
          <div className="flex justify-end items-start">

            {/* GPS Switch Card (Real-time Update) */}
            <div className="bg-white/90 backdrop-blur shadow-lg rounded-2xl p-3 pointer-events-auto flex items-center gap-3 border border-green-100 transition-all">
                <div className={`w-2 h-2 rounded-full ${isGpsOn ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <div className="flex flex-col mr-1">
                    <span className="text-xs font-bold text-gray-700">GPS Tracker</span>
                    <span className="text-[10px] text-gray-500">
                        {togglingGps ? 'กำลังบันทึก...' : (isGpsOn ? 'กำลังทำงาน' : 'ปิดเพื่อประหยัดแบต')}
                    </span>
                </div>
                
                {/* ✅ ใช้ handleGpsToggle แทน setIsGpsOn ตรงๆ */}
                <Switch 
                    checked={isGpsOn} 
                    onCheckedChange={handleGpsToggle} 
                    disabled={togglingGps} // ห้ามกดรัวๆ
                    className="data-[state=checked]:bg-green-500 ml-2" 
                />
            </div>
          </div>
      </div>

      {/* Map Section */}
      <div className="flex-1 relative bg-slate-200">
         <MapSelector lat={lat} lng={lng} r1={lv1} r2={lv2} onChange={(l: number, n: number) => { setLat(l); setLng(n); }} />
         
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm z-[400] text-xs text-gray-600 flex items-center gap-2 pointer-events-none opacity-85">
            <MapPin className="w-3 h-3 text-red-500" /> แตะเพื่อปักจุดศูนย์กลาง Safezone
         </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-8 relative z-30 shrink-0">
         
         <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

         <div className="space-y-6">
            
            {/* Radius Level 1 */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-200"></div> 
                        เขตปลอดภัย ชั้นที่ 1
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => adjustVal(setLv1, lv1, -10)} className="w-12 h-10 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-95 transition-all"><Minus className="w-5 h-5" /></button>
                    <div className="flex-1 relative">
                        <input type="number" value={lv1} onChange={(e) => handleInput(setLv1, e.target.value)} className="w-full h-10 text-center text-xl font-bold text-gray-700 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-green-500 transition-all" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">ม.</span>
                    </div>
                    <button onClick={() => adjustVal(setLv1, lv1, 10)} className="w-12 h-10 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-95 transition-all"><Plus className="w-5 h-5" /></button>
                </div>
                <div className="px-1 pt-1">
                    <input type="range" min="10" max="1000" step="10" value={lv1} onChange={(e) => setLv1(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500" />
                </div>
            </div>

            {/* Radius Level 2 */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200"></div> 
                        เขตปลอดภัย ชั้นที่ 2
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => adjustVal(setLv2, lv2, -50)} className="w-12 h-10 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-95 transition-all"><Minus className="w-5 h-5" /></button>
                    <div className="flex-1 relative">
                        <input type="number" value={lv2} onChange={(e) => handleInput(setLv2, e.target.value)} className="w-full h-10 text-center text-xl font-bold text-gray-700 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-red-500 transition-all" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">ม.</span>
                    </div>
                    <button onClick={() => adjustVal(setLv2, lv2, 50)} className="w-12 h-10 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-95 transition-all"><Plus className="w-5 h-5" /></button>
                </div>
                <div className="px-1 pt-1">
                    <input type="range" min="100" max="2000" step="50" value={lv2} onChange={(e) => setLv2(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
                </div>
            </div>

         </div>

         {/* Save Button */}
         <div className="mt-8">
            <button 
                onClick={handleSave} 
                disabled={saving} 
                className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
                {saving ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />}
                บันทึกการตั้งค่า
            </button>
         </div>

      </div>
    </div>
  );
}