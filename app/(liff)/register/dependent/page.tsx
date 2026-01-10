'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { checkLiffUserStatus } from '@/actions/liff-auth.actions';
import { RegisterElderlyForm } from '@/components/features/registers/dependent-register-form';
import { Loader2 } from 'lucide-react';

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

  if (checking) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-600" /></div>;

  return <RegisterElderlyForm />;
}