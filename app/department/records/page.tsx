'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

export default function StaticDataDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Dashboard...</div>}>
      <StaticDataContent />
    </Suspense>
  );
}

function StaticDataContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDept = searchParams.get('name');

  const [records, setRecords] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    category: '',
    key: '',
    value: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user && session.user.role !== 'admin' && session.user.role !== 'superadmin') {
      router.push('/unauthorized');
    } else if (currentDept && session?.user && !session.user.departments?.includes(currentDept) && session.user.role !== 'superadmin') {
      router.push('/unauthorized');
    } else if (status === 'authenticated' && session) {
      fetchRecords();
      fetchCategories();
    }
  }, [status, session, router]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/records?department=${currentDept || ''}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      setError('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    setLoading(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (res.ok) {
        setNewCategoryName('');
        setShowAddCategory(false);
        fetchCategories();
        setSuccess('Category added successfully!');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add category');
      }
    } catch (err) {
      setError('Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const method = isEditing ? 'PUT' : 'POST';
    const body = isEditing 
      ? JSON.stringify({ ...formData }) 
      : JSON.stringify({ 
          category: formData.category, 
          key: formData.key, 
          value: formData.value,
          department: currentDept 
        });

    try {
      const res = await fetch('/api/records', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save record');
      } else {
        setSuccess(isEditing ? 'Record updated successfully!' : 'Record created successfully!');
        setFormData({ id: '', category: '', key: '', value: '' });
        setIsEditing(false);
        setShowForm(false);
        fetchRecords();
      }
    } catch (err) {
      setError('An error occurred while saving the record');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: any) => {
    setFormData({
      id: record._id,
      category: record.category,
      key: record.key,
      value: record.value,
    });
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/records?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('Record deleted successfully');
        fetchRecords();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete record');
      }
    } catch (err) {
      setError('Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentDept ? `${currentDept} Static Data` : 'Static Data Management'}
          </h1>
          <p className="text-gray-500 mt-1">
            Build and manage {currentDept || "your department's"} repository of key information (Category &rarr; Key &rarr; Value).
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <Link href={currentDept ? `/department?name=${currentDept}` : "/department"} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md transition-colors">
            Policy Scrapers
          </Link>
          <span className="bg-white shadow-sm px-4 py-2 text-sm font-medium text-blue-600 rounded-md">
            Static Data
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Record Editor Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {isEditing ? 'Edit Record' : 'Add New Record'}
            </h2>
            
            {(error || success) && (
              <div className={`mb-4 text-sm p-3 rounded-lg border ${error ? 'text-red-600 bg-red-50 border-red-100' : 'text-green-600 bg-green-50 border-green-100'}`}>
                {error || success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="flex gap-2 mb-2">
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  >
                    <option value="">Select a Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                    title="Add new category"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {showAddCategory && (
                  <div className="mt-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-2">
                    <input
                      type="text"
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:outline-none p-2"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={loading || !newCategoryName}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tuition Fee"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. 1,50,000 per year"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none text-gray-900"
                />
              </div>
              
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Saving...' : isEditing ? 'Update Record' : 'Create Record'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ id: '', category: '', key: '', value: '' });
                      setError('');
                      setSuccess('');
                    }}
                    className="w-full bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Records List Table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Department Records</h2>
              <button 
                onClick={fetchRecords} 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {record.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.key}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {record.value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(record._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                          <p className="text-sm">No static records found for your department.</p>
                          <p className="text-xs mt-1 text-gray-400">Start by adding a new record on the left.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {loading && records.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        <p className="animate-pulse">Loading records...</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
