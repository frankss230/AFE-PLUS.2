'use client'
import { useEffect, useState, Suspense } from 'react'
import liff from '@line/liff'
import { useSearchParams } from 'next/navigation'
import { Loader2, Radio, CheckCircle2, AlertTriangle, Send } from 'lucide-react'

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID_TRIGGER!;

function TriggerContent() {
  const [status, setStatus] = useState('กำลังเชื่อมต่อระบบ...')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)

  const searchParams = useSearchParams()
  const recordId = searchParams.get('id')
  const alertType = searchParams.get('type')

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

        setStatus('กำลังระบุพิกัด GPS...')

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            setStatus('กำลังส่งสัญญาณขอความช่วยเหลือ...')
            await sendHelpSignal(userId, latitude, longitude, recordId, alertType)
          },
          async (error) => {
            console.warn('GPS Error:', error)
            setStatus('ไม่พบตำแหน่ง... กำลังส่งสัญญาณแบบไม่มีพิกัด')
            await sendHelpSignal(userId, null, null, recordId, alertType)
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        )

      } catch (error) {
        console.error('LIFF Error:', error)
        setStatus('เกิดข้อผิดพลาดในการเชื่อมต่อ LINE')
        setIsError(true)
      }
    }

    main()
  }, [recordId, alertType])

  const sendHelpSignal = async (
    userId: string,
    lat: number | null,
    lng: number | null,
    rId: string | null,
    type: string | null
  ) => {

    let messageText = "เหตุฉุกเฉินเพิ่มเติม"

    if (type === 'FALL') messageText = "ยืนยันเหตุการล้ม (ต้องการความช่วยเหลือ)"
    else if (type === 'FALL_CONSCIOUS') messageText = "ยืนยันเหตุการล้ม (กดขอความช่วยเหลือ)"
    else if (type === 'FALL_UNCONSCIOUS') messageText = "ยืนยันเหตุการล้ม (หมดสติ/ไม่ตอบสนอง)"
    else if (type === 'ZONE') messageText = "ออกนอกพื้นที่ปลอดภัย (ต้องการความช่วยเหลือ)"
    else if (type === 'HEART') messageText = "ชีพจรผิดปกติวิกฤต (ต้องการความช่วยเหลือ)"
    else if (type === 'TEMP') messageText = "อุณหภูมิร่างกายสูงวิกฤต (ต้องการความช่วยเหลือ)"
    else if (type === 'HEALTH') messageText = "สัญญาณชีพผิดปกติ (ต้องการความช่วยเหลือ)"

    try {
      const res = await fetch('/api/rescue/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          latitude: lat,
          longitude: lng,
          recordId: rId ? parseInt(rId) : null,
          alertType: type,
          message: messageText
        })
      })

      if (res.ok) {
        setStatus('ส่งสัญญาณสำเร็จ!')
        setIsSuccess(true)
        setTimeout(() => {
          liff.closeWindow()
        }, 2500)
      } else {
        setStatus('เกิดข้อผิดพลาดในการส่งข้อมูล')
        setIsError(true)
      }

    } catch (err) {
      console.error(err)
      setStatus('ไม่สามารถเชื่อมต่อ Server ได้')
      setIsError(true)
    }
  }

  const getIcon = () => {
    if (isError) return <AlertTriangle className="w-12 h-12 text-red-500" />
    if (isSuccess) return <CheckCircle2 className="w-12 h-12 text-green-500" />
    return <Radio className="w-12 h-12 text-red-500 animate-pulse" />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 relative overflow-hidden text-center">

      {/* Background Pulse Effect */}
      {!isSuccess && !isError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 bg-red-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        </div>
      )}

      <div className="relative z-10 bg-white p-8 rounded-[2rem] shadow-xl shadow-red-900/10 border border-white/60 w-full max-w-sm">

        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full ${isError ? 'bg-red-100' : isSuccess ? 'bg-green-100' : 'bg-red-50'}`}>
            {getIcon()}
          </div>
        </div>

        <h1 className={`text-xl font-bold mb-2 ${isError ? 'text-red-600' : isSuccess ? 'text-green-600' : 'text-slate-800'}`}>
          {isError ? 'เกิดข้อผิดพลาด' : isSuccess ? 'ส่งแจ้งเตือนเรียบร้อย' : 'กำลังดำเนินการ'}
        </h1>

        <p className="text-slate-500 text-sm font-medium mb-6">
          {status}
        </p>

        {!isSuccess && !isError && (
          <div className="flex items-center justify-center gap-2 text-xs text-red-400 font-bold bg-red-50 py-2 px-4 rounded-full mx-auto w-fit">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>กำลังระบุพิกัดและส่งข้อมูล...</span>
          </div>
        )}

        {isSuccess && (
          <p className="text-xs text-slate-400 mt-4">หน้าต่างจะปิดอัตโนมัติ...</p>
        )}

      </div>

      <div className="mt-8 text-center opacity-60">
        <p className="text-[10px] text-slate-400 font-medium tracking-wider">EMERGENCY BROADCAST SYSTEM</p>
        <p className="text-[10px] text-slate-300 mt-1">SAFE ZONE WATCH</p>
      </div>

    </div>
  )
}

export default function BroadcastTriggerPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-red-50"><Loader2 className="w-10 h-10 text-red-500 animate-spin" /></div>}>
      <TriggerContent />
    </Suspense>
  )
}