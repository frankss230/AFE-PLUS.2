"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { AlertTriangle, CheckCircle, Clock, Bell, HeartPulse, MapPin, Thermometer } from "lucide-react";

interface AlertItem {
  id: number;
  type: string;
  status: string;
  timestamp: Date;
  dependentName: string;
}

interface ActiveAlertsProps {
  activeAlerts: AlertItem[];
}

export default function AlertFunnel({ activeAlerts }: ActiveAlertsProps) {
  
  // ✅ ฟังก์ชันแปลงเวลาแบบมืออาชีพ (ใช้ได้ทั่วโลก ได้เวลาไทยเสมอ)
  const formatThaiTime = (dateInput: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok', // 👈 บังคับโซนเวลาไทย
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(dateInput));
  };

  // ✅ กรณีที่ 1: ปกติ (ไม่มีการแจ้งเตือน)
  if (!activeAlerts || activeAlerts.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-28.8rem)] bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-slate-600 font-medium mb-1">สถานการณ์ปกติ</h3>
        <p className="text-xs text-slate-400 font-light">
           ไม่พบการแจ้งเตือนใหม่
        </p>
      </div>
    );
  }

  // ✅ กรณีที่ 2: มีรายการแจ้งเตือน (Minimal Design)
  return (
    <div className="w-full h-[calc(100vh-28.8rem)] bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
      
      {/* Header - เรียบง่าย */}
      <div className="px-5 py-4 bg-white border-b border-slate-50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
             <Bell className="w-5 h-5 text-slate-700" />
             <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </div>
          <h3 className="font-semibold text-slate-700 text-sm">การแจ้งเตือน</h3>
        </div>
        <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-full">
          {activeAlerts.length} รายการ
        </span>
      </div>

      {/* Content List - Minimal Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-white scrollbar-hide">
        {activeAlerts.map((alert, index) => {
          const isAck = alert.status === "ACKNOWLEDGED";
          
          // Logic เลือกสีและไอคอนแบบมินิมอล
          let icon = <AlertTriangle className="w-5 h-5" />;
          let themeColor = isAck ? "text-orange-500" : "text-red-500";
          let bgIcon = isAck ? "bg-orange-50" : "bg-red-50";

          if (alert.type.includes("หัวใจ")) icon = <HeartPulse className="w-5 h-5" />;
          else if (alert.type.includes("พื้นที่")) icon = <MapPin className="w-5 h-5" />;
          else if (alert.type.includes("อุณหภูมิ")) icon = <Thermometer className="w-5 h-5" />;

          // เวลาไทย (+7 ชม.)
          const thaiTime = new Date(new Date(alert.timestamp).getTime() + (7 * 60 * 60 * 1000));

          return (
            <div 
              key={`${alert.type}-${alert.id}-${index}`}
              className="group w-full p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-300 flex items-center gap-4 cursor-default"
            >
              {/* 1. Icon Circle */}
              <div className={`w-10 h-10 rounded-full ${bgIcon} ${themeColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                  {icon}
              </div>

              {/* 2. Alert Type (โชว์ยาวๆ ไม่ตบบรรทัด) */}
              <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
                <p className="font-bold text-slate-700 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                  {alert.type}
                </p>
              </div>

              {/* 3. Time & Status (กองรวมกันขวาสุด แยกบรรทัด) */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {/* เวลา (บรรทัดบน) */}
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                   <Clock className="w-3 h-3" />
                   {formatThaiTime(alert.timestamp)} น.
                </span>
                
                {/* สถานะ/จุดกะพริบ (บรรทัดล่าง) */}
                {isAck ? (
                   <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-orange-500 font-medium">กำลังช่วยเหลือ</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                   </div>
                ) : (
                   <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-red-500 font-medium animate-pulse">เกิดเหตุ!</span>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}