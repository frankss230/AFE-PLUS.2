'use client'
import { useEffect, useState } from 'react'
import liff from '@line/liff'

// ใส่ LIFF ID ของนายน้อยตรงนี้ (หรือดึงจาก .env ก็ได้)
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID_TRIGGER || 'YOUR_LIFF_ID_HERE'; 

export default function BroadcastTriggerPage() {
  const [status, setStatus] = useState('กำลังระบุตำแหน่ง...')

  useEffect(() => {
    const main = async () => {
      try {
        await liff.init({ liffId: LIFF_ID })
        
        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }

        const profile = await liff.getProfile()
        const userId = profile.userId 

        // 1. ดึงพิกัด GPS ก่อน
        setStatus('กำลังระบุตำแหน่ง GPS...')
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            // กรณีได้พิกัด
            const { latitude, longitude } = position.coords
            setStatus('กำลังส่งสัญญาณขอความช่วยเหลือ...')
            
            // 2. ยิง API ไปหลังบ้าน (พร้อมพิกัด และ ข้อความหัวข้อ)
            await sendHelpSignal(userId, latitude, longitude)
          },
          async (error) => {
            // กรณีระบุพิกัดไม่ได้ (หรือ User ไม่กดอนุญาต) -> ส่งแบบไม่มีพิกัดไป
            console.warn('GPS Error:', error)
            setStatus('ไม่พบตำแหน่ง... กำลังส่งสัญญาณแบบไม่มีพิกัด')
            await sendHelpSignal(userId, null, null)
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        )

      } catch (error) {
        console.error('LIFF Error:', error)
        setStatus('เกิดข้อผิดพลาดในการเชื่อมต่อ LINE')
      }
    }

    main()
  }, [])

  // ฟังก์ชันแยกสำหรับยิง API
  const sendHelpSignal = async (userId: string, lat: number | null, lng: number | null) => {
    try {
      const res = await fetch('/api/rescue/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId: userId,
            latitude: lat,
            longitude: lng,
            // ⭐ จุดสำคัญ: ส่งข้อความหัวข้อตรงนี้ครับ (แก้คำได้ตามใจชอบ)
            message: "💗 สุขภาพผิดปกติ" 
        }) 
      })

      if (res.ok) {
        setStatus('ส่งสัญญาณสำเร็จ! เจ้าหน้าที่กำลังตรวจสอบ')
        // ปิดหน้าต่างอัตโนมัติหลังส่งเสร็จ 2 วินาที
        setTimeout(() => {
            liff.closeWindow()
        }, 2000)
      } else {
        setStatus('เกิดข้อผิดพลาดในการส่งข้อมูล')
      }

    } catch (err) {
      console.error(err)
      setStatus('เชื่อมต่อ Server ไม่ได้')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-orange-50 p-4">
      {/* Animation วงกลมหมุนๆ (Loading) */}
      <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
      
      <div className="text-xl font-bold text-orange-600 animate-pulse text-center">
        {status}
      </div>
      <p className="text-gray-500 mt-4 text-sm text-center">
        ระบบจะดึงพิกัดและส่งแจ้งเตือนไปยังผู้ดูแลทันที
      </p>
    </div>
  )
}