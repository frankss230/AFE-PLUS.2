import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/admin', '/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isLoginPage = pathname === '/admin/login';

  
  
  
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

  
  
  
  if (isLoginPage && token) {
    const payload = await verifyToken(token);
    
    if (payload && payload.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url)); 
    }
  }

  
  
  
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