import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AdminLayout } from '@/components/layouts/admin-layout';


export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <AdminLayout>
        {}
      {children}
    </AdminLayout>
  );
}