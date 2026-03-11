import { getServerSession } from 'next-auth/next';
import { authOptions } from '../lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role === 'superadmin') {
    redirect('/super-admin');
  } else if (session.user.role === 'admin') {
    redirect('/department');
  } else {
    // If for some reason the role is missing or unknown, redirect to login
    redirect('/login');
  }

  return null;
}
