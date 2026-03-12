import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Named export for Next.js 16 Proxy
export const proxy = withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    console.log(`Proxy running for: ${path}`, { hasToken: !!token, role: token?.role });

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (path.startsWith('/super-admin') && token.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (path.startsWith('/department') && token.role !== 'admin') {
      if (token.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Also dynamic export default for compatibility if needed
export default proxy;

export const config = {
  matcher: ['/super-admin/:path*', '/department/:path*'],
};
