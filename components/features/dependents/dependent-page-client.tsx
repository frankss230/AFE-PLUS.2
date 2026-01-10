"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DependentTable } from "@/components/features/dependents/dependent-table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface DependentPageClientProps {
  initialData: any[];
}

export default function DependentPageClient({ initialData }: DependentPageClientProps) {
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
        <DependentTable data={initialData} />
      </CardContent>
    </Card>
  );
}