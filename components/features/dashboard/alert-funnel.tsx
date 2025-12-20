"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { AlertTriangle, CheckCircle, Clock, User, Bell } from "lucide-react";

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
  
  // ✅ กรณีที่ 1: ปกติ (ไม่มีการแจ้งเตือน)
  if (!activeAlerts || activeAlerts.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-28.8rem)] bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[24px] border border-emerald-100 shadow-[0_2px_20px_-10px_rgba(16,185,129,0.15)] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-200/50">
            <CheckCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-bold text-emerald-800 mb-1">เหตุการณ์ปกติ</h3>
          <p className="text-xs text-emerald-600 max-w-[200px] leading-relaxed">
            ไม่มีการแจ้งเตือน หรือรอการช่วยเหลือในขณะนี้
          </p>
        </div>
      </div>
    );
  }

  // ✅ กรณีที่ 2: มีรายการแจ้งเตือน
  return (
    // ปรับความสูงให้สัมพันธ์กับ Layout หลัก
    <div className="w-full h-[calc(100vh-28.8rem)] bg-white rounded-[24px] border border-blue-100 shadow-[0_2px_20px_-10px_rgba(59,130,246,0.15)] flex flex-col overflow-hidden">
      
      {/* Header - ปรับให้เล็กกระชับขึ้น */}
      <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
            <Bell className="w-4 h-4 text-white animate-pulse" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">รายการแจ้งเตือน</h3>
            <p className="text-[10px] text-slate-500 font-medium">{activeAlerts.length} รายการรอดำเนินการ</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full border border-blue-100">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
          <span className="text-[10px] text-blue-600 font-bold">Live</span>
        </div>
      </div>

      {/* Content List - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-slate-50 to-white">
        {activeAlerts.map((alert, index) => {
          const isAck = alert.status === "ACKNOWLEDGED";
          
          const statusConfig = isAck 
            ? {
                borderColor: "border-l-orange-500",
                bgColor: "bg-orange-50/50",
                iconBg: "bg-orange-100",
                iconColor: "text-orange-600",
                badgeBg: "bg-orange-100",
                badgeText: "text-orange-700",
                label: "กำลังช่วยเหลือ"
              }
            : {
                borderColor: "border-l-red-500",
                bgColor: "bg-red-50/30",
                iconBg: "bg-red-100",
                iconColor: "text-red-600",
                badgeBg: "bg-red-100",
                badgeText: "text-red-700",
                label: "เกิดเหตุ!"
              };

          return (
            <div 
              key={`${alert.type}-${alert.id}-${index}`}
              // 🔥 ปรับลด Padding (p-4 -> p-2.5) และ Gap (gap-3 -> gap-2)
              className={`w-full p-2.5 rounded-xl border-l-[3px] shadow-sm bg-white flex flex-col gap-2 transition-all hover:shadow-md hover:scale-[1.01] ${statusConfig.borderColor} ${!isAck && 'animate-pulse'}`}
            >
              {/* แถวบน: Badge + เวลา */}
              <div className="flex justify-between items-center">
                <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusConfig.badgeBg} ${statusConfig.badgeText}`}>
                  {statusConfig.label}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <Clock className="w-3 h-3" />
                  {/* บวก 7 ชม. ให้เวลาไทย (เผื่อ Server UTC) */}
                  {format(new Date(new Date(alert.timestamp).getTime() + (7 * 60 * 60 * 1000)), "HH:mm น.", { locale: th })}
                </div>
              </div>

              {/* เนื้อหา: Icon + รายละเอียด */}
              <div className="flex items-center gap-2.5">
                {/* 🔥 ลดขนาด Icon Container (p-3 -> p-1.5) และ Icon (w-6 -> w-4) */}
                <div className={`p-1.5 rounded-lg ${statusConfig.iconBg} ${statusConfig.iconColor} shadow-sm shrink-0`}>
                  {alert.type.includes("SOS") 
                    ? <AlertTriangle className="w-4 h-4" strokeWidth={2.5} /> 
                    : <User className="w-4 h-4" strokeWidth={2.5} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  {/* 🔥 ลดขนาด Font */}
                  <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">
                    {alert.dependentName}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    {alert.type}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}