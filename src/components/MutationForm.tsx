/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Landmark, Save, FileText, ArrowRight, User, Phone, MapPin, Layers, Sparkles, Check, RefreshCw, UploadCloud, FileUp, File } from 'lucide-react';
import { MutationRecord, IndexPlotRecord } from '../types';

interface MutationFormProps {
  onSave: (record: MutationRecord) => Promise<boolean>;
  indexRecords: IndexPlotRecord[];
  editRecord?: MutationRecord | null;
  onCancelEdit?: () => void;
}

export default function MutationForm({
  onSave,
  indexRecords,
  editRecord,
  onCancelEdit
}: MutationFormProps) {
  // Form fields state
  const [formData, setFormData] = useState<Omit<MutationRecord, 'id' | 'synced'>>({
    applicationNumber: '',
    name: '',
    caseNumber: '',
    mobile: '',
    landAmount: '',
    address: '',
    halDag: '',
    sabekDag: '',
    applicationType: 'মিউটেশন',
    status: 'অপেক্ষমান',
    decisionReason: '',
    manualComments: '',
    uploadDate: new Date().toISOString().split('T')[0]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // AI states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [aiPopulatedFields, setAiPopulatedFields] = useState<string[]>([]);
  
  // Suggestion match found state
  const [matchedPlot, setMatchedPlot] = useState<IndexPlotRecord | null>(null);

  // If editing, load the record details
  useEffect(() => {
    if (editRecord) {
      setFormData({
        applicationNumber: editRecord.applicationNumber,
        name: editRecord.name,
        caseNumber: editRecord.caseNumber,
        mobile: editRecord.mobile,
        landAmount: editRecord.landAmount,
        address: editRecord.address,
        halDag: editRecord.halDag,
        sabekDag: editRecord.sabekDag,
        applicationType: editRecord.applicationType,
        status: editRecord.status,
        decisionReason: editRecord.decisionReason,
        manualComments: editRecord.manualComments,
        uploadDate: editRecord.uploadDate
      });
    } else {
      handleReset();
    }
  }, [editRecord]);

  // Generate Automatic Application Number
  const generateAppNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({
      ...prev,
      applicationNumber: `MUT-${year}-${random}`
    }));
  };

  // Search Index Book for match based on Hal or Sabek plot selection
  useEffect(() => {
    const hal = formData.halDag.trim();
    const sabek = formData.sabekDag.trim();
    
    if (!hal && !sabek) {
      setMatchedPlot(null);
      return;
    }

    let match: IndexPlotRecord | undefined;
    
    if (hal) {
      match = indexRecords.find(r => r.halDag === hal);
    }
    
    if (!match && sabek) {
      match = indexRecords.find(r => r.sabekDag === sabek);
    }

    if (match) {
      setMatchedPlot(match);
    } else {
      setMatchedPlot(null);
    }
  }, [formData.halDag, formData.sabekDag, indexRecords]);

  // Auto-fill from matched plot record
  const handleAutoFill = () => {
    if (!matchedPlot) return;
    
    setFormData(prev => ({
      ...prev,
      name: matchedPlot.ownerName,
      landAmount: matchedPlot.landAmount,
      address: matchedPlot.address,
      halDag: matchedPlot.halDag,
      sabekDag: matchedPlot.sabekDag,
      manualComments: matchedPlot.remarks 
        ? `সূচী বই মন্তব্য: ${matchedPlot.remarks}. ${prev.manualComments}`
        : prev.manualComments
    }));

    setMatchedPlot(null); // Clear recommendation banner after filling
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setFormData({
      applicationNumber: '',
      name: '',
      caseNumber: '',
      mobile: '',
      landAmount: '',
      address: '',
      halDag: '',
      sabekDag: '',
      applicationType: 'মিউটেশন',
      status: 'অপেক্ষমান',
      decisionReason: '',
      manualComments: '',
      uploadDate: new Date().toISOString().split('T')[0]
    });
    setMatchedPlot(null);
    setSaveStatus(null);
  };

  // Parse file and extract content (supports text and Gemini AI for PDF/Images)
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const fileType = file.type;
    const isText = fileType === 'text/plain' || file.name.endsWith('.txt');
    const isPdf = fileType === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = fileType.startsWith('image/');

    if (!isText && !isPdf && !isImage) {
      setSaveStatus({
        type: 'error',
        message: 'শুধুমাত্র PDF, ইমেজ (.png, .jpg, .jpeg) অথবা টেক্সট (.txt) ফাইল আপলোড করা যাবে।'
      });
      return;
    }

    setSaveStatus(null);
    setAiPopulatedFields([]);

    if (isText) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split('\n');
          const updates: Partial<typeof formData> = {};
          const populated: string[] = [];

          lines.forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
              const key = parts[0].trim();
              const val = parts.slice(1).join(':').trim();

              if (key.includes('আবেদন নম্বর') || key.includes('Application')) { updates.applicationNumber = val; populated.push('applicationNumber'); }
              if (key.includes('নাম') || key.includes('Name')) { updates.name = val; populated.push('name'); }
              if (key.includes('কেস') || key.includes('Case')) { updates.caseNumber = val; populated.push('caseNumber'); }
              if (key.includes('মোবাইল') || key.includes('Mobile')) { updates.mobile = val; populated.push('mobile'); }
              if (key.includes('পরিমাণ') || key.includes('Amount')) { updates.landAmount = val; populated.push('landAmount'); }
              if (key.includes('ঠিকানা') || key.includes('Address')) { updates.address = val; populated.push('address'); }
              if (key.includes('হাল দাগ') || key.includes('Hal')) { updates.halDag = val; populated.push('halDag'); }
              if (key.includes('সাবেক দাগ') || key.includes('Sabek')) { updates.sabekDag = val; populated.push('sabekDag'); }
            }
          });

          if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
            setAiPopulatedFields(populated);
            setSaveStatus({
              type: 'success',
              message: 'আবেদন টেক্সট ফাইল থেকে সফলভাবে তথ্য লোড করা হয়েছে! অনুগ্রহ করে ফর্মটি রিভিও করে সেভ করুন।'
            });
          } else {
            throw new Error('ফাইলের ফরম্যাট সঠিক নয়। কি-ভ্যালু জোড়া থাকতে হবে (যেমন "নাম: করিম")।');
          }
        } catch (err: any) {
          setSaveStatus({
            type: 'error',
            message: err.message || 'ফাইলটি পার্স করা যায়নি।'
          });
        }
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      setIsAnalyzing(true);
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        const response = await fetch('/api/gemini/parse-mutation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileData: base64Data,
            mimeType: fileType
          })
        });

        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
          const data = result.data;
          
          setFormData(prev => ({
            ...prev,
            applicationNumber: data.applicationNumber || prev.applicationNumber,
            name: data.name || prev.name,
            mobile: data.mobile || prev.mobile,
            landAmount: data.landAmount || prev.landAmount,
            address: data.address || prev.address,
            halDag: data.halDag || prev.halDag,
            sabekDag: data.sabekDag || prev.sabekDag,
            applicationType: data.applicationType || prev.applicationType,
            uploadDate: data.uploadDate || prev.uploadDate,
          }));

          const populated = Object.keys(data).filter(key => !!data[key as keyof typeof data]);
          setAiPopulatedFields(populated);

          setSaveStatus({
            type: 'success',
            message: `✨ জেমিনি AI আবেদনপত্রটি (${file.name}) সফলভাবে বিশ্লেষণ করেছে এবং ফর্মটি অটো-ফিল করে দিয়েছে! অনুগ্রহ করে যাচাই করুন।`
          });
        } else {
          throw new Error(result.message || 'আবেদনপত্রটি বিশ্লেষণ করা যায়নি।');
        }
      } catch (err: any) {
        console.error('Gemini extraction failed:', err);
        setSaveStatus({
          type: 'error',
          message: err.message || 'জেমিনি AI দিয়ে ফাইলটি প্রসেস করার সময় কোনো সমস্যা হয়েছে।'
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple Validation
    if (!formData.applicationNumber.trim()) {
      setSaveStatus({ type: 'error', message: 'আবেদন নম্বর দেওয়া আবশ্যক!' });
      return;
    }
    if (!formData.name.trim()) {
      setSaveStatus({ type: 'error', message: 'আবেদনকারীর নাম দেওয়া আবশ্যক!' });
      return;
    }

    setIsSubmitting(true);
    setSaveStatus(null);

    const recordToSave: MutationRecord = {
      ...formData,
      id: editRecord ? editRecord.id : `mut_${Date.now()}`
    };

    const success = await onSave(recordToSave);
    setIsSubmitting(false);

    if (success) {
      setSaveStatus({
        type: 'success',
        message: editRecord 
          ? 'আবেদনটি সফলভাবে আপডেট করা হয়েছে!' 
          : 'নতুন আবেদনটি সফলভাবে সিস্টেমে এবং গুগল স্প্রেডশিটে সংরক্ষিত হয়েছে!'
      });
      if (!editRecord) {
        handleReset();
      }
    } else {
      setSaveStatus({
        type: 'error',
        message: 'তথ্য সংরক্ষণ করা যায়নি। সংযোগ পরীক্ষা করুন বা লোকাল মোডে পুনরায় চেষ্টা করুন।'
      });
    }
  };

  return (
    <div id="mutation-form-section" className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
      {/* Title Header */}
      <div className="bg-emerald-800 text-white p-5 border-b-4 border-amber-500 flex items-center gap-3">
        <Landmark className="text-amber-400 stroke-[2]" size={24} />
        <div>
          <h3 className="text-lg font-bold">
            {editRecord ? 'মিউটেশন আবেদন তথ্য সংশোধন ও আপডেট' : 'নতুন মিউটেশন আবেদন নিবন্ধন ফর্ম'}
          </h3>
          <p className="text-xs text-emerald-100 mt-0.5">
            হাল/সাবেক দাগের সাথে মিলিয়ে দ্রুত এবং নির্ভুল ডাটা এন্ট্রি করুন
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Status notification */}
        {saveStatus && (
          <div className={`p-4 rounded-lg text-sm font-semibold border ${
            saveStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {saveStatus.message}
          </div>
        )}

        {/* Smart AI File Uploader Box (Only in Create Mode) */}
        {!editRecord && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all relative overflow-hidden ${
              isDragOver 
                ? 'border-amber-500 bg-amber-50/40 shadow-inner' 
                : 'border-slate-200 hover:border-emerald-500/50 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            {isAnalyzing && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center z-10 animate-fade-in">
                <RefreshCw size={36} className="text-emerald-700 animate-spin mb-3 stroke-[2.5]" />
                <h4 className="font-bold text-sm text-slate-800">জেমিনি AI দ্বারা মিউটেশন আবেদনপত্র বিশ্লেষণ করা হচ্ছে...</h4>
                <p className="text-xs text-slate-500 mt-1 animate-pulse font-semibold max-w-md">
                  আবেদনপত্রের দাগ নম্বর, খতিয়ান, আবেদনকারীর নাম, মোবাইল নম্বর এবং জমির পরিমাণ (একর হতে শতাংশে রূপান্তরিত) স্বয়ংক্রিয়ভাবে পড়া হচ্ছে। অনুগ্রহ করে একটু অপেক্ষা করুন...
                </p>
              </div>
            )}

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-full">
                <UploadCloud size={24} className="stroke-[2.5] text-emerald-700" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-800 block">
                  স্মার্ট মিউটেশন আবেদন আপলোড (PDF, Image, Text)
                </span>
                <p className="text-xs text-slate-500 mt-1 font-semibold">
                  মিউটেশন আবেদনের স্ক্রিনশট, মূল PDF বা টেক্সট ফাইল এখানে ড্র্যাগ করে ছাড়ুন অথবা ডিভাইস থেকে সিলেক্ট করুন
                </p>
              </div>

              <label className="mt-2 text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-100 px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 border border-emerald-200 shadow-xs">
                <FileUp size={14} />
                ফাইল নির্বাচন করুন
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  accept=".pdf,.png,.jpg,.jpeg,.txt"
                  className="hidden"
                />
              </label>

              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1">✨ জেমিনি ৩.৫ ফ্লাশ চালিত</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">✓ একর হতে শতাংশ রূপান্তর</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">✓ বাংলা ল্যান্ড রেকর্ডস বিশেষজ্ঞ</span>
              </div>
            </div>
          </div>
        )}

        {/* Auto Fill Alert Banner from Index Book */}
        {matchedPlot && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <Sparkles className="text-amber-600 mt-0.5 shrink-0" size={18} />
              <div>
                <h4 className="font-bold text-sm">হাল/সাবেক দাগের সাথে মিলেছে!</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  দাগ <strong>{matchedPlot.halDag}</strong> (হাল) / <strong>{matchedPlot.sabekDag}</strong> (সাবেক) রেকর্ডটি সূচী বইয়ে পাওয়া গেছে। <br />
                  মালিক: <span className="font-semibold">{matchedPlot.ownerName}</span> | পরিমাণ: <span className="font-semibold">{matchedPlot.landAmount} শতাংশ</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAutoFill}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start md:self-center"
            >
              <Check size={14} />
              অটো-ফিল করুন
            </button>
          </div>
        )}

        {/* Grid Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Section 1: Application identifiers */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">আবেদন পরিচিতি</h4>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>আবেদন নম্বর *</span>
                  {aiPopulatedFields.includes('applicationNumber') && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full animate-pulse">
                      <Sparkles size={8} /> জেমিনি AI
                    </span>
                  )}
                </span>
                {!editRecord && (
                  <button
                    type="button"
                    onClick={generateAppNumber}
                    className="text-[10px] text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Sparkles size={10} /> অটো-জেনারেট
                  </button>
                )}
              </label>
              <input
                type="text"
                name="applicationNumber"
                value={formData.applicationNumber}
                onChange={handleInputChange}
                required
                placeholder="উদা: MUT-2026-1049"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">কেস নম্বর</label>
              <input
                type="text"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleInputChange}
                placeholder="উদা: ১২৪/২০২৬-২৭"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">আবেদনের ধরণ</label>
              <select
                name="applicationType"
                value={formData.applicationType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all font-semibold"
              >
                <option value="মিউটেশন">মিউটেশন (Mutation)</option>
                <option value="নামজারি">নামজারি (Namjari)</option>
                <option value="দলিল">দলিল রেজিস্ট্রি (Deed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">আবেদনের তারিখ</label>
              <input
                type="date"
                name="uploadDate"
                value={formData.uploadDate}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Section 2: Personal & Land Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">আবেদনকারী ও দাগের বিবরণ</h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User size={13} className="text-slate-400" />
                <span>আবেদনকারী / গ্রহীতার নাম *</span>
                {aiPopulatedFields.includes('name') && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full animate-pulse">
                    <Sparkles size={8} /> জেমিনি AI
                  </span>
                )}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="আবেদনকারী বা দাতার নাম লিখুন"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Layers size={13} className="text-slate-400" />
                  <span>হাল দাগ নং</span>
                  {aiPopulatedFields.includes('halDag') && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full animate-pulse">
                      <Sparkles size={8} /> জেমিনি AI
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="halDag"
                  value={formData.halDag}
                  onChange={handleInputChange}
                  placeholder="হাল দাগ"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-emerald-800 bg-emerald-50/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Layers size={13} className="text-slate-400" />
                  <span>সাবেক দাগ নং</span>
                  {aiPopulatedFields.includes('sabekDag') && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full animate-pulse">
                      <Sparkles size={8} /> জেমিনি AI
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="sabekDag"
                  value={formData.sabekDag}
                  onChange={handleInputChange}
                  placeholder="সাবেক দাগ"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-amber-700 bg-amber-50/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <span>জমির পরিমাণ (শতাংশ)</span>
                  {aiPopulatedFields.includes('landAmount') && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full animate-pulse">
                      <Sparkles size={8} /> জেমিনি AI
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="landAmount"
                  value={formData.landAmount}
                  onChange={handleInputChange}
                  placeholder="উদা: ১০.৫"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-400" />
                  <span>মোবাইল নম্বর</span>
                  {aiPopulatedFields.includes('mobile') && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full animate-pulse">
                      <Sparkles size={8} /> জেমিনি AI
                    </span>
                  )}
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="মোবাইল নম্বর লিখুন"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-400" />
                <span>জমির ঠিকানা / মৌজা</span>
                {aiPopulatedFields.includes('address') && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full animate-pulse">
                    <Sparkles size={8} /> জেমিনি AI
                  </span>
                )}
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="উদা: মৌজা হরিরামপুর, সাভার, ঢাকা"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Section 3: Official Decision & Remarks */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">সিদ্ধান্ত ও দাপ্তরিক মন্তব্য</h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">আবেদনের অবস্থা (Status)</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all font-bold"
              >
                <option value="অপেক্ষমান">অপেক্ষমান (Pending)</option>
                <option value="তদন্তাধীন">তদন্তাধীন (Under Investigation)</option>
                <option value="মঞ্জুর">মঞ্জুর (Approved)</option>
                <option value="নামঞ্জুর">নামঞ্জুর (Rejected)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">মঞ্জুর/নামঞ্জুরের কারণ বা বিবরণ</label>
              <textarea
                name="decisionReason"
                rows={3}
                value={formData.decisionReason}
                onChange={handleInputChange}
                placeholder="আবেদনটি মঞ্জুর বা নামঞ্জুর হওয়ার প্রধান কারণ ও আইনের ধারা এখানে উল্লেখ করুন..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ম্যানুয়াল মন্তব্য ও করণীয়</label>
              <textarea
                name="manualComments"
                rows={2}
                value={formData.manualComments}
                onChange={handleInputChange}
                placeholder="শুনানির তারিখ বা অন্যান্য সাধারণ মন্তব্য..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
          >
            ফিলাপ মুছুন
          </button>
          
          {editRecord && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-5 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all cursor-pointer"
            >
              বাতিল করুন
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500 text-white font-bold text-sm rounded-lg shadow-md shadow-emerald-700/10 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                সংরক্ষণ করা হচ্ছে...
              </>
            ) : (
              <>
                <Save size={16} />
                {editRecord ? 'তথ্য আপডেট করুন' : 'আবেদন সংরক্ষণ করুন'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
