"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaregiverTable } from "@/components/features/caregivers/caregiver-table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface CaregiverPageClientProps {
  initialData: any[]; 
}

export default function CaregiverPageClient({ initialData }: CaregiverPageClientProps) {
  const router = useRouter();

  
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh(); 
    }, 10000); 

    return () => clearInterval(interval);
  }, [router]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>รายชื่อ ({initialData.length})</CardTitle>
        {}
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
        {}
        <CaregiverTable data={initialData} />
      </CardContent>
    </Card>
  );
}