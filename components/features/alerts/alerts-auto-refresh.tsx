'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AlertsAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    // ตั้งเวลาให้รีเฟรชหน้าจอทุกๆ 5 วินาที
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}