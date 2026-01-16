'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { checkLiffUserStatus } from '@/actions/liff-auth.actions';
import { CaregiverRegisterForm } from '@/components/features/registers/caregiver-register-form';
import { PremiumLoading } from '@/components/ui/premium-loading';

export default function UserRegisterPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        await liff.init({
          liffId: process.env.NEXT_PUBLIC_LIFF_ID || '',
          withLoginOnExternalBrowser: true
        });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        const status = await checkLiffUserStatus(profile.userId);

        if (status === 'NO_ELDERLY') {
          window.location.href = '/register/dependent';
          return;
        } else if (status === 'COMPLETE') {
          window.location.href = '/safety-settings';
          return;
        }

        setChecking(false);

      } catch (e) {
        setChecking(false);
      }
    };
    check();
  }, []);

  if (checking) return <PremiumLoading text="กำลังตรวจสอบสถานะ..." />;

  return <CaregiverRegisterForm />;
}