import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { SettingsView } from '@/components/features/settings/settings-view';

async function getAllAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    include: { adminProfile: true },
    orderBy: { createdAt: 'desc' }
  });
  
  return admins.map(u => ({
      id: u.id,
      username: u.username,
      isActive: u.isActive,
      role: u.role,
      firstName: u.adminProfile?.firstName || 'System',
      lastName: u.adminProfile?.lastName || 'Admin',
      phone: u.adminProfile?.phone || '-',
      position: u.adminProfile?.position || 'Administrator'
  }));
}

export default async function SettingsPage() {
  const session = await getSession();
  
  const myAccount = await prisma.user.findUnique({
    where: { id: session?.userId },
    include: { adminProfile: true }
  });

  const allAdmins = await getAllAdmins();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <SettingsView myAccount={myAccount} allAdmins={allAdmins} />
    </div>
  );
}