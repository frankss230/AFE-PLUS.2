import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { 
  ArrowLeft, 
  PackageOpen, 
  User, 
  Calendar, 
  FileText, 
  AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function submitReturnRequest(formData: FormData) {
  "use server";

  const requestId = parseInt(formData.get("requestId") as string);
  const condition = formData.get("condition") as string;

  if (!requestId) return;

  try {
    await prisma.borrowEquipment.update({
      where: { id: requestId },
      data: {
        status: "RETURN_PENDING",
        returnDate: new Date(),
      },
    });

    revalidatePath("/equipment");
  } catch (error) {
    console.error("Error submitting return:", error);
  }
  
  redirect("/equipment");
}

export default async function ReturnEquipmentPage({ params }: PageProps) {
  const { id } = await params;
  const requestId = parseInt(id);

  if (isNaN(requestId)) redirect("/equipment");

  const request = await prisma.borrowEquipment.findUnique({
    where: { id: requestId },
    include: {
      items: { include: { equipment: true } },
      dependent: true, 
    },
  });

  
  if (!request) {
    return <div className="p-6 text-center text-red-500">ไม่พบข้อมูลการยืม</div>;
  }

  if (request.status !== "APPROVED" && request.status !== "RETURN_FAILED") {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800 border border-yellow-200">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
          <h3 className="font-bold">ไม่สามารถทำรายการได้</h3>
          <p className="text-sm">สถานะปัจจุบัน: {request.status}</p>
          <Link href="/equipment">
            <Button variant="outline" className="mt-4">กลับหน้าหลัก</Button>
          </Link>
        </div>
      </div>
    );
  }

  const equipmentName = request.items[0]?.equipment?.name || "อุปกรณ์ไม่ระบุ";
  const dependentName = `${request.dependent.firstName} ${request.dependent.lastName}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      <div className="bg-white p-4 shadow-sm border-b sticky top-0 z-10 flex items-center gap-3">
        <Link href="/equipment">
            <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
        </Link>
        <h1 className="text-lg font-bold text-slate-800">แจ้งคืนอุปกรณ์</h1>
      </div>

      <div className="p-4 space-y-6">
        
        <Card className="border-blue-100 shadow-sm bg-blue-50/50">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-blue-100">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <PackageOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-blue-500 font-bold uppercase">กำลังคืน</p>
                        <h2 className="font-bold text-slate-800 text-lg">{equipmentName}</h2>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-slate-400 flex items-center gap-1 text-xs mb-1">
                            <User className="w-3 h-3" /> ผู้ยืม
                        </p>
                        <p className="font-medium text-slate-700">{dependentName}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 flex items-center gap-1 text-xs mb-1">
                            <Calendar className="w-3 h-3" /> วันที่เริ่มยืม
                        </p>
                        <p className="font-medium text-slate-700">
                            {format(new Date(request.createdAt), "d MMM yyyy", { locale: th })}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <form action={submitReturnRequest} className="space-y-6">
            <input type="hidden" name="requestId" value={request.id} />

            <div className="space-y-2">
                <Label htmlFor="condition" className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" /> 
                    สภาพอุปกรณ์ / หมายเหตุ
                </Label>
                <Textarea 
                    id="condition" 
                    name="condition" 
                    placeholder="เช่น อุปกรณ์ใช้งานได้ปกติ, สายชาร์จมีรอยถลอกเล็กน้อย..." 
                    className="bg-white min-h-[120px]"
                    required
                />
            </div>

            <Button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-12 text-base font-bold rounded-xl"
            >
                ยืนยันการแจ้งคืน
            </Button>
        </form>

      </div>
    </div>
  );
}