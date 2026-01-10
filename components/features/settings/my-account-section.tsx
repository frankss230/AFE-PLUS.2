'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Save, Loader2, Camera, Check, X, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateAdminProfile, deleteSelfAccount } from '@/actions/admin.actions';
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


interface MyAccountSectionProps {
    user: any;
}

export function MyAccountSection({ user }: MyAccountSectionProps) {
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
        if (user) {
            setData({
                firstName: user.adminProfile?.firstName || '',
                lastName: user.adminProfile?.lastName || '',
                phone: user.adminProfile?.phone || '',
                position: user.adminProfile?.position || '',
                username: user.username || '',
                image: user.adminProfile?.image || ''
            });
        }
    }, [user]);

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


        const res = await updateAdminProfile(user.id, { ...data, newPassword: passwords.newPassword });

        if (res.success) {
            toast.success("บันทึกข้อมูลส่วนตัวเรียบร้อย");
            setPasswords({ newPassword: '', confirmPassword: '' });

        } else {
            toast.error(res.error);
        }
        setLoading(false);
        setLoading(false);
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteConfirmUsername, setDeleteConfirmUsername] = useState('');
    const [deleteReason, setDeleteReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Add the delete handler
    const handleDeleteAccount = async () => {
        if (!deleteConfirmUsername || !deleteReason) {
            return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
        }

        if (deleteConfirmUsername !== user.username) {
            return toast.error("Username ไม่ถูกต้อง");
        }

        setIsDeleting(true);
        try {
            const res = await deleteSelfAccount(user.id, user.username, deleteConfirmUsername, deleteReason);
            if (res.success) {
                toast.success("ลบบัญชีเรียบร้อยแล้ว");
                // Redirect to login or logout
                window.location.href = '/login';
            } else {
                toast.error(res.error || "เกิดข้อผิดพลาดในการลบบัญชี");
                setIsDeleting(false);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
            setIsDeleting(false);
        }
    };


    return (
        <div className="bg-white">
            { }
            {isCropping ? (
                <div className="space-y-4 border border-slate-200 p-4 rounded-xl bg-slate-50">
                    <div className="relative w-full h-[300px] bg-black rounded-xl overflow-hidden shadow-inner">
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

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => { setIsCropping(false); setImageSrc(null); }}>
                            <X className="w-4 h-4 mr-2" /> ยกเลิก
                        </Button>
                        <Button onClick={showCroppedImage} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Check className="w-4 h-4 mr-2" /> ยืนยันรูปนี้
                        </Button>
                    </div>
                </div>
            ) : (

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs defaultValue="general" className="w-full">

                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="general">ข้อมูลทั่วไป</TabsTrigger>
                            <TabsTrigger value="security">ความปลอดภัย</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-6 animate-in fade-in-50">
                            { }
                            <div className="flex items-center gap-6">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 bg-slate-100 rounded-full flex shrink-0 items-center justify-center relative overflow-hidden group cursor-pointer border-4 border-white shadow-md hover:shadow-lg transition-all"
                                >
                                    {data.image ? (
                                        <img src={data.image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-slate-400" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium text-slate-900">รูปโปรไฟล์</h3>
                                    <p className="text-xs text-slate-500 mb-3">แนะนำขนาด 500x500px (ไฟล์ .jpg, .png)</p>
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        อัปโหลดรูปใหม่
                                    </Button>
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <Input value={data.position} placeholder="เช่น ผู้ดูแลระบบ, เจ้าหน้าที่ IT" onChange={e => setData({ ...data, position: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>เบอร์โทรศัพท์</Label>
                                <Input value={data.phone} placeholder="กรอกเบอร์โทรศัพท์" onChange={e => setData({ ...data, phone: e.target.value })} />
                            </div>
                        </TabsContent>

                        <TabsContent value="security" className="space-y-4 animate-in fade-in-50">
                            <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200 mb-4 flex gap-2">
                                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                    <strong>เปลี่ยนรหัสผ่าน</strong>
                                    <p className="text-xs mt-1 text-yellow-700">ปล่อยว่างไว้หากไม่ต้องการเปลี่ยนแปลง</p>
                                </div>
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

                    <div className="pt-4 flex justify-end border-t border-slate-100">
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 min-w-[120px]" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            บันทึกการเปลี่ยนแปลง
                        </Button>
                    </div>

                    <div className="mt-10 pt-6 border-t border-red-100">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-red-800 font-bold flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" /> ลบบัญชีผู้ใช้
                                </h3>
                                <p className="text-red-600/80 text-sm mt-1">
                                    การลบบัญชีจะไม่สามารถกู้คืนได้ และข้อมูลทั้งหมดของคุณจะหายไป
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setDeleteModalOpen(true)}
                                className="bg-red-600 hover:bg-red-700 shrink-0"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> ลบบัญชีของฉัน
                            </Button>
                        </div>
                    </div>

                </form>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-red-900">ยืนยันการลบบัญชี</h2>
                                <p className="text-xs text-red-700">การลบบัญชีไม่สามารถย้อนกลับได้</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700">พิมพ์ Username ของคุณเพื่อยืนยัน <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1 rounded">{user.username}</span></Label>
                                <Input
                                    value={deleteConfirmUsername}
                                    onChange={(e) => setDeleteConfirmUsername(e.target.value)}
                                    placeholder="Username"
                                    className="border-red-200 focus:ring-red-500/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700">เหตุผลที่ต้องการลบ (จำเป็น)</Label>
                                <textarea
                                    className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[80px]"
                                    placeholder="ระบุเหตุผล..."
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
                                ยกเลิก
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteAccount}
                                disabled={!deleteConfirmUsername || !deleteReason || isDeleting || deleteConfirmUsername !== user.username}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                ยืนยันลบถาวร
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}