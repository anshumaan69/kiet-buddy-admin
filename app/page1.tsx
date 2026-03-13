import { getServerSession } from 'next-auth/next';
import { authOptions } from '../lib/auth';
import { redirect } from 'next/navigation';
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


export default async function Home() {
    return (
        <div>
            {
                ALL_DEPARTMENTS.map(dept => {
                    const isAuthorized = session?.user?.departments?.includes(dept);
                    return (
                        <BranchButton
                            key={dept}
                            dept={dept}
                            isAuthorized={isAuthorized}
                            onClick={() => {
                                if (isAuthorized) {
                                    redirect(`/department?name=${dept}`);
                                } else {
                                    alert('You are not authorized to access this department');
                                }
                            }}
                        />
                    )


                })
            }
        </div>
    )
}