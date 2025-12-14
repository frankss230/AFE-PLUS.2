"use client";
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import liff from '@line/liff';
import { GoogleMap, useJsApiLoader, OverlayView, DirectionsRenderer } from '@react-google-maps/api';
import { updateRescuerLocation } from '@/actions/rescue.actions';
import { MapPin, Navigation } from 'lucide-react';

export default function RescueFormPage() {
    const searchParams = useSearchParams();
    const alertIdParam = searchParams.get('id');
    const alertId = alertIdParam ? parseInt(alertIdParam) : 0;

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP || ''
    });

    // Data State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [details, setDetails] = useState("");
    const [victimLoc, setVictimLoc] = useState<{lat: number, lng: number} | null>(null);

    // Map State
    const [myLoc, setMyLoc] = useState<{lat: number, lng: number} | null>(null);
    const [directions, setDirections] = useState<any>(null);
    
    // Tracking Refs
    const watchIdRef = useRef<number | null>(null);
    const lastSentRef = useRef<number>(0); // ✅ เอาไว้จำเวลาล่าสุดที่ส่ง (กันกระตุก)

    // UI State
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [status, setStatus] = useState("checking"); 
    const [lockedBy, setLockedBy] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const STORAGE_KEY = `rescue_owner_${alertId}`;

    // 1. Init
    useEffect(() => {
        const init = async () => {
            try {
                await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID || '' });
                if (!alertId) return;

                const res = await fetch(`/api/rescue/status?id=${alertId}`);
                const data = await res.json();

                if (data.lat && data.lng) {
                    setVictimLoc({ lat: parseFloat(data.lat), lng: parseFloat(data.lng) });
                }

                const isOwner = localStorage.getItem(STORAGE_KEY) === 'true';

                if (data.status === 'RESOLVED') {
                    setStatus("success");
                } else if (data.status === 'ACKNOWLEDGED') {
                    if (isOwner) {
                        setStatus("accepted");
                        setName(data.rescuerName || "");
                        setPhone(data.rescuerPhone || "");
                        startTracking(); 
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

        return () => stopTracking();
    }, [alertId]);

    // 2. Routing
    useEffect(() => {
        if (isLoaded && myLoc && victimLoc) {
            const service = new google.maps.DirectionsService();
            service.route({
                origin: myLoc,
                destination: victimLoc,
                travelMode: google.maps.TravelMode.DRIVING
            }, (result, status) => {
                if (status === 'OK') setDirections(result);
            });
        }
    }, [isLoaded, myLoc, victimLoc]);

    // ---------------------------------------------
    // 🛰️ GPS Logic (ลบ Wake Lock ออกแล้ว)
    // ---------------------------------------------
    const startTracking = async () => {
        if (!('geolocation' in navigator)) return;
        
        // ❌ เอา Wake Lock ออกแล้วครับ (ตามสั่ง)

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                
                // 1. อัปเดตหน้าจอตัวเองทันที (เพื่อให้จุดสีน้ำเงินลื่นไหล)
                setMyLoc({ lat: latitude, lng: longitude });
                
                // 2. ส่ง Server: แต่ส่งแค่ทุกๆ 5 วินาทีพอ (กันกระตุก)
                const now = Date.now();
                if (alertId && (now - lastSentRef.current > 5000)) { // 5000ms = 5 วิ
                    updateRescuerLocation(alertId, latitude, longitude);
                    lastSentRef.current = now;
                    console.log("📍 Server Updated");
                }
            },
            (err) => console.error(err),
            { 
                enableHighAccuracy: true, 
                timeout: 10000, 
                maximumAge: 0 
            }
        );
    };

    const stopTracking = () => {
        if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };

    // ---------------------------------------------
    // Actions
    // ---------------------------------------------
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
                startTracking(); 
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
                stopTracking();
                setStatus("success");
            } else {
                setErrorMsg("บันทึกไม่สำเร็จ");
            }
        } catch (e) { setErrorMsg("Error Connection"); }
        setActionLoading(false);
    };

    // ---------------------------------------------
    // Render
    // ---------------------------------------------
    if (loading) return <div className="h-screen bg-[#FFFBF5] flex items-center justify-center text-gray-400">⏳ กำลังโหลดข้อมูล...</div>;

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
        <div className="min-h-screen bg-[#FFFBF5] font-sans pb-10">
            
            {/* 🗺️ MAP SECTION */}
            <div className="relative mx-4 mt-4 h-[320px] rounded-[32px] border-[6px] border-white shadow-2xl overflow-hidden z-0 bg-slate-100">
                {isLoaded && victimLoc ? (
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={myLoc || victimLoc} 
                        zoom={15}
                        options={{ 
                            disableDefaultUI: true, 
                            zoomControl: false,
                            // เปลี่ยนสไตล์แผนที่ให้ดูคลีนขึ้น (Optional)
                            styles: [
                                { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
                            ]
                        }}
                    >
                        {/* 🔴 จุดคนเจ็บ */}
                        <OverlayView position={victimLoc} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                             <div className="relative flex items-center justify-center w-12 h-12 -translate-x-1/2 -translate-y-1/2">
                                <div className="absolute w-full h-full rounded-full bg-red-500 opacity-30 animate-ping"></div>
                                <div className="relative w-4 h-4 border-2 border-white rounded-full bg-red-600 shadow-md"></div>
                                {/* ป้ายชื่อแบบลอย */}
                                <div className="absolute top-full mt-2 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-red-600 shadow-sm border border-red-100 whitespace-nowrap">
                                    📍 ผู้ประสบเหตุ
                                </div>
                             </div>
                        </OverlayView>

                        {/* 🔵 จุดเรา (Rescuer) */}
                        {isAccepted && myLoc && (
                            <OverlayView position={myLoc} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                                <div className="relative flex items-center justify-center w-12 h-12 -translate-x-1/2 -translate-y-1/2">
                                    <div className="relative w-5 h-5 border-2 border-white rounded-full bg-blue-500 shadow-lg flex items-center justify-center z-10">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    </div>
                                    {/* เรดาร์หมุนๆ */}
                                    <div className="absolute w-16 h-16 border border-blue-400/30 rounded-full animate-[spin_3s_linear_infinite] border-t-transparent border-l-transparent"></div>
                                    <div className="absolute bottom-full mb-2 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-lg whitespace-nowrap z-20">
                                        👮‍♂️ คุณ (จนท.)
                                    </div>
                                </div>
                            </OverlayView>
                        )}

                        {/* 🛣️ เส้นทาง */}
                        {directions && (
                            <DirectionsRenderer 
                                directions={directions} 
                                options={{ 
                                    suppressMarkers: true, 
                                    polylineOptions: { 
                                        strokeColor: "#3B82F6", 
                                        strokeWeight: 6, 
                                        strokeOpacity: 0.8 
                                    } 
                                }} 
                            />
                        )}
                    </GoogleMap>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 animate-pulse bg-slate-50">
                        <MapPin className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs">กำลังโหลดแผนที่...</span>
                    </div>
                )}
                
                {/* ปุ่มนำทาง (ดีไซน์ใหม่เป็นปุ่มกลมลอย) */}
                {victimLoc && (
                    <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${victimLoc.lat},${victimLoc.lng}`}
                        target="_blank"
                        className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-600 active:scale-90 transition-all z-10"
                    >
                        <Navigation size={18} />
                    </a>
                )}
            </div>

            {/* FORM SECTION */}
            <div className="px-6 -mt-6 relative z-10">
                <div className="bg-white p-6 rounded-[24px] shadow-xl shadow-orange-100/50 border border-orange-50 space-y-4">
                    
                    <div className="mb-2">
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            {isAccepted ? <span className="text-green-500">● ปฏิบัติการช่วยเหลือ</span> : "🚑 ยืนยันการช่วยเหลือ"}
                        </h1>
                        <p className="text-gray-400 text-xs mt-1">Case ID: {alertId}</p>
                    </div>

                    {errorMsg && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl">⚠️ {errorMsg}</div>}

                    {/* ช่องกรอกข้อมูล */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 ml-1">ชื่อผู้ช่วยเหลือ</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)}
                            disabled={isAccepted} 
                            className={`w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-200 transition-all ${isAccepted ? 'text-gray-500 bg-gray-100 font-medium' : ''}`}
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

                        {/* ปุ่มรับเคส */}
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
                            {isAccepted ? <span className="text-2xl">✓</span> : actionLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "รับเคส"}
                        </button>
                    </div>

                    {/* ส่วนปิดเคส */}
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
                        เมื่อรับเคสแล้ว ระบบจะส่งพิกัดของคุณไปยังศูนย์ฯ
                    </p>
                )}
            </div>
        </div>
    );
}