import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/admin', '/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isLoginPage = pathname === '/admin/login';

  // =========================================================
  // 1. ป้องกันพื้นที่หวงห้าม (Admin Only)
  // =========================================================
  if (isProtectedRoute && !isLoginPage) {
    if (!token) {
      return redirectToLogin(request);
    }

    const payload = await verifyToken(token);
    
    if (!payload) {

      const response = redirectToLogin(request);
      response.cookies.delete('session');
      return response;
    }

    if (payload.role !== 'ADMIN') {
      const response = redirectToLogin(request);
      response.cookies.delete('session'); 
      return response;
    }
  }

  // =========================================================
  // 2. ถ้าเป็น Admin แล้ว ห้ามเข้าหน้า Login ซ้ำ (ดีดไป Dashboard เลย)
  // =========================================================
  if (isLoginPage && token) {
    const payload = await verifyToken(token);
    
    if (payload && payload.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url)); 
    }
  }

  // =========================================================
  // 3. ปล่อยผ่าน + ตั้งค่า Header ห้าม Cache (Security)
  // =========================================================
  const response = NextResponse.next();
  
  if (isProtectedRoute) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  return response;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/admin/login', request.url);
  
  const response = NextResponse.redirect(loginUrl);
  
  // ห้าม Cache การ Redirect
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/dashboard/:path*'
  ],
};