import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'default-secret-key';

interface JWTPayload {
  userId: number;
  username?: string;
  role: string;
  [key: string]: any;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(SECRET_KEY);
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(SECRET_KEY);
    
    const { payload } = await jwtVerify(token, secret);
    
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}