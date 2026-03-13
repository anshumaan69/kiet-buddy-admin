import { getServerSession } from 'next-auth/next';
import { authOptions } from '../lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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
  }

  const ALL_DEPARTMENTS = [
    "Information Technology",
    "CSIT",
    "CSE",
    "ECE",
    "Mechanical Engineering",
    "Civil Engineering",
    "MBA",
    "MCA",
    "Administrative"
  ];

  const userDepartments = session.user.departments || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full text-center mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-800 mb-4">
          KIET Buddy Admin
        </h1>
        <p className="text-xl text-gray-600">
          Select a department to manage its records and scrapers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
        {ALL_DEPARTMENTS.map((dept) => {
          const isAuthorized = userDepartments.includes(dept);
          
          return (
            <div key={dept} className="relative group">
              {isAuthorized ? (
                <Link
                  href={`/department?name=${dept}`}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden h-full"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-1 truncate w-full">
                    {dept}
                  </h3>
                  
                  <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">
                    Authorized
                  </p>
                  
                  <div className="flex items-center text-blue-600 font-bold text-xs group-hover:text-blue-700">
                    MANAGE
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ) : (
                <div className="bg-gray-50/50 p-8 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center grayscale opacity-60 cursor-not-allowed h-full relative">
                  <div className="absolute top-4 right-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-400 mb-1 truncate w-full">
                    {dept}
                  </h3>
                  
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
                    No Access
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {ALL_DEPARTMENTS.length === 0 && (
          <div className="col-span-full py-12 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800">No Departments Assigned</h3>
            <p className="text-gray-500 mt-2">Please contact a superadmin to get access to departments.</p>
          </div>
        )}
      </div>
    </div>
  );
}
