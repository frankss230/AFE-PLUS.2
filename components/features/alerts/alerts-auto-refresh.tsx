'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AlertsAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    // refresh every 5 seconds
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}