import { getServerSession } from 'next-auth/next';
import { authOptions } from '../lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  console.log('Home Page Session:', { hasSession: !!session, role: session?.user?.role });

  console.log('Home Page Session Full:', JSON.stringify(session, null, 2));

  if (!session) {
    console.log('No session at root, redirecting to /login');
    redirect('/login');
  }

  if (session.user.role === 'superadmin') {
    console.log('Superadmin detected, redirecting to /super-admin');
    redirect('/super-admin');
  } else if (session.user.role === 'admin') {
    console.log('Admin detected, redirecting to /department');
    redirect('/department');
  } else {
    console.log('Unknown role or missing role, redirecting to /login');
    redirect('/login');
  }

  return null;
}
