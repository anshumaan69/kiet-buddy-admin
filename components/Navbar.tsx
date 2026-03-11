'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex bg-white items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold tracking-tight text-blue-600">KIET Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                <div className="flex flex-col text-right">
                  <span className="text-sm font-medium text-gray-900">{session.user.email}</span>
                  <span className="text-xs text-gray-500 capitalize">
                    {session.user.role} {session.user.department ? `(${session.user.department})` : ''}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
