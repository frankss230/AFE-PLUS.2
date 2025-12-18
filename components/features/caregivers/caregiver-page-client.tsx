"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaregiverTable } from "@/components/features/caregivers/caregiver-table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface CaregiverPageClientProps {
  initialData: any[]; // รับข้อมูลจาก Server
}

export default function CaregiverPageClient({ initialData }: CaregiverPageClientProps) {
  const router = useRouter();

  // ✅ Auto Refresh: สั่งโหลดข้อมูลใหม่ทุกๆ 10 วินาที (ถ้าต้องการ)
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh(); // สั่งให้ Server Component ดึงข้อมูลใหม่
    }, 10000); // 10000ms = 10 วินาที

    return () => clearInterval(interval);
  }, [router]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>รายชื่อ ({initialData.length})</CardTitle>
        {/* ปุ่มกด Refresh เอง ถ้าไม่อยากรอนาน */}
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.refresh()}
            className="gap-2"
        >
            <RefreshCw className="w-4 h-4" />
            อัปเดตข้อมูล
        </Button>
      </CardHeader>
      <CardContent>
        {/* ส่งข้อมูลลงตาราง */}
        <CaregiverTable data={initialData} />
      </CardContent>
    </Card>
  );
}