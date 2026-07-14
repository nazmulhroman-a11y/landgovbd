/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Download, Search, FileSpreadsheet, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { IndexPlotRecord } from '../types';
import { parseCSV, downloadCSV } from '../utils/csv';

interface IndexBookManagerProps {
  indexRecords: IndexPlotRecord[];
  setIndexRecords: React.Dispatch<React.SetStateAction<IndexPlotRecord[]>>;
  onSyncWithServer?: (records: IndexPlotRecord[]) => Promise<boolean>;
  isSyncedMode: boolean;
}

export default function IndexBookManager({
  indexRecords,
  setIndexRecords,
  onSyncWithServer,
  isSyncedMode
}: IndexBookManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Filter records based on search query
  const filteredRecords = indexRecords.filter(record => {
    const query = searchQuery.trim();
    if (!query) return true;
    return (
      record.halDag.includes(query) ||
      record.sabekDag.includes(query) ||
      record.ownerName.toLowerCase().includes(query.toLowerCase()) ||
      record.address.toLowerCase().includes(query.toLowerCase())
    );
  });

  // Handle CSV Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedLines = parseCSV(text);
        
        if (parsedLines.length < 2) {
          throw new Error('ফাইলটিতে পর্যাপ্ত ডেটা নেই বা হেডার রোটি ত্রুটিযুক্ত।');
        }

        // Headers validation
        // We will match column headers flexibly
        const headers = parsedLines[0].map(h => h.trim());
        
        // Let's parse rows
        const parsedRecords: IndexPlotRecord[] = [];
        
        for (let i = 1; i < parsedLines.length; i++) {
          const row = parsedLines[i];
          if (row.length < 3) continue; // Skip empty/incomplete rows
          
          parsedRecords.push({
            id: `idx_uploaded_${i}_${Date.now()}`,
            halDag: row[0] || '',
            sabekDag: row[1] || '',
            ownerName: row[2] || '',
            landAmount: row[3] || '',
            address: row[4] || '',
            remarks: row[5] || ''
          });
        }

        if (parsedRecords.length === 0) {
          throw new Error('ফাইল থেকে কোনো বৈধ রেকর্ড পাওয়া যায়নি। কলামগুলো যাচাই করুন।');
        }

        // Save records locally
        // Save records locally
        setIndexRecords(prev => [...parsedRecords, ...prev]);
        setUploadStatus({
          type: 'success',
          message: `সাফল্যের সাথে ${parsedRecords.length}টি দাগের সূচী রেকর্ড আপলোড করা হয়েছে!`
        });

        // Trigger Apps Script upload if in Sync Mode
        if (isSyncedMode && onSyncWithServer) {
          setIsSyncing(true);
          const success = await onSyncWithServer(parsedRecords);
          setIsSyncing(false);
          if (success) {
            setUploadStatus(prev => prev ? {
              ...prev,
              message: `${prev.message} এবং গুগল স্প্রেডশিটে সফলভাবে সংরক্ষিত হয়েছে।`
            } : null);
          } else {
            setUploadStatus(prev => prev ? {
              type: 'error',
              message: `${prev.message} কিন্তু গুগল স্প্রেডশিটে সিঙ্ক করা যায়নি। আপনার স্প্রেডশিট কানেকশন চেক করুন।`
            } : null);
          }
        }

      } catch (err: any) {
        setUploadStatus({
          type: 'error',
          message: `ফাইল আপলোডে সমস্যা: ${err.message || 'দয়া করে সঠিক CSV ফরম্যাট ব্যবহার করুন।'}`
        });
      }
    };

    reader.readAsText(file, 'UTF-8');
    // Clear input so same file can be uploaded again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle PDF Upload via Gemini
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a PDF or Image
    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (!isPDF && !isImage) {
      setUploadStatus({
        type: 'error',
        message: 'অনুগ্রহ করে একটি PDF বা ইমেজ ফাইল আপলোড করুন।'
      });
      return;
    }

    setUploadStatus(null);
    setIsSyncing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        try {
          const response = await fetch('/api/gemini/parse-index-book', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileData: base64Data,
              mimeType: file.type
            })
          });

          const resJson = await response.json();

          if (resJson.status === 'success' && Array.isArray(resJson.data)) {
            const newRecords: IndexPlotRecord[] = resJson.data.map((item: any, index: number) => ({
              id: `idx_ai_${Date.now()}_${index}`,
              halDag: item.halDag || '',
              sabekDag: item.sabekDag || '',
              ownerName: item.ownerName || '',
              landAmount: item.landAmount || '',
              address: item.address || '',
              remarks: item.remarks || ''
            }));

            setIndexRecords(prev => [...newRecords, ...prev]);
            setUploadStatus({
              type: 'success',
              message: `জেমিনি AI সাফল্যের সাথে ${newRecords.length}টি রেকর্ড এক্সট্রাক্ট করেছে!`
            });

            // Sync with Google Sheets if enabled
            if (isSyncedMode && onSyncWithServer) {
              await onSyncWithServer([...newRecords, ...indexRecords]);
            }
          } else {
            throw new Error(resJson.message || 'AI তথ্য এক্সট্রাক্ট করতে ব্যর্থ হয়েছে।');
          }
        } catch (apiErr: any) {
          setUploadStatus({
            type: 'error',
            message: `AI প্রসেসিং ত্রুটি: ${apiErr.message}`
          });
        } finally {
          setIsSyncing(false);
        }
      };
    } catch (err: any) {
      setIsSyncing(false);
      setUploadStatus({
        type: 'error',
        message: `ফাইল রিডিং ত্রুটি: ${err.message}`
      });
    }

    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  // Download sample CSV template
  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        halDag: '২৪৫০',
        sabekDag: '১২১০',
        ownerName: 'আব্দুর রহমান',
        landAmount: '১২.৫',
        address: 'হরিরামপুর, সাভার, ঢাকা',
        remarks: 'আরএস খতিয়ান নং ৮৮০'
      },
      {
        halDag: '১০৫',
        sabekDag: '৪৫',
        ownerName: 'আজিজুল হক ভূঁইয়া',
        landAmount: '১৫.৫',
        address: 'রাজাসন, সাভার, ঢাকা',
        remarks: 'এসএ খতিয়ান নং ১২'
      }
    ];

    downloadCSV(
      sampleData,
      [
        { key: 'halDag', label: 'হাল দাগ (Hal Dag)' },
        { key: 'sabekDag', label: 'সাবেক দাগ (Sabek Dag)' },
        { key: 'ownerName', label: 'মালিকের নাম (Owner Name)' },
        { key: 'landAmount', label: 'জমির পরিমাণ (Land Amount)' },
        { key: 'address', label: 'ঠিকানা/মৌজা (Address/Mouza)' },
        { key: 'remarks', label: 'মন্তব্য (Remarks)' }
      ],
      'ভূমি_অফিস_সূচী_বই_টেমপ্লেট'
    );
  };

  // Clear Index Book
  const handleClearIndexBook = () => {
    const confirmClear = window.confirm('আপনি কি নিশ্চিত যে আপনি সূচী বইয়ের সব রেকর্ড মুছে ফেলতে চান? এটি পুনরায় ফিরিয়ে আনা যাবে না।');
    if (!confirmClear) return;
    
    setIndexRecords([]);
    setUploadStatus({
      type: 'success',
      message: 'সূচী বইয়ের সকল রেকর্ড মুছে ফেলা হয়েছে।'
    });

    if (isSyncedMode && onSyncWithServer) {
      onSyncWithServer([]);
    }
  };

  return (
    <div id="index-book-manager" className="space-y-6">
      {/* Intro & Utility Grid */}
      <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600" />
              হাল ও সাবেক দাগের সূচী বই (Index Book)
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              অফিসের সূচী বইয়ের তালিকা আপলোড করে রাখুন। নতুন আবেদন এন্ট্রি করার সময় হাল বা সাবেক দাগ ইনপুট দিলে জমির মালিক, ঠিকানা ও পরিমাণের তথ্য স্বয়ংক্রিয়ভাবে পূর্ণ হয়ে যাবে।
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadSampleTemplate}
              className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download size={16} />
              টেমপ্লেট ডাউনলোড করুন
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSyncing}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/15"
            >
              <Upload size={16} />
              {isSyncing ? 'প্রসেসিং...' : 'সূচী বই আপলোড (CSV)'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />

            <button
              onClick={() => pdfInputRef.current?.click()}
              disabled={isSyncing}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/15"
            >
              <Upload size={16} />
              {isSyncing ? 'AI প্রসেসিং হচ্ছে...' : 'সূচী বই আপলোড (PDF AI)'}
            </button>
            <input
              type="file"
              ref={pdfInputRef}
              onChange={handlePDFUpload}
              accept=".pdf,image/*"
              className="hidden"
            />

            {indexRecords.length > 0 && (
              <button
                onClick={handleClearIndexBook}
                className="px-3 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={16} />
                সব মুছুন
              </button>
            )}
          </div>
        </div>

        {/* Upload status message */}
        {uploadStatus && (
          <div className={`mt-5 p-4 rounded-lg flex items-start gap-3 border ${
            uploadStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {uploadStatus.type === 'success' ? (
              <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-600" size={18} />
            ) : (
              <AlertCircle className="shrink-0 mt-0.5 text-red-600" size={18} />
            )}
            <div className="text-sm font-medium">{uploadStatus.message}</div>
          </div>
        )}
      </div>

      {/* Main Search & Database Section */}
      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="হাল দাগ, সাবেক দাগ, মালিকের নাম বা ঠিকানা দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="text-xs font-bold text-slate-500 bg-slate-200/50 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
            <span>মোট সূচী রেকর্ড:</span>
            <span className="text-emerald-700 text-sm font-extrabold">{indexRecords.length}টি</span>
          </div>
        </div>

        {/* List Table */}
        <div className="overflow-x-auto">
          {filteredRecords.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-100 text-slate-600 font-bold text-xs uppercase">
                  <th className="py-3 px-5 text-center w-24">হাল দাগ</th>
                  <th className="py-3 px-5 text-center w-24">সাবেক দাগ</th>
                  <th className="py-3 px-5">মালিক/জোতদারের নাম</th>
                  <th className="py-3 px-5 text-center">জমির পরিমাণ</th>
                  <th className="py-3 px-5">ঠিকানা/মৌজা</th>
                  <th className="py-3 px-5">মন্তব্য / রেফারেন্স খতিয়ান</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5 text-center font-bold text-emerald-800 bg-emerald-50/30">
                      {record.halDag}
                    </td>
                    <td className="py-3 px-5 text-center font-semibold text-amber-700 bg-amber-50/20">
                      {record.sabekDag}
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-700">{record.ownerName}</td>
                    <td className="py-3 px-5 text-center font-bold text-slate-800">
                      {record.landAmount} শতাংশ
                    </td>
                    <td className="py-3 px-5 text-slate-600">{record.address}</td>
                    <td className="py-3 px-5 text-slate-500 italic text-xs">{record.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <FileSpreadsheet className="mx-auto text-slate-300 stroke-[1.2] mb-3" size={48} />
              <h3 className="text-slate-700 font-bold text-base">কোনো সূচী রেকর্ড খুঁজে পাওয়া যায়নি</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                {searchQuery ? 'আপনার সার্চ কি-ওয়ার্ড পরিবর্তন করে দেখুন।' : 'টেমপ্লেট ডাউনলোড করে আপনার তথ্য যোগ করুন এবং ফাইলটি আপলোড করুন।'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
