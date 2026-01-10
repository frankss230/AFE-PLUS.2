"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { UserForm } from "@/components/features/caregivers/caregiver-form"; 
import { useRouter } from "next/navigation";

export default function EditCaregiverModal({ initialData }: { initialData: any }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  
  const handleSuccess = () => {
    setOpen(false); 
    router.refresh(); 
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 rounded-full px-6 transition-transform hover:scale-105">
          <Edit className="w-4 h-4 mr-2" />
          แก้ไขข้อมูล
        </Button>
      </DialogTrigger>
      
      {}
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl">
        <DialogHeader className="px-6 py-4 border-b bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-slate-200 rounded-full">
                <Edit className="w-5 h-5 text-slate-600" />
            </div>
            แก้ไขข้อมูลผู้ดูแล
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
          {}
          <UserForm initialData={initialData} onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}