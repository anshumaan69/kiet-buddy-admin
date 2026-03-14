'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';



const ALL_DEPARTMENTS = [
    "CSE",
    "ECE",
    "IT",
    "CS",
    "AIML",
    "DS",
    "BBA",
    "MBA",
    "B.Tech",
    "M.Tech",
    "PhD",
    "Other"
];

function BranchButton({ dept, isAuthorized, onClick }: { dept: string, isAuthorized: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`p-6 rounded-xl border-2 transition-all ${
                isAuthorized 
                ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-md' 
                : 'border-gray-200 bg-gray-50 text-gray-400 opacity-60 cursor-not-allowed'
            }`}
        >
            <h3 className="text-lg font-bold">{dept}</h3>
            <p className="text-xs uppercase mt-1">{isAuthorized ? 'Authorized' : 'Locked'}</p>
        </button>
    );
}

export default function Home() {
    const { data: session } = useSession();
    const router = useRouter();

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Select Department</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {
                    ALL_DEPARTMENTS.map(dept => {
                        const isAuthorized = session?.user?.departments?.includes(dept) || session?.user?.role === 'superadmin';
                        return (
                            <BranchButton
                                key={dept}
                                dept={dept}
                                isAuthorized={!!isAuthorized}
                                onClick={() => {
                                    if (isAuthorized) {
                                        router.push(`/department?name=${dept}`);
                                    } else {
                                        alert('You are not authorized to access this department');
                                    }
                                }}
                            />
                        )
                    })
                }
            </div>
        </div>
    )
}