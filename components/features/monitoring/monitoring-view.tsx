'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, DirectionsRenderer } from '@react-google-maps/api';
import { Card } from '@/components/ui/card';
import { Heart, Thermometer, Battery, Map as MapIcon, Satellite, ShieldCheck, User } from 'lucide-react';
import { useRouter } from "next/navigation";

const containerStyle = { width: '100%', height: '100%', borderRadius: '1.5rem' };
const centerDefault = { lat: 13.7563, lng: 100.5018 };

export default function MonitoringView({ users }: { users: any[] }) {
    const router = useRouter();
    const mapRef = useRef<google.maps.Map | null>(null);

    // ✅ 1. State สำหรับ Auto Refresh & Selection
    const [selectedUser, setSelectedUser] = useState<any>(users[0] || null);

    // ✅ 2. Ref เพื่อเช็คว่าเราต้องขยับกล้องหรือไม่
    // เก็บ ID ของคนที่เราเพิ่ง Pan กล้องไปล่าสุด
    const lastPannedUserId = useRef<number | null>(null); 

    // ✅ Auto Refresh Logic
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 5000);
        return () => clearInterval(interval);
    }, [router]);

    useEffect(() => {
        if (selectedUser) {
            const updatedUser = users.find(u => u.id === selectedUser.id);
            if (updatedUser) {
                setSelectedUser(updatedUser);
            }
        } else if (users.length > 0) {
            setSelectedUser(users[0]);
        }
    }, [users]); // Dependency คือ users ที่เปลี่ยนทุก 5 วิ

    // ✅ Map Logic
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP || ''
    });

    const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
    const [directionsResponse, setDirectionsResponse] = useState<any>(null);

    // ✅ Effect สำหรับขยับกล้อง (PanTo) แยกออกมา
    // จะทำงานก็ต่อเมื่อ "เปลี่ยนคน" หรือ "คนเดิมย้ายที่ไกลๆ" เท่านั้น
    useEffect(() => {
        if (isLoaded && mapRef.current && selectedUser?.location) {
            
            // เช็คว่า "เราเคย Pan ไปหาคนนี้แล้วหรือยัง?"
            // ถ้าเป็นคนเดิม (ID เดิม) -> ไม่ต้อง Pan ซ้ำ (Map จะได้ไม่กระตุก)
            // ยกเว้นว่าอยากให้ตามติดตลอดเวลาก็เอาเงื่อนไขนี้ออกได้ แต่จะกระตุกนิดนึง
            if (lastPannedUserId.current !== selectedUser.id) {
                mapRef.current.panTo({ lat: selectedUser.location.lat, lng: selectedUser.location.lng });
                lastPannedUserId.current = selectedUser.id; // จำไว้ว่าไปหาคนนี้แล้ว
            }
        }
    }, [selectedUser, isLoaded]); // Effect นี้จะทำงานเมื่อ selectedUser เปลี่ยน

    // Routing Logic (เหมือนเดิม)
    useEffect(() => {
        if (isLoaded && selectedUser?.isEmergency && selectedUser?.rescuer) {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route({
                origin: { lat: selectedUser.rescuer.lat, lng: selectedUser.rescuer.lng },
                destination: { lat: selectedUser.location.lat, lng: selectedUser.location.lng },
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

    // ฟังก์ชันเมื่อกดเลือก User จาก Sidebar
    const handleUserClick = (user: any) => {
        setSelectedUser(user);
        lastPannedUserId.current = null; // Reset เพื่อให้ Map ยอม Pan ไปหาคนใหม่ทันที
    };

    if (!isLoaded) return <div className="h-full flex items-center justify-center">Loading Operations Map...</div>;

    return (
        <div className="flex h-[calc(100vh-12rem)] gap-4">

            {/* 🟢 Sidebar รายชื่อ (ซ้าย) */}
            <Card className="w-1/4 flex flex-col overflow-hidden bg-white/90 backdrop-blur border-slate-200 shadow-sm">
                <div className="p-4 bg-slate-50 border-b font-bold text-slate-700">รายชื่อผู้ใช้งาน</div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {users.map(user => (
                        <div
                            key={user.id}
                            onClick={() => handleUserClick(user)} // ✅ ใช้ฟังก์ชันใหม่
                            className={`p-3 rounded-lg cursor-pointer border transition-all flex items-center justify-between ${selectedUser?.id === user.id
                                ? 'bg-blue-50 border-blue-500 shadow-md'
                                : 'hover:bg-slate-50 border-transparent'
                                }`}
                        >
                            <div>
                                <div className="font-bold text-slate-700">{user.firstName} {user.lastName}</div>
                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    {user.isEmergency ? <span className="text-red-500 font-bold">🚨 EMERGENCY</span> : <span className="text-green-600 flex items-center gap-1"><ShieldCheck size={10} /> Normal</span>}
                                </div>
                            </div>
                            {user.isEmergency && (
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* 🗺️ Main Area (ขวา) */}
            <div className="flex-1 flex flex-col gap-4">

                {/* 1. Map Card */}
                <Card className="flex-1 relative overflow-hidden shadow-xl border-slate-300 rounded-3xl">

                    {/* 🔒 Privacy Mode Check */}
                    {!selectedUser?.isEmergency ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                            <ShieldCheck className="w-20 h-20 mb-4 text-green-500 opacity-80" />
                            <h2 className="text-2xl font-bold text-slate-600">สถานะปกติ (Safe)</h2>
                            <p className="text-sm mt-2">ปิดการแสดงผลแผนที่เพื่อความเป็นส่วนตัว</p>
                            <p className="text-xs text-slate-400 mt-1">Map will active only on Emergency</p>
                        </div>
                    ) : (
                        <>
                            {/* ปุ่มเปลี่ยนโหมดแผนที่ */}
                            <div className="absolute top-4 right-4 z-10 flex gap-2 bg-white/90 p-1.5 rounded-full shadow-lg backdrop-blur border border-slate-100">
                                <button
                                    onClick={() => setMapType('roadmap')}
                                    className={`p-2 rounded-full transition-all ${mapType === 'roadmap' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <MapIcon size={18} />
                                </button>
                                <button
                                    onClick={() => setMapType('satellite')}
                                    className={`p-2 rounded-full transition-all ${mapType === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <Satellite size={18} />
                                </button>
                            </div>

                            <GoogleMap
                                mapContainerStyle={containerStyle}
                                // เอา center ออกจาก prop เพื่อให้ panTo ทำงานแทน
                                // center={selectedUser?.location ? { lat: selectedUser.location.lat, lng: selectedUser.location.lng } : centerDefault}
                                zoom={16}
                                mapTypeId={mapType}
                                onLoad={(map) => { mapRef.current = map; }} // ✅ เก็บ Map Instance ไว้
                                options={{ disableDefaultUI: true, zoomControl: true }}
                            >
                                {/* จุดผู้ประสบเหตุ */}
                                {selectedUser?.location && (
                                    <OverlayView position={{ lat: selectedUser.location.lat, lng: selectedUser.location.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                                        <div className="relative flex items-center justify-center w-12 h-12 -translate-x-1/2 -translate-y-1/2">
                                            <div className="absolute w-full h-full rounded-full bg-red-500 opacity-30 animate-ping"></div>
                                            <div className="relative w-4 h-4 border-2 border-white rounded-full bg-red-600 shadow-lg"></div>
                                        </div>
                                    </OverlayView>
                                )}

                                {/* จุดผู้ช่วยเหลือ */}
                                {selectedUser?.rescuer && (
                                    <OverlayView position={{ lat: selectedUser.rescuer.lat, lng: selectedUser.rescuer.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                                        <div className="relative flex items-center justify-center w-12 h-12 -translate-x-1/2 -translate-y-1/2">
                                            <div className="absolute w-full h-full rounded-full bg-blue-500 opacity-30 animate-[spin_3s_linear_infinite]"></div>
                                            <div className="relative w-5 h-5 border-2 border-white rounded-full bg-blue-500 shadow-lg"></div>
                                            <div className="absolute bottom-full mb-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap shadow-md">
                                                👮‍♂️ {selectedUser.rescuer.name}
                                            </div>
                                        </div>
                                    </OverlayView>
                                )}

                                {directionsResponse && (
                                    <DirectionsRenderer directions={directionsResponse} options={{ suppressMarkers: true, polylineOptions: { strokeColor: "#3B82F6", strokeWeight: 5, strokeOpacity: 0.8 } }} />
                                )}
                            </GoogleMap>
                        </>
                    )}
                </Card>

                {/* 2. Status Panel */}
                {selectedUser && (
                    <Card className="p-4 flex items-center justify-between bg-white border-slate-200 shadow-sm">
                        {/* ข้อมูลสุขภาพ */}
                        <div className="flex gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                    <Heart size={20} className={selectedUser.health.bpm > 100 ? 'animate-pulse' : ''} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold">HEART RATE</p>
                                    <p className="text-xl font-bold text-slate-700">{selectedUser.health.bpm} <span className="text-xs font-normal">bpm</span></p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                                    <Thermometer size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold">TEMP</p>
                                    <p className="text-xl font-bold text-slate-700">{selectedUser.health.temp} <span className="text-xs font-normal">°C</span></p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                                    <Battery size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold">BATTERY</p>
                                    <p className="text-xl font-bold text-slate-700">{selectedUser.location?.battery || 0}%</p>
                                </div>
                            </div>
                        </div>

                        {/* ปุ่มรับเคส / สถานะ */}
                        <div>
                            {selectedUser.isEmergency ? (
                                selectedUser.status === 'ACKNOWLEDGED' ? (
                                    <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold border border-blue-200 flex items-center gap-2">
                                        👮‍♂️ จนท. กำลังปฏิบัติงาน
                                    </div>
                                ) : (
                                    <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold border border-red-200 animate-pulse">
                                        🚨 รอการช่วยเหลือ
                                    </div>
                                )
                            ) : (
                                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold border border-green-200 flex items-center gap-2">
                                    <ShieldCheck size={18} /> เหตุการณ์ปกติ
                                </div>
                            )}
                        </div>

                    </Card>
                )}
            </div>
        </div>
    );
}   