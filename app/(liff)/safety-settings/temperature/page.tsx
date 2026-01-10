'use client';

import { useState, useEffect } from 'react';
import liff from '@line/liff';
import { Save, Loader2, Minus, Plus, Flame, Snowflake, ThermometerSun, AlertTriangle } from 'lucide-react';
import { getElderlySafetySettings, updateTemperature } from '@/actions/safety-settings.actions';
import { toast } from 'sonner';
import LiffGuard from '@/components/auth/liff-guard';

export default function TemperatureSettingPage() {
  return <LiffGuard><TemperatureContent /></LiffGuard>;
}

function TemperatureContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [temp, setTemp] = useState(37.5);
  const [lineId, setLineId] = useState('');

  const getTheme = (t: number) => {
    if (t >= 38.5) return {
        color: 'text-rose-600', 
        slider: 'accent-rose-500',
        gradient: 'from-red-500 via-rose-500 to-pink-600',
        shadow: 'shadow-rose-300',
        bgBtn: 'bg-rose-600 hover:bg-rose-700',
        icon: <Flame className="w-20 h-20 text-white animate-[pulse_0.5s_ease-in-out_infinite]" />,
        label: 'มีไข้สูง (High Fever)',
    };
    if (t >= 37.6) return {
        color: 'text-orange-500', 
        slider: 'accent-orange-500',
        gradient: 'from-orange-400 via-amber-500 to-red-500',
        shadow: 'shadow-orange-200',
        bgBtn: 'bg-orange-500 hover:bg-orange-600',
        icon: <Flame className="w-20 h-20 text-white animate-pulse" />,
        label: 'มีไข้ต่ำ (Mild Fever)',
    };
    if (t >= 37.3) return {
        color: 'text-yellow-500', 
        slider: 'accent-yellow-500',
        gradient: 'from-yellow-400 via-amber-400 to-orange-400',
        shadow: 'shadow-yellow-200',
        bgBtn: 'bg-yellow-500 hover:bg-yellow-600',
        icon: <AlertTriangle className="w-20 h-20 text-white" />,
        label: 'เฝ้าระวัง (Warning)',
    };
    if (t >= 36.0) return {
        color: 'text-emerald-600', 
        slider: 'accent-emerald-500',
        gradient: 'from-emerald-400 via-green-500 to-teal-500',
        shadow: 'shadow-emerald-200',
        bgBtn: 'bg-emerald-500 hover:bg-emerald-600',
        icon: <ThermometerSun className="w-20 h-20 text-white" />,
        label: 'อุณหภูมิปกติ (Normal)',
    };
    return {
        color: 'text-cyan-600', 
        slider: 'accent-cyan-500',
        gradient: 'from-cyan-400 via-sky-500 to-blue-600',
        shadow: 'shadow-cyan-200',
        bgBtn: 'bg-cyan-500 hover:bg-cyan-600',
        icon: <Snowflake className="w-20 h-20 text-white animate-bounce" />,
        label: 'อุณหภูมิต่ำ (Hypothermia)',
    };
  };

  const theme = getTheme(temp);

  useEffect(() => {
    const init = async () => {
      try {
        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setLineId(profile.userId);
            const res = await getElderlySafetySettings(profile.userId);
            if (res.success && res.data) {
                setTemp(res.data.tempSetting.maxTemperature || 37.5);
            }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    init();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateTemperature(lineId, temp);
    if (res.success) {
        toast.success("บันทึกเรียบร้อย");
        setTimeout(() => liff.closeWindow(), 1000);
    } else { toast.error("เกิดข้อผิดพลาด"); }
    setSaving(false);
  };

  const adjustVal = (delta: number) => {
    setTemp(prev => {
        const newVal = prev + delta;
        return Math.round(newVal * 10) / 10;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) setTemp(val);
  };

  const handleBlur = () => {
      if (temp < 34) setTemp(34);
      if (temp > 42) setTemp(42);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className={`h-screen flex flex-col overflow-hidden relative font-sans transition-colors duration-700 ease-in-out bg-gradient-to-b ${theme.gradient}`}>
      
      <div className="flex-1 relative flex flex-col items-center justify-center p-6">

         <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-30 scale-150 bg-white animate-pulse"></div>
            <div className="w-40 h-40 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30 relative z-10 transition-all duration-500">
                {theme.icon}
            </div>
         </div>

         <div className="text-center text-white">
             <p className="text-sm font-medium opacity-80 mb-2">แจ้งเตือนเมื่อสูงกว่า</p>
             <div className="text-6xl font-black drop-shadow-lg tracking-tighter flex items-start justify-center">
                {temp.toFixed(1)}
                <span className="text-2xl mt-2 opacity-80">°C</span>
             </div>
             <div className="mt-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full inline-block">
                <span className="text-sm font-bold tracking-wide">{theme.label}</span>
             </div>
         </div>
      </div>

      <div className="bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] p-8 pb-8 relative z-30 shrink-0">
         
         <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>

         <div className="space-y-8">
            
            <div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">กำหนดค่าเอง</span>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => adjustVal(-0.1)} 
                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-95 transition-all shadow-sm"
                    >
                        <Minus className="w-6 h-6" />
                    </button>
                    
                    <div className="flex-1 relative group">
                        <input 
                            type="number"
                            step="0.1"
                            min="34"
                            max="42"
                            value={temp}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={`w-full h-14 text-center text-2xl font-bold text-gray-700 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:bg-white transition-all ${theme.color.replace('text-', 'focus:border-')}`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">°C</span>
                    </div>

                    <button 
                        onClick={() => adjustVal(0.1)} 
                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 active:scale-95 transition-all shadow-sm"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="mt-6 px-2">
                    <input 
                        type="range" 
                        min="34" max="42" step="0.1" 
                        value={temp} 
                        onChange={(e) => setTemp(parseFloat(e.target.value))} 
                        className={`w-full h-3 rounded-full appearance-none cursor-pointer bg-gray-200 ${theme.slider}`} 
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                        <span>34.0</span>
                        <span>38.0</span>
                        <span>42.0</span>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <button 
                    onClick={handleSave} 
                    disabled={saving} 
                    className={`w-full py-4 text-white font-bold text-lg rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${theme.bgBtn} ${theme.shadow}`}
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