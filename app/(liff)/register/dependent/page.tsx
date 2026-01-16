'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { checkLiffUserStatus } from '@/actions/liff-auth.actions';
import { RegisterElderlyForm } from '@/components/features/registers/dependent-register-form';
import { PremiumLoading } from '@/components/ui/premium-loading';

export default function ElderlyRegisterPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID || '' });
        if (!liff.isLoggedIn()) { liff.login(); return; }

        const profile = await liff.getProfile();
        const status = await checkLiffUserStatus(profile.userId);

        if (status === 'UNREGISTERED') {
          window.location.href = '/register/user';
        } else {
          setChecking(false);
        }
      } catch (e) { setChecking(false); }
    };
    check();
  }, []);

  if (checking) return <PremiumLoading text="กำลังตรวจสอบสถานะ..." />;

  return <RegisterElderlyForm />;
}