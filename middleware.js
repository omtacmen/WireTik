// middleware.js
import { NextResponse } from 'next/server';

export function middleware(req) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return new NextResponse('Autenticación requerida', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Acceso VPN"' },
    });
  }

  const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  const user = auth[0];
  const pass = auth[1];

  // Las credenciales que pediste
  if (user === 'admin' && pass === 'admin') {
    return NextResponse.next();
  }

  return new NextResponse('Credenciales incorrectas', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Acceso VPN"' },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};