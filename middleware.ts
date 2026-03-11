import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (path.startsWith('/super-admin') && token.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (path.startsWith('/department') && token.role !== 'admin') {
      // If a superadmin tries to access department routes without building special access,
      // it restricts them here. If you want superadmin to access anything, change this logic.
      if (token.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
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

export const config = {
  matcher: ['/super-admin/:path*', '/department/:path*'],
};
