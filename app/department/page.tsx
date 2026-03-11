'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DepartmentAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [selectedData, setSelectedData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const role = session?.user?.role;
      if (role !== 'admin' && role !== 'superadmin') {
        router.push('/unauthorized');
      } else {
        fetchHistory();
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

  const handleTriggerScrape = async (filePath?: string, category?: string) => {
    const isManual = !!filePath;
    if (!isManual && !confirm('This will trigger the KIET Python Scraper on the backend. This may take several minutes to complete. Are you sure you want to proceed?')) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/trigger-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, category }),
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
        handleTriggerScrape(data.filePath, uploadCategory);
        setUploadCategory('');
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
          <h1 className="text-3xl font-bold text-gray-900">Policy Management Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Trigger automated scrapers to pull and store KIET policy documents directly in the database.
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <span className="bg-white shadow-sm px-4 py-2 text-sm font-medium text-indigo-600 rounded-md">
            Policy Scrapers
          </span>
          <Link href="/department/records" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md transition-colors">
            Static Data
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Trigger Scrape Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Scraper Control</h2>
            
            {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
            {success && <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">{success}</div>}
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Clicking the button below will spawn the background Python script <code>kiet-scraper</code>. It will visit the targets, parse PDFs, generate the aggregated JSON data, and store the results directly in MongoDB.
              </p>
              <button
                onClick={() => handleTriggerScrape()}
                disabled={loading}
                className="w-full bg-indigo-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-indigo-700 transition shadow-md disabled:opacity-50 disabled:cursor-wait flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running Scraper...
                  </>
                ) : 'Trigger Web Scrape'}
              </button>
            </div>
          </div>

          {/* Manual PDF Upload Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Process Uploaded PDF</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload a local PDF file to extract data using the KIET scraper engine.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fees, Exam, Admission"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none p-2 mb-4"
                />

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload PDF Document
                </label>
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleManualUpload(file);
                    e.target.value = ''; // Reset
                  }}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100
                    cursor-pointer
                  "
                />
              </div>
              <p className="text-xs text-gray-400 italic">
                The file will be uploaded and then processed by the scraper.
              </p>
            </div>
          </div>
        </div>


        {/* Scrape History Table */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Scrape History Log</h2>
            <button onClick={fetchHistory} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Triggered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heading</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Triggered By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">JSON Data</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((run) => {
                  const dateObj = new Date(run.runDate);
                  return (
                    <tr key={run._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {run.heading || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {run.category || 'Manual Scrape'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {run.departmentTriggeredBy}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => setSelectedData(run.scrapedData)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          View Data
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No scrapes have been triggered yet. Click the button to initiate the first run.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
