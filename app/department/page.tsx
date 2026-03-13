'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

export default function DepartmentAdminDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <DepartmentAdminContent />
    </Suspense>
  );
}

function DepartmentAdminContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDept = searchParams.get('name');

  const [history, setHistory] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedData, setSelectedData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customFileName, setCustomFileName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const role = session?.user?.role;
      if (role !== 'admin' && role !== 'superadmin') {
        router.push('/unauthorized');
      } else if (currentDept && !session.user.departments?.includes(currentDept) && role !== 'superadmin') {
        router.push('/unauthorized');
      } else {
        fetchHistory();
        fetchCategories();
      }
    }
  }, [status, session, router]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/trigger-scrape');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch scrape history', err);
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

  const handleTriggerScrape = async (filePath?: string, category?: string, fileName?: string) => {
    const isManual = !!filePath;
    if (!isManual && !confirm('This will trigger the KIET Python Scraper on the backend. This may take several minutes to complete. Are you sure you want to proceed?')) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/trigger-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, category, customFileName: fileName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Scrape failed to execute securely');
      } else {
        setSuccess(isManual ? 'PDF processed successfully! Data extracted and stored in DB.' : 'Scraper completed successfully! Data stored in MongoDB.');
        fetchHistory();
      }
    } catch (err) {
      setError('An unexpected error occurred while communicating with the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpload = async (file: File) => {
    if (!uploadCategory) {
      setError('Please provide a category name for the upload');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadCategory);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to upload file');
        setLoading(false);
      } else {
        // File uploaded, now trigger the scraper on it
        setSuccess('File uploaded. Starting data extraction...');
        handleTriggerScrape(data.filePath, uploadCategory, customFileName);
        setUploadCategory('');
        setCustomFileName('');
      }
    } catch (err) {
      setError('Failed to upload file');
      setLoading(false);
    }
  };


  if (status === 'loading') return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentDept ? `${currentDept} Policy Management` : 'Policy Management Dashboard'}
          </h1>
          <p className="text-gray-500 mt-1">
            Trigger automated scrapers to pull and store {currentDept || 'department'} policy documents directly in the database.
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <span className="bg-white shadow-sm px-4 py-2 text-sm font-medium text-indigo-600 rounded-md">
            Policy Scrapers
          </span>
          <Link href={currentDept ? `/department/records?name=${currentDept}` : "/department/records"} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md transition-colors">
            Static Data
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Upload */}
        <div className="lg:col-span-1 space-y-8">
          {/* Manual PDF Upload Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-xl font-semibold mb-2 text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Quick Upload
            </h2>
            <p className="text-xs text-gray-500 mb-6 font-medium">
              Files uploaded here will be processed and indexed instantly.
            </p>

            {error && <div className="mb-4 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">{error}</div>}
            {success && <div className="mb-4 text-xs text-green-600 bg-green-50 p-2.5 rounded-lg border border-green-100">{success}</div>}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <div className="flex gap-2 mb-4">
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none p-2 transition-all"
                  >
                    <option value="">Select a Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-all active:scale-95"
                    title="Add new category"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {showAddCategory && (
                  <div className="mt-2 mb-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-2 animate-in slide-in-from-top-2 duration-300">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="block w-full text-xs text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none p-2"
                    />
                    <button
                      onClick={handleAddCategory}
                      disabled={loading || !newCategoryName}
                      className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Exam Guidelines"
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none p-2 transition-all"
                  />
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleManualUpload(file);
                      e.target.value = ''; // Reset
                    }}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-xl file:border-0
                      file:text-xs file:font-bold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100
                      cursor-pointer border border-dashed border-gray-300 rounded-xl p-2 bg-gray-50/50 hover:bg-gray-50 transition-colors
                    "
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
                      <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs animate-pulse">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Scrape History Log</h2>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase tracking-wider">Drive Extractions for {currentDept || 'all departments'}</p>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-grow sm:w-64">
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button onClick={fetchHistory} className="p-2 text-indigo-600 hover:bg-white hover:shadow-sm rounded-full transition-all active:scale-95" title="Refresh">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto">
              {history
                .filter(run => !currentDept || run.departmentTriggeredBy === currentDept)
                .filter(run => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    (run.fileName || '').toLowerCase().includes(query) ||
                    (run.heading || '').toLowerCase().includes(query) ||
                    (run.category || '').toLowerCase().includes(query)
                  );
                })
                .map((run) => {
                const dateObj = new Date(run.runDate);
                const isManual = run.category === 'Manual Upload';
                
                return (
                  <div 
                    key={run._id} 
                    className="group bg-white border border-gray-100 rounded-2xl p-5 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative flex flex-col ring-1 ring-gray-200/50"
                    onClick={() => setSelectedData(run.scrapedData)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-2xl shadow-inner ${isManual ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                        {isManual ? (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {run.s3Url && (
                          <a 
                            href={run.s3Url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all border border-gray-100 hover:border-indigo-100"
                            title="Download PDF"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-gray-900 truncate mb-1 text-base leading-tight group-hover:text-indigo-700 transition-colors" title={run.fileName || run.heading}>
                      {run.fileName || run.heading || 'Untitled Scrape'}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-6">
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-tight ${isManual ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {run.category || 'System'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-[10px] text-white font-extrabold shadow-sm">
                          {run.uploadedBy ? run.uploadedBy[0].toUpperCase() : 'S'}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-[11px] font-bold text-gray-700 truncate" title={run.uploadedBy || 'System'}>
                            {run.uploadedBy?.split('@')[0] || 'Automated'}
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium">Uploader</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-indigo-600 font-bold text-[10px] group-hover:translate-x-1 transition-transform">
                        DETAILS
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}

              {history.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                   <svg className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm">No documents found for this department.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* JSON Modal */}
      {selectedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Scraped Data Content</h3>
              <button 
                onClick={() => setSelectedData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-auto bg-gray-50 font-mono text-sm">
              <pre>{JSON.stringify(selectedData, null, 2)}</pre>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setSelectedData(null)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
