'use client';

import { useState, useEffect } from 'react';
import liff from '@line/liff';
import dynamic from 'next/dynamic';
import { Save, Loader2, Minus, Plus, ChevronUp } from 'lucide-react';
import { getElderlySafetySettings, updateSafezone, toggleGpsMode } from '@/actions/safety-settings.actions';
import { toast } from 'sonner';
import LiffGuard from '@/components/auth/liff-guard';
import { Switch } from '@/components/ui/switch';
import { motion, useAnimation, PanInfo } from 'framer-motion';

const MapSelector = dynamic(() => import('@/components/features/safezone/map-selector'), {
    ssr: false, loading: () => <div className="h-full w-full bg-slate-100 animate-pulse" />
});

export default function SafezoneSettingPage() {
    return <LiffGuard><SafezoneContent /></LiffGuard>;
}

function SafezoneContent() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [togglingGps, setTogglingGps] = useState(false);

    const [lineId, setLineId] = useState('');
    const [lv1, setLv1] = useState(100);
    const [lv2, setLv2] = useState(500);
    const [lat, setLat] = useState(13.7563);
    const [lng, setLng] = useState(100.5018);
    const [isGpsOn, setIsGpsOn] = useState(true);

    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP || "";
    const controls = useAnimation();
    const [isPanelOpen, setIsPanelOpen] = useState(true);

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

    const handleGpsToggle = async (checked: boolean) => {
        setIsGpsOn(checked);
        setTogglingGps(true);
        const res = await toggleGpsMode(lineId, checked);
        if (!res.success) setIsGpsOn(!checked);
        setTogglingGps(false);
    };

    const handleSave = async () => {
        setSaving(true);
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

    const onDragEnd = (event: any, info: PanInfo) => {
        const threshold = 50;
        if (info.offset.y > threshold) {
            setIsPanelOpen(false);
            controls.start({ y: "85%" });
        } else if (info.offset.y < -threshold) {
            setIsPanelOpen(true);
            controls.start({ y: 0 });
        } else {
            controls.start({ y: isPanelOpen ? 0 : "85%" });
        }
    };

    const togglePanel = () => {
        setIsPanelOpen(!isPanelOpen);
        controls.start({ y: isPanelOpen ? "85%" : 0 });
    }

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-green-600" /></div>;

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden relative font-sans">

            <style jsx global>{`
  input[type=range] { -webkit-appearance: none; background: transparent; }
  
  input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 24px; 
      width: 24px; 
      border-radius: 50%;
      
      background: currentColor; 
      border: none; 
      
      cursor: pointer; 
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
      margin-top: -8px; 
  }

  input[type=range]:active::-webkit-slider-thumb { 
      transform: scale(1.3);
  }

  input[type=range]::-webkit-slider-runnable-track {
      width: 100%; 
      height: 8px; 
      cursor: pointer; 
      background: #e5e7eb; 
      border-radius: 999px;
  }
  
  input[type=number]::-webkit-inner-spin-button, 
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
`}</style>

            <div className="absolute inset-0 z-0">
                <MapSelector apiKey={googleMapsApiKey} lat={lat} lng={lng} r1={lv1} r2={lv2} onChange={(l, n) => { setLat(l); setLng(n); }} />
            </div>

            <motion.div
                animate={controls}
                initial={{ y: 0 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.1}
                onDragEnd={onDragEnd}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 w-full bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-30 flex flex-col h-[50vh]"
            >
                <div className="w-full pt-3 pb-2 px-6 bg-white rounded-t-[2rem] border-b border-gray-100 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing" onClick={togglePanel}>
                    <div className="flex-1"></div>

                    <div className="flex flex-col items-center flex-1">
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-2"></div>
                        <h3 className="text-sm font-bold text-gray-800">
                            {isPanelOpen ? "ตั้งค่าเขตปลอดภัย" : "แตะเพื่อตั้งค่า"}
                        </h3>
                    </div>

                    <div className="flex-1 flex justify-end items-center gap-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-gray-500">GPS</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${isGpsOn ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        </div>
                        <Switch
                            checked={isGpsOn}
                            onCheckedChange={handleGpsToggle}
                            disabled={togglingGps}
                            className="data-[state=checked]:bg-green-500 scale-75 origin-right"
                        />
                    </div>
                </div>

                <div className="p-6 pb-6 overflow-y-auto h-full space-y-5">

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wider">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                เขตปลอดภัยชั้นที่ 1
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => adjustVal(setLv1, lv1, -10)} className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus className="w-5 h-5 text-gray-600" /></button>
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    value={lv1}
                                    onChange={(e) => handleInput(setLv1, e.target.value)}
                                    className="w-full h-10 text-center text-xl font-bold text-green-600 bg-green-50/50 rounded-xl border border-transparent focus:border-green-500 focus:bg-white transition-all outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">ม.</span>
                            </div>
                            <button onClick={() => adjustVal(setLv1, lv1, 10)} className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Plus className="w-5 h-5 text-gray-600" /></button>
                        </div>
                        <input type="range" min="10" max="1000" step="10" value={lv1} onChange={(e) => setLv1(parseInt(e.target.value))} className="w-full accent-green-500 text-green-500" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wider">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                เขตปลอดภัยชั้นที่ 2
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => adjustVal(setLv2, lv2, -50)} className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus className="w-5 h-5 text-gray-600" /></button>
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    value={lv2}
                                    onChange={(e) => handleInput(setLv2, e.target.value)}
                                    className="w-full h-10 text-center text-xl font-bold text-red-600 bg-red-50/50 rounded-xl border border-transparent focus:border-red-500 focus:bg-white transition-all outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">ม.</span>
                            </div>
                            <button onClick={() => adjustVal(setLv2, lv2, 50)} className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Plus className="w-5 h-5 text-gray-600" /></button>
                        </div>
                        <input type="range" min="100" max="2000" step="50" value={lv2} onChange={(e) => setLv2(parseInt(e.target.value))} className="w-full accent-red-500 text-red-500" />
                    </div>

                    <div className="pt-1">
                        <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-gray-900 text-white font-bold text-lg rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                            บันทึก
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}