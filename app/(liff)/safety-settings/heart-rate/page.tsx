'use client';

import { useState, useEffect } from 'react';
import liff from '@line/liff';
import { Save, Loader2, Minus, Plus, Heart, Activity, HeartPulse } from 'lucide-react';
import { getElderlySafetySettings, updateHeartrate } from '@/actions/safety-settings.actions';
import { toast } from 'sonner';
import LiffGuard from '@/components/auth/liff-guard';

export default function HeartRateSettingPage() {
  return <LiffGuard><HeartRateContent /></LiffGuard>;
}

function HeartRateContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [bpm, setBpm] = useState(120);
  const [lineId, setLineId] = useState('');

  const getTheme = (val: number) => {
    if (val >= 120) return {
        gradient: 'from-rose-500 via-red-500 to-pink-600',
        bgBtn: 'bg-rose-600 hover:bg-rose-700',
        slider: 'accent-rose-500',
        label: 'หัวใจเต้นเร็ว (Tachycardia)',
        icon: <HeartPulse className="w-24 h-24 text-white" strokeWidth={2} />,
        colorHex: '#f43f5e'
    };
    if (val <= 50) return {
        gradient: 'from-indigo-400 via-blue-500 to-cyan-600',
        bgBtn: 'bg-indigo-500 hover:bg-indigo-600',
        slider: 'accent-indigo-500',
        label: 'หัวใจเต้นช้า (Bradycardia)',
        icon: <Activity className="w-24 h-24 text-white" strokeWidth={2} />,
        colorHex: '#6366f1'
    };
    return {
        gradient: 'from-teal-400 via-emerald-500 to-green-500',
        bgBtn: 'bg-teal-600 hover:bg-teal-700',
        slider: 'accent-teal-500',
        label: 'อัตราปกติ (Normal)',
        icon: <Heart className="w-24 h-24 text-white fill-white/20" strokeWidth={2} />,
        colorHex: '#14b8a6'
    };
  };

  const theme = getTheme(bpm);

  useEffect(() => {
    const init = async () => {
      try {
        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setLineId(profile.userId);
            const res = await getElderlySafetySettings(profile.userId);
            if (res.success && res.data) {
                setBpm(res.data.heartSetting.maxBpm || 120);
            }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    init();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateHeartrate(lineId, bpm);
    if (res.success) {
        toast.success("บันทึกเรียบร้อย");
        setTimeout(() => liff.closeWindow(), 1000);
    } else { toast.error("เกิดข้อผิดพลาด"); }
    setSaving(false);
  };

  const adjustVal = (delta: number) => setBpm(Math.max(40, Math.min(200, bpm + delta)));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val)) setBpm(val);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-gray-400" /></div>;

  const beatDuration = 60 / Math.max(40, bpm); 

  return (
    <div className={`h-screen flex flex-col overflow-hidden relative font-sans transition-colors duration-700 ease-in-out bg-gradient-to-b ${theme.gradient}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes heartbeat {
          0% { transform: scale(1); opacity: 1; }
          15% { transform: scale(1.25); opacity: 1; }
          30% { transform: scale(1); opacity: 1; }
          45% { transform: scale(1.15); opacity: 0.9; }
          60% { transform: scale(1); opacity: 1; }
        }
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 0.6; border-width: 4px; }
          100% { transform: scale(2.5); opacity: 0; border-width: 0px; }
        }
      `}} />

      <div className="flex-1 relative flex flex-col items-center justify-center p-6 overflow-hidden">

         <div className="relative mb-8 flex items-center justify-center">
            
            <div 
                className="absolute w-40 h-40 rounded-full border-white/40 box-border"
                style={{ animation: `ripple ${beatDuration}s linear infinite` }}
            ></div>
            <div 
                className="absolute w-40 h-40 rounded-full border-white/20 box-border"
                style={{ animation: `ripple ${beatDuration}s linear infinite`, animationDelay: `${beatDuration/2}s` }}
            ></div>
            
            <div 
                className="w-40 h-40 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border-4 border-white/40 relative z-10 transition-all duration-500"
                style={{ animation: `heartbeat ${beatDuration}s ease-in-out infinite` }}
            >
                {theme.icon}
            </div>

         </div>

         <div className="text-center text-white relative z-10">
             <p className="text-sm font-medium opacity-80 mb-1">แจ้งเตือนเมื่อสูงกว่า</p>
             <div className="text-6xl font-black drop-shadow-lg tracking-tighter flex items-baseline justify-center gap-1">
                {bpm} <span className="text-2xl font-medium opacity-80">bpm</span>
             </div>
             <div className="mt-3 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full inline-block border border-white/10">
                <span className="text-sm font-bold tracking-wide">{theme.label}</span>
             </div>
         </div>
      </div>

      <div className="bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] p-8 pb-8 relative z-30 shrink-0">
         
         <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>

         <div className="space-y-8">
            
            <div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Max Heart Rate</span>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => adjustVal(-5)} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-95 transition-all shadow-sm">
                        <Minus className="w-6 h-6" />
                    </button>
                    
                    <div className="flex-1 relative group">
                        <input 
                            type="number"
                            value={bpm}
                            onChange={handleInputChange}
                            className={`w-full h-14 text-center text-2xl font-bold text-gray-700 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:bg-white transition-all`}
                            style={{ borderColor: 'transparent' }}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">BPM</span>
                    </div>

                    <button onClick={() => adjustVal(5)} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-95 transition-all shadow-sm">
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="mt-6 px-2">
                    <input 
                        type="range" 
                        min="40" max="200" step="1" 
                        value={bpm} 
                        onChange={(e) => setBpm(parseInt(e.target.value))} 
                        className={`w-full h-3 rounded-full appearance-none cursor-pointer bg-gray-200 ${theme.slider}`} 
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                        <span>40</span>
                        <span>120</span>
                        <span>200</span>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <button 
                    onClick={handleSave} 
                    disabled={saving} 
                    className={`w-full py-4 text-white font-bold text-lg rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${theme.bgBtn}`}
                >
                    {saving ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />}
                    บันทึกการตั้งค่า
                </button>
            </div>

         </div>
      </div>
    </div>
  );
}