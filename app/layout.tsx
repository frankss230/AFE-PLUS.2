import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { GlobalModal } from '@/components/ui/global-modal';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Smart Watch Monitoring System',
  description: 'ระบบติดตามสุขภาพผู้สูงอายุผ่าน Smart Watch',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning={true}>
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
        <GlobalModal />
      </body>
    </html>
  );
}