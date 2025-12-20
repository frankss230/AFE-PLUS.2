// 'use client';

// import { useEffect, useRef } from 'react';
// import { getUnreadAlertCount } from '@/actions/alert.actions';
// import { toast } from 'sonner';

// export const alertState = { count: 0 }; 

// export default function AlertListener() {
//   const audioRef = useRef<HTMLAudioElement | null>(null);
//   const lastCount = useRef(0);

//   useEffect(() => {
//     audioRef.current = new Audio('/sounds/alert.mp3');
    
//     const checkAlerts = async () => {
//       const res = await getUnreadAlertCount();
//       const currentCount = res.count;

//       alertState.count = currentCount;
      
//       window.dispatchEvent(new CustomEvent('alert-update', { detail: currentCount }));

//       if (currentCount > lastCount.current) {
//         if (audioRef.current) {
//             audioRef.current.play().catch(e => console.log("Audio play failed (user interaction needed)"));
//         }
//         toast.error(`มีแจ้งเตือนฉุกเฉินใหม่ ${currentCount} รายการ!`, {
//             duration: 5000,
//         });
//       }

//       lastCount.current = currentCount;
//     };

//     // เช็คทุก 5 วินาที
//     const interval = setInterval(checkAlerts, 5000);
//     checkAlerts();

//     return () => clearInterval(interval);
//   }, []);

//   return null;
// }