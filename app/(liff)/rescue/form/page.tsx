"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import liff from '@line/liff';

export default function RescueFormPage() {
    const searchParams = useSearchParams();
    const alertId = searchParams.get('id');

    // Data State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [details, setDetails] = useState("");

    // UI State
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [status, setStatus] = useState("checking"); 
    const [lockedBy, setLockedBy] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const STORAGE_KEY = `rescue_owner_${alertId}`;

    useEffect(() => {
        const init = async () => {
            try {
                await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID || '' });
                if (!alertId) return;

                const res = await fetch(`/api/rescue/status?id=${alertId}`);
                const data = await res.json();

                const isOwner = localStorage.getItem(STORAGE_KEY) === 'true';

                if (data.status === 'RESOLVED') {
                    setStatus("success");
                } else if (data.status === 'ACKNOWLEDGED') {
                    if (isOwner) {
                        setStatus("accepted");
                        // ✅ แก้ตรงนี้: ดึงข้อมูลเก่ามาแสดง (User จะได้ไม่งง)
                        setName(data.rescuerName || "");
                        setPhone(data.rescuerPhone || "");
                    } else {
                        setLockedBy(data.rescuerName);
                        setStatus("locked");
                    }
                } else {
                    setStatus("active");
                }
            } catch (e) {
                console.error(e);
                setErrorMsg("เชื่อมต่อระบบไม่ได้");
            }
            setLoading(false);
        };
        init();
    }, [alertId]);

    // Action 1: กดรับเคส
    const handleAccept = async () => {
        if (!name.trim()) return setErrorMsg("กรุณาระบุชื่อผู้ช่วยเหลือ");
        if (phone.length !== 10 || !phone.startsWith('0')) return setErrorMsg("เบอร์โทรศัพท์ต้องมี 10 หลัก");
        
        setActionLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch('/api/rescue/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'accept', alertId, name, phone })
            });

            if (res.ok) {
                localStorage.setItem(STORAGE_KEY, 'true');
                setTimeout(() => {
                    setStatus("accepted");
                    setActionLoading(false);
                }, 800);
            } else if (res.status === 409) {
                const d = await res.json();
                setLockedBy(d.takenBy);
                setStatus("locked");
            } else {
                setErrorMsg("เกิดข้อผิดพลาด");
                setActionLoading(false);
            }
        } catch (e) {
            setErrorMsg("Error Connection");
            setActionLoading(false);
        }
    };

    // Action 2: กดปิดเคส
    const handleCloseCase = async () => {
        if (!details.trim()) return setErrorMsg("กรุณาระบุรายละเอียดอาการก่อนปิดเคส");
        
        setActionLoading(true);
        try {
            const res = await fetch('/api/rescue/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'close', alertId, details })
            });

            if (res.ok) {
                localStorage.removeItem(STORAGE_KEY);
                setStatus("success");
            } else {
                setErrorMsg("บันทึกไม่สำเร็จ");
            }
        } catch (e) { setErrorMsg("Error Connection"); }
        setActionLoading(false);
    };

    if (loading) return <div className="h-screen bg-[#FFFBF5] flex items-center justify-center text-gray-400">⏳ กำลังโหลด...</div>;

    if (status === "locked") return (
        <div className="h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
             <div className="text-6xl mb-4 grayscale opacity-50">🔒</div>
             <h1 className="text-xl font-bold text-gray-800">มีผู้รับเคสไปแล้ว</h1>
             <p className="text-gray-500 mt-2">โดย: {lockedBy}</p>
             <button onClick={() => liff.closeWindow()} className="mt-8 w-full py-3 bg-white border border-gray-300 rounded-xl text-gray-600 font-bold shadow-sm">ปิดหน้าต่าง</button>
        </div>
    );

    if (status === "success") return (
        <div className="h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center">
             <div className="text-6xl mb-4 animate-bounce">✅</div>
             <h1 className="text-2xl font-bold text-green-700">ปิดเคสสมบูรณ์</h1>
             <p className="text-gray-500 mt-2">ขอบคุณที่ช่วยเหลือครับ ❤️</p>
             <button onClick={() => liff.closeWindow()} className="mt-8 w-full py-3 bg-white border border-green-200 rounded-xl text-green-600 font-bold shadow-sm">ปิดหน้าต่าง</button>
        </div>
    );

    const isAccepted = status === "accepted";

    return (
        <div className="min-h-screen bg-[#FFFBF5] p-6 font-sans">
            <div className="mb-6 pt-4">
                <h1 className="text-2xl font-bold text-gray-800">🚑 ยืนยันการช่วยเหลือ</h1>
                <p className="text-gray-400 text-xs mt-1">Case ID: {alertId}</p>
            </div>

            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-orange-50 space-y-4">
                
                {errorMsg && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl">⚠️ {errorMsg}</div>}

                <div>
                    <label className="text-xs font-bold text-gray-400 ml-1">ชื่อผู้ช่วยเหลือ</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        disabled={isAccepted} 
                        className={`w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-200 transition-all ${isAccepted ? 'text-gray-500 bg-gray-100 font-medium' : ''}`} // ปรับสี Text ให้เข้มขึ้นนิดนึงตอน Disable จะได้อ่านง่าย
                        placeholder="ระบุชื่อของคุณ" 
                    />
                </div>

                <div className="flex gap-3 items-end">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-400 ml-1">เบอร์โทร</label>
                        <input 
                            type="tel" 
                            maxLength={10} 
                            value={phone} 
                            onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            disabled={isAccepted}
                            className={`w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-200 transition-all ${isAccepted ? 'text-gray-500 bg-gray-100 font-medium' : ''}`}
                            placeholder="08xxxxxxxx" 
                        />
                    </div>

                    <button 
                        onClick={handleAccept}
                        disabled={isAccepted || actionLoading}
                        className={`h-[48px] px-6 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center min-w-[100px]
                            ${isAccepted 
                                ? "bg-green-500 shadow-none cursor-default w-[48px] px-0"
                                : "bg-gradient-to-r from-orange-500 to-amber-500 active:scale-95 hover:shadow-lg"
                            }
                        `}
                    >
                        {isAccepted ? (
                            <span className="text-2xl animate-scale-in">✓</span>
                        ) : actionLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            "รับเคส"
                        )}
                    </button>
                </div>

                {isAccepted && (
                    <div className="pt-4 border-t border-dashed border-gray-100 animate-fade-in-up">
                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-400 ml-1">รายละเอียดอาการ / การช่วยเหลือ</label>
                            <textarea 
                                rows={4} 
                                value={details} 
                                onChange={e => setDetails(e.target.value)}
                                className="w-full mt-1 px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-green-200 resize-none transition-all"
                                placeholder="เช่น ผู้ป่วยรู้สึกตัวดี ปฐมพยาบาลเบื้องต้นแล้ว..." 
                            />
                        </div>

                        <button 
                            onClick={handleCloseCase}
                            disabled={actionLoading}
                            className="w-full py-4 bg-[#22C55E] hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-all flex justify-center items-center gap-2"
                        >
                            {actionLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'บันทึกและปิดเคส'}
                        </button>
                    </div>
                )}
            </div>
            
            {!isAccepted && (
                <p className="text-center text-gray-300 text-xs mt-6">
                    กดปุ่ม <span className="text-orange-400 font-bold">"รับเคส"</span> เพื่อเริ่มดำเนินการ
                </p>
            )}
        </div>
    );
}