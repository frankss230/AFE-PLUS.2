'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Save, Loader2, Camera, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { updateAdminProfile, getAdminProfile } from '@/actions/admin.actions';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg', 0.9);
}

export function ProfileDialog({ userId, trigger, onUpdateSuccess }: { userId: number, trigger: React.ReactNode, onUpdateSuccess: (newData: any) => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        firstName: '', lastName: '', phone: '', position: '', username: '', image: ''
    });
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });


    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isCropping, setIsCropping] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open && userId) {
            getAdminProfile(userId).then(res => {
                if (res) setData({
                    firstName: res.firstName,
                    lastName: res.lastName,
                    phone: res.phone || '',
                    position: res.position || '',
                    username: res.username,
                    image: res.image || ''
                });
            });
        }
    }, [open, userId]);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || '');
                setIsCropping(true);
            });
            reader.readAsDataURL(file);
        }

        e.target.value = '';
    };

    const showCroppedImage = async () => {
        if (imageSrc && croppedAreaPixels) {
            try {
                const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
                setData({ ...data, image: croppedImageBase64 });
                setIsCropping(false);
                setImageSrc(null);
            } catch (e) {
                console.error(e);
                toast.error("เกิดข้อผิดพลาดในการตัดรูป");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword && passwords.newPassword !== passwords.confirmPassword) {
            return toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
        }
        setLoading(true);

        const res = await updateAdminProfile(userId, { ...data, newPassword: passwords.newPassword });

        if (res.success) {
            toast.success("บันทึกข้อมูลส่วนตัวเรียบร้อย");
            setOpen(false);
            setPasswords({ newPassword: '', confirmPassword: '' });
            onUpdateSuccess({ firstName: data.firstName, lastName: data.lastName });
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isCropping ? 'ปรับแต่งรูปโปรไฟล์' : 'แก้ไขข้อมูลส่วนตัว'}</DialogTitle>
                </DialogHeader>

                { }
                {isCropping ? (
                    <div className="space-y-4">
                        <div className="relative w-full h-[300px] bg-black rounded-xl overflow-hidden">
                            <Cropper
                                image={imageSrc || ''}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={false}
                            />
                        </div>

                        <div className="space-y-2 px-2">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Zoom</span>
                                <span>{zoom.toFixed(1)}x</span>
                            </div>
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.1}
                                onValueChange={(value: number[]) => setZoom(value[0])}
                            />
                        </div>

                        <div className="flex justify-between pt-2">
                            <Button variant="outline" onClick={() => { setIsCropping(false); setImageSrc(null); }}>
                                <X className="w-4 h-4 mr-2" /> ยกเลิก
                            </Button>
                            <Button onClick={showCroppedImage} className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Check className="w-4 h-4 mr-2" /> ใช้รูปนี้
                            </Button>
                        </div>
                    </div>
                ) : (

                    <form onSubmit={handleSubmit}>
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="general">ข้อมูลทั่วไป</TabsTrigger>
                                <TabsTrigger value="security">ความปลอดภัย</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-4">
                                { }
                                <div className="flex flex-col items-center gap-3 mb-4">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center relative overflow-hidden group cursor-pointer border-4 border-white shadow-md hover:shadow-lg transition-all"
                                    >
                                        {data.image ? (
                                            <img src={data.image} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-12 h-12 text-slate-400" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        เปลี่ยนรูปโปรไฟล์
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>ชื่อจริง</Label>
                                        <Input value={data.firstName} onChange={e => setData({ ...data, firstName: e.target.value })} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>นามสกุล</Label>
                                        <Input value={data.lastName} onChange={e => setData({ ...data, lastName: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>ตำแหน่งงาน</Label>
                                    <Input value={data.position} placeholder="เช่น ผู้ดูแลระบบ" onChange={e => setData({ ...data, position: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>เบอร์โทรศัพท์</Label>
                                    <Input value={data.phone} placeholder="กรอกเบอร์โทรศัพท์" onChange={e => setData({ ...data, phone: e.target.value })} />
                                </div>
                            </TabsContent>

                            <TabsContent value="security" className="space-y-4">
                                <div className="p-3 bg-yellow-50 text-yellow-700 text-xs rounded-lg border border-yellow-200 mb-2">
                                    ️ ปล่อยว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน
                                </div>
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input value={data.username} onChange={e => setData({ ...data, username: e.target.value })} required />
                                </div>
                                <div className="space-y-2 relative">
                                    <Label>รหัสผ่านใหม่</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <Input type="password" className="pl-9" placeholder="••••••••" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2 relative">
                                    <Label>ยืนยันรหัสผ่านใหม่</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <Input type="password" className="pl-9" placeholder="••••••••" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="mt-6 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                บันทึกข้อมูล
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}