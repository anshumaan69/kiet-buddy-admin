import { Suspense } from 'react';
import LoginForm from '../../components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 border-gray-200">
      <Suspense fallback={<div className="text-gray-500">Loading form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
