import { cookies } from 'next/headers';
import { verifyToken } from './jwt';

export async function getSession() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  return await verifyToken(token);
}

export async function createSession(token: string) {
  const cookieStore = await cookies();
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}