import { DefaultSession, DefaultUser } from 'next-auth';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'superadmin';
      department?: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    role: 'admin' | 'superadmin';
    department?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'superadmin';
    department?: string;
  }
}
